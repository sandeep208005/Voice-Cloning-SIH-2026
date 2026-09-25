import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Float, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ChallengeSession(Base):
    __tablename__ = "challenge_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id: Mapped[Optional[str]] = mapped_column(String(64), index=True, nullable=True)
    session_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    phrase: Mapped[str] = mapped_column(Text, nullable=False)
    phonetic_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    
    # Metadata and synchronization with Live Radar & Incident Management
    source: Mapped[str] = mapped_column(String(64), default="Dynamic Challenge Studio", nullable=False)
    person_identity: Mapped[str] = mapped_column(String(128), default="Target Identity", nullable=False)
    detection_type: Mapped[str] = mapped_column(String(64), default="Vocal Liveness Challenge", nullable=False)
    risk_level: Mapped[str] = mapped_column(String(20), default="low", nullable=False)  # low, medium, high, critical
    confidence_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    verification_status: Mapped[str] = mapped_column(String(30), default="pending", nullable=False)  # pending, verified, failed, challenge_issued, blocked
    
    # Challenge evaluation details
    challenge_response: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    challenge_result: Mapped[Optional[str]] = mapped_column(String(30), nullable=True)  # passed, failed, pending
    evidence_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    final_decision: Mapped[str] = mapped_column(String(40), default="PENDING_VERIFICATION", nullable=False)
    
    # Legacy scores & status
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, verified, failed
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    voice_authenticity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
