import cv2
import numpy as np
from typing import List, Dict, Any, Tuple


class VideoTemporalAnalyzer:
    """Measures inter-frame temporal stability, bounding box jitter, and optical flow anomalies."""

    def compute_temporal_jitter(self, face_boxes_per_frame: List[List[tuple]]) -> Dict[str, Any]:
        """
        Analyzes the trajectory of primary faces across frames.
        High-frequency bounding-box coordinates and aspect-ratio fluctuations indicate face-swap jitter.
        """
        centers = []
        areas = []

        for boxes in face_boxes_per_frame:
            if boxes and len(boxes) > 0:
                # Pick largest face
                largest = max(boxes, key=lambda b: b[2] * b[3])
                x, y, w, h = largest
                centers.append((x + w / 2.0, y + h / 2.0))
                areas.append(w * h)
            else:
                centers.append(None)
                areas.append(None)

        # Compute displacements between consecutive valid frames
        displacements = []
        area_changes = []

        for i in range(len(centers) - 1):
            c1, c2 = centers[i], centers[i + 1]
            a1, a2 = areas[i], areas[i + 1]

            if c1 is not None and c2 is not None:
                dist = np.sqrt((c1[0] - c2[0]) ** 2 + (c1[1] - c2[1]) ** 2)
                displacements.append(dist)

            if a1 is not None and a2 is not None and a1 > 0:
                area_ratio = abs(a2 - a1) / a1
                area_changes.append(area_ratio)

        if len(displacements) < 2:
            return {
                "center_jitter_variance": 0.0,
                "scale_jitter_variance": 0.0,
                "temporal_face_stability_score": 1.0,
                "face_tracking_ratio": round(len([c for c in centers if c is not None]) / max(1, len(centers)), 2),
            }

        # Jitter variance is normalized against median displacement
        center_jitter = float(np.std(displacements))
        scale_jitter = float(np.std(area_changes))

        # Stability score: 1.0 is perfectly stable, lower is jittery/erratic
        stability_score = max(0.0, 1.0 - (center_jitter / 50.0 + scale_jitter * 2.0))

        return {
            "center_jitter_variance": round(center_jitter, 2),
            "scale_jitter_variance": round(scale_jitter, 4),
            "temporal_face_stability_score": round(stability_score, 3),
            "face_tracking_ratio": round(len([c for c in centers if c is not None]) / len(centers), 2),
        }

    def compute_optical_flow_residuals(self, prev_bgr: np.ndarray, curr_bgr: np.ndarray) -> float:
        """Calculates optical flow magnitude between two frames."""
        prev_gray = cv2.cvtColor(prev_bgr, cv2.COLOR_BGR2GRAY)
        curr_gray = cv2.cvtColor(curr_bgr, cv2.COLOR_BGR2GRAY)

        flow = cv2.calcOpticalFlowFarneback(
            prev_gray,
            curr_gray,
            None,
            pyr_scale=0.5,
            levels=3,
            winsize=15,
            iterations=3,
            poly_n=5,
            poly_sigma=1.2,
            flags=0,
        )
        mag, _ = cv2.cartToPolar(flow[..., 0], flow[..., 1])
        return float(np.mean(mag))
