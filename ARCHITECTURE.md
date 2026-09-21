# DeepShield AI — Architectural Specification

## 1. System Topology

DeepShield AI employs a high-throughput, low-latency micro-modular architecture designed for deterministic forensic media triage and real-time biometric surveillance.

```text
[ CLIENT TIER ]
   React 19 + TypeScript + Vite Single-Page Application (SPA)
   - Real-time HUD Dashboard with direct database telemetry
   - Forensic Ingestion & Multi-modality Inspector
   - WebRTC / WebSocket Radar Stream
   - Dynamic Challenge-Response Vocal Studio
          |
          | (HTTPS / WSS Reverse Proxy)
          v
[ GATEWAY TIER ]
   FastAPI ASGI Application Server
   - Route Dispatch & Request Validation (Pydantic v2)
   - Cryptographic Authentication (PBKDF2-HMAC-SHA256 & JWT)
   - Magic-Byte MIME & Payload Sanitization (Streaming Ingestion)
   - WebSocket Connection Multiplexing
          |
          +-------------------------------------------+
          |                                           |
          v                                           v
[ INGESTION & STORAGE ]                    [ AI / ML FORENSIC ENGINES ]
   - Path Traversal Sanitization              - Audio: Librosa Acoustic Extractor
   - Disk Quota & Size Enforcement            - Image: OpenCV ELA & 2D-FFT Analyzer
   - Encrypted / Isolated Storage             - Video: Temporal Frame Sampler & Jitter Tracker
          |                                           |
          +---------------------+---------------------+
                                |
                                v
                   [ MULTIMODAL RISK ENGINE ]
                      - Evidential Bayesian Log-Odds Fusion
                      - Calibrated Confidence Assessment
                      - Transparent Explainability Narrative
                                |
                                v
                   [ PERSISTENCE LAYER ]
                      - SQLAlchemy ORM 2.0 (PostgreSQL / SQLite)
                      - Database-audited Analysis & Anomaly Alerts
```

---

## 2. Forensic Signal Processing Pipelines

### 2.1 Audio Forensic Pipeline (`AudioCloneDetector`)
Neural vocoders (e.g., HiFi-GAN, WaveGlow, MelGAN) and text-to-speech models (Tacotron, VALL-E, ElevenLabs) leave distinctive spectral fingerprints:

1. **High-Frequency Attenuation ($\ge 7.5\text{kHz}$)**:
   Many commercial synthesis models resample audio at 16kHz or 22.05kHz, introducing a steep cliff in energy above 7.5kHz. The ratio of energy above 7.5kHz to total energy is calculated using Short-Time Fourier Transform (STFT):
   $$\text{Ratio}_{\text{high}} = \frac{\sum_{f \ge 7500} |S(f, t)|}{\sum_{f} |S(f, t)|}$$
2. **Micro-pitch Jitter Fluctuation**:
   Natural human phonation has subtle cycle-to-cycle frequency perturbations. Fundamental frequency ($F_0$) is tracked using the probabilistic YIN algorithm (`librosa.pyin`). Unnaturally low jitter ($< 0.004$) signals robotic/rigid pitch contours, while abrupt jumps indicate phoneme concatenation boundaries.
3. **Mel-Frequency Cepstral Coefficients (MFCCs)**:
   20 MFCCs are computed across frames. Upper coefficients ($c_4$ to $c_{19}$) represent vocal tract resonances. Over-smoothed or unnaturally erratic variance across these coefficients exposes neural synthesis.
4. **Harmonic-to-Percussive Separation (HPSS)**:
   Organic speech maintains a strict balance between vocal cord harmonic resonance and unvoiced consonants. Deviations indicate vocoder phase distortion.

---

### 2.2 Image Forensic Pipeline (`ImageArtifactDetector`)
Generative adversarial networks (GANs) and diffusion models leave microscopic artifacts:

1. **Error Level Analysis (ELA)**:
   JPEG compression stores coefficients in $8 \times 8$ pixel blocks quantized by compression tables. Resaving the image at a standard 90% quality level and calculating per-pixel error exposes differences:
   $$\Delta(x, y) = |I_{\text{orig}}(x, y) - I_{90\%}(x, y)|$$
   Face swaps introduce localized double-compression discrepancies between the face region and background.
2. **2D Fast Fourier Transform (FFT) Frequency Spikes**:
   Deconvolution and latent upsampling introduce periodic grid patterns in the spatial domain. In the 2D frequency spectrum:
   $$F(u, v) = \sum_{x} \sum_{y} f(x, y) e^{-j 2\pi (ux/M + vy/N)}$$
   Azimuthal high-frequency integration isolates abnormal spikes exceeding $1.5 \times \text{IQR}$.
3. **Facial Boundary Gradient Discontinuity**:
   Mask blending around replaced faces creates feathering or blur halos. Sobel gradients along the perimeter track boundary standard deviations.

---

### 2.3 Video Temporal Consistency Pipeline (`VideoDeepfakeDetector`)
Frame-by-frame deepfake generation fails to maintain temporal coherence:

1. **Facial Trajectory Jitter**:
   Face bounding box centers $(x_c, y_c)$ and bounding areas $A = w \times h$ are tracked across sampled frames. High-frequency variance in inter-frame displacement reveals independent frame alignment failure.
2. **Robust Multi-frame Fusion**:
   To prevent single abnormal frames from skewing the verdict, the system aggregates:
   $$P_{\text{video}} = 0.6 \cdot P_{90} + 0.4 \cdot \bar{P} + \text{Penalty}_{\text{temporal}}$$

---

## 3. Multimodal Bayesian Risk Engine

DeepShield aggregates evidence across independent modalities without arbitrary linear weights using **Evidential Log-Odds Likelihood Ratio Pooling**:

$$\mathcal{L}_{\text{post}} = \ln \frac{P(\text{Fake})}{1 - P(\text{Fake})} + \sum_{m} c_m \left( \ln \frac{P(m|\text{Fake})}{1 - P(m|\text{Fake})} - \ln \frac{P(\text{Fake})}{1 - P(\text{Fake})} \right)$$

Where:
- $P(\text{Fake}) = 0.10$ is the conservative operational prior.
- $c_m \in [0, 1]$ is the model confidence for modality $m$.
- Posterior probability:
  $$P(\text{Synthetic} \mid \text{Evidence}) = \frac{1}{1 + e^{-\mathcal{L}_{\text{post}}}}$$

### Threat Classifications:
- **LOW RISK ($p < 0.38$)**: "Likely Authentic" — features align with organic biometric baseline.
- **MEDIUM RISK ($0.38 \le p < 0.70$)**: "Suspicious Anomaly" — requires secondary operational verification.
- **HIGH RISK ($p \ge 0.70$)**: "Confirmed Deepfake / Synthetic" — high-confidence synthetic manipulation confirmed.

---

## 4. Scalability & Worker Architecture

For enterprise scale ($>10,000$ concurrent stream analyses):
1. **Asynchronous Ingestion**: Ingest endpoint immediately writes file to object storage and enqueues task ID.
2. **Distributed AI Workers**: Celery / RQ workers consume from Redis / RabbitMQ queues, running PyTorch/TensorRT inference on GPU clusters.
3. **WebSocket Pub/Sub**: Redis Pub/Sub pushes per-frame analysis updates to active client sessions.
