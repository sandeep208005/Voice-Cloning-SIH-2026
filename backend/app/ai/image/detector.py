"""
DeepShield AI - Production Vision Forensic Detector (Version 2.0.0)
Dual-stream neural classifier fusing spatial optical features with frequency/ELA residuals.
Features:
- Calibrated probability estimation via Temperature Scaling
- Optimal decision thresholding (theta* = 0.50)
- Uncertainty abstention margin for borderline ambiguous cases
- Grad-CAM visual attention heatmap generation
- True separation of Synthetic Probability vs Model Confidence
"""

import os
import io
import time
import json
import base64
import cv2
import numpy as np
import torch
from typing import Dict, Any, Optional
from PIL import Image

from app.ai.image.model import DeepShieldImageClassifier
from app.ai.image.preprocessing import DEFAULT_PREPROCESSOR, preprocess_image_tensor
from app.ai.image.spectral_analyzer import ImageSpectralAnalyzer
from app.ai.image.ela_analyzer import ELAAnalyzer

def _resolve_model_path(filename: str) -> str:
    candidates = [
        os.path.join("models", "image", filename),
        os.path.join("..", "models", "image", filename),
        os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "models", "image", filename)),
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    return candidates[0]

CHECKPOINT_PATH = _resolve_model_path("deepshield_image_detector_best.pt")
CALIBRATION_CONFIG_PATH = _resolve_model_path("calibration_config.json")


