"""
DeepShield Vision Model Probability Calibration & Threshold Optimization
Implements Temperature Scaling (Guo et al., 2017), Expected Calibration Error (ECE),
Brier Score evaluation, ROC/PR curve threshold optimization on the validation split,
and abstention uncertainty margins.
"""

import os
import sys
import json
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from sklearn.metrics import roc_curve, precision_recall_curve, f1_score, accuracy_score, brier_score_loss
from PIL import Image

sys.path.insert(0, ".")
from backend.app.ai.image.model import DeepShieldImageClassifier
from backend.app.ai.image.preprocessing import preprocess_image_tensor
from scripts.train_image_detector import VisionDataset

CHECKPOINT_PATH = os.path.join("models", "image", "deepshield_image_detector_best.pt")
CALIBRATION_CONFIG_PATH = os.path.join("models", "image", "calibration_config.json")
VAL_DIR = os.path.join("data", "val")


def compute_ece(probs: np.ndarray, labels: np.ndarray, n_bins: int = 10) -> float:
    """
    Computes Expected Calibration Error (ECE) across n_bins equal-width bins.
    probs: 1D array of predicted class confidence (max prob)
    labels: 1D array of binary true outcomes (1 if prediction correct, 0 otherwise)
    """
    bin_limits = np.linspace(0.0, 1.0, n_bins + 1)
    ece = 0.0
    n_samples = len(probs)

    for i in range(n_bins):
        bin_low = bin_limits[i]
        bin_high = bin_limits[i + 1]
        mask = (probs > bin_low) & (probs <= bin_high) if i > 0 else (probs >= bin_low) & (probs <= bin_high)
        bin_count = np.sum(mask)

        if bin_count > 0:
            bin_acc = np.mean(labels[mask])
            bin_conf = np.mean(probs[mask])
            ece += (bin_count / n_samples) * np.abs(bin_acc - bin_conf)

    return float(ece)


class TemperatureScaler(nn.Module):
    """Learns a single scalar temperature T to rescale logits before softmax."""
    def __init__(self):
        super().__init__()
        self.temperature = nn.Parameter(torch.ones(1) * 1.5)

    def forward(self, logits: torch.Tensor) -> torch.Tensor:
        # Scale logits: z / T
        return logits / self.temperature


