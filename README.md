# DeepShield AI — Multimodal Deepfake & Impersonation Defense Platform

**AI-Powered Real-Time Detection and Prevention of Voice, Image, and Video Cloning-Based Impersonation Attacks**

[![Python Version](https://img.shields.io/badge/python-3.14-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19-61DAFB.svg)](https://react.dev/)
[![Security](https://img.shields.io/badge/Zero%20Demo%20Data-Guaranteed-brightgreen.svg)]()

---

## Executive Overview

**DeepShield AI** is an enterprise-grade multimodal cybersecurity platform engineered to detect, analyze, and quarantine synthetic media attacks. DeepShield analyzes acoustic frequency spectra, spatial compression quantization, facial boundary blending gradients, and inter-frame temporal consistency to defend organizations against:
- **Neural Voice Cloning**: Unauthorized acoustic synthesis and real-time TTS vocoder impersonation (HiFi-GAN, WaveGlow, VALL-E, ElevenLabs).
- **Synthetic Facial Manipulation**: Diffusion/GAN generative face replacements, digital face swaps (DeepFaceLab, FaceFusion, Roop), and boundary blending artifacts.
- **Video Deepfakes**: Multi-frame temporal jitter, trajectory instability, and facial landmark flickering.
- **Active Impersonation**: Bypasses passive playback attacks via dynamic, timestamped challenge-response vocal verification.

---

## 0. Zero Demo Data Guarantee

DeepShield AI strictly enforces the **Zero Demo Data Principle**:
1. Every statistic, metric card, risk distribution, and trend on the Dashboard HUD queries the active database directly (`analyses` table).
2. If the database contains zero records, the dashboard displays an honest empty state:
   > *No analysis data available.*
3. Zero random number generators (`Math.random()`, `random.choice()`), zero seeded mock history records, and zero hardcoded confidence values exist.
4. If a model or device is unconfigured or a file is corrupted, the system returns an explicit failure state rather than fabricating predictions.

---

## Architecture Diagram

```text
                                [ Web Browser / React 19 Frontend ]
                                          |            |
                                  REST API|            |WebSocket Stream
                                          v            v
                               +-------------------------------+
                               |     FastAPI Gateway (:8000)   |
                               +-------------------------------+
                                  |            |            |
                     +------------+     +------+------+     +-------------+
                     |                  |             |                   |
                     v                  v             v                   v
              [ Auth Service ]   [ MIME Validator ] [ Live Stream Engine ] [ Challenge Studio ]
             (PBKDF2-HMAC-SHA256) (Magic Bytes Check) (/ws/realtime)    (Dynamic Liveness)
                     |                  |
                     |                  v
                     |        [ Storage Service ]
                     |      (Sanitized UUID Store)
                     |                  |
                     v                  v
         +-------------------------------------------------------------+
         |                AI / ML Forensic Pipeline Layer              |
         +-------------------------------------------------------------+
         |  1. Audio: Librosa / 20 MFCCs / Mel-Spectrogram / Jitter   |
         |  2. Image: OpenCV / ELA Quantization / 2D-FFT Grid Spikes   |
         |  3. Video: Multi-frame Uniform Sampler / Temporal Jitter   |
         +-------------------------------------------------------------+
                                        |
                                        v
                        [ Multimodal Bayesian Risk Engine ]
                        (Evidential Log-Odds Fusion)
                                        |
                                        v
                       [ SQLAlchemy Persistence Layer ]
                           (SQLite / PostgreSQL)
```

---

## Forensic Detection Pipelines

### 1. Audio Voice Cloning Pipeline (`DeepShield-AcousticForensics-v1`)
- **Signal Extraction**: Ingests audio signal via `librosa` / `soundfile` resampled to 22,050 Hz mono.
- **Feature Set**:
  - 20 Mel-Frequency Cepstral Coefficients (MFCCs) mean and intra-frame variance.
  - Spectral Centroid (timbral brightness) & Spectral Rolloff (85% energy threshold).
  - High-Frequency Vocoder Signature: Analyzes energy ratio above 7,500 Hz to detect characteristic neural vocoder band-limiting.
  - Micro-pitch Jitter (F0 perturbation): Organic vocal tracts produce natural pitch perturbations ($0.004 \le \text{jitter} \le 0.035$). Flat or hyper-erratic pitch contours signal synthetic TTS synthesis.
  - Harmonic-to-Percussive Separation (HPSS): Evaluates organic resonance vs aspiration noise balance.
- **Visual Output**: Generates normalized Mel-Spectrogram image (0 - 8,000 Hz) for forensic inspection.

### 2. Image Synthetic Artifact Pipeline (`DeepShield-VisualForensics-v1`)
- **Spatial Localization**: Localizes primary facial regions using OpenCV cascade and YCrCb chrominance contour segmentation.
- **Error Level Analysis (ELA)**: Resaves image at 90% JPEG quality to measure quantization variance between facial boundaries and background. Composite face-swaps exhibit high regional discrepancy.
- **2D-FFT Frequency Analysis**: Computes 2D Fast Fourier Transform magnitude spectrum `log(1 + |F(u, v)|)` to detect periodic high-frequency grid spikes characteristic of GAN deconvolution and latent diffusion upsampling.
- **Boundary Gradient Analysis**: Sobel gradient standard deviation along facial blend perimeters exposes feathering and blur halos.

### 3. Video Temporal Consistency Pipeline (`DeepShield-TemporalForensics-v1`)
- **Uniform Frame Sampling**: Extracts calibrated sequence of frames across video timeline.
- **Per-Frame Spatial Inference**: Measures spatial and frequency anomaly scores across all sampled frames.
- **Inter-Frame Temporal Stability**: Tracks centroid displacement Euclidean distance and bounding box scale variance. Face replacement models calculate alignment independently per frame, producing characteristic high-frequency coordinate jitter.
- **Robust Fusion**: Fuses 90th percentile peak anomaly with average frame score and temporal trajectory penalty.

### 4. Multimodal Bayesian Risk Engine
Fuses evidence across channels using Bayesian log-odds evidential pooling:
$$\text{Log-Odds} = \ln\frac{P(\text{Fake})}{1 - P(\text{Fake})} + \sum_{m \in \{A, I, V\}} c_m \left( \ln\frac{P(m|\text{Fake})}{1 - P(m|\text{Fake})} - \text{Prior} \right)$$
- Prior probability $P(\text{Fake}) = 0.10$.
- Risk tiers: **LOW** ($p < 0.38$), **MEDIUM** ($0.38 \le p < 0.70$), **HIGH** ($p \ge 0.70$).

---

## Quickstart & Installation

### Prerequisites
- Python 3.10+ (Tested on Python 3.14)
- Node.js 18+ (Tested on Node v26)
- Git

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional)
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run database migrations and start server
python main.py
```
The FastAPI backend will start at `http://127.0.0.1:8000`.
- API Docs: `http://127.0.0.1:8000/docs`
- Health Check: `http://127.0.0.1:8000/api/v1/health`

### 2. Frontend Setup
```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install packages
npm install

# Start Vite development server
npm run dev
```
The frontend UI will be accessible at `http://localhost:5173`.

---

## Automated Test Execution

Run the backend test suite verifying real acoustic feature extraction, image analysis, video sampling, authentication, and the zero-mock-data guarantee:
```bash
cd backend
python -m pytest -v
```

All tests execute in-memory with zero mock data.

---

## Project Structure

```text
deepshield-ai/
├── backend/
│   ├── app/
│   │   ├── ai/
│   │   │   ├── audio/        # Acoustic extractor & vocoder clone detector
│   │   │   ├── image/        # ELA analyzer, 2D-FFT, and face boundary forensics
│   │   │   ├── video/        # Frame sampler & temporal jitter detector
│   │   │   └── multimodal/   # Bayesian log-odds evidential risk engine
│   │   ├── api/
│   │   │   ├── deps.py       # JWT and DB session dependencies
│   │   │   └── v1/           # auth, analyses, dashboard, verification, realtime
│   │   ├── core/             # Settings & PBKDF2 password security
│   │   ├── db/               # SQLAlchemy engine & session maker
│   │   ├── models/           # User, Analysis, AnalysisDetail, Alert, Challenge
│   │   ├── schemas/          # Pydantic v2 schemas
│   │   └── services/         # Storage MIME validation & challenge service
│   ├── tests/                # Pytest unit & integration test suites
│   ├── uploads/              # Local sanitized media store
│   ├── requirements.txt      # Backend dependency manifest
│   └── main.py               # Application entrypoint & lifespan
├── frontend/
│   ├── src/
│   │   ├── components/       # DashboardHUD, ForensicLab, Radar, Studio, History
│   │   ├── services/         # API HTTP & WebSocket client
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.tsx           # Main application state coordinator
│   │   └── index.css         # Stitch-informed cybersecurity glassmorphic theme
│   ├── package.json
│   └── vite.config.ts        # Dev server & reverse proxy configuration
├── docs/                     # Technical specifications
├── README.md
├── ARCHITECTURE.md
├── API.md
├── MODEL_CARD.md
├── SECURITY.md
└── .env.example
```

---

## License & Compliance
Licensed under Apache 2.0. Built for ethical cybersecurity defense, digital forensics, and media authentication.

# Voice-Cloning-SIH-2026
