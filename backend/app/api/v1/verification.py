import os
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.services.challenge import ChallengeService
from app.services.storage import validate_and_save_upload, delete_stored_file
from app.schemas.challenge import (
    ChallengeGenerateRequest,
    ChallengeGenerateResponse,
    ChallengeSubmitResponse,
    RadarEventRecordRequest,
    VerificationRecordItem,
)

router = APIRouter()
challenge_service = ChallengeService()


@router.post("/challenge", response_model=ChallengeGenerateResponse)
def generate_challenge_endpoint(
    req: Optional[ChallengeGenerateRequest] = None,
    event_id: Optional[str] = Query(None),
    source: Optional[str] = Query("Dynamic Challenge Studio"),
    person_identity: Optional[str] = Query("Target Identity"),
    detection_type: Optional[str] = Query("Vocal Liveness Challenge"),
    risk_level: Optional[str] = Query("low"),
    confidence_score: Optional[float] = Query(0.0),
    evidence_id: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    """
    Generates a dynamic, timestamped challenge phrase for active identity/liveness verification.
    Automatically links to event_id if provided.
    """
    target_event_id = req.event_id if req and req.event_id else event_id
    target_source = req.source if req and req.source else source
    target_person = req.person_identity if req and req.person_identity else person_identity
    target_detection = req.detection_type if req and req.detection_type else detection_type
    target_risk = req.risk_level if req and req.risk_level else risk_level
    target_conf = req.confidence_score if req and req.confidence_score is not None else confidence_score
    target_evidence = req.evidence_id if req and req.evidence_id else evidence_id

    session = challenge_service.generate_challenge(
        db=db,
        event_id=target_event_id,
        source=target_source,
        person_identity=target_person,
        detection_type=target_detection,
        risk_level=target_risk,
        confidence_score=target_conf,
        evidence_id=target_evidence,
    )
    return ChallengeGenerateResponse(
        session_token=session.session_token,
        phrase=session.phrase,
        expires_at=session.expires_at,
        instructions="Read and record the phrase aloud using your microphone to verify vocal liveness and articulatory authenticity.",
        event_id=session.event_id,
        source=session.source,
        person_identity=session.person_identity,
    )


@router.post("/submit", response_model=ChallengeSubmitResponse)
async def submit_challenge_endpoint(
    session_token: Optional[str] = Form(None),
    event_id: Optional[str] = Form(None),
    token: Optional[str] = Query(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """
    Verifies user-recorded audio response against the challenge session.
    Persists verification outcome in the database and updates linked event.
    """
    target_token = session_token or token
    if not target_token and not event_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session token or event_id is required for challenge verification.",
        )

    stored_filename, safe_name, size, mime = await validate_and_save_upload(
        file=file,
        expected_media_type="audio",
    )
    full_path = os.path.join(settings.STORAGE_DIR, stored_filename)

    try:
        result = challenge_service.verify_response(
            db=db,
            session_token=target_token or "",
            audio_file_path=full_path,
            event_id=event_id,
        )
        return ChallengeSubmitResponse(
            session_token=result.get("session_token", target_token or ""),
            event_id=result.get("event_id"),
            status=result["status"],
            similarity_score=result["similarity_score"],
            voice_authenticity_score=result["voice_authenticity_score"],
            is_authentic=result["is_authentic"],
            explanation=result["explanation"],
            verification_status=result.get("verification_status"),
            final_decision=result.get("final_decision"),
        )
    finally:
        # Securely delete the temporary verification audio
        delete_stored_file(stored_filename)


@router.get("/history", response_model=List[VerificationRecordItem])
def get_verification_history_endpoint(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db),
):
    """
    Retrieves all persistent verification records across Live Radar, Challenge Studio, and Impersonation Verification.
    """
    records = challenge_service.get_verification_history(db, limit=limit)
    response_list = []
    for r in records:
        response_list.append(VerificationRecordItem(
            id=r.id,
            event_id=r.event_id or f"VRF-{r.id[:8]}",
            session_token=r.session_token,
            created_at=r.created_at,
            source=r.source or "Dynamic Challenge Studio",
            person_identity=r.person_identity or "Target Identity",
            detection_type=r.detection_type or "Vocal Liveness Challenge",
            risk_level=r.risk_level or "low",
            confidence_score=r.confidence_score or 0.0,
            verification_status=r.verification_status or r.status,
            challenge_phrase=r.phrase,
            challenge_response=r.challenge_response,
            challenge_result=r.challenge_result or ("passed" if r.status == "verified" else ("failed" if r.status == "failed" else "pending")),
            similarity_score=r.similarity_score or 0.0,
            voice_authenticity_score=r.voice_authenticity_score or 0.0,
            evidence_id=r.evidence_id,
            final_decision=r.final_decision or ("VERIFIED_AUTHENTIC" if r.status == "verified" else "PENDING_VERIFICATION"),
        ))
    return response_list


@router.post("/event", response_model=VerificationRecordItem)
def record_radar_event_endpoint(
    payload: RadarEventRecordRequest,
    db: Session = Depends(get_db),
):
    """
    Directly records or updates a Live Surveillance / Radar event into the verification database.
    """
    session = challenge_service.record_radar_event(
        db=db,
        event_id=payload.event_id,
        source=payload.source or "Live Surveillance Radar",
        person_identity=payload.person_identity or "Subject Detected",
        detection_type=payload.detection_type or "Live Stream Anomaly",
        risk_level=payload.risk_level,
        confidence_score=payload.confidence_score,
        evidence_id=payload.evidence_id,
        details=payload.details,
    )
    return VerificationRecordItem(
        id=session.id,
        event_id=session.event_id or f"VRF-{session.id[:8]}",
        session_token=session.session_token,
        created_at=session.created_at,
        source=session.source,
        person_identity=session.person_identity,
        detection_type=session.detection_type,
        risk_level=session.risk_level,
        confidence_score=session.confidence_score,
        verification_status=session.verification_status,
        challenge_phrase=session.phrase,
        challenge_response=session.challenge_response,
        challenge_result=session.challenge_result or "pending",
        similarity_score=session.similarity_score,
        voice_authenticity_score=session.voice_authenticity_score,
        evidence_id=session.evidence_id,
        final_decision=session.final_decision,
    )


@router.get("/event/{event_id}", response_model=VerificationRecordItem)
def get_event_endpoint(
    event_id: str,
    db: Session = Depends(get_db),
):
    """
    Retrieves verification details for a specific event ID.
    """
    session = challenge_service.get_by_event_id(db, event_id=event_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Verification event '{event_id}' not found.",
        )
    return VerificationRecordItem(
        id=session.id,
        event_id=session.event_id or f"VRF-{session.id[:8]}",
        session_token=session.session_token,
        created_at=session.created_at,
        source=session.source,
        person_identity=session.person_identity,
        detection_type=session.detection_type,
        risk_level=session.risk_level,
        confidence_score=session.confidence_score,
        verification_status=session.verification_status,
        challenge_phrase=session.phrase,
        challenge_response=session.challenge_response,
        challenge_result=session.challenge_result or "pending",
        similarity_score=session.similarity_score,
        voice_authenticity_score=session.voice_authenticity_score,
        evidence_id=session.evidence_id,
        final_decision=session.final_decision,
    )
