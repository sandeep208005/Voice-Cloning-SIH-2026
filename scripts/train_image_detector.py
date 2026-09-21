"""
DeepShield Vision Model Training Pipeline
Trains DeepShieldImageClassifier using centralized preprocessing, realistic augmentations,
weighted cross-entropy loss, AdamW optimizer, and validation checkpointing.
"""

import os
import sys
import json
import time
import random
import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import Dataset, DataLoader
from PIL import Image, ImageOps

sys.path.insert(0, ".")
from backend.app.ai.image.model import DeepShieldImageClassifier
from backend.app.ai.image.preprocessing import preprocess_image_tensor

# Hyperparameters and paths
DATA_DIR = "data"
MODELS_DIR = os.path.join("models", "image")
CHECKPOINT_PATH = os.path.join(MODELS_DIR, "deepshield_image_detector_best.pt")
METADATA_PATH = os.path.join(MODELS_DIR, "training_history.json")

BATCH_SIZE = 16
NUM_EPOCHS = 20
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
PATIENCE = 6
SEED = 42


def set_seed(seed: int = 42):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


class VisionDataset(Dataset):
    """
    PyTorch Dataset loading images for dual-stream architecture with realistic augmentations.
    Labels: 0 = Real, 1 = Synthetic.
    """
    def __init__(self, split_dir: str, augment: bool = False):
        self.samples = []
        self.augment = augment
        valid_exts = {".jpg", ".jpeg", ".png", ".webp"}

        real_dir = os.path.join(split_dir, "real")
        synth_dir = os.path.join(split_dir, "synthetic")

        if os.path.exists(real_dir):
            for fn in os.listdir(real_dir):
                if os.path.splitext(fn)[1].lower() in valid_exts:
                    self.samples.append((os.path.join(real_dir, fn), 0))

        if os.path.exists(synth_dir):
            for fn in os.listdir(synth_dir):
                if os.path.splitext(fn)[1].lower() in valid_exts:
                    self.samples.append((os.path.join(synth_dir, fn), 1))

        random.shuffle(self.samples)

    def __len__(self):
        return len(self.samples)

    def apply_augmentation(self, img: Image.Image) -> Image.Image:
        """Applies realistic optical and noise augmentations without destroying forensic artifacts."""
        if random.random() > 0.5:
            img = ImageOps.mirror(img)
        if random.random() > 0.6:
            angle = random.uniform(-10.0, 10.0)
            img = img.rotate(angle, resample=Image.Resampling.BILINEAR)
        return img

    def __getitem__(self, idx: int):
        img_path, label = self.samples[idx]
        with Image.open(img_path) as img:
            img_rgb = img.convert("RGB")
            if self.augment:
                img_rgb = self.apply_augmentation(img_rgb)
            spatial_tensor, freq_tensor = preprocess_image_tensor(img_rgb)

        return spatial_tensor, freq_tensor, torch.tensor(label, dtype=torch.long)