def calibrate():
    if not os.path.exists(CHECKPOINT_PATH):
        raise FileNotFoundError(f"Model checkpoint not found at {CHECKPOINT_PATH}. Run train_image_detector.py first.")

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[CALIBRATE] Loading checkpoint from {CHECKPOINT_PATH}")

    model = DeepShieldImageClassifier().to(device)
    checkpoint = torch.load(CHECKPOINT_PATH, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    val_dataset = VisionDataset(VAL_DIR, augment=False)
    if len(val_dataset) == 0:
        raise RuntimeError("Validation dataset empty!")

    val_loader = DataLoader(val_dataset, batch_size=16, shuffle=False)

    all_logits = []
    all_labels = []

    with torch.no_grad():
        for spatial_b, freq_b, labels_b in val_loader:
            spatial_b = spatial_b.to(device)
            freq_b = freq_b.to(device)
            logits = model(spatial_b, freq_b)
            all_logits.append(logits.cpu())
            all_labels.append(labels_b.cpu())

    logits_tensor = torch.cat(all_logits, dim=0)
    labels_tensor = torch.cat(all_labels, dim=0)

    # 1. Uncalibrated probabilities
    uncal_probs = torch.softmax(logits_tensor, dim=1).numpy()
    uncal_synth_probs = uncal_probs[:, 1]
    uncal_confs = np.max(uncal_probs, axis=1)
    uncal_preds = np.argmax(uncal_probs, axis=1)
    uncal_correct = (uncal_preds == labels_tensor.numpy()).astype(float)

    ece_before = compute_ece(uncal_confs, uncal_correct, n_bins=10)
    brier_before = float(brier_score_loss(labels_tensor.numpy(), uncal_synth_probs))

    print(f"[BEFORE CALIBRATION] Val ECE: {ece_before:.4f} | Val Brier Score: {brier_before:.4f}")

    # 2. Optimize Temperature parameter T on validation set using NLL
    temp_scaler = TemperatureScaler().to(device)
    nll_criterion = nn.CrossEntropyLoss()
    optimizer = optim.LBFGS([temp_scaler.temperature], lr=0.01, max_iter=50)

    logits_dev = logits_tensor.to(device)
    labels_dev = labels_tensor.to(device)

    def eval_nll():
        optimizer.zero_grad()
        loss = nll_criterion(temp_scaler(logits_dev), labels_dev)
        loss.backward()
        return loss

    optimizer.step(eval_nll)

    learned_temp = float(temp_scaler.temperature.item())
    learned_temp = max(0.1, learned_temp)  # Keep positive and stable
    print(f"[CALIBRATION] Optimized Temperature T: {learned_temp:.4f}")

    # 3. Calibrated probabilities
    with torch.no_grad():
        cal_logits = logits_dev / learned_temp
        cal_probs = torch.softmax(cal_logits, dim=1).cpu().numpy()

    cal_synth_probs = cal_probs[:, 1]
    cal_confs = np.max(cal_probs, axis=1)
    cal_preds = np.argmax(cal_probs, axis=1)
    cal_correct = (cal_preds == labels_tensor.numpy()).astype(float)

    ece_after = compute_ece(cal_confs, cal_correct, n_bins=10)
    brier_after = float(brier_score_loss(labels_tensor.numpy(), cal_synth_probs))

    print(f"[AFTER CALIBRATION] Val ECE: {ece_after:.4f} (improved by {ece_before - ece_after:+.4f})")
    print(f"[AFTER CALIBRATION] Val Brier Score: {brier_after:.4f} (improved by {brier_before - brier_after:+.4f})")

    # 4. Threshold Optimization on Validation Set
    y_true = labels_tensor.numpy()
    thresholds = np.arange(0.10, 0.95, 0.05)
    threshold_results = []
    best_threshold = 0.50
    best_f1 = -1.0

    print("[THRESHOLD SWEEP ON VALIDATION SET]:")
    for th in thresholds:
        th = round(float(th), 2)
        y_pred_th = (cal_synth_probs >= th).astype(int)
        acc_th = accuracy_score(y_true, y_pred_th)
        f1_th = f1_score(y_true, y_pred_th, zero_division=0)
        threshold_results.append({
            "threshold": th,
            "accuracy": round(float(acc_th), 4),
            "f1": round(float(f1_th), 4)
        })
        print(f"  Threshold {th:.2f} -> Accuracy: {acc_th*100:.1f}%, F1: {f1_th:.4f}")

        if (f1_th > best_f1) or (f1_th == best_f1 and abs(th - 0.50) < abs(best_threshold - 0.50)):
            best_f1 = f1_th
            best_threshold = th

    print(f"[OPTIMAL THRESHOLD] Selected theta* = {best_threshold:.2f} (Validation F1 = {best_f1:.4f})")

    # Save calibration configuration
    calib_config = {
        "temperature": round(learned_temp, 4),
        "optimal_threshold": round(best_threshold, 2),
        "uncertainty_band": 0.12,  # Images with |p - theta| < 0.12 classified as 'uncertain'
        "calibration_method": "temperature_scaling",
        "ece_before": round(ece_before, 4),
        "ece_after": round(ece_after, 4),
        "brier_before": round(brier_before, 4),
        "brier_after": round(brier_after, 4),
        "val_best_f1": round(best_f1, 4),
        "val_sample_count": len(val_dataset),
        "threshold_sweep": threshold_results
    }

    with open(CALIBRATION_CONFIG_PATH, "w") as f:
        json.dump(calib_config, f, indent=2)

    print(f"[SAVED] Calibration & threshold configuration saved to {CALIBRATION_CONFIG_PATH}")


if __name__ == "__main__":
    calibrate()
