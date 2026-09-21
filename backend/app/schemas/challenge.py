from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ChallengeGenerateResponse(BaseModel):
    session_token: str
    phrase: str
    expires_at: datetime
    instructions: str


class ChallengeSubmitResponse(BaseModel):
    session_token: str
    status: str  # verified, failed
    similarity_score: float
    voice_authenticity_score: float
    is_authentic: bool
    explanation: str
