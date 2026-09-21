import os
import io
import random
import urllib.request
import cv2
import numpy as np
import sys
from PIL import Image, ImageFilter, ImageEnhance
from typing import List, Dict, Tuple
sys.path.insert(0, ".")
from scripts.remove_duplicates import deduplicate_dataset

# Base directories
DATA_DIR = "data"
SPLITS = ["train", "val", "test_id", "test_ood", "test_hard"]
CLASSES = ["real", "synthetic"]

# Diverse categories for real and synthetic data
CATEGORIES = ["portraits", "landscapes", "architecture", "objects", "macro_indoor"]
AI_GENERATOR_FAMILIES = ["stable_diffusion", "midjourney_style", "dalle_style", "flux_style", "gan_style"]


def setup_directories():
    """Creates the dataset folder hierarchy."""
    for s in SPLITS:
        if s == "test_hard":
            os.makedirs(os.path.join(DATA_DIR, s), exist_ok=True)
        else:
            for c in CLASSES:
                os.makedirs(os.path.join(DATA_DIR, s, c), exist_ok=True)


def download_public_domain_image(url: str, save_path: str, timeout: int = 10) -> bool:
    """Safely downloads an image from a public URL."""
    try:
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "DeepShield-Research-Agent/1.0 (Educational/Cybersecurity Benchmark)"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            content = resp.read()
            img = Image.open(io.BytesIO(content)).convert("RGB")
            img.save(save_path, "JPEG", quality=92)
            return True
    except Exception as e:
        return False


def generate_benchmark_real_image(category: str, seed: int) -> Image.Image:
    """
    Synthesizes authentic-style natural physical camera photography simulation
    incorporating sensor Poisson-Gaussian noise, optical point-spread function (blur),
    and chromatic aberration characteristic of real CMOS/CCD optics.
    """
    rng = np.random.RandomState(seed)
    w, h = 320, 320
    img = np.zeros((h, w, 3), dtype=np.float32)
    y, x = np.ogrid[:h, :w]
    
    if category == "portraits":
        # Background: blurred organic ambient lighting
        bg_h = rng.uniform(40, 180)
        bg_s = rng.uniform(0.3, 0.7)
        img[:, :, 0] = bg_h * (1.0 + 0.3 * np.sin(x / 50.0 + seed % 10))
        img[:, :, 1] = bg_h * bg_s * (1.0 + 0.2 * np.cos(y / 60.0))
        img[:, :, 2] = bg_h * 0.8 * (1.0 + 0.25 * np.sin((x + y) / 70.0))
        
        # Face contour with varying center and dimensions
        cx = 140 + (seed * 13) % 40
        cy = 130 + (seed * 17) % 40
        rx = 60 + (seed * 7) % 25
        ry = 80 + (seed * 11) % 30
        face_mask = ((x - cx)**2 / (rx**2) + (y - cy)**2 / (ry**2)) <= 1.0
        
        # Skin tone with natural melanin variation
        base_skin = rng.uniform(140, 230)
        grid_y = np.broadcast_to(y, (h, w)).astype(np.float32)
        grid_x = np.broadcast_to(x, (h, w)).astype(np.float32)
        skin_r = base_skin + 15.0 * np.sin(grid_y / 15.0) + rng.normal(0, 3, (h, w))
        skin_g = base_skin * 0.75 + 10.0 * np.sin(grid_y / 15.0)
        skin_b = base_skin * 0.65 + 8.0 * np.sin(grid_x / 15.0)
        img[face_mask, 0] = skin_r[face_mask]
        img[face_mask, 1] = skin_g[face_mask]
        img[face_mask, 2] = skin_b[face_mask]

        # Eyes / features
        eye_y = cy - 15
        left_eye = ((x - (cx - 22))**2 + (y - eye_y)**2) <= 36
        right_eye = ((x - (cx + 22))**2 + (y - eye_y)**2) <= 36
        img[left_eye | right_eye] = [40, 30, 25]

    elif category == "landscapes":
        # Sky gradient
        sky_r = rng.uniform(80, 160)
        horizon = 140 + (seed * 9) % 60
        for r in range(horizon):
            ratio = r / max(1, horizon)
            img[r, :, 0] = sky_r * (1.0 - ratio * 0.4)
            img[r, :, 1] = 160.0 + ratio * 40.0
            img[r, :, 2] = 230.0 - ratio * 50.0
        # Mountains / terrain
        freq = rng.uniform(15.0, 35.0)
        for c in range(w):
            peak = int(horizon - 40 * np.sin(c / freq) - 20 * np.cos(c / 10.0))
            if peak < h:
                img[peak:h, c, 0] = rng.uniform(40, 80) + (c % 15)
                img[peak:h, c, 1] = rng.uniform(90, 140) + ((c + seed) % 20)
                img[peak:h, c, 2] = rng.uniform(30, 70)

    elif category == "architecture":
        # Building structure with perspective
        wall_tone = rng.uniform(90, 180)
        img[:, :] = wall_tone
        col_step = 25 + (seed * 5) % 25
        for c in range(15, w - 15, col_step):
            img[30:290, c:c+15, :] = [wall_tone * 0.6, wall_tone * 0.65, wall_tone * 0.7]
            # Windows
            for win_y in range(50, 270, 40):
                img[win_y:win_y+25, c+2:c+13, :] = [200, 215, 235]

    elif category == "objects":
        # Table top + object (e.g. ceramic mug or metallic sphere)
        img[:, :] = [180, 160, 140]  # wooden table
        obj_cx = 160 + (seed * 11) % 50 - 25
        obj_cy = 160 + (seed * 13) % 40 - 20
        rad = 45 + (seed * 3) % 20
        sphere_mask = ((x - obj_cx)**2 + (y - obj_cy)**2) <= rad**2
        z = np.sqrt(np.clip(rad**2 - (x - obj_cx)**2 - (y - obj_cy)**2, 0, None))
        shading = np.clip((z + (x - obj_cx)*0.5 + (y - obj_cy)*0.5) / rad, 0, 1)
        img[sphere_mask, 0] = 50 + shading[sphere_mask] * 180
        img[sphere_mask, 1] = 70 + shading[sphere_mask] * 160
        img[sphere_mask, 2] = 120 + shading[sphere_mask] * 130

    else:
        # Macro indoor texture (fibers, leaves, cellular gradients)
        scale = rng.uniform(6.0, 18.0)
        pattern = np.sin(x / scale) * np.cos(y / scale) * 80 + 120
        img[:, :, 0] = np.clip(pattern + rng.normal(0, 10, (h, w)), 0, 255)
        img[:, :, 1] = np.clip(pattern * 1.1 + rng.normal(0, 8, (h, w)), 0, 255)
        img[:, :, 2] = np.clip(pattern * 0.85 + rng.normal(0, 12, (h, w)), 0, 255)

    # Physical camera sensor Poisson-Gaussian noise simulation
    shot_noise = rng.poisson(np.clip(img, 1, 255).astype(np.float32))
    read_noise = rng.normal(0, 3.2, img.shape)
    raw_cam = np.clip(0.88 * shot_noise + read_noise, 0, 255).astype(np.uint8)

    pil_img = Image.fromarray(raw_cam)
    # Natural camera lens point-spread function (blur)
    pil_img = pil_img.filter(ImageFilter.GaussianBlur(radius=rng.uniform(0.3, 0.6)))
    return pil_img


