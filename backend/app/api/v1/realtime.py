import json
import base64
import numpy as np
import cv2
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.ai.image.face_detector import FaceDetector

router = APIRouter()
face_detector = FaceDetector()


@router.websocket("/ws/realtime")
@router.websocket("/realtime")
async def websocket_realtime_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time surveillance streaming.
    Receives base64 video frames or audio chunks and returns live forensic telemetry.
    """
    await websocket.accept()
    rolling_scores = []

    try:
        while True:
            data = await websocket.receive_text()
            try:
                payload = json.loads(data)
            except Exception:
                await websocket.send_json({"error": "Payload must be valid JSON."})
                continue

            stream_type = payload.get("type", "video_frame")
            raw_base64 = payload.get("data", "")

            if not raw_base64:
                await websocket.send_json({"error": "Empty data field."})
                continue

            if stream_type == "video_frame":
                try:
                    # Strip header if data URI
                    if "," in raw_base64:
                        raw_base64 = raw_base64.split(",")[1]
                    img_bytes = base64.b64decode(raw_base64)
                    np_arr = np.frombuffer(img_bytes, np.uint8)
                    frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

                    if frame is None:
                        await websocket.send_json({"error": "Failed to decode frame."})
                        continue

                    # Real face detection on frame
                    faces = face_detector.detect_faces(frame)
                    face_count = len(faces)

                    # Real frequency sharpness
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

                    # Simple forensic signal: blur or over-smoothing
                    anomaly_signal = 0.08
                    if face_count > 0:
                        if lap_var < 35.0:
                            anomaly_signal = 0.65  # Suspicious face blurring
                        elif lap_var > 450.0:
                            anomaly_signal = 0.55  # High-frequency noise

                    rolling_scores.append(anomaly_signal)
                    if len(rolling_scores) > 10:
                        rolling_scores.pop(0)

                    rolling_avg = float(np.mean(rolling_scores))
                    risk = "high" if rolling_avg >= 0.65 else ("medium" if rolling_avg >= 0.35 else "low")

                    await websocket.send_json({
                        "status": "active",
                        "stream_type": "video_frame",
                        "faces_detected": face_count,
                        "frame_laplacian_variance": round(lap_var, 2),
                        "instant_anomaly_score": round(anomaly_signal, 3),
                        "rolling_risk_score": round(rolling_avg, 3),
                        "risk_level": risk,
                        "timestamp": payload.get("timestamp"),
                    })

                except Exception as e:
                    await websocket.send_json({"error": f"Frame processing error: {str(e)}"})

            elif stream_type == "audio_chunk":
                try:
                    if "," in raw_base64:
                        raw_base64 = raw_base64.split(",")[1]
                    audio_bytes = base64.b64decode(raw_base64)
                    audio_arr = np.frombuffer(audio_bytes, dtype=np.int16).astype(np.float32)

                    if len(audio_arr) == 0:
                        continue

                    # Real RMS energy and Zero-Crossing Rate
                    rms = float(np.sqrt(np.mean(audio_arr ** 2)))
                    zcr = float(np.mean(np.abs(np.diff(np.sign(audio_arr)))) / 2.0)

                    await websocket.send_json({
                        "status": "active",
                        "stream_type": "audio_chunk",
                        "rms_energy": round(rms, 2),
                        "zero_crossing_rate": round(zcr, 4),
                        "voice_activity_detected": rms > 200.0,
                        "timestamp": payload.get("timestamp"),
                    })
                except Exception as e:
                    await websocket.send_json({"error": f"Audio processing error: {str(e)}"})

    except WebSocketDisconnect:
        pass
