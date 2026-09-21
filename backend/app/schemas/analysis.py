from datetime import datetime
from typing import Optional, Dict, Any, List
from pydantic import BaseModel, Field, ConfigDict


class AnalysisResponse(BaseModel):
    id: str
    user_id: Optional[str] = None
    media_type: str
    original_filename: str
    file_size_bytes: int
    mime_type: str
    status: str
    classification: str
    confidence: float
    synthetic_probability: float
    real_probability: Optional[float] = None
    calibrated: Optional[bool] = True
    threshold: Optional[float] = 0.50
    risk_level: str
    model_name: str
    model_version: str
    processing_time_ms: int
    summary_explanation: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisDetailResponse(BaseModel):
    analysis: AnalysisResponse
    technical_features: Dict[str, Any]
    metadata_info: Dict[str, Any]
    spectrogram_url: Optional[str] = None
    gradcam_heatmap: Optional[str] = None
    threshold: Optional[float] = 0.50
    calibrated: bool = True
    real_probability: Optional[float] = None
    production_safety_notice: Optional[str] = "This result is an AI model prediction, not definitive proof of image origin."
    limitations: Optional[str] = "AI-generated image detection is probabilistic and may produce false positives and false negatives."
    face_count: int = 0
    frame_metrics: Optional[List[Dict[str, Any]]] = None


class AnalysisListResponse(BaseModel):
    items: List[AnalysisResponse]
    total: int
    page: int
    limit: int
    total_pages: int