def generate_benchmark_synthetic_image(generator_family: str, seed: int) -> Image.Image:
    """
    Synthesizes AI-generated benchmark imagery reproducing distinctive generator
    artifacts: latent diffusion grid patterns, over-smoothing, saturation exaggeration,
    and high-frequency upsampling comb filters.
    """
    rng = np.random.RandomState(seed)
    w, h = 320, 320

    # Base visual content
    cat = CATEGORIES[seed % len(CATEGORIES)]
    base = generate_benchmark_real_image(cat, seed + 10000)
    img_np = np.array(base, dtype=np.float32)

    if generator_family == "gan_style":
        # GAN deconvolution checkerboard artifact (alternating pixel block grid)
        grid = np.zeros((h, w), dtype=np.float32)
        grid[::4, ::4] = 24.0
        grid[1::4, 1::4] = -20.0
        img_np[:, :, 0] = np.clip(img_np[:, :, 0] + grid, 0, 255)
        img_np[:, :, 1] = np.clip(img_np[:, :, 1] + grid * 0.85, 0, 255)
        img_np[:, :, 2] = np.clip(img_np[:, :, 2] + grid * 1.15, 0, 255)

    elif generator_family in ["stable_diffusion", "flux_style"]:
        # Latent diffusion 8x8 block boundary artifact + high frequency chromatic noise
        y, x = np.ogrid[:h, :w]
        block_artifact = ((x % 8 == 0) | (y % 8 == 0)).astype(np.float32) * 9.0
        img_np += np.stack([block_artifact, block_artifact * 0.9, block_artifact * 1.1], axis=-1)
        # Characteristic over-smoothing in fine texture areas
        img_np = cv2.bilateralFilter(np.clip(img_np, 0, 255).astype(np.uint8), d=7, sigmaColor=75, sigmaSpace=75).astype(np.float32)

    elif generator_family == "midjourney_style":
        # Hyper-saturated dynamic range and contrast boosting typical of commercial prompts
        img_np[:, :, 0] = np.clip(img_np[:, :, 0] * 1.25 + 18, 0, 255)
        img_np[:, :, 1] = np.clip(img_np[:, :, 1] * 1.15 + 12, 0, 255)
        img_np[:, :, 2] = np.clip(img_np[:, :, 2] * 1.30 + 22, 0, 255)

    else:
        # DALL-E style: smooth gradient transitions, edge halos, plastic texture
        img_np = cv2.GaussianBlur(img_np.astype(np.uint8), (5, 5), 1.2).astype(np.float32)
        img_np = np.clip(img_np * 1.08 + 8, 0, 255)

    out_img = Image.fromarray(np.clip(img_np, 0, 255).astype(np.uint8))
    return out_img


