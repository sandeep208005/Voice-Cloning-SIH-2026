import io
import cv2
import numpy as np
from PIL import Image, ImageOps, ImageChops
from typing import Tuple, Dict, Any, Optional

# Standard ImageNet normalization parameters
IMAGENET_MEAN = np.array([0.485, 0.456, 0.406], dtype=np.float32)
IMAGENET_STD = np.array([0.229, 0.224, 0.225], dtype=np.float32)

TARGET_SIZE = (256, 256)
PREPROCESSING_VERSION = "2.1.0"


class ImagePreprocessor:
    """
    Centralized, deterministic image preprocessing pipeline shared across
    training, validation, testing, and production inference.
    """

    def __init__(self, target_size: Tuple[int, int] = TARGET_SIZE):
        self.target_size = target_size
        self.version = PREPROCESSING_VERSION

    def load_and_standardize_pil(self, image_input) -> Image.Image:
        """
        Loads and standardizes image to RGB, handling EXIF orientation,
        RGBA transparency (composite on black/neutral), and CMYK/grayscale.
        """
        if isinstance(image_input, str):
            img = Image.open(image_input)
        elif isinstance(image_input, bytes):
            img = Image.open(io.BytesIO(image_input))
        elif isinstance(image_input, Image.Image):
            img = image_input
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        # 1. Correct EXIF orientation
        try:
            img = ImageOps.exif_transpose(img)
        except Exception:
            pass

        # 2. Handle color modes
        if img.mode == "RGBA":
            # Composite onto neutral gray background to avoid alpha edge artifacts
            background = Image.new("RGB", img.size, (128, 128, 128))
            background.paste(img, mask=img.split()[3])
            img = background
        elif img.mode != "RGB":
            img = img.convert("RGB")

        # 3. High quality bicubic resize
        img_resized = img.resize(self.target_size, Image.Resampling.BICUBIC)
        return img_resized

    def extract_spatial_tensor(self, pil_image: Image.Image) -> np.ndarray:
        """
        Converts standardized PIL image to normalized float32 tensor (C, H, W).
        Shape: (3, H, W), normalized with ImageNet mean and std.
        """
        np_img = np.array(pil_image, dtype=np.float32) / 255.0
        # Normalize
        norm_img = (np_img - IMAGENET_MEAN) / IMAGENET_STD
        # Transpose from (H, W, C) to (C, H, W)
        tensor = np.transpose(norm_img, (2, 0, 1)).astype(np.float32)
        return tensor

    def extract_frequency_tensor(self, pil_image: Image.Image) -> np.ndarray:
        """
        Extracts 2D-FFT logarithmic magnitude spectrum and ELA map as a 2-channel forensic tensor.
        Shape: (2, H, W), normalized to [0, 1].
        """
        # Convert to grayscale
        gray = np.array(pil_image.convert("L"), dtype=np.float32)
        
        # 1. 2D Fast Fourier Transform
        f = np.fft.fft2(gray)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = np.log1p(np.abs(fshift))
        mag_max = np.max(magnitude_spectrum) + 1e-6
        fft_norm = (magnitude_spectrum / mag_max).astype(np.float32)

        # 2. Error Level Analysis (ELA) map at Q=90
        buf = io.BytesIO()
        pil_image.save(buf, format="JPEG", quality=90)
        buf.seek(0)
        resaved = Image.open(buf)
        diff = ImageChops.difference(pil_image, resaved)
        diff_gray = np.array(diff.convert("L"), dtype=np.float32)
        ela_norm = np.clip(diff_gray / 32.0, 0.0, 1.0).astype(np.float32)

        # Stack into (2, H, W) tensor
        freq_tensor = np.stack([fft_norm, ela_norm], axis=0)
        return freq_tensor

    def preprocess_for_inference(self, image_input) -> Dict[str, Any]:
        """
        Full inference preprocessing returning spatial and frequency tensors
        along with image metadata.
        """
        pil_standard = self.load_and_standardize_pil(image_input)
        spatial_tensor = self.extract_spatial_tensor(pil_standard)
        freq_tensor = self.extract_frequency_tensor(pil_standard)

        return {
            "spatial_tensor": spatial_tensor,
            "freq_tensor": freq_tensor,
            "pil_image": pil_standard,
            "target_size": self.target_size,
            "preprocessing_version": self.version,
        }


DEFAULT_PREPROCESSOR = ImagePreprocessor()


def preprocess_image_tensor(image_input) -> Tuple[Any, Any]:
    """
    Centralized helper converting image input to PyTorch tensors
    (spatial_tensor: 3x256x256, freq_tensor: 2x256x256).
    """
    import torch
    data = DEFAULT_PREPROCESSOR.preprocess_for_inference(image_input)
    spatial_t = torch.from_numpy(data["spatial_tensor"]).float()
    freq_t = torch.from_numpy(data["freq_tensor"]).float()
    return spatial_t, freq_t
