import cv2
import numpy as np
from typing import Dict, Any, List


class ImageSpectralAnalyzer:
    """Frequency-domain and boundary gradient analysis for synthetic visual artifact detection."""

    def analyze_frequency_domain(self, image_bgr: np.ndarray) -> Dict[str, Any]:
        """
        Computes 2D-FFT frequency spectrum metrics to detect GAN / Diffusion grid artifacts.
        """
        if image_bgr is None or image_bgr.size == 0:
            return {"high_freq_power": 0.0, "grid_artifact_score": 0.0}

        gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape

        # Standardize size for consistent frequency analysis
        resized = cv2.resize(gray, (256, 256), interpolation=cv2.INTER_AREA)

        # 2D Fast Fourier Transform
        f = np.fft.fft2(resized)
        fshift = np.fft.fftshift(f)
        magnitude_spectrum = np.log1p(np.abs(fshift))

        # Separate into center (low frequency) and outer ring (high frequency)
        cy, cx = 128, 128
        y, x = np.ogrid[:256, :256]
        dist_from_center = np.sqrt((x - cx) ** 2 + (y - cy) ** 2)

        # Low frequency radius <= 32, high frequency radius >= 80
        low_mask = dist_from_center <= 32
        high_mask = dist_from_center >= 80

        low_power = float(np.mean(magnitude_spectrum[low_mask]))
        high_power = float(np.mean(magnitude_spectrum[high_mask]))
        high_low_ratio = high_power / (low_power + 1e-5)

        # Check for unnatural periodic peaks in high-frequency ring (GAN grid artifact)
        high_vals = magnitude_spectrum[high_mask]
        q75, q25 = np.percentile(high_vals, [75, 25])
        iqr = q75 - q25
        high_spikes = np.sum(high_vals > (q75 + 1.5 * iqr)) / len(high_vals)

        # Laplacian sharpness variance
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        lap_var = float(laplacian.var())

        return {
            "high_freq_power": round(high_power, 3),
            "high_low_power_ratio": round(high_low_ratio, 4),
            "high_frequency_spikes_ratio": round(float(high_spikes), 4),
            "laplacian_variance": round(lap_var, 2),
        }

    def analyze_facial_boundary(self, image_bgr: np.ndarray, box: tuple) -> float:
        """
        Calculates gradient discontinuity across the face boundary box.
        Face swaps typically display a smoothing/blur artifact along the blending perimeter.
        """
        x, y, w, h = box
        img_h, img_w, _ = image_bgr.shape

        # Define boundary strip
        pad = 8
        y1, y2 = max(0, y - pad), min(img_h, y + h + pad)
        x1, x2 = max(0, x - pad), min(img_w, x + w + pad)

        boundary_roi = image_bgr[y1:y2, x1:x2]
        if boundary_roi.size == 0:
            return 0.0

        gray_roi = cv2.cvtColor(boundary_roi, cv2.COLOR_BGR2GRAY)
        sobelx = cv2.Sobel(gray_roi, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray_roi, cv2.CV_64F, 0, 1, ksize=3)
        grad_mag = np.sqrt(sobelx ** 2 + sobely ** 2)

        # Return standard deviation of gradient magnitude along boundary
        return float(np.std(grad_mag))