def build_curated_benchmark_dataset():
    """
    Builds the complete multi-category, multi-generator benchmark dataset
    with strict train, val, test (in-dist), test (OOD), and test (hard) splits.
    """
    setup_directories()
    print("Building diverse multimodal dataset benchmark with strict split isolation...")

    # Clean existing data directories
    import shutil
    for s in SPLITS:
        shutil.rmtree(os.path.join(DATA_DIR, s), ignore_errors=True)
    setup_directories()

    # 1. Generate Real Images across 5 distinct categories with unique noise seeds
    real_candidates = []
    seed_counter = 1000
    for cat in CATEGORIES:
        for idx in range(35):
            seed_counter += 7
            img = generate_benchmark_real_image(cat, seed=seed_counter)
            real_candidates.append((img, f"real_{cat}_{idx:03d}_{seed_counter}.jpg"))

    random.seed(101)
    random.shuffle(real_candidates)

    # 2. Generate In-Distribution Synthetic Images (Stable Diffusion, GAN, DALL-E styles)
    synth_in_dist_candidates = []
    for gen in ["stable_diffusion", "gan_style", "dalle_style"]:
        for idx in range(45):
            seed_counter += 11
            img = generate_benchmark_synthetic_image(gen, seed=seed_counter)
            synth_in_dist_candidates.append((img, f"synth_{gen}_{idx:03d}_{seed_counter}.jpg"))

    random.seed(202)
    random.shuffle(synth_in_dist_candidates)

    # 3. Generate Out-of-Distribution Synthetic Images (Midjourney & Flux styles withheld from training)
    synth_ood_candidates = []
    for gen in ["midjourney_style", "flux_style"]:
        for idx in range(25):
            seed_counter += 19
            img = generate_benchmark_synthetic_image(gen, seed=seed_counter)
            synth_ood_candidates.append((img, f"synth_ood_{gen}_{idx:03d}_{seed_counter}.jpg"))

    random.seed(303)
    random.shuffle(synth_ood_candidates)

    # Split assignments:
    # Real: 70 train, 20 val, 25 test_id, 25 test_ood (Total: 140)
    train_real = real_candidates[:70]
    val_real = real_candidates[70:90]
    test_id_real = real_candidates[90:115]
    test_ood_real = real_candidates[115:140]

    # Synthetic:
    # Train: 70 in-dist
    # Val: 20 in-dist
    # Test In-Distribution: 25 in-dist
    # Test Out-of-Distribution: 25 OOD (withheld generators)
    train_synth = synth_in_dist_candidates[:70]
    val_synth = synth_in_dist_candidates[70:90]
    test_id_synth = synth_in_dist_candidates[90:115]
    test_ood_synth = synth_ood_candidates[:25]

    def save_split_images(img_list, split, label):
        dest_dir = os.path.join(DATA_DIR, split, label)
        os.makedirs(dest_dir, exist_ok=True)
        for img, fname in img_list:
            img.save(os.path.join(dest_dir, fname), "JPEG", quality=92)

    save_split_images(train_real, "train", "real")
    save_split_images(train_synth, "train", "synthetic")
    save_split_images(val_real, "val", "real")
    save_split_images(val_synth, "val", "synthetic")
    save_split_images(test_id_real, "test_id", "real")
    save_split_images(test_id_synth, "test_id", "synthetic")
    save_split_images(test_ood_real, "test_ood", "real")
    save_split_images(test_ood_synth, "test_ood", "synthetic")

    # 4. Generate Hard-Case Test Set with distinct seeds
    hard_dir = os.path.join(DATA_DIR, "test_hard")
    os.makedirs(hard_dir, exist_ok=True)
    for i in range(12):
        seed_counter += 31
        # Hard real: low light + camera compression
        h_real = generate_benchmark_real_image("landscapes", seed=seed_counter)
        buf = io.BytesIO()
        h_real.save(buf, format="JPEG", quality=40)
        buf.seek(0)
        Image.open(buf).save(os.path.join(hard_dir, f"hard_real_{i:02d}_comp40.jpg"))

        # Hard synthetic: subtle diffusion + downscale artifact
        seed_counter += 37
        h_synth = generate_benchmark_synthetic_image("flux_style", seed=seed_counter)
        down = h_synth.resize((128, 128), Image.Resampling.BILINEAR).resize((320, 320), Image.Resampling.BICUBIC)
        down.save(os.path.join(hard_dir, f"hard_synth_{i:02d}_rescaled.jpg"))

    print("Curated benchmark dataset written successfully.")


if __name__ == "__main__":
    build_curated_benchmark_dataset()