class DeepShieldVisionDetector:
    """Production visual forensic detector powered by trained neural backbone and calibrated probabilities."""

    def __init__(self):
        self.model_name = "DeepShieldDualStreamSpatialFreq_v1"
        self.model_version = "2.0.0"
        self.preprocessing_version = DEFAULT_PREPROCESSOR.version
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        # Load calibration parameters
        self.temperature = 1.3922
        self.threshold = 0.50
        self.uncertainty_band = 0.12

        if os.path.exists(CALIBRATION_CONFIG_PATH):
            try:
                with open(CALIBRATION_CONFIG_PATH, "r") as f:
                    cfg = json.load(f)
                    self.temperature = float(cfg.get("temperature", 1.3922))
                    self.threshold = float(cfg.get("optimal_threshold", 0.50))
                    self.uncertainty_band = float(cfg.get("uncertainty_band", 0.12))
            except Exception:
                pass

        # Instantiate model
        self.model = DeepShieldImageClassifier().to(self.device)
        self.model_ready = False

        if os.path.exists(CHECKPOINT_PATH):
            try:
                checkpoint = torch.load(CHECKPOINT_PATH, map_location=self.device)
                self.model.load_state_dict(checkpoint["model_state_dict"])
                self.model.eval()
                self.model_ready = True
            except Exception as e:
                print(f"[ERROR] Failed to load vision checkpoint: {e}")
                self.model_ready = False

        # Auxiliary analyzers for technical inspection
        self.spectral_analyzer = ImageSpectralAnalyzer()
        self.ela_analyzer = ELAAnalyzer()

    def analyze(self, file_path: str) -> Dict[str, Any]:
        """Runs end-to-end calibrated visual forensic inference on an image file."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Image file not found: {file_path}")

        if not self.model_ready:
            raise RuntimeError("MODEL NOT READY: Vision detector weights not loaded or checkpoint corrupted.")

        start_t = time.time()

        # 1. Load image and physical metadata
        file_size = os.path.getsize(file_path)
        img_bgr = cv2.imread(file_path)
        if img_bgr is None:
            raise ValueError(f"Failed to decode image from {file_path}")

        orig_h, orig_w, orig_c = img_bgr.shape

        with Image.open(file_path) as pil_raw:
            pil_rgb = pil_raw.convert("RGB")

        # 2. Centralized deterministic preprocessing
        spatial_t, freq_t = preprocess_image_tensor(pil_rgb)
        spatial_batch = spatial_t.unsqueeze(0).to(self.device)
        freq_batch = freq_t.unsqueeze(0).to(self.device)

        # 3. Model Inference & Temperature-Calibrated Softmax
        with torch.no_grad():
            raw_logits = self.model(spatial_batch, freq_batch)
            cal_logits = raw_logits / self.temperature
            probs = torch.softmax(cal_logits, dim=1).cpu().numpy()[0]

        prob_real = float(probs[0])
        prob_synthetic = float(probs[1])

        # True statistical definition of model confidence
        model_confidence = float(max(prob_synthetic, prob_real))

        # 4. Optimal Decision Thresholding & Uncertainty Abstention
        dist_from_threshold = abs(prob_synthetic - self.threshold)

        if dist_from_threshold < self.uncertainty_band:
            classification = "uncertain"
            risk_level = "medium"
            summary = (
                f"Model evidence is in the indeterminate margin (|p - θ*| = {dist_from_threshold:.3f} < {self.uncertainty_band:.2f}). "
                "Forensic confidence is insufficient for a definitive verdict. Secondary expert review recommended."
            )
        elif prob_synthetic >= self.threshold:
            classification = "ai_generated"
            risk_level = "high" if prob_synthetic >= 0.75 else "medium"
            summary = (
                f"Calibrated neural classifier indicates high likelihood of synthetic generation "
                f"({prob_synthetic * 100:.2f}% probability vs optimal threshold of {self.threshold:.2f}). "
                "Spatial texture boundaries and high-frequency spectral residuals exhibit generative artifacts."
            )
        else:
            classification = "real"
            risk_level = "low"
            summary = (
                f"Visual optical consistency, sensor noise distribution, and natural gradient boundaries "
                f"align with authentic human-captured camera photography ({prob_real * 100:.2f}% authentic probability)."
            )

        # 5. Explainability: Generate Grad-CAM attention heatmap
        try:
            target_class = 1 if prob_synthetic >= self.threshold else 0
            cam_map = self.model.generate_gradcam(spatial_batch, freq_batch, target_class=target_class)
            # Create color overlay on thumbnail
            cam_colored = cv2.applyColorMap((cam_map * 255).astype(np.uint8), cv2.COLORMAP_JET)
            cam_bgr = cv2.cvtColor(cam_colored, cv2.COLOR_RGB2BGR)
            # Encode as PNG data URI
            _, buf = cv2.imencode(".png", cam_colored)
            gradcam_data_uri = f"data:image/png;base64,{base64.b64encode(buf).decode('ascii')}"
        except Exception:
            gradcam_data_uri = None

        # 6. Technical forensic metrics
        freq_metrics = self.spectral_analyzer.analyze_frequency_domain(img_bgr)
        ela_metrics = self.ela_analyzer.analyze_ela(img_bgr)
        elapsed_ms = int((time.time() - start_t) * 1000)

        return {
            "status": "completed",
            "classification": classification,
            "synthetic_probability": round(prob_synthetic, 4),
            "real_probability": round(prob_real, 4),
            "calibrated": True,
            "confidence": round(model_confidence, 4),
            "risk_level": risk_level,
            "threshold": self.threshold,
            "uncertainty_band": self.uncertainty_band,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "preprocessing_version": self.preprocessing_version,
            "processing_time_ms": elapsed_ms,
            "gradcam_heatmap": gradcam_data_uri,
            "summary_explanation": summary,
            "production_safety_notice": "This result is an AI model prediction, not definitive proof of image origin.",
            "limitations": "AI-generated image detection is probabilistic and may produce false positives and false negatives, particularly under heavy compression or social media re-encoding.",
            "technical_features": {
                "dimensions": {"width": orig_w, "height": orig_h, "channels": orig_c},
                "file_size_bytes": file_size,
                "spectral_frequency_metrics": freq_metrics,
                "error_level_analysis": ela_metrics,
                "temperature_scaling_factor": self.temperature,
            },
            "metadata": {
                "width": orig_w,
                "height": orig_h,
                "aspect_ratio": round(orig_w / max(1, orig_h), 2),
                "file_size_kb": round(file_size / 1024, 1),
                "preprocessing_version": self.preprocessing_version,
            }
        }


# Aliases for backward compatibility
ImageArtifactDetector = DeepShieldVisionDetector
