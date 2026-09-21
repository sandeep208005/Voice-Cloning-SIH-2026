# DeepShield AI — REST & WebSocket API Reference

Base URL: `http://127.0.0.1:8000/api/v1`

All responses are formatted in JSON. Authentication uses standard HTTP Bearer Tokens (`Authorization: Bearer <token>`).

---

## 1. Authentication Endpoints

### `POST /auth/register`
Creates a new analyst account.
- **Request Body**:
  ```json
  {
    "email": "analyst@deepshield.ai",
    "password": "SecurePassword123!",
    "full_name": "Dr. Sarah Lin",
    "role": "analyst"
  }
  ```
- **Response** `201 Created`:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "user": {
      "id": "7fae29ec-...",
      "email": "analyst@deepshield.ai",
      "full_name": "Dr. Sarah Lin",
      "role": "analyst",
      "is_active": true,
      "created_at": "2026-09-21T18:00:00Z"
    }
  }
  ```

### `POST /auth/login`
Authenticates analyst credentials and issues access token.
- **Request Body**:
  ```json
  {
    "email": "analyst@deepshield.ai",
    "password": "SecurePassword123!"
  }
  ```
- **Response** `200 OK`: Same as register.

### `GET /auth/me`
Returns active authenticated analyst profile.
- **Headers**: `Authorization: Bearer <token>`
- **Response** `200 OK`: User object.

---

## 2. Forensic Analysis Endpoints

### `POST /analyses/audio`
Uploads and executes acoustic forensic feature extraction on audio samples.
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Audio binary (WAV, MP3, FLAC, M4A, OGG)
- **Response** `201 Created`:
  ```json
  {
    "analysis": {
      "id": "9b1deb4d-...",
      "media_type": "audio",
      "original_filename": "wiretap_sample.wav",
      "status": "completed",
      "classification": "likely_synthetic",
      "confidence": 0.92,
      "synthetic_probability": 0.84,
      "risk_level": "high",
      "model_name": "DeepShield-AcousticForensics-v1",
      "model_version": "1.2.0",
      "processing_time_ms": 142,
      "summary_explanation": "Elevated likelihood of synthetic voice cloning: Severe high-frequency attenuation above 7.5kHz characteristic of neural vocoder resampling; Sub-natural micro-pitch perturbation."
    },
    "technical_features": {
      "sample_rate": 22050,
      "duration_seconds": 3.4,
      "high_freq_ratio": 0.008,
      "pitch_jitter": 0.0021,
      "mfcc_summary": { ... }
    },
    "spectrogram_url": "/uploads/spec_9b1deb4d.png"
  }
  ```

### `POST /analyses/image`
Uploads and analyzes image for ELA discrepancy, 2D-FFT periodic spikes, and boundary blur.
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Image binary (JPG, PNG, WEBP)
- **Response** `201 Created`: AnalysisDetail JSON with ELA metrics and FFT spectrum power.

### `POST /analyses/video`
Uploads video and extracts multi-frame sequence to evaluate temporal trajectory stability.
- **Content-Type**: `multipart/form-data`
- **Form Data**:
  - `file`: Video binary (MP4, WEBM, MOV)
- **Response** `201 Created`: AnalysisDetail JSON with `frame_metrics` array and temporal jitter stats.

### `GET /analyses`
Retrieves paginated analyses backed directly by database queries.
- **Query Parameters**:
  - `page`: int (default: 1)
  - `limit`: int (default: 10, max: 100)
  - `media_type`: "audio" | "image" | "video" | "all"
  - `risk_level`: "low" | "medium" | "high" | "all"
  - `search`: string (matches ID or original filename)
  - `sort_by`: "newest" | "oldest" | "risk_high" | "risk_low"
- **Response** `200 OK`:
  ```json
  {
    "items": [ ... ],
    "total": 42,
    "page": 1,
    "limit": 10,
    "total_pages": 5
  }
  ```

### `GET /analyses/{id}`
Returns complete technical telemetry breakdown for an analysis ID.

### `DELETE /analyses/{id}`
Purges analysis database record and deletes physical file from storage.

---

## 3. Dashboard Endpoints

### `GET /dashboard/statistics`
Returns real-time database counts. If 0 records exist, returns exact zeros.
- **Response** `200 OK`:
  ```json
  {
    "total_analyses": 0,
    "audio_analyses": 0,
    "image_analyses": 0,
    "video_analyses": 0,
    "suspicious_detections": 0,
    "high_risk_analyses": 0,
    "processing_failures": 0,
    "risk_distribution": { "low": 0, "medium": 0, "high": 0 },
    "classification_distribution": { "likely_authentic": 0, "suspicious": 0, "likely_synthetic": 0 },
    "trends": [],
    "unresolved_alerts_count": 0
  }
  ```

### `GET /dashboard/recent`
Returns top 6 most recent database analyses.

---

## 4. Challenge-Response Verification

### `POST /verification/challenge`
Generates a dynamic, timestamped challenge phrase for vocal liveness verification.
- **Response** `200 OK`:
  ```json
  {
    "session_token": "a4f89d...",
    "phrase": "Quantum shield verifies twelve biometric vectors today [Code: 8492]",
    "expires_at": "2026-09-21T18:05:00Z",
    "instructions": "Read and record the phrase aloud using your microphone..."
  }
  ```

### `POST /verification/submit`
Verifies user audio recording against dynamic challenge session.
- **Form Data**:
  - `session_token`: string
  - `file`: Recorded audio binary
- **Response** `200 OK`:
  ```json
  {
    "session_token": "a4f89d...",
    "status": "verified",
    "similarity_score": 0.88,
    "voice_authenticity_score": 0.94,
    "is_authentic": true,
    "explanation": "Acoustic liveness confirmed with organic vocal tract dynamics."
  }
  ```

---

## 5. WebSocket Real-Time Radar

### `ws://127.0.0.1:8000/ws/realtime`
Full-duplex WebSocket pipe for streaming short-window optical and acoustic surveillance.
- **Client Frame Transmission**:
  ```json
  {
    "type": "video_frame",
    "data": "data:image/jpeg;base64,/9j/4AAQSkZJR...",
    "timestamp": 1790012400000
  }
  ```
- **Server Telemetry Response**:
  ```json
  {
    "status": "active",
    "stream_type": "video_frame",
    "faces_detected": 1,
    "frame_laplacian_variance": 142.5,
    "instant_anomaly_score": 0.08,
    "rolling_risk_score": 0.12,
    "risk_level": "low",
    "timestamp": 1790012400000
  }
  ```
