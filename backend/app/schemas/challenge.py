from datetime import datetime
from typing import Optional, Any, Dict
from pydantic import BaseModel, ConfigDict


class ChallengeGenerateRequest(BaseModel):
    event_id: Optional[str] = None
    source: Optional[str] = "Dynamic Challenge Studio"
    person_identity: Optional[str] = "Target Identity"
    detection_type: Optional[str] = "Vocal Liveness Challenge"
    risk_level: Optional[str] = "low"
    confidence_score: Optional[float] = 0.0
    evidence_id: Optional[str] = None


class ChallengeGenerateResponse(BaseModel):
    session_token: str
    phrase: str
    expires_at: datetime
    instructions: str
    event_id: Optional[str] = None
    source: Optional[str] = None
    person_identity: Optional[str] = None


class ChallengeSubmitResponse(BaseModel):
    session_token: str
    event_id: Optional[str] = None
    status: str  # verified, failed
    similarity_score: float
    voice_authenticity_score: float
    is_authentic: bool
    explanation: str
    verification_status: Optional[str] = None
    final_decision: Optional[str] = None


class RadarEventRecordRequest(BaseModel):
    event_id: Optional[str] = None
    source: Optional[str] = "Live Surveillance Radar"
    person_identity: Optional[str] = "Subject Detected"
    detection_type: Optional[str] = "Live Stream Anomaly"
    risk_level: str = "high"
    confidence_score: float = 0.85
    evidence_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class VerificationRecordItem(BaseModel):
    id: str
    event_id: str
    session_token: Optional[str] = None
    created_at: datetime
    source: str
    person_identity: str
    detection_type: str
    risk_level: str
    confidence_score: float
    verification_status: str
    challenge_phrase: Optional[str] = None
    challenge_response: Optional[str] = None
    challenge_result: Optional[str] = None
    similarity_score: float
    voice_authenticity_score: float
    evidence_id: Optional[str] = None
    final_decision: str

    model_config = ConfigDict(from_attributes=True)
