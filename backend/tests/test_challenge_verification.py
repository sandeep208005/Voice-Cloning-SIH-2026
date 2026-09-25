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
    assert "Session token or event_id is required" in resp.json()["detail"]


def test_challenge_submit_valid_wav(client):
    """Verifies end-to-end challenge completion with valid WAV audio."""
    # 1. Generate challenge with event ID
    gen_resp = client.post("/api/v1/verification/challenge?event_id=EVT-TEST-001&person_identity=CEO%20Test")
    assert gen_resp.status_code == 200
    session_token = gen_resp.json()["session_token"]
    assert gen_resp.json()["event_id"] == "EVT-TEST-001"

    # 2. Submit vocal response
    buf = create_mock_wav(duration=1.8)
    files = {"file": ("response.wav", buf, "audio/wav")}
    data = {"session_token": session_token, "event_id": "EVT-TEST-001"}

    resp = client.post("/api/v1/verification/submit", data=data, files=files)
    assert resp.status_code == 200
    res_data = resp.json()
    assert res_data["session_token"] == session_token
    assert res_data["event_id"] == "EVT-TEST-001"
    assert res_data["status"] in ["verified", "failed"]
    assert "similarity_score" in res_data
    assert "voice_authenticity_score" in res_data
    assert "is_authentic" in res_data
    assert "explanation" in res_data
    assert "final_decision" in res_data

    # 3. Check persistent history
    hist_resp = client.get("/api/v1/verification/history")
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) > 0
    matched = [h for h in history if h["event_id"] == "EVT-TEST-001"]
    assert len(matched) == 1
    assert matched[0]["person_identity"] == "CEO Test"


def test_radar_event_persistence_and_retrieval(client):
    """Verifies storing a Live Surveillance / Radar event and retrieving it."""
    event_payload = {
        "event_id": "EVT-RADAR-TEST-99",
        "source": "Live Surveillance Radar",
        "person_identity": "Live Subject 42",
        "detection_type": "Video FaceSwap Anomaly",
        "risk_level": "critical",
        "confidence_score": 0.94,
        "evidence_id": "EVD-TEST-HASH-99",
    }
    resp = client.post("/api/v1/verification/event", json=event_payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["event_id"] == "EVT-RADAR-TEST-99"
    assert data["risk_level"] == "critical"

    # Retrieve by event ID
    get_resp = client.get("/api/v1/verification/event/EVT-RADAR-TEST-99")
    assert get_resp.status_code == 200
    assert get_resp.json()["person_identity"] == "Live Subject 42"


def test_challenge_submit_expired_session(client, db_session):
    """Verifies that submitting against an expired challenge is rejected."""
    expired_time = datetime.now(timezone.utc) - timedelta(minutes=10)
    session = ChallengeSession(
        session_token="test_expired_token_123456789",
        phrase="Test expired phrase [Code: 9999]",
        phonetic_hash="expiredhash123",
        source="Dynamic Challenge Studio",
        person_identity="Target Identity",
        detection_type="Vocal Liveness Challenge",
        risk_level="low",
        confidence_score=0.0,
        verification_status="pending",
        final_decision="PENDING_VERIFICATION",
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
