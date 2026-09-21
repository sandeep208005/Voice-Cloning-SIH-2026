import os
import cv2
import numpy as np
from typing import Dict, Any, List
from app.ai.video.sampler import VideoFrameSampler
from app.ai.video.temporal_analyzer import VideoTemporalAnalyzer
from app.ai.image.face_detector import FaceDetector
from app.ai.image.ela_analyzer import ELAAnalyzer
from app.ai.image.spectral_analyzer import ImageSpectralAnalyzer


class VideoDeepfakeDetector:
    """Forensic video classifier aggregating multi-frame spatial and temporal consistency evidence."""

    def __init__(self, max_frames: int = 24):
        self.sampler = VideoFrameSampler(max_frames=max_frames)
        self.temporal_analyzer = VideoTemporalAnalyzer()
        self.face_detector = FaceDetector()
        self.ela_analyzer = ELAAnalyzer()
        self.spectral_analyzer = ImageSpectralAnalyzer()
        self.model_name = "DeepShield-TemporalForensics-v1"
        self.model_version = "1.2.0"

    def analyze(self, file_path: str) -> Dict[str, Any]:
        """Runs end-to-end video deepfake and temporal inconsistency detection."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Video file not found: {file_path}")

        # 1. Sample frames
        frames, metadata = self.sampler.sample_frames(file_path)
        if not frames:
            raise ValueError("No frames could be extracted from the video.")

        frame_metrics = []
        face_boxes_per_frame = []
        frame_synthetic_scores = []

        # 2. Inspect each sampled frame
        for i, frame in enumerate(frames):
            faces = self.face_detector.detect_faces(frame)
            boxes = [f["box"] for f in faces]
            face_boxes_per_frame.append(boxes)

            # ELA and frequency
            ela = self.ela_analyzer.analyze_ela(frame, face_boxes=boxes)
            freq = self.spectral_analyzer.analyze_frequency_domain(frame)

            # Compute frame-level anomaly
            frame_score = 0.05
            if ela.get("ela_regional_discrepancy", 0) > 0.40:
                frame_score += 0.40
            if freq.get("high_frequency_spikes_ratio", 0) > 0.05:
                frame_score += 0.35

            frame_score = float(np.clip(frame_score, 0.02, 0.95))
            frame_synthetic_scores.append(frame_score)

            frame_metrics.append({
                "frame_index": i,
                "faces_detected": len(faces),
                "frame_synthetic_score": round(frame_score, 3),
                "ela_discrepancy": ela.get("ela_regional_discrepancy", 0),
                "spectral_spikes": freq.get("high_frequency_spikes_ratio", 0),
            })

        # 3. Analyze temporal stability across all frames
        temporal_stats = self.temporal_analyzer.compute_temporal_jitter(face_boxes_per_frame)

        # 4. Multiframe aggregation
        observations = []
        avg_frame_score = float(np.mean(frame_synthetic_scores))
        max_frame_score = float(np.max(frame_synthetic_scores))
        p90_score = float(np.percentile(frame_synthetic_scores, 90))

        # Temporal stability penalty
        stability = temporal_stats.get("temporal_face_stability_score", 1.0)
        temporal_anomaly_penalty = 0.0
        if stability < 0.50 and temporal_stats.get("face_tracking_ratio", 0) > 0.4:
            temporal_anomaly_penalty = (0.50 - stability) * 0.6
            observations.append(f"Inter-frame facial jitter and bounding trajectory instability detected (stability={stability})")

        # Fused video synthetic score (70% robust percentile + 30% temporal jitter)
        combined_score = (0.6 * p90_score + 0.4 * avg_frame_score) + temporal_anomaly_penalty
        synthetic_probability = float(np.clip(combined_score, 0.02, 0.98))

        # Observations
        if avg_frame_score > 0.45:
            observations.append("Recurrent spatial and frequency-domain synthetic artifacts observed across sampled frames")

        # Confidence
        confidence = 0.88 if len(frames) >= 12 else 0.70

        # Classification
        if synthetic_probability >= 0.70:
            classification = "likely_synthetic"
            risk_level = "high"
            summary = "Model indicates high probability of video manipulation / deepfake face-swap: " + ("; ".join(observations) if observations else "Consistent multi-frame facial anomalies detected.")
        elif synthetic_probability >= 0.38:
            classification = "suspicious"
            risk_level = "medium"
            summary = "Temporal or facial anomalies detected requiring secondary manual inspection: " + ("; ".join(observations) if observations else "Mild inter-frame variance observed.")
        else:
            classification = "likely_authentic"
            risk_level = "low"
            summary = "Temporal progression, facial alignment trajectory, and per-frame compression levels remain stable and authentic."

        return {
            "classification": classification,
            "synthetic_probability": round(synthetic_probability, 4),
            "confidence": round(confidence, 4),
            "risk_level": risk_level,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "frames_analyzed": len(frames),
            "technical_features": {
                "metadata": metadata,
                "temporal_jitter_metrics": temporal_stats,
                "average_frame_score": round(avg_frame_score, 3),
                "peak_frame_score": round(max_frame_score, 3),
            },
            "frame_metrics": frame_metrics,
            "metadata": metadata,
            "summary_explanation": summary,
        }
