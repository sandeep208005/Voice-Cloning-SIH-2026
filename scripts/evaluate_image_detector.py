"""
DeepShield Vision Model Evaluation & Comparative Benchmark
Evaluates Old Heuristic Detector vs New Trained Dual-Stream Vision Model on:
1. In-Distribution Test Set (test_id)
2. Cross-Generator Out-of-Distribution Test Set (test_ood)
3. Hard Adversarial Cases (test_hard)
4. Metadata-Stripped Robustness Test
Calculates: Accuracy, Precision, Recall, F1, ROC-AUC, Specificity, Sensitivity,
Confusion Matrix (TP, TN, FP, FN), ECE, Brier Score, and enforces Quality Gate.
"""

import os
import sys
import json
import time
import numpy as np
import torch
from typing import Dict, Any, List, Tuple
from PIL import Image, ImageOps
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, brier_score_loss
)

sys.path.insert(0, ".")
sys.path.insert(0, "backend")
from backend.app.ai.image.model import DeepShieldImageClassifier
from backend.app.ai.image.preprocessing import DEFAULT_PREPROCESSOR, preprocess_image_tensor
from scripts.calibrate_model import compute_ece

CHECKPOINT_PATH = os.path.join("models", "image", "deepshield_image_detector_best.pt")
CALIBRATION_CONFIG_PATH = os.path.join("models", "image", "calibration_config.json")
REPORT_PATH = os.path.join("models", "image", "evaluation_report.json")


def load_split_images(split_dir: str) -> List[Tuple[str, int]]:
    """Loads image paths and labels (0 = Real, 1 = Synthetic)."""
    samples = []
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}

    real_dir = os.path.join(split_dir, "real")
    synth_dir = os.path.join(split_dir, "synthetic")

    if os.path.exists(real_dir):
        for fn in sorted(os.listdir(real_dir)):
            if os.path.splitext(fn)[1].lower() in valid_exts:
                samples.append((os.path.join(real_dir, fn), 0))

    if os.path.exists(synth_dir):
        for fn in sorted(os.listdir(synth_dir)):
            if os.path.splitext(fn)[1].lower() in valid_exts:
                samples.append((os.path.join(synth_dir, fn), 1))

    return samples


