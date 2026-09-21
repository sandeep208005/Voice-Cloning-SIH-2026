import uuid
from typing import Optional, Dict, Any, List
from sqlalchemy import String, Integer, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class AnalysisDetail(Base):
    __tablename__ = "analysis_details"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    analysis_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("analyses.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # Real technical features extracted from the input media
    technical_features: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    metadata_info: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    # Forensic metrics
    spectrogram_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    face_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    frame_metrics: Mapped[Optional[List[Dict[str, Any]]]] = mapped_column(JSON, default=list, nullable=True)

    analysis = relationship("Analysis", back_populates="details")
