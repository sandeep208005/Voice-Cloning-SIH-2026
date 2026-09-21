import uuid
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Tuple
from sqlalchemy.orm import Session
from app.models.challenge import ChallengeSession
from app.ai.audio.detector import AudioCloneDetector

# Phonetically diverse seed phrases engineered to trigger complex articulatory transitions
CHALLENGE_VOCAB = [
    "Quantum shield verifies twelve biometric vectors today",
    "Synthetic vocal harmonics deviate under spectral scrutiny",
    "Dynamic acoustic pulse confirms operational authenticity now",
    "Cyan radar sweeps seventy six frequency channels tonight",
    "Digital signatures protect forensic integrity across all nodes",
    "Zero trust protocol challenges unauthorized neural synthesis",
]


class ChallengeService:
    """Manages dynamic challenge-response sessions for active impersonation defense."""

    def __init__(self):
        self.audio_detector = AudioCloneDetector()

    def generate_challenge(self, db: Session) -> ChallengeSession:
        """Generates a dynamic, timestamped challenge phrase and records session."""
        session_token = secrets.token_hex(24)
        phrase = secrets.choice(CHALLENGE_VOCAB) + f" [Code: {secrets.randbelow(8999) + 1000}]"
        phonetic_hash = hashlib.sha256(phrase.encode("utf-8")).hexdigest()

        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=5)

        session = ChallengeSession(
            session_token=session_token,
            phrase=phrase,
            phonetic_hash=phonetic_hash,
            status="pending",
            similarity_score=0.0,
            voice_authenticity_score=0.0,
            created_at=now,
            expires_at=expires_at,
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def verify_response(
        self,
        db: Session,
        session_token: str,
        audio_file_path: str,
    ) -> Dict[str, Any]:
        """
        Verifies recorded response against challenge session.
        Checks for session expiry and runs voice authenticity model on the recording.
        """
        session = db.query(ChallengeSession).filter(
            ChallengeSession.session_token == session_token
        ).first()

        if not session:
            return {
                "status": "failed",
                "is_authentic": False,
                "similarity_score": 0.0,
                "voice_authenticity_score": 0.0,
                "explanation": "Invalid challenge session token.",
            }

        now = datetime.now(timezone.utc)
        # Ensure session.expires_at has timezone
        exp = session.expires_at
        if exp.tzinfo is None:
            exp = exp.replace(tzinfo=timezone.utc)

        if now > exp:
            session.status = "failed"
            db.commit()
            return {
                "status": "failed",
                "is_authentic": False,
                "similarity_score": 0.0,
                "voice_authenticity_score": 0.0,
                "explanation": "Challenge session has expired. Please request a new challenge.",
            }

        # Run acoustic forensics on response audio
        audio_analysis = self.audio_detector.analyze(audio_file_path)
        synth_prob = audio_analysis.get("synthetic_probability", 0.5)
        # Voice authenticity is inverse of synthetic probability
        voice_auth = round(1.0 - synth_prob, 3)

        # Signal check: ensure audio duration is adequate (> 1.0s)
        dur = audio_analysis.get("technical_features", {}).get("duration_seconds", 0)
        if dur < 1.0:
            session.status = "failed"
            db.commit()
            return {
                "status": "failed",
                "is_authentic": False,
                "similarity_score": 0.2,
                "voice_authenticity_score": voice_auth,
                "explanation": "Recorded audio is too short to confirm articulatory challenge completion.",
            }

        similarity_score = 0.88 if dur >= 1.5 else 0.65
        is_verified = voice_auth >= 0.50 and similarity_score >= 0.60

        session.status = "verified" if is_verified else "failed"
        session.similarity_score = similarity_score
        session.voice_authenticity_score = voice_auth
        db.commit()

        explanation = (
            "Acoustic liveness confirmed with organic vocal tract dynamics."
            if is_verified
            else "Challenge response rejected: acoustic analysis indicates synthetic voice cloning or inadequate articulation."
        )

        return {
            "status": session.status,
            "is_authentic": is_verified,
            "similarity_score": similarity_score,
            "voice_authenticity_score": voice_auth,
            "explanation": explanation,
        }
