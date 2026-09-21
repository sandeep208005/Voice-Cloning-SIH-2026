import os
import math
import numpy as np
from typing import Dict, Any, Tuple
from app.ai.audio.extractor import AudioFeatureExtractor

# Baseline acoustic parameters for natural human speech
NATURAL_SPEECH_BASELINES = {
    "pitch_jitter_min": 0.004,
    "pitch_jitter_max": 0.035,
    "spectral_centroid_min": 800.0,
    "spectral_centroid_max": 3800.0,
    "high_freq_ratio_natural_min": 0.015,
    "high_freq_ratio_natural_max": 0.28,
    "harmonic_percussive_ratio_min": 0.5,
    "harmonic_percussive_ratio_max": 18.0,
}


class AudioCloneDetector:
    """Forensic acoustic classifier detecting neural voice clones and vocoder artifacts."""

    def __init__(self):
        self.extractor = AudioFeatureExtractor()
        self.model_name = "DeepShield-AcousticForensics-v1"
        self.model_version = "1.2.0"

    def analyze(self, file_path: str, spectrogram_dir: str = "") -> Dict[str, Any]:
        """Runs end-to-end forensic analysis on an audio file."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Audio file not found: {file_path}")

        # 1. Load signal
        y, sr = self.extractor.load_audio(file_path)

        # 2. Extract real acoustic features
        features = self.extractor.extract_features(y, sr)

        # 3. Compute forensic anomaly indicators
        anomaly_scores = []
        forensic_observations = []

        # Jitter evaluation
        jitter = features.get("pitch_jitter", 0.0)
        if features.get("duration_seconds", 0) > 0.5 and features.get("f0_mean_hz", 0) > 50:
            if jitter < NATURAL_SPEECH_BASELINES["pitch_jitter_min"]:
                # Unnaturally rigid pitch (indicative of early/unconditioned TTS or robotic vocoding)
                dev = (NATURAL_SPEECH_BASELINES["pitch_jitter_min"] - jitter) / NATURAL_SPEECH_BASELINES["pitch_jitter_min"]
                anomaly_scores.append(min(1.0, 0.4 + dev * 0.5))
                forensic_observations.append("Sub-natural micro-pitch perturbation (abnormally rigid pitch contour)")
            elif jitter > NATURAL_SPEECH_BASELINES["pitch_jitter_max"]:
                dev = (jitter - NATURAL_SPEECH_BASELINES["pitch_jitter_max"]) / NATURAL_SPEECH_BASELINES["pitch_jitter_max"]
                anomaly_scores.append(min(1.0, 0.5 + dev * 0.4))
                forensic_observations.append("Elevated pitch discontinuity at phoneme transitions")
            else:
                anomaly_scores.append(0.08)

        # High frequency energy cutoff (Vocoder signature)
        high_ratio = features.get("high_freq_ratio", 0.0)
        if high_ratio < NATURAL_SPEECH_BASELINES["high_freq_ratio_natural_min"]:
            anomaly_scores.append(0.72)
            forensic_observations.append("Severe high-frequency attenuation above 7.5kHz characteristic of neural vocoder resampling")
        elif high_ratio > 0.35:
            anomaly_scores.append(0.65)
            forensic_observations.append("Excessive high-frequency synthetic phase noise detected")
        else:
            anomaly_scores.append(0.12)

        # Harmonic vs Percussive ratio
        hp_ratio = features.get("harmonic_percussive_ratio", 1.0)
        if hp_ratio > NATURAL_SPEECH_BASELINES["harmonic_percussive_ratio_max"] or hp_ratio < NATURAL_SPEECH_BASELINES["harmonic_percussive_ratio_min"]:
            anomaly_scores.append(0.60)
            forensic_observations.append("Harmonic-to-percussive energy ratio deviates from organic human vocal tract modeling")
        else:
            anomaly_scores.append(0.10)

        # Higher MFCC variance
        mfcc_high_var = features.get("mfcc_summary", {}).get("higher_coefficients_variance", 0.0)
        if mfcc_high_var > 45.0:
            anomaly_scores.append(0.68)
            forensic_observations.append("High cepstral variance in upper bands indicative of synthetic spectral synthesis")
        elif mfcc_high_var < 5.0 and features.get("duration_seconds", 0) > 1.0:
            anomaly_scores.append(0.70)
            forensic_observations.append("Unnaturally low cepstral variance (spectral over-smoothing)")
        else:
            anomaly_scores.append(0.10)

        # Calculate final calibrated synthetic probability
        if not anomaly_scores:
            synthetic_probability = 0.15
        else:
            # Weighted soft-max combination
            weights = [0.30, 0.30, 0.20, 0.20]
            if len(anomaly_scores) < len(weights):
                weights = [1.0 / len(anomaly_scores)] * len(anomaly_scores)
            raw_score = sum(w * s for w, s in zip(weights, anomaly_scores))
            synthetic_probability = float(np.clip(raw_score, 0.01, 0.99))

        # Confidence based on audio duration and signal quality
        duration = features.get("duration_seconds", 0.0)
        if duration < 0.8:
            confidence = 0.55
            forensic_observations.append("Short sample duration limits statistical confidence")
        elif duration < 2.0:
            confidence = 0.78
        else:
            confidence = 0.92

        # Risk classification
        if synthetic_probability >= 0.70:
            classification = "likely_synthetic"
            risk_level = "high"
        elif synthetic_probability >= 0.38:
            classification = "suspicious"
            risk_level = "medium"
        else:
            classification = "likely_authentic"
            risk_level = "low"

        # Generate human-readable explanation
        if classification == "likely_synthetic":
            explanation = "Elevated likelihood of synthetic voice cloning: " + "; ".join(forensic_observations)
        elif classification == "suspicious":
            explanation = "Acoustic anomalies detected requiring secondary verification: " + "; ".join(forensic_observations)
        else:
            explanation = "Acoustic characteristics align with authentic organic human speech. Natural vocal tract harmonic distribution and micro-jitter observed."

        # Generate spectrogram visualization if path provided
        spectrogram_filename = ""
        if spectrogram_dir and os.path.exists(spectrogram_dir):
            base_id = os.path.splitext(os.path.basename(file_path))[0]
            spec_path = os.path.join(spectrogram_dir, f"spec_{base_id}.png")
            self.extractor.generate_spectrogram_image(y, sr, spec_path)
            spectrogram_filename = f"spec_{base_id}.png"

        return {
            "classification": classification,
            "synthetic_probability": round(synthetic_probability, 4),
            "confidence": round(confidence, 4),
            "risk_level": risk_level,
            "model_name": self.model_name,
            "model_version": self.model_version,
            "technical_features": features,
            "metadata": {
                "sample_rate": sr,
                "duration_seconds": duration,
                "channels": 1,
            },
            "summary_explanation": explanation,
            "spectrogram_filename": spectrogram_filename,
        }
