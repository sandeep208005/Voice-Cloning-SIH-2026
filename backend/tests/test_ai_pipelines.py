import io
import os
import tempfile
import numpy as np
import cv2
import soundfile as sf
import pytest

from app.ai.audio.detector import AudioCloneDetector
from app.ai.image.detector import ImageArtifactDetector
from app.ai.video.detector import VideoDeepfakeDetector
from app.ai.multimodal.risk_engine import MultimodalRiskEngine


def test_real_audio_pipeline():
    """Tests real acoustic feature extraction on synthesized signal."""
    detector = AudioCloneDetector()
    sr = 22050
    t = np.linspace(0, 2.0, int(sr * 2.0), endpoint=False)
    # Generate audio with fundamental 220Hz + harmonics + noise
    audio = 0.5 * np.sin(2 * np.pi * 220 * t) + 0.2 * np.sin(2 * np.pi * 440 * t) + 0.02 * np.random.randn(len(t))

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        sf.write(tmp.name, audio.astype(np.float32), sr)
        tmp_path = tmp.name

    try:
        result = detector.analyze(tmp_path)
        assert result["model_name"] == "DeepShield-AcousticForensics-v1"
        assert 0.0 <= result["synthetic_probability"] <= 1.0
        assert 0.0 <= result["confidence"] <= 1.0
        assert result["risk_level"] in ["low", "medium", "high"]
        features = result["technical_features"]
        assert features["sample_rate"] == 22050
        assert "spectral_centroid_mean" in features
        assert "zero_crossing_rate_mean" in features
        assert "high_freq_ratio" in features
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_real_image_pipeline():
    """Tests real image forensic pipeline (face detection, ELA, 2D-FFT)."""
    detector = ImageArtifactDetector()
    # Create synthetic test image (200x200 BGR)
    img = np.ones((256, 256, 3), dtype=np.uint8) * 128
    # Add high-frequency grid pattern simulating GAN artifact
    img[::4, ::4, :] = 220

    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
        cv2.imwrite(tmp.name, img)
        tmp_path = tmp.name

    try:
        result = detector.analyze(tmp_path)
        assert result["model_name"] == "DeepShieldDualStreamSpatialFreq_v1"
        assert 0.0 <= result["synthetic_probability"] <= 1.0
        assert 0.0 <= result["real_probability"] <= 1.0
        assert result["calibrated"] is True
        assert result["risk_level"] in ["low", "medium", "high"]
        features = result["technical_features"]
        assert "error_level_analysis" in features
        assert "spectral_frequency_metrics" in features
        assert features["spectral_frequency_metrics"]["high_freq_power"] > 0
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_real_video_pipeline():
    """Tests real video sampling and temporal consistency analysis."""
    detector = VideoDeepfakeDetector(max_frames=12)
    
    with tempfile.NamedTemporaryFile(suffix=".mp4", delete=False) as tmp:
        tmp_path = tmp.name

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(tmp_path, fourcc, 10.0, (128, 128))
    for i in range(15):
        frame = np.zeros((128, 128, 3), dtype=np.uint8)
        # Shift a block to simulate motion
        cv2.rectangle(frame, (20 + i * 2, 20), (60 + i * 2, 60), (200, 180, 150), -1)
        out.write(frame)
    out.release()

    try:
        result = detector.analyze(tmp_path)
        assert result["model_name"] == "DeepShield-TemporalForensics-v1"
        assert result["frames_analyzed"] > 0
        assert 0.0 <= result["synthetic_probability"] <= 1.0
        assert "frame_metrics" in result
        assert len(result["frame_metrics"]) > 0
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def test_multimodal_bayesian_fusion():
    """Tests Bayesian log-odds fusion of multimodal evidence."""
    audio_res = {"synthetic_probability": 0.85, "confidence": 0.90}
    image_res = {"synthetic_probability": 0.78, "confidence": 0.85}

    fused = MultimodalRiskEngine.fuse_evidence(audio_result=audio_res, image_result=image_res)
    assert fused["risk_level"] == "high"
    assert fused["synthetic_probability"] >= 0.70
    assert "audio" in fused["modalities_evaluated"]
    assert "image" in fused["modalities_evaluated"]

    # Authentic evidence test
    clean_audio = {"synthetic_probability": 0.08, "confidence": 0.90}
    clean_image = {"synthetic_probability": 0.05, "confidence": 0.88}
    clean_fused = MultimodalRiskEngine.fuse_evidence(audio_result=clean_audio, image_result=clean_image)
    assert clean_fused["risk_level"] == "low"
    assert clean_fused["synthetic_probability"] < 0.35