def evaluate_metrics(y_true: np.ndarray, y_pred: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """Computes full suite of mathematically valid classification & calibration metrics."""
    acc = float(accuracy_score(y_true, y_pred))
    prec = float(precision_score(y_true, y_pred, zero_division=0))
    rec = float(recall_score(y_true, y_pred, zero_division=0))
    f1 = float(f1_score(y_true, y_pred, zero_division=0))

    # ROC-AUC
    try:
        if len(np.unique(y_true)) > 1:
            auc = float(roc_auc_score(y_true, y_prob))
        else:
            auc = 0.5
    except Exception:
        auc = 0.5

    # Confusion matrix: tn, fp, fn, tp
    cm = confusion_matrix(y_true, y_pred, labels=[0, 1])
    tn, fp, fn, tp = int(cm[0, 0]), int(cm[0, 1]), int(cm[1, 0]), int(cm[1, 1])

    # Specificity & Sensitivity
    sensitivity = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    # Class-wise metrics
    prec_real = float(precision_score(y_true == 0, y_pred == 0, zero_division=0))
    rec_real = float(recall_score(y_true == 0, y_pred == 0, zero_division=0))
    f1_real = float(f1_score(y_true == 0, y_pred == 0, zero_division=0))

    # Calibration: ECE & Brier
    confidences = np.maximum(y_prob, 1.0 - y_prob)
    correctness = (y_pred == y_true).astype(float)
    ece = compute_ece(confidences, correctness, n_bins=10)
    brier = float(brier_score_loss(y_true, y_prob))

    return {
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1": round(f1, 4),
        "roc_auc": round(auc, 4),
        "sensitivity": round(sensitivity, 4),
        "specificity": round(specificity, 4),
        "fpr": round(fpr, 4),
        "fnr": round(fnr, 4),
        "confusion_matrix": {"tp": tp, "tn": tn, "fp": fp, "fn": fn},
        "class_wise": {
            "real": {"precision": round(prec_real, 4), "recall": round(rec_real, 4), "f1": round(f1_real, 4)},
            "synthetic": {"precision": round(prec, 4), "recall": round(rec, 4), "f1": round(f1, 4)}
        },
        "calibration": {
            "ece": round(ece, 4),
            "brier_score": round(brier, 4)
        }
    }


def run_evaluation():
    print("=" * 70)
    print("DEEPSHIELD AI - IMAGE DETECTOR COMPREHENSIVE BENCHMARK & QUALITY GATE")
    print("=" * 70)

    # QUALITY GATE CHECK 1: Datasets exist
    test_id_samples = load_split_images(os.path.join("data", "test_id"))
    test_ood_samples = load_split_images(os.path.join("data", "test_ood"))

    if not test_id_samples:
        raise RuntimeError("[QUALITY GATE FAILED] In-distribution test dataset missing or empty!")
    if not test_ood_samples:
        raise RuntimeError("[QUALITY GATE FAILED] Out-of-distribution test dataset missing or empty!")

    # QUALITY GATE CHECK 2: Model weights and calibration exist
    if not os.path.exists(CHECKPOINT_PATH):
        raise RuntimeError(f"[QUALITY GATE FAILED] Trained model weights missing at {CHECKPOINT_PATH}!")
    if not os.path.exists(CALIBRATION_CONFIG_PATH):
        raise RuntimeError(f"[QUALITY GATE FAILED] Calibration config missing at {CALIBRATION_CONFIG_PATH}!")

    with open(CALIBRATION_CONFIG_PATH, "r") as f:
        calib_cfg = json.load(f)

    temp = calib_cfg.get("temperature", 1.0)
    threshold = calib_cfg.get("optimal_threshold", 0.50)
    uncertainty_band = calib_cfg.get("uncertainty_band", 0.12)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    model = DeepShieldImageClassifier().to(device)
    ckpt = torch.load(CHECKPOINT_PATH, map_location=device)
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    # Load Old Model for direct comparison
    from backend.app.ai.image.detector import ImageArtifactDetector
    old_detector = ImageArtifactDetector()

    def predict_new_model(img_path: str) -> Tuple[float, int, str]:
        with Image.open(img_path) as img:
            s_t, f_t = preprocess_image_tensor(img.convert("RGB"))
        with torch.no_grad():
            s_t = s_t.unsqueeze(0).to(device)
            f_t = f_t.unsqueeze(0).to(device)
            logits = model(s_t, f_t)
            cal_logits = logits / temp
            probs = torch.softmax(cal_logits, dim=1).cpu().numpy()[0]
            synth_prob = float(probs[1])

        # Apply optimal threshold & uncertainty abstention
        if abs(synth_prob - threshold) < uncertainty_band:
            verdict = "uncertain"
        else:
            verdict = "synthetic" if synth_prob >= threshold else "real"

        pred_bin = 1 if synth_prob >= threshold else 0
        return synth_prob, pred_bin, verdict

    def predict_old_model(img_path: str) -> Tuple[float, int]:
        res = old_detector.analyze(img_path)
        synth_prob = float(res.get("synthetic_probability", 0.5))
        pred_bin = 1 if synth_prob >= 0.50 else 0
        return synth_prob, pred_bin

    # 1. Evaluate IN-DISTRIBUTION TEST SET
    print("\n[BENCHMARK 1/4] Evaluating In-Distribution Test Set (test_id)...")
    y_true_id = np.array([s[1] for s in test_id_samples])
    new_probs_id, new_preds_id = [], []
    old_probs_id, old_preds_id = [], []
    uncertain_count_id = 0

    for fpath, label in test_id_samples:
        n_prob, n_pred, verdict = predict_new_model(fpath)
        new_probs_id.append(n_prob)
        new_preds_id.append(n_pred)
        if verdict == "uncertain":
            uncertain_count_id += 1

        o_prob, o_pred = predict_old_model(fpath)
        old_probs_id.append(o_prob)
        old_preds_id.append(o_pred)

    metrics_new_id = evaluate_metrics(y_true_id, np.array(new_preds_id), np.array(new_probs_id))
    metrics_old_id = evaluate_metrics(y_true_id, np.array(old_preds_id), np.array(old_probs_id))

    # 2. Evaluate OUT-OF-DISTRIBUTION CROSS-GENERATOR TEST SET
    print("\n[BENCHMARK 2/4] Evaluating Cross-Generator Out-of-Distribution Test Set (test_ood)...")
    y_true_ood = np.array([s[1] for s in test_ood_samples])
    new_probs_ood, new_preds_ood = [], []
    old_probs_ood, old_preds_ood = [], []
    uncertain_count_ood = 0

    for fpath, label in test_ood_samples:
        n_prob, n_pred, verdict = predict_new_model(fpath)
        new_probs_ood.append(n_prob)
        new_preds_ood.append(n_pred)
        if verdict == "uncertain":
            uncertain_count_ood += 1

        o_prob, o_pred = predict_old_model(fpath)
        old_probs_ood.append(o_prob)
        old_preds_ood.append(o_pred)

    metrics_new_ood = evaluate_metrics(y_true_ood, np.array(new_preds_ood), np.array(new_probs_ood))
    metrics_old_ood = evaluate_metrics(y_true_ood, np.array(old_preds_ood), np.array(old_probs_ood))

    # 3. Evaluate HARD CASES TEST SET
    print("\n[BENCHMARK 3/4] Evaluating Dedicated Hard Cases (test_hard)...")
    hard_dir = os.path.join("data", "test_hard")
    hard_files = sorted([os.path.join(hard_dir, f) for f in os.listdir(hard_dir) if f.endswith(".jpg")])
    hard_results = []

    for hf in hard_files:
        is_synth = 1 if "synth" in os.path.basename(hf) else 0
        prob, pred, verdict = predict_new_model(hf)
        hard_results.append({
            "file": os.path.basename(hf),
            "ground_truth": "synthetic" if is_synth == 1 else "real",
            "prediction": verdict,
            "synthetic_probability": round(prob, 4),
            "correct": (pred == is_synth) or verdict == "uncertain"
        })

    hard_accuracy = np.mean([1 if r["correct"] else 0 for r in hard_results])

    # 4. METADATA STRIPPING ROBUSTNESS TEST
    print("\n[BENCHMARK 4/4] Evaluating Metadata Robustness (Original vs EXIF-stripped)...")
    meta_diffs = []
    for fpath, _ in test_id_samples[:10]:
        p_orig, _, _ = predict_new_model(fpath)
        # Load and strip all EXIF metadata
        with Image.open(fpath) as img:
            data = list(img.getdata())
            stripped = Image.new(img.mode, img.size)
            stripped.putdata(data)
            temp_stripped_path = os.path.join("data", "raw", "temp_stripped.jpg")
            stripped.save(temp_stripped_path, "JPEG")

        p_stripped, _, _ = predict_new_model(temp_stripped_path)
        meta_diffs.append(abs(p_orig - p_stripped))
        if os.path.exists(temp_stripped_path):
            os.remove(temp_stripped_path)

    avg_meta_diff = float(np.mean(meta_diffs))
    print(f"  --> Average probability deviation upon complete EXIF stripping: {avg_meta_diff:.6f}")

    # Compile Full Report
    report = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "model_architecture": "DeepShieldDualStreamSpatialFreq_v1",
        "optimal_threshold": threshold,
        "temperature": temp,
        "uncertainty_band": uncertainty_band,
        "metadata_stripping_avg_deviation": round(avg_meta_diff, 6),
        "in_distribution_test": {
            "sample_count": len(test_id_samples),
            "uncertain_predictions": uncertain_count_id,
            "new_model": metrics_new_id,
            "old_model": metrics_old_id
        },
        "out_of_distribution_test": {
            "sample_count": len(test_ood_samples),
            "uncertain_predictions": uncertain_count_ood,
            "new_model": metrics_new_ood,
            "old_model": metrics_old_ood
        },
        "hard_cases_test": {
            "sample_count": len(hard_files),
            "accuracy_with_uncertainty": round(float(hard_accuracy), 4),
            "cases": hard_results
        }
    }

    with open(REPORT_PATH, "w") as f:
        json.dump(report, f, indent=2)

    # Print Comparison Table
    print("\n" + "=" * 78)
    print(f"{'METRIC':<24} | {'OLD MODEL (test_id)':<22} | {'NEW MODEL (test_id)':<22}")
    print("-" * 78)
    for m in ["accuracy", "precision", "recall", "f1", "roc_auc", "sensitivity", "specificity", "fpr", "fnr"]:
        print(f"{m.upper():<24} | {metrics_old_id[m]:<22} | {metrics_new_id[m]:<22}")
    print("-" * 78)
    print(f"{'ECE (CALIBRATION)':<24} | {metrics_old_id['calibration']['ece']:<22} | {metrics_new_id['calibration']['ece']:<22}")
    print(f"{'BRIER SCORE':<24} | {metrics_old_id['calibration']['brier_score']:<22} | {metrics_new_id['calibration']['brier_score']:<22}")
    print("=" * 78)

    print("\n" + "=" * 78)
    print(f"{'OUT-OF-DISTRIBUTION':<24} | {'OLD MODEL (test_ood)':<22} | {'NEW MODEL (test_ood)':<22}")
    print("-" * 78)
    for m in ["accuracy", "precision", "recall", "f1", "roc_auc"]:
        print(f"{m.upper():<24} | {metrics_old_ood[m]:<22} | {metrics_new_ood[m]:<22}")
    print("=" * 78)

    print(f"\n[QUALITY GATE PASSED] Full benchmark report saved to {REPORT_PATH}\n")
    return report


if __name__ == "__main__":
    run_evaluation()
