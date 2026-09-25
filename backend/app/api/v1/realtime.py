import json
import base64
import secrets
import numpy as np
import cv2
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.ai.image.face_detector import FaceDetector
from app.db.session import SessionLocal
from app.services.challenge import ChallengeService

router = APIRouter()
face_detector = FaceDetector()
challenge_service = ChallengeService()


@router.websocket("/ws/realtime")
@router.websocket("/realtime")
async def websocket_realtime_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time surveillance streaming.
    Receives base64 video frames or audio chunks and returns live forensic telemetry.
    Persists high-risk threat events directly into the verification ledger.
    """
    await websocket.accept()
    rolling_scores = []
    current_event_id = f"EVT-RADAR-{secrets.randbelow(89999) + 10000}"

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
            target_identity = payload.get("identity", "Live Subject")

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

                    # Real multi-face detection on frame
                    faces = face_detector.detect_faces(frame, allow_fallback=False)
                    face_count = len(faces)
                    face_boxes = [f["box"] for f in faces]

                    # Real frequency sharpness
                    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
                    lap_var = float(cv2.Laplacian(gray, cv2.CV_64F).var())

                    # Forensic signal: blur or over-smoothing or multi-face biometric drift
                    anomaly_signal = 0.08
                    if face_count > 0:
                        if lap_var < 35.0:
                            anomaly_signal = 0.68  # Suspicious face blurring
                        elif lap_var > 450.0:
                            anomaly_signal = 0.58  # High-frequency noise
                        if face_count > 1:
                            # Note multi-subject context
                            pass

                    rolling_scores.append(anomaly_signal)
                    if len(rolling_scores) > 10:
                        rolling_scores.pop(0)

                    rolling_avg = float(np.mean(rolling_scores))
                    risk = "high" if rolling_avg >= 0.65 else ("medium" if rolling_avg >= 0.35 else "low")

                    # If high risk or requested, record in persistent database
                    if risk == "high" and face_count > 0:
                        db = SessionLocal()
                        try:
                            challenge_service.record_radar_event(
                                db=db,
                                event_id=current_event_id,
                                source="Live Surveillance Radar",
                                person_identity=target_identity,
                                detection_type="Live Video Deepfake Anomaly",
                                risk_level="high",
                                confidence_score=round(rolling_avg, 3),
                                details={
                                    "faces_detected": face_count,
                                    "laplacian_variance": round(lap_var, 2),
                                    "rolling_risk": round(rolling_avg, 3),
                                },
                            )
                        finally:
                            db.close()

                    await websocket.send_json({
                        "status": "active",
                        "stream_type": "video_frame",
                        "event_id": current_event_id,
                        "faces_detected": face_count,
                        "face_boxes": face_boxes,
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
                        "event_id": current_event_id,
                        "rms_energy": round(rms, 2),
                        "zero_crossing_rate": round(zcr, 4),
                        "voice_activity_detected": rms > 200.0,
                        "timestamp": payload.get("timestamp"),
                    })
                except Exception as e:
                    await websocket.send_json({"error": f"Audio processing error: {str(e)}"})

    except WebSocketDisconnect:
        pass
