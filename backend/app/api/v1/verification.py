import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.core.config import settings
from app.services.challenge import ChallengeService
from app.services.storage import validate_and_save_upload, delete_stored_file
from app.schemas.challenge import ChallengeGenerateResponse, ChallengeSubmitResponse

router = APIRouter()
challenge_service = ChallengeService()


@router.post("/challenge", response_model=ChallengeGenerateResponse)
def generate_challenge_endpoint(db: Session = Depends(get_db)):
    """Generates a dynamic, timestamped challenge phrase for active identity/liveness verification."""
    session = challenge_service.generate_challenge(db)
    return ChallengeGenerateResponse(
        session_token=session.session_token,
        phrase=session.phrase,
        expires_at=session.expires_at,
        instructions="Read and record the phrase aloud using your microphone to verify vocal liveness and articulatory authenticity.",
    )


@router.post("/submit", response_model=ChallengeSubmitResponse)
async def submit_challenge_endpoint(
    session_token: Optional[str] = Form(None),
    token: Optional[str] = Query(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
):
    """Verifies user-recorded audio response against the challenge session."""
    target_token = session_token or token
    if not target_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session token is required for challenge verification.",
        )
    stored_filename, safe_name, size, mime = await validate_and_save_upload(
        file=file,
        expected_media_type="audio",
    )
    full_path = os.path.join(settings.STORAGE_DIR, stored_filename)

    try:
        result = challenge_service.verify_response(
            db=db,
            session_token=session_token,
            audio_file_path=full_path,
        )
        return ChallengeSubmitResponse(
            session_token=session_token,
            status=result["status"],
            similarity_score=result["similarity_score"],
            voice_authenticity_score=result["voice_authenticity_score"],
            is_authentic=result["is_authentic"],
            explanation=result["explanation"],
        )
    finally:
        # Securely delete the temporary verification audio
        delete_stored_file(stored_filename)
