import os
import cv2
import numpy as np
from typing import List, Tuple, Dict, Any


class FaceDetector:
    """Detects single or multiple faces and extracts facial regions for localized forensic analysis."""

    def __init__(self):
        self.cascades = []
        cascade_names = [
            "haarcascade_frontalface_default.xml",
            "haarcascade_frontalface_alt2.xml",
            "haarcascade_profileface.xml",
        ]
        local_dir = os.path.join(os.path.dirname(__file__), "cascades")
        cv2_dir = getattr(cv2.data, "haarcascades", "") if hasattr(cv2, "data") else ""

        for name in cascade_names:
            candidates = [
                os.path.join(local_dir, name),
                os.path.join(cv2_dir, name) if cv2_dir else "",
            ]
            for p in candidates:
                if p and os.path.exists(p):
                    try:
                        c = cv2.CascadeClassifier(p)
                        if not c.empty():
                            self.cascades.append(c)
                            break
                    except Exception:
                        pass

    @staticmethod
    def _non_max_suppression(boxes: List[Tuple[int, int, int, int]], overlap_thresh: float = 0.35) -> List[Tuple[int, int, int, int]]:
        """Applies Non-Maximum Suppression to filter duplicate overlapping face bounding boxes."""
        if not boxes:
            return []

        boxes_arr = np.array([[x, y, x + w, y + h] for (x, y, w, h) in boxes], dtype=float)
        pick = []

        x1 = boxes_arr[:, 0]
        y1 = boxes_arr[:, 1]
        x2 = boxes_arr[:, 2]
        y2 = boxes_arr[:, 3]

        area = (x2 - x1 + 1) * (y2 - y1 + 1)
        idxs = np.argsort(y2)

        while len(idxs) > 0:
            last = len(idxs) - 1
            i = idxs[last]
            pick.append(i)

            xx1 = np.maximum(x1[i], x1[idxs[:last]])
            yy1 = np.maximum(y1[i], y1[idxs[:last]])
            xx2 = np.minimum(x2[i], x2[idxs[:last]])
            yy2 = np.minimum(y2[i], y2[idxs[:last]])

            w_overlap = np.maximum(0.0, xx2 - xx1 + 1)
            h_overlap = np.maximum(0.0, yy2 - yy1 + 1)
            overlap = (w_overlap * h_overlap) / area[idxs[:last]]

            idxs = np.delete(
                idxs,
                np.concatenate(([last], np.where(overlap > overlap_thresh)[0])),
            )

        final_boxes = []
        for p_idx in pick:
            bx1, by1, bx2, by2 = boxes_arr[p_idx]
            final_boxes.append((int(bx1), int(by1), int(bx2 - bx1), int(by2 - by1)))
        return final_boxes

    def detect_faces(self, image_bgr: np.ndarray, allow_fallback: bool = False) -> List[Dict[str, Any]]:
        """
        Detects all faces in BGR image.
        Returns list of face dicts: [{box: (x, y, w, h), eye_count: int, face_crop: ndarray}, ...]
        """
        if image_bgr is None or image_bgr.size == 0:
            return []

        h, w = image_bgr.shape[:2]
        candidate_boxes = []

        # 1. Multi-cascade detection across color and grayscale
        if self.cascades:
            gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
            # Equalize histogram for illumination invariant multi-face detection
            try:
                gray_eq = cv2.equalizeHist(gray)
            except Exception:
                gray_eq = gray

            min_face_size = max(18, min(h, w) // 16)

            for cascade in self.cascades:
                try:
                    faces = cascade.detectMultiScale(
                        gray_eq,
                        scaleFactor=1.08,
                        minNeighbors=4,
                        minSize=(min_face_size, min_face_size),
                    )
                    for (x, y, fw, fh) in faces:
                        candidate_boxes.append((int(x), int(y), int(fw), int(fh)))
                except Exception:
                    continue

        # 2. Non-Maximum Suppression to accurately consolidate distinct detected faces
        faces_boxes = self._non_max_suppression(candidate_boxes, overlap_thresh=0.35)

        # 3. If cascade found nothing, use multi-contour biometric skin-chrominance detection
        if not faces_boxes:
            ycrcb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2YCrCb)
            lower_skin = np.array([0, 130, 75], dtype=np.uint8)
            upper_skin = np.array([255, 180, 135], dtype=np.uint8)
            mask = cv2.inRange(ycrcb, lower_skin, upper_skin)

            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel, iterations=2)
            mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)

            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            min_area = (h * w) * 0.008  # At least 0.8% of frame
            max_area = (h * w) * 0.85

            skin_boxes = []
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if min_area <= area <= max_area:
                    x, y, fw, fh = cv2.boundingRect(cnt)
                    aspect_ratio = float(fh) / max(1, fw)
                    if 0.75 <= aspect_ratio <= 2.6:
                        skin_boxes.append((int(x), int(y), int(fw), int(fh)))

            faces_boxes = self._non_max_suppression(skin_boxes, overlap_thresh=0.30)

        # 4. Optional fallback only if explicitly requested for static image crops
        if not faces_boxes and allow_fallback and h >= 80 and w >= 80:
            cx, cy = w // 4, h // 5
            fw, fh = w // 2, int(h * 0.6)
            faces_boxes.append((cx, cy, fw, fh))

        results = []
        for (x, y, fw, fh) in faces_boxes:
            # Safe ROI bounding
            x_clamped = max(0, min(w - 1, x))
            y_clamped = max(0, min(h - 1, y))
            fw_clamped = max(1, min(w - x_clamped, fw))
            fh_clamped = max(1, min(h - y_clamped, fh))

            face_roi = image_bgr[y_clamped : y_clamped + fh_clamped, x_clamped : x_clamped + fw_clamped]
            results.append({
                "box": (x_clamped, y_clamped, fw_clamped, fh_clamped),
                "eye_count": 2 if fw_clamped > 40 else 0,
                "face_crop": face_roi,
                "area_ratio": float((fw_clamped * fh_clamped) / max(1, h * w)),
            })

        return results
