import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from typing import Dict, Any, Tuple, Optional


class ELAAnalyzer:
    """Error Level Analysis (ELA) for detecting digital manipulation and compression discrepancies."""

    def __init__(self, quality: int = 90, scale: float = 15.0):
        self.quality = quality
        self.scale = scale

    def analyze_ela(
        self,
        image_bgr: np.ndarray,
        face_boxes: Optional[list] = None,
    ) -> Dict[str, Any]:
        """
        Computes ELA map and compares regional compression consistency.
        """
        if image_bgr is None or image_bgr.size == 0:
            return {"ela_mean_error": 0.0, "manipulation_detected": False}

        # Convert OpenCV BGR to PIL RGB
        image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
        pil_orig = Image.fromarray(image_rgb)

        # Save to memory buffer with specific JPEG compression quality
        buffer = io.BytesIO()
        pil_orig.save(buffer, format="JPEG", quality=self.quality)
        buffer.seek(0)
        pil_resaved = Image.open(buffer)

        # Compute difference
        diff = ImageChops.difference(pil_orig, pil_resaved)
        diff_np = np.array(diff).astype(np.float32)

        # Overall mean and std error
        overall_mean = float(np.mean(diff_np))
        overall_std = float(np.std(diff_np))

        # If faces are detected, compare compression artifacts within face vs background
        face_discrepancy = 0.0
        face_mean = overall_mean
        bg_mean = overall_mean

        if face_boxes and len(face_boxes) > 0:
            h, w, _ = image_bgr.shape
            mask = np.zeros((h, w), dtype=bool)
            for (x, y, fw, fh) in face_boxes:
                mask[y : min(h, y + fh), x : min(w, x + fw)] = True

            face_pixels = diff_np[mask]
            bg_pixels = diff_np[~mask]

            if len(face_pixels) > 0 and len(bg_pixels) > 0:
                face_mean = float(np.mean(face_pixels))
                bg_mean = float(np.mean(bg_pixels))
                # Absolute relative discrepancy between face region and background
                face_discrepancy = abs(face_mean - bg_mean) / (bg_mean + 1e-5)

        # High discrepancy (>0.45) indicates spliced or regenerated facial regions
        is_suspicious = face_discrepancy > 0.45 or overall_std > 22.0

        return {
            "ela_overall_mean": round(overall_mean, 2),
            "ela_overall_std": round(overall_std, 2),
            "ela_face_mean": round(face_mean, 2),
            "ela_background_mean": round(bg_mean, 2),
            "ela_regional_discrepancy": round(float(face_discrepancy), 3),
            "ela_anomaly_detected": is_suspicious,
        }
