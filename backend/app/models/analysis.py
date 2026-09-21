import uuid
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Analysis(Base):
    __tablename__ = "analyses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[Optional[str]] = mapped_column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    media_type: Mapped[str] = mapped_column(String(20), nullable=False)  # audio, image, video
    original_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    stored_filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    mime_type: Mapped[str] = mapped_column(String(100), nullable=False)
    
    # State & Verdict
    status: Mapped[str] = mapped_column(String(20), default="processing", nullable=False)  # processing, completed, failed
    classification: Mapped[str] = mapped_column(String(50), default="unclassified", nullable=False)  # likely_authentic, suspicious, likely_synthetic
    confidence: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # 0.0 to 1.0
    synthetic_probability: Mapped[float] = mapped_column(Float, default=0.0, nullable=False)  # 0.0 to 1.0
    risk_level: Mapped[str] = mapped_column(String(20), default="low", nullable=False)  # low, medium, high
    
    # Model provenance
    model_name: Mapped[str] = mapped_column(String(100), default="ensemble", nullable=False)
    model_version: Mapped[str] = mapped_column(String(50), default="1.0.0", nullable=False)
    processing_time_ms: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    summary_explanation: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
        index=True,
    )

    # Relationships
    user = relationship("User", back_populates="analyses")
    details = relationship("AnalysisDetail", back_populates="analysis", uselist=False, cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="analysis", cascade="all, delete-orphan")
