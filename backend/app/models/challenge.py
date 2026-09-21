import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.db.base import Base


class ChallengeSession(Base):
    __tablename__ = "challenge_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    session_token: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    phrase: Mapped[str] = mapped_column(Text, nullable=False)
    phonetic_hash: Mapped[str] = mapped_column(String(128), nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)  # pending, verified, failed
    similarity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    voice_authenticity_score: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )
