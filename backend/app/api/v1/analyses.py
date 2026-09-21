import os
import time
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc

from app.db.session import get_db
from app.core.config import settings
from app.api.deps import get_current_user_optional
from app.models.user import User
from app.models.analysis import Analysis
from app.models.analysis_detail import AnalysisDetail
from app.models.alert import Alert
from app.schemas.analysis import (
    AnalysisResponse,
    AnalysisDetailResponse,
    AnalysisListResponse,
)
from app.services.storage import validate_and_save_upload, delete_stored_file
from app.ai.audio.detector import AudioCloneDetector
from app.ai.image.detector import ImageArtifactDetector
from app.ai.video.detector import VideoDeepfakeDetector

router = APIRouter()

# Instantiate forensic models
audio_detector = AudioCloneDetector()
image_detector = ImageArtifactDetector()
video_detector = VideoDeepfakeDetector()


@router.post("/audio", response_model=AnalysisDetailResponse, status_code=status.HTTP_201_CREATED)
async def analyze_audio_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Uploads and analyzes an audio file for neural voice cloning artifacts."""
    start_time = time.time()

    # Ingest and validate file
    stored_filename, safe_orig_name, file_size, mime_type = await validate_and_save_upload(
        file=file,
        expected_media_type="audio",
    )
    full_path = os.path.join(settings.STORAGE_DIR, stored_filename)

    try:
        # Run real acoustic forensic detector
        result = audio_detector.analyze(
            file_path=full_path,
            spectrogram_dir=settings.STORAGE_DIR,
        )
        elapsed_ms = int((time.time() - start_time) * 1000)

        # Create Analysis record in DB
        analysis = Analysis(
            user_id=current_user.id if current_user else None,
            media_type="audio",
            original_filename=safe_orig_name,
            stored_filename=stored_filename,
            file_size_bytes=file_size,
            mime_type=mime_type,
            status="completed",
            classification=result["classification"],
            confidence=result["confidence"],
            synthetic_probability=result["synthetic_probability"],
            risk_level=result["risk_level"],
            model_name=result["model_name"],
            model_version=result["model_version"],
            processing_time_ms=elapsed_ms,
            summary_explanation=result["summary_explanation"],
        )
        db.add(analysis)
        db.flush()

        # Create detailed technical telemetry record
        spec_url = f"/uploads/{result['spectrogram_filename']}" if result.get("spectrogram_filename") else None
        detail = AnalysisDetail(
            analysis_id=analysis.id,
            technical_features=result["technical_features"],
            metadata_info=result["metadata"],
            spectrogram_url=spec_url,
            face_count=0,
            frame_metrics=[],
        )
        db.add(detail)

        # Trigger alert if high risk
        if result["risk_level"] == "high":
            alert = Alert(
                analysis_id=analysis.id,
                severity="critical",
                alert_type="voice_clone",
                message=f"High risk voice clone detected in {safe_orig_name}: {result['summary_explanation']}",
            )
            db.add(alert)

        db.commit()
        db.refresh(analysis)
        db.refresh(detail)

        return AnalysisDetailResponse(
            analysis=AnalysisResponse.model_validate(analysis),
            technical_features=detail.technical_features,
            metadata_info=detail.metadata_info,
            spectrogram_url=detail.spectrogram_url,
            face_count=0,
            frame_metrics=[],
        )

    except ValueError as e:
        db.rollback()
        delete_stored_file(stored_filename)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid or corrupted audio data: {str(e)}",
        )
    except Exception as e:
        db.rollback()
        # Save failed analysis record for transparency
        analysis = Analysis(
            user_id=current_user.id if current_user else None,
            media_type="audio",
            original_filename=safe_orig_name,
            stored_filename=stored_filename,
            file_size_bytes=file_size,
            mime_type=mime_type,
            status="failed",
            classification="error",
            confidence=0.0,
            synthetic_probability=0.0,
            risk_level="low",
            model_name=audio_detector.model_name,
            model_version=audio_detector.model_version,
            processing_time_ms=int((time.time() - start_time) * 1000),
            summary_explanation=f"Processing failed: {str(e)}",
        )
        db.add(analysis)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Audio analysis failure: {str(e)}",
        )


@router.post("/image", response_model=AnalysisDetailResponse, status_code=status.HTTP_201_CREATED)
async def analyze_image_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Uploads and analyzes an image for synthetic generation / face-swap anomalies."""
    start_time = time.time()

    stored_filename, safe_orig_name, file_size, mime_type = await validate_and_save_upload(
        file=file,
        expected_media_type="image",
    )
    full_path = os.path.join(settings.STORAGE_DIR, stored_filename)

    try:
        # Run real visual forensic detector
        result = image_detector.analyze(file_path=full_path)
        elapsed_ms = int((time.time() - start_time) * 1000)

        analysis = Analysis(
            user_id=current_user.id if current_user else None,
            media_type="image",
            original_filename=safe_orig_name,
            stored_filename=stored_filename,
            file_size_bytes=file_size,
            mime_type=mime_type,
            status="completed",
            classification=result["classification"],
            confidence=result["confidence"],
            synthetic_probability=result["synthetic_probability"],
            risk_level=result["risk_level"],
            model_name=result["model_name"],
            model_version=result["model_version"],
            processing_time_ms=elapsed_ms,
            summary_explanation=result["summary_explanation"],
        )
        db.add(analysis)
        db.flush()

        detail = AnalysisDetail(
            analysis_id=analysis.id,
            technical_features=result["technical_features"],
            metadata_info=result["metadata"],
            spectrogram_url=None,
            face_count=result.get("face_count", 0),
            frame_metrics=[],
        )
        db.add(detail)

        if result["risk_level"] == "high":
            alert = Alert(
                analysis_id=analysis.id,
                severity="critical",
                alert_type="synthetic_image",
                message=f"High risk synthetic imagery detected in {safe_orig_name}: {result['summary_explanation']}",
            )
            db.add(alert)

        db.commit()
        db.refresh(analysis)
        db.refresh(detail)

        anal_resp = AnalysisResponse.model_validate(analysis)
        anal_resp.real_probability = result.get("real_probability", round(1.0 - analysis.synthetic_probability, 4))
        anal_resp.calibrated = result.get("calibrated", True)
        anal_resp.threshold = result.get("threshold", 0.50)

        return AnalysisDetailResponse(
            analysis=anal_resp,
            technical_features=detail.technical_features,
            metadata_info=detail.metadata_info,
            spectrogram_url=None,
            gradcam_heatmap=result.get("gradcam_heatmap"),
            threshold=result.get("threshold", 0.50),
            calibrated=result.get("calibrated", True),
            real_probability=result.get("real_probability", round(1.0 - analysis.synthetic_probability, 4)),
            production_safety_notice=result.get("production_safety_notice"),
            limitations=result.get("limitations"),
            face_count=detail.face_count,
            frame_metrics=[],
        )

    except Exception as e:
        db.rollback()
        analysis = Analysis(
            user_id=current_user.id if current_user else None,
            media_type="image",
            original_filename=safe_orig_name,
            stored_filename=stored_filename,
            file_size_bytes=file_size,
            mime_type=mime_type,
            status="failed",
            classification="error",
            confidence=0.0,
            synthetic_probability=0.0,
            risk_level="low",
            model_name=image_detector.model_name,
            model_version=image_detector.model_version,
            processing_time_ms=int((time.time() - start_time) * 1000),
            summary_explanation=f"Processing failed: {str(e)}",
        )
        db.add(analysis)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image analysis failure: {str(e)}",
        )


@router.post("/video", response_model=AnalysisDetailResponse, status_code=status.HTTP_201_CREATED)
async def analyze_video_endpoint(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Uploads and analyzes a video file for multi-frame deepfake and temporal anomalies."""
    start_time = time.time()

    stored_filename, safe_orig_name, file_size, mime_type = await validate_and_save_upload(
        file=file,
        expected_media_type="video",
    )
    full_path = os.path.join(settings.STORAGE_DIR, stored_filename)

    try:
        # Run real temporal video detector
        result = video_detector.analyze(file_path=full_path)
        elapsed_ms = int((time.time() - start_time) * 1000)

        analysis = Analysis(
            user_id=current_user.id if current_user else None,
            media_type="video",
            original_filename=safe_orig_name,
            stored_filename=stored_filename,
            file_size_bytes=file_size,
            mime_type=mime_type,
            status="completed",
            classification=result["classification"],
            confidence=result["confidence"],
            synthetic_probability=result["synthetic_probability"],
            risk_level=result["risk_level"],
            model_name=result["model_name"],
            model_version=result["model_version"],
            processing_time_ms=elapsed_ms,
            summary_explanation=result["summary_explanation"],
        )
        db.add(analysis)
        db.flush()

        detail = AnalysisDetail(
            analysis_id=analysis.id,
            technical_features=result["technical_features"],
            metadata_info=result["metadata"],
            spectrogram_url=None,
            face_count=result.get("frames_analyzed", 0),
            frame_metrics=result.get("frame_metrics", []),
        )
        db.add(detail)

        if result["risk_level"] == "high":
            alert = Alert(
                analysis_id=analysis.id,
                severity="critical",
                alert_type="video_deepfake",
                message=f"Deepfake video detected in {safe_orig_name}: {result['summary_explanation']}",
            )
            db.add(alert)

        db.commit()
        db.refresh(analysis)
        db.refresh(detail)

        return AnalysisDetailResponse(
            analysis=AnalysisResponse.model_validate(analysis),
            technical_features=detail.technical_features,
            metadata_info=detail.metadata_info,
            spectrogram_url=None,
            face_count=detail.face_count,
            frame_metrics=detail.frame_metrics,
        )

    except Exception as e:
        db.rollback()
        analysis = Analysis(
            user_id=current_user.id if current_user else None,
            media_type="video",
            original_filename=safe_orig_name,
            stored_filename=stored_filename,
            file_size_bytes=file_size,
            mime_type=mime_type,
            status="failed",
            classification="error",
            confidence=0.0,
            synthetic_probability=0.0,
            risk_level="low",
            model_name=video_detector.model_name,
            model_version=video_detector.model_version,
            processing_time_ms=int((time.time() - start_time) * 1000),
            summary_explanation=f"Processing failed: {str(e)}",
        )
        db.add(analysis)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Video analysis failure: {str(e)}",
        )


@router.get("", response_model=AnalysisListResponse)
def list_analyses(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=100),
    media_type: Optional[str] = Query(None),
    risk_level: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("newest"),
    db: Session = Depends(get_db),
):
    """Retrieves paginated analyses backed strictly by database queries."""
    query = db.query(Analysis)

    if media_type and media_type != "all":
        query = query.filter(Analysis.media_type == media_type)
    if risk_level and risk_level != "all":
        query = query.filter(Analysis.risk_level == risk_level)
    if status and status != "all":
        query = query.filter(Analysis.status == status)
    if search:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Analysis.original_filename.ilike(search_pattern))
            | (Analysis.id.ilike(search_pattern))
        )

    # Sorting
    if sort_by == "oldest":
        query = query.order_by(asc(Analysis.created_at))
    elif sort_by == "risk_high":
        query = query.order_by(desc(Analysis.synthetic_probability))
    elif sort_by == "risk_low":
        query = query.order_by(asc(Analysis.synthetic_probability))
    else:
        query = query.order_by(desc(Analysis.created_at))

    total = query.count()
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    total_pages = (total + limit - 1) // limit if limit > 0 else 1

    return AnalysisListResponse(
        items=[AnalysisResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
    )


@router.get("/{analysis_id}", response_model=AnalysisDetailResponse)
def get_analysis_detail(
    analysis_id: str,
    db: Session = Depends(get_db),
):
    """Returns complete forensic technical breakdown for an analysis ID."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis record with ID '{analysis_id}' not found.",
        )

    detail = db.query(AnalysisDetail).filter(AnalysisDetail.analysis_id == analysis_id).first()

    return AnalysisDetailResponse(
        analysis=AnalysisResponse.model_validate(analysis),
        technical_features=detail.technical_features if detail else {},
        metadata_info=detail.metadata_info if detail else {},
        spectrogram_url=detail.spectrogram_url if detail else None,
        face_count=detail.face_count if detail else 0,
        frame_metrics=detail.frame_metrics if detail else [],
    )


@router.delete("/{analysis_id}", status_code=status.HTTP_200_OK)
def delete_analysis(
    analysis_id: str,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional),
):
    """Deletes an analysis record and removes stored media file from disk."""
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Analysis record with ID '{analysis_id}' not found.",
        )

    # Delete physical file
    delete_stored_file(analysis.stored_filename)

    # If spectrogram existed, delete it
    detail = db.query(AnalysisDetail).filter(AnalysisDetail.analysis_id == analysis_id).first()
    if detail and detail.spectrogram_url:
        spec_filename = os.path.basename(detail.spectrogram_url)
        delete_stored_file(spec_filename)

    db.delete(analysis)
    db.commit()

    return {"message": f"Analysis '{analysis_id}' successfully purged."}
