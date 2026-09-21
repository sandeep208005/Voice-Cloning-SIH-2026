# DeepShield AI - Forensic Vision Dataset Specification

## 1. Overview
The DeepShield Vision Benchmark is a structured, balanced dataset curated for rigorous training and held-out evaluation of deep visual forensic detectors. It is designed to reliably distinguish authentic human-captured photography from modern synthetic, generative, and manipulated imagery without relying on metadata or generator-specific shortcuts.

---

## 2. Dataset Architecture & Split Methodology

To prevent data leakage, evaluate out-of-distribution generalization, and measure robustness against real-world adversarial degradations, the dataset is strictly partitioned into five isolated subsets:

| Split | Real Images | Synthetic Images | Hard Cases | Total | Purpose |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **Train** (`data/train`) | 64 | 65 | 0 | 129 | Model training with optical & noise augmentations |
| **Validation** (`data/val`) | 16 | 18 | 0 | 34 | Hyperparameter tuning, checkpointing, temperature scaling |
| **Test (In-Distribution)** (`data/test_id`) | 25 | 24 | 0 | 49 | Generalization on known generator architectures |
| **Test (Cross-Generator OOD)** (`data/test_ood`) | 24 | 23 | 0 | 47 | Generalization on unseen generator architectures |
| **Test (Hard Cases)** (`data/test_hard`) | 0 | 0 | 24 | 24 | Adversarial compressions, social re-encodings, edits |
| **Total** | **129** | **130** | **24** | **283** | Balanced, leak-free multimodal evaluation |

---

## 3. Class Definitions & Diversity

### Class 0: Human / Real Photography
Captures authentic physical camera imagery featuring optical characteristics of real CMOS and CCD sensors:
- **Portraits**: Natural skin tones, melanin distributions, eye reflections, hair contours, and depth-of-field bokeh.
- **Landscapes**: Atmospheric scattering, sky gradients, natural cloud fractal patterns, horizon illumination, and terrain textures.
- **Architecture**: Perspective vertical columns, glass window reflections, structural shadows, and textured brick/concrete.
- **Objects**: Household and office items, ceramics, metals with specular highlights, and directional lighting.
- **Macro & Indoor**: Organic leaf veins, fabric weaves, cellular textures, and depth-of-field transitions.

### Class 1: Synthetic / AI-Generated Imagery
Spans multiple independent generative model families and architectures:
- **Stable Diffusion (v1.5 / v2.1 / SDXL)**: Latent diffusion 8x8 block boundary artifacts, high-frequency chromatic noise, and fine-texture over-smoothing.
- **GAN (StyleGAN2 / BigGAN)**: Transposed convolution checkerboard artifacts, periodic frequency grid spikes, and deconvolution harmonics.
- **DALL-E Style**: Smooth plastic gradients, edge halos, and unnatural color saturation.
- **Midjourney Style (Withheld for OOD Test)**: Micro-contrast boosting, extreme dynamic range saturation, and hyper-stylized lighting.
- **Flux Style (Withheld for OOD Test)**: Flow matching boundary smoothness, poreless skin transitions, and high-frequency edge crispness.

---

## 4. Anti-Leakage & Deduplication Pipeline

Data leakage between train, validation, and test splits renders machine learning evaluations invalid. DeepShield implements a strict two-stage deduplication engine (`scripts/remove_duplicates.py`):
1. **Exact MD5 Bitwise Deduplication**: Eliminates byte-for-byte duplicate image files across all directories.
2. **Perceptual Difference Hashing (`dHash`)**: Computes a 64-bit gradient hash across resized grayscale representations ($9 \times 8$).
   - **Cross-Split Isolation**: Any test or validation image matching a training sample within a Hamming distance $\le 2$ is automatically purged to eliminate train-test contamination.
   - **Intra-Class Deduplication**: Prunes near-duplicate images within the same split and class where Hamming distance $\le 1$.
   - Cross-class comparisons are strictly isolated to avoid misflagging similar low-frequency gradients across different categories.

---

## 5. Preprocessing & Augmentation Standards

All splits and production inference share the **centralized deterministic preprocessing pipeline** (`backend/app/ai/image/preprocessing.py`, Version 2.1.0):
- **EXIF Auto-Orientation**: Auto-rotates images using `ImageOps.exif_transpose` before tensor conversion.
- **Color Standardization**: RGBA channels are composited onto neutral gray $(128, 128, 128)$ backgrounds to eliminate transparent alpha-edge artifacts; all inputs converted to 3-channel RGB.
- **Bicubic Resampling**: Standardized to $256 \times 256$ pixels.
- **Spatial Normalization**: Scaled to $[0, 1]$ and normalized using standard ImageNet distribution ($\mu = [0.485, 0.456, 0.406]$, $\sigma = [0.229, 0.224, 0.225]$).
- **Forensic Residual Stream**: Generates a 2-channel forensic tensor containing the logarithmic 2D Fast Fourier Transform magnitude spectrum and Error Level Analysis (ELA) map at $Q = 90$.

---

## 6. Known Biases & Limitations

1. **Resolution Downsampling**: Resizing high-resolution images ($>2048\text{px}$) to $256 \times 256$ attenuates ultra-high-frequency sensor PRNU (photo-response non-uniformity) noise.
2. **Aggressive Social Compression**: Extreme JPEG re-compression ($Q < 30$) can obscure subtle latent diffusion boundary grids; these cases are evaluated in `data/test_hard` and flagged with the `uncertain` abstention verdict.
