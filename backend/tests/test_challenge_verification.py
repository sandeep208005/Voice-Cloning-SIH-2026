import io
import numpy as np
import soundfile as sf
from datetime import datetime, timedelta, timezone
from app.models.challenge import ChallengeSession
from app.db.session import SessionLocal


def create_mock_wav(duration: float = 1.5, sr: int = 22050) -> io.BytesIO:
    """Creates an in-memory valid 16-bit PCM WAV audio buffer."""
    t = np.linspace(0, duration, int(sr * duration), endpoint=False)
    # Fundamental frequency ~ 180Hz with natural harmonics
    signal = 0.4 * np.sin(2 * np.pi * 180 * t) + 0.15 * np.sin(2 * np.pi * 360 * t)
    noise = 0.01 * np.random.randn(len(t))
    audio = (signal + noise).astype(np.float32)

    buf = io.BytesIO()
    sf.write(buf, audio, sr, format="WAV", subtype="PCM_16")
    buf.seek(0)
    return buf


def test_challenge_generate_endpoint(client):
    """Verifies generation of a dynamic, timestamped challenge phrase."""
    resp = client.post("/api/v1/verification/challenge")
    assert resp.status_code == 200
    data = resp.json()
    assert "session_token" in data
    assert len(data["session_token"]) >= 24
    assert "phrase" in data
    assert "Code:" in data["phrase"]
    assert "instructions" in data


def test_challenge_submit_missing_token(client):
    """Verifies rejection with 400 when session_token is missing."""
    buf = create_mock_wav(1.5)
    files = {"file": ("response.wav", buf, "audio/wav")}
    resp = client.post("/api/v1/verification/submit", files=files)
    assert resp.status_code == 400
    assert "Session token is required" in resp.json()["detail"]


def test_challenge_submit_valid_wav(client):
    """Verifies end-to-end challenge completion with valid WAV audio."""
    # 1. Generate challenge
    gen_resp = client.post("/api/v1/verification/challenge")
    assert gen_resp.status_code == 200
    session_token = gen_resp.json()["session_token"]

    # 2. Submit vocal response
    buf = create_mock_wav(duration=1.8)
    files = {"file": ("response.wav", buf, "audio/wav")}
    data = {"session_token": session_token}

    resp = client.post("/api/v1/verification/submit", data=data, files=files)
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["session_token"] == session_token
    assert res_data["status"] in ["verified", "failed"]
    assert "similarity_score" in res_data
    assert "voice_authenticity_score" in res_data
    assert "is_authentic" in res_data
    assert "explanation" in res_data


def test_challenge_submit_expired_session(client, db_session):
    """Verifies that submitting against an expired challenge is rejected."""
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    session = ChallengeSession(
        session_token="test_expired_token_123456789",
        phrase="Test expired phrase [Code: 9999]",
        phonetic_hash="expiredhash123",
        status="pending",
        similarity_score=0.0,
        voice_authenticity_score=0.0,
        created_at=expired_time - timedelta(minutes=5),
        expires_at=expired_time,
    )
    db_session.add(session)
    db_session.commit()

    buf = create_mock_wav(duration=1.5)
    files = {"file": ("response.wav", buf, "audio/wav")}
    data = {"session_token": "test_expired_token_123456789"}

    resp = client.post("/api/v1/verification/submit", data=data, files=files)
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["status"] == "failed"
    assert res_data["is_authentic"] is False
    assert "expired" in res_data["explanation"].lower()