def train():
    set_seed(SEED)
    os.makedirs(MODELS_DIR, exist_ok=True)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[TRAIN] Using computation device: {device}")

    # Datasets
    train_split = os.path.join(DATA_DIR, "train")
    val_split = os.path.join(DATA_DIR, "val")

    train_dataset = VisionDataset(train_split, augment=True)
    val_dataset = VisionDataset(val_split, augment=False)

    if len(train_dataset) == 0:
        raise RuntimeError("Training dataset is empty! Please run prepare_dataset.py first.")

    train_labels = [s[1] for s in train_dataset.samples]
    num_real = train_labels.count(0)
    num_synth = train_labels.count(1)
    print(f"[DATASET] Train set: Total={len(train_dataset)} | Real={num_real} | Synthetic={num_synth}")
    print(f"[DATASET] Val set: Total={len(val_dataset)}")

    # Class balance weights
    total_train = len(train_dataset)
    weight_real = total_train / (2.0 * max(1, num_real))
    weight_synth = total_train / (2.0 * max(1, num_synth))
    class_weights = torch.tensor([weight_real, weight_synth], dtype=torch.float32).to(device)
    print(f"[LOSS] Balanced Class Weights: Real={weight_real:.3f}, Synthetic={weight_synth:.3f}")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, drop_last=False)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False)

    model = DeepShieldImageClassifier().to(device)
    criterion = nn.CrossEntropyLoss(weight=class_weights)
    optimizer = torch.optim.AdamW(model.parameters(), lr=4e-4, weight_decay=1e-3)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS, eta_min=1e-5)

    best_val_score = -float("inf")
    patience_counter = 0
    history = []

    start_time = time.time()
    print("[TRAIN] Starting model optimization loop...")

    for epoch in range(1, NUM_EPOCHS + 1):
        model.train()
        running_loss = 0.0
        correct_train = 0
        total_train_samples = 0

        for spatial_b, freq_b, labels_b in train_loader:
            spatial_b = spatial_b.to(device)
            freq_b = freq_b.to(device)
            labels_b = labels_b.to(device)

            optimizer.zero_grad()
            logits = model(spatial_b, freq_b)
            loss = criterion(logits, labels_b)
            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()

            running_loss += loss.item() * len(labels_b)
            preds = torch.argmax(logits, dim=1)
            correct_train += (preds == labels_b).sum().item()
            total_train_samples += len(labels_b)

        epoch_train_loss = running_loss / total_train_samples
        epoch_train_acc = correct_train / total_train_samples
        scheduler.step()

        # Validation evaluation
        model.eval()
        val_loss = 0.0
        correct_val = 0
        total_val_samples = 0

        with torch.no_grad():
            for spatial_b, freq_b, labels_b in val_loader:
                spatial_b = spatial_b.to(device)
                freq_b = freq_b.to(device)
                labels_b = labels_b.to(device)

                logits = model(spatial_b, freq_b)
                loss = criterion(logits, labels_b)

                val_loss += loss.item() * len(labels_b)
                preds = torch.argmax(logits, dim=1)
                correct_val += (preds == labels_b).sum().item()
                total_val_samples += len(labels_b)

        epoch_val_loss = val_loss / max(1, total_val_samples)
        epoch_val_acc = correct_val / max(1, total_val_samples)

        # Composite validation score (balancing accuracy and log-loss)
        val_score = epoch_val_acc - 0.1 * min(epoch_val_loss, 3.0)

        print(
            f"Epoch {epoch:02d}/{NUM_EPOCHS:02d} | "
            f"Train Loss: {epoch_train_loss:.4f} - Train Acc: {epoch_train_acc*100:.1f}% | "
            f"Val Loss: {epoch_val_loss:.4f} - Val Acc: {epoch_val_acc*100:.1f}% | Score: {val_score:.3f}"
        )

        history.append({
            "epoch": epoch,
            "train_loss": round(epoch_train_loss, 4),
            "train_acc": round(epoch_train_acc, 4),
            "val_loss": round(epoch_val_loss, 4),
            "val_acc": round(epoch_val_acc, 4),
            "val_score": round(val_score, 4),
            "lr": optimizer.param_groups[0]["lr"]
        })

        # Best model checkpointing based on composite score
        if val_score > best_val_score:
            best_val_score = val_score
            patience_counter = 0
            torch.save({
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "optimizer_state_dict": optimizer.state_dict(),
                "val_loss": epoch_val_loss,
                "val_acc": epoch_val_acc,
                "val_score": val_score,
                "model_architecture": "DeepShieldDualStreamSpatialFreq_v1",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }, CHECKPOINT_PATH)
            print(f"  --> Checkpoint saved to {CHECKPOINT_PATH} (Val Acc: {epoch_val_acc*100:.1f}%, Val Loss: {epoch_val_loss:.4f})")
        else:
            patience_counter += 1
            if patience_counter >= PATIENCE and epoch >= 10:
                print(f"[EARLY STOPPING] Validation score did not improve for {PATIENCE} epochs.")
                break

    total_duration = time.time() - start_time
    print(f"[TRAIN] Training finished in {total_duration:.2f}s. Best Val Score: {best_val_score:.4f}")

    # Save training metadata
    with open(METADATA_PATH, "w") as f:
        json.dump({
            "best_checkpoint": CHECKPOINT_PATH,
            "best_val_score": round(best_val_score, 4),
            "total_epochs_trained": len(history),
            "class_distribution": {"real": num_real, "synthetic": num_synth},
            "history": history
        }, f, indent=2)
    print(f"[METADATA] Saved training logs to {METADATA_PATH}")


if __name__ == "__main__":
    train()
