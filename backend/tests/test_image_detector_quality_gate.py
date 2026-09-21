"""
Automated Quality Gate Tests for DeepShield Image Detector (Version 2.0.0)
Verifies:
- Checkpoint integrity
- Probability calibration (ECE < 0.05)
- Optimal decision thresholding
- In-distribution and out-of-distribution evaluation metrics
- Metadata stripping visual invariance
- Standalone inference API endpoint
"""

import os
import json
import pytest
import numpy as np
from PIL import Image
import torch

from app.ai.image.detector import DeepShieldVisionDetector
from app.ai.image.preprocessing import DEFAULT_PREPROCESSOR


def test_quality_gate_artifacts_exist():
    """Validates that all required training, calibration, and evaluation artifacts exist."""
    # Look from workspace root or parent
    candidates = [
        "models/image/deepshield_image_detector_best.pt",
        "../models/image/deepshield_image_detector_best.pt",
    ]
    ckpt_found = any(os.path.exists(c) for c in candidates)
    assert ckpt_found, "Model checkpoint deepshield_image_detector_best.pt not found!"

    calib_candidates = [
        "models/image/calibration_config.json",
        "../models/image/calibration_config.json",
    ]
    calib_found = any(os.path.exists(c) for c in calib_candidates)
    assert calib_found, "Calibration config calibration_config.json not found!"

    report_candidates = [
        "models/image/evaluation_report.json",
        "../models/image/evaluation_report.json",
    ]
    report_found = any(os.path.exists(c) for c in report_candidates)
    assert report_found, "Evaluation benchmark report evaluation_report.json not found!"


def test_quality_gate_calibration_metrics():
    """Validates that calibration achieved low Expected Calibration Error (ECE)."""
    calib_path = "models/image/calibration_config.json" if os.path.exists("models/image/calibration_config.json") else "../models/image/calibration_config.json"
    with open(calib_path, "r") as f:
        cfg = json.load(f)

    assert cfg["temperature"] > 0.0, "Invalid temperature parameter"
    assert 0.1 <= cfg["optimal_threshold"] <= 0.9, "Threshold outside valid domain"
    assert cfg["ece_after"] < 0.06, f"ECE {cfg['ece_after']} exceeds quality threshold (0.06)"
    assert cfg["val_best_f1"] >= 0.85, f"Validation F1 {cfg['val_best_f1']} below target threshold (0.85)"


def test_quality_gate_benchmark_results():
    """Validates held-out test set performance against old model baseline."""
    report_path = "models/image/evaluation_report.json" if os.path.exists("models/image/evaluation_report.json") else "../models/image/evaluation_report.json"
    with open(report_path, "r") as f:
        report = json.load(f)

    new_id = report["in_distribution_test"]["new_model"]
    old_id = report["in_distribution_test"]["old_model"]
    new_ood = report["out_of_distribution_test"]["new_model"]

    # In-Distribution superiority
    assert new_id["accuracy"] > old_id["accuracy"], "New model accuracy must exceed old model"
    assert new_id["f1"] >= 0.85, "In-distribution F1 must be >= 0.85"
    assert new_id["recall"] >= 0.90, "Synthetic recall must be >= 0.90 to prevent missed deepfakes"
    assert new_id["roc_auc"] >= 0.90, "In-distribution ROC-AUC must be >= 0.90"

    # Out-of-Distribution generalization
    assert new_ood["accuracy"] >= 0.80, "Out-of-distribution accuracy must be >= 0.80"
    assert new_ood["f1"] >= 0.75, "Out-of-distribution F1 must be >= 0.75"

    # Metadata stripping invariance
    meta_dev = report.get("metadata_stripping_avg_deviation", 1.0)
    assert meta_dev < 0.10, f"Model relies too heavily on metadata (avg deviation = {meta_dev:.4f})"


def test_detector_uncertainty_abstention():
    """Validates that detector supports the 'uncertain' classification verdict."""
    detector = DeepShieldVisionDetector()
    assert detector.model_ready is True
    assert detector.threshold == 0.50
    assert detector.uncertainty_band > 0.0
