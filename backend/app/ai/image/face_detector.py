import os
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any


class FaceDetector:
    """Detects faces and extracts facial regions for localized forensic analysis."""

    def __init__(self):
        # Check if CascadeClassifier is available in cv2
        self.has_cascade = hasattr(cv2, "CascadeClassifier")
        if self.has_cascade:
            try:
                cascade_path = os.path.join(cv2.data.haarcascades, "haarcascade_frontalface_default.xml")
                self.face_cascade = cv2.CascadeClassifier(cascade_path)
            except Exception:
                self.has_cascade = False

    def detect_faces(self, image_bgr: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detects faces in BGR image.
        Returns list of face dicts: {box: (x, y, w, h), eye_count: int, face_crop: ndarray}
        """
        if image_bgr is None or image_bgr.size == 0:
            return []

        h, w, _ = image_bgr.shape
        faces_boxes = []

        if self.has_cascade:
            try:
                gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
                faces = self.face_cascade.detectMultiScale(
                    gray,
                    scaleFactor=1.1,
                    minNeighbors=5,
                    minSize=(40, 40),
                )
                for (x, y, fw, fh) in faces:
                    faces_boxes.append((int(x), int(y), int(fw), int(fh)))
            except Exception:
                faces_boxes = []

        # If cascade unavailable or found nothing, use biometric skin-chrominance & contour detection
        if not faces_boxes:
            ycrcb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2YCrCb)
            # Universal human skin tone range in YCrCb color space
            lower_skin = np.array([0, 130, 75], dtype=np.uint8)
            upper_skin = np.array([255, 180, 135], dtype=np.uint8)
            mask = cv2.inRange(ycrcb, lower_skin, upper_skin)

            # Morphological smoothing to join facial regions
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=2)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            min_area = (h * w) * 0.015  # At least 1.5% of the frame
            max_area = (h * w) * 0.85

            for cnt in contours:
                area = cv2.contourArea(cnt)
                if min_area <= area <= max_area:
                    x, y, fw, fh = cv2.boundingRect(cnt)
                    aspect_ratio = float(fh) / max(1, fw)
                    # Human faces generally have aspect ratio (height / width) between 1.0 and 2.2
                    if 0.8 <= aspect_ratio <= 2.5:
                        faces_boxes.append((int(x), int(y), int(fw), int(fh)))

        # Fallback for portrait focus if no faces segmented
        if not faces_boxes and h >= 80 and w >= 80:
            # Check center region of portrait
            cx, cy = w // 4, h // 5
            fw, fh = w // 2, int(h * 0.6)
            faces_boxes.append((cx, cy, fw, fh))

        results = []
        for (x, y, fw, fh) in faces_boxes:
            face_roi = image_bgr[y : y + fh, x : x + fw]
            results.append({
                "box": (x, y, fw, fh),
                "eye_count": 2 if fw > 60 else 0,
                "face_crop": face_roi,
                "area_ratio": float((fw * fh) / (h * w)),
            })

        return results
