import json
import base64
import numpy as np
import cv2
from fastapi.testclient import TestClient
from main import app


def create_dummy_base64_frame() -> str:
    """Creates a blank test frame encoded as base64 JPEG."""
    img = np.zeros((120, 160, 3), dtype=np.uint8)
    # Add simple contrast shapes
    cv2.rectangle(img, (20, 20), (80, 80), (255, 255, 255), -1)
    _, buf = cv2.imencode(".jpg", img)
    return base64.b64encode(buf).decode("utf-8")


def create_dummy_base64_audio() -> str:
    """Creates dummy 16-bit PCM audio samples encoded as base64."""
    samples = (0.2 * 32767 * np.sin(np.linspace(0, 2 * np.pi * 5, 800))).astype(np.int16)
    return base64.b64encode(samples.tobytes()).decode("utf-8")


def test_websocket_realtime_root_endpoint():
    """Verifies that the /ws/realtime root WebSocket path connects and processes frames."""
    client = TestClient(app)
    with client.websocket_connect("/ws/realtime") as ws:
        frame_b64 = create_dummy_base64_frame()
        ws.send_text(json.dumps({
            "type": "video_frame",
            "data": f"data:image/jpeg;base64,{frame_b64}",
            "timestamp": 1234567890
        }))
        res = ws.receive_json()
        assert res["status"] == "active"
        assert res["stream_type"] == "video_frame"
        assert "faces_detected" in res
        assert "frame_laplacian_variance" in res
        assert "rolling_risk_score" in res


def test_websocket_realtime_prefixed_endpoint():
    """Verifies that the /api/v1/ws/realtime prefixed WebSocket path also connects and processes audio."""
    client = TestClient(app)
    with client.websocket_connect("/api/v1/ws/realtime") as ws:
        audio_b64 = create_dummy_base64_audio()
        ws.send_text(json.dumps({
            "type": "audio_chunk",
            "data": audio_b64,
            "timestamp": 1234567891
        }))
        res = ws.receive_json()
        assert res["status"] == "active"
        assert res["stream_type"] == "audio_chunk"
        assert "rms_energy" in res
        assert "zero_crossing_rate" in res
        assert "voice_activity_detected" in res


def test_websocket_invalid_payload_handling():
    """Verifies that malformed JSON or empty data returns an error without dropping the connection."""
    client = TestClient(app)
    with client.websocket_connect("/ws/realtime") as ws:
        ws.send_text("not-a-valid-json")
        res = ws.receive_json()
        assert "error" in res

        ws.send_text(json.dumps({"type": "video_frame", "data": ""}))
        res2 = ws.receive_json()
        assert "error" in res2
