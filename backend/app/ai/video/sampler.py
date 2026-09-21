import cv2
import numpy as np
from typing import List, Tuple, Dict, Any


class VideoFrameSampler:
    """Samples uniform temporal frames from video streams for forensic inspection."""

    def __init__(self, max_frames: int = 32):
        self.max_frames = max_frames

    def sample_frames(self, video_path: str) -> Tuple[List[np.ndarray], Dict[str, Any]]:
        """
        Samples uniformly spaced frames from video.
        Returns: (frames_list_bgr, video_metadata)
        """
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Unable to open video stream at {video_path}")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        fps = float(cap.get(cv2.CAP_PROP_FPS))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        duration = float(total_frames / fps) if fps > 0 else 0.0

        if total_frames <= 0:
            cap.release()
            raise ValueError(f"Video contains 0 frames: {video_path}")

        # Determine sampling indices
        num_to_sample = min(self.max_frames, total_frames)
        indices = np.linspace(0, total_frames - 1, num=num_to_sample, dtype=int)

        frames = []
        for idx in indices:
            cap.set(cv2.CAP_PROP_POS_FRAMES, int(idx))
            ret, frame = cap.read()
            if ret and frame is not None:
                frames.append(frame)

        cap.release()

        metadata = {
            "total_frames": total_frames,
            "fps": round(fps, 2),
            "width": width,
            "height": height,
            "duration_seconds": round(duration, 2),
            "sampled_frames_count": len(frames),
        }

        return frames, metadata
