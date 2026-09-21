import io
import numpy as np
import soundfile as sf


def test_upload_and_analyze_audio(client):
    """End-to-end test of uploading and analyzing a real audio file."""
    sr = 22050
    t = np.linspace(0, 1.2, int(sr * 1.2), endpoint=False)
    signal = 0.3 * np.sin(2 * np.pi * 300 * t) + 0.01 * np.random.randn(len(t))

    buffer = io.BytesIO()
    sf.write(buffer, signal.astype(np.float32), sr, format="WAV")
    buffer.seek(0)

    files = {"file": ("test_intercept.wav", buffer, "audio/wav")}
    response = client.post("/api/v1/analyses/audio", files=files)
    assert response.status_code == 201
    data = response.json()
    assert "analysis" in data
    assert data["analysis"]["media_type"] == "audio"
    assert data["analysis"]["original_filename"] == "test_intercept.wav"
    assert data["analysis"]["status"] == "completed"
    assert "technical_features" in data
    assert "spectrogram_url" in data

    analysis_id = data["analysis"]["id"]

    # Verify retrieval
    get_resp = client.get(f"/api/v1/analyses/{analysis_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["analysis"]["id"] == analysis_id

    # Verify deletion
    del_resp = client.delete(f"/api/v1/analyses/{analysis_id}")
    assert del_resp.status_code == 200

    # Ensure 404 after deletion
    not_found = client.get(f"/api/v1/analyses/{analysis_id}")
    assert not_found.status_code == 404


def test_reject_empty_file(client):
    """Rejects 0-byte file uploads."""
    empty_buf = io.BytesIO(b"")
    files = {"file": ("empty.wav", empty_buf, "audio/wav")}
    response = client.post("/api/v1/analyses/audio", files=files)
    assert response.status_code == 400


def test_reject_spoofed_mime_type(client):
    """Rejects text or executable file disguised as audio."""
    fake_buf = io.BytesIO(b"<!DOCTYPE html><html><body>Fake Audio</body></html>")
    files = {"file": ("malicious.wav", fake_buf, "audio/wav")}
    response = client.post("/api/v1/analyses/audio", files=files)
    # Magic bytes check will reject non-audio content
    assert response.status_code in [400, 415]


def test_upload_browser_recorded_webm_audio(client):
    """Verifies that browser-recorded WebM/Opus audio is accepted and analyzed without 415 error."""
    import imageio_ffmpeg
    import subprocess
    import tempfile
    import os

    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
    sr = 22050
    t = np.linspace(0, 1.5, int(sr * 1.5), endpoint=False)
    sine = (0.3 * np.sin(2 * np.pi * 320 * t)).astype(np.float32)

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
        sf.write(tmp_wav.name, sine, sr)
        wav_path = tmp_wav.name

    webm_path = wav_path.replace(".wav", ".webm")
    try:
        subprocess.run([ffmpeg, "-y", "-i", wav_path, "-c:a", "libopus", webm_path], check=True, capture_output=True)
        with open(webm_path, "rb") as f:
            files = {"file": ("recorded_speech.webm", f, "audio/webm")}
            response = client.post("/api/v1/analyses/audio", files=files)

        assert response.status_code == 201
        data = response.json()
        assert data["analysis"]["media_type"] == "audio"
        assert data["analysis"]["status"] == "completed"
    finally:
        if os.path.exists(wav_path):
            os.remove(wav_path)
        if os.path.exists(webm_path):
            os.remove(webm_path)
