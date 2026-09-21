from typing import List
from fastapi import APIRouter
from app.schemas.models_status import ModelInfo
from app.ai.audio.detector import AudioCloneDetector
from app.ai.image.detector import ImageArtifactDetector
from app.ai.video.detector import VideoDeepfakeDetector

router = APIRouter()

audio_m = AudioCloneDetector()
image_m = ImageArtifactDetector()
video_m = VideoDeepfakeDetector()


@router.get("", response_model=List[ModelInfo])
def get_models_status():
    """Returns the operational status and feature extraction specifications of active models."""
    return [
        ModelInfo(
            name=audio_m.model_name,
            version=audio_m.model_version,
            media_type="audio",
            status="online",
            device="CPU / Scipy Librosa Engine",
            features_extracted=[
                "Mel-Spectrogram (128 bins)",
                "20 MFCCs (mean & variance)",
                "Spectral Centroid & Rolloff",
                "High-frequency Vocoder Cutoff (>7.5kHz)",
                "Micro-pitch Jitter & Harmonic/Percussive Ratio",
            ],
            description="Forensic acoustic analysis pipeline detecting neural vocoder artifacts and synthetic prosodic manipulation.",
        ),
        ModelInfo(
            name=image_m.model_name,
            version=image_m.model_version,
            media_type="image",
            status="online",
            device="CPU / OpenCV NumPy Engine",
            features_extracted=[
                "Haar Facial Landmark Detection",
                "Error Level Analysis (ELA) Quantization Discrepancy",
                "2D-FFT High-frequency Grid Spikes (GAN/Diffusion Fingerprint)",
                "Facial Boundary Gradient Discontinuity",
                "Laplacian Variance Blur Analysis",
            ],
            description="Spatial and frequency domain forensic analyzer identifying face-swap blending and synthetic generation fingerprints.",
        ),
        ModelInfo(
            name=video_m.model_name,
            version=video_m.model_version,
            media_type="video",
            status="online",
            device="CPU / OpenCV Temporal Engine",
            features_extracted=[
                "Uniform Temporal Frame Sampling (up to 24 frames)",
                "Inter-frame Bounding Box Jitter & Scale Fluctuation",
                "Optical Flow Velocity Consistency",
                "Per-frame ELA and Frequency Anomaly Tracking",
                "Robust Percentile Temporal Aggregation",
            ],
            description="Multi-frame temporal consistency detector exposing frame-by-frame face alignment instability and deepfake jitter.",
        ),
    ]
