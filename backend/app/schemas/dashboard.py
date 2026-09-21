from typing import List, Dict, Any
from pydantic import BaseModel
from app.schemas.analysis import AnalysisResponse


class TrendDataPoint(BaseModel):
    date: str
    total: int
    synthetic: int
    authentic: int


class DashboardStatistics(BaseModel):
    total_analyses: int
    audio_analyses: int
    image_analyses: int
    video_analyses: int
    suspicious_detections: int
    high_risk_analyses: int
    processing_failures: int
    risk_distribution: Dict[str, int]
    classification_distribution: Dict[str, int]
    trends: List[TrendDataPoint]
    unresolved_alerts_count: int


class RecentAnalysisItem(BaseModel):
    id: str
    media_type: str
    original_filename: str
    risk_level: str
    classification: str
    synthetic_probability: float
    confidence: float
    created_at: str
