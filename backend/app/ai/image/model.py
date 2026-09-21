"""
DeepShield Vision Neural Architecture - Dual-Stream Spatial + Frequency Classifier
Binary classification: Class 0 = REAL / HUMAN, Class 1 = SYNTHETIC / AI-GENERATED.
Includes Grad-CAM activation hooks for visual spatial explainability.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Tuple, Optional, Dict, Any
import numpy as np
import cv2


class ResidualBlock(nn.Module):
    """Residual convolutional block with batch normalization and GELU."""
    def __init__(self, channels: int):
        super().__init__()
        self.conv1 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn1 = nn.BatchNorm2d(channels)
        self.act1 = nn.GELU()
        self.conv2 = nn.Conv2d(channels, channels, kernel_size=3, padding=1, bias=False)
        self.bn2 = nn.BatchNorm2d(channels)
        self.act2 = nn.GELU()

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.act2(x + self.bn2(self.conv2(self.act1(self.bn1(self.conv1(x))))))


class SpatialStream(nn.Module):
    """
    Spatial feature extractor targeting texture, boundaries, chromatic aberrations,
    and optical consistency across scales.
    Input: (B, 3, 256, 256)
    """
    def __init__(self, out_features: int = 256):
        super().__init__()
        # Stage 1: 256 -> 128
        self.conv_in = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(32),
            nn.GELU()
        )
        self.res1 = ResidualBlock(32)

        # Stage 2: 128 -> 64
        self.down1 = nn.Sequential(
            nn.Conv2d(32, 64, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.GELU()
        )
        self.res2 = ResidualBlock(64)

        # Stage 3: 64 -> 32
        self.down2 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=4, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.GELU()
        )
        self.res3 = ResidualBlock(128)

        # Stage 4: 32 -> 16 (Target layer for Grad-CAM)
        self.target_conv = nn.Sequential(
            nn.Conv2d(128, 256, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(256),
            nn.GELU()
        )
        self.res4 = ResidualBlock(256)

        self.pool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(256, out_features)

    def forward(self, x: torch.Tensor) -> Tuple[torch.Tensor, torch.Tensor]:
        x = self.conv_in(x)
        x = self.res1(x)
        x = self.down1(x)
        x = self.res2(x)
        x = self.down2(x)
        x = self.res3(x)
        features_map = self.target_conv(x)
        features_map = self.res4(features_map)
        pooled = self.pool(features_map).flatten(1)
        embed = self.fc(pooled)
        return embed, features_map


class FrequencyStream(nn.Module):
    """
    Frequency domain stream analyzing 2D-FFT spectral artifacts and ELA compression gradients.
    Input: (B, 2, 256, 256)
    """
    def __init__(self, out_features: int = 128):
        super().__init__()
        self.net = nn.Sequential(
            nn.Conv2d(2, 32, kernel_size=5, stride=2, padding=2, bias=False),
            nn.BatchNorm2d(32),
            nn.GELU(),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(64),
            nn.GELU(),
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1, bias=False),
            nn.BatchNorm2d(128),
            nn.GELU(),
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(128, out_features),
            nn.GELU()
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


class DeepShieldImageClassifier(nn.Module):
    """
    Unified multimodal vision architecture fusing spatial optical consistency
    with frequency domain spectral/ELA residual analysis.
    Output: 2 logits [logit_real, logit_synthetic].
    """
    def __init__(self):
        super().__init__()
        self.spatial_stream = SpatialStream(out_features=256)
        self.freq_stream = FrequencyStream(out_features=128)

        self.classifier = nn.Sequential(
            nn.Linear(256 + 128, 128),
            nn.GELU(),
            nn.Dropout(0.35),
            nn.Linear(128, 64),
            nn.GELU(),
            nn.Dropout(0.2),
            nn.Linear(64, 2)  # [0 = real, 1 = synthetic]
        )

        # Grad-CAM hooks storage
        self.gradients: Optional[torch.Tensor] = None
        self.activations: Optional[torch.Tensor] = None

    def activations_hook(self, grad: torch.Tensor):
        self.gradients = grad

    def forward(self, spatial: torch.Tensor, freq: torch.Tensor) -> torch.Tensor:
        spatial_embed, feat_map = self.spatial_stream(spatial)
        
        # Register hook on feature map for Grad-CAM
        if feat_map.requires_grad:
            self.activations = feat_map
            feat_map.register_hook(self.activations_hook)
        else:
            self.activations = feat_map

        freq_embed = self.freq_stream(freq)
        fused = torch.cat([spatial_embed, freq_embed], dim=1)
        logits = self.classifier(fused)
        return logits

    def generate_gradcam(
        self,
        spatial_tensor: torch.Tensor,
        freq_tensor: torch.Tensor,
        target_class: int = 1
    ) -> np.ndarray:
        """
        Generates Grad-CAM visual attention heatmap highlighting regions contributing
        to the model's decision (e.g. synthetic artifacts or realistic optical signatures).
        Returns: 2D numpy array [0, 1] of shape (256, 256).
        """
        self.eval()
        self.zero_grad()

        # Ensure gradient tracking
        spatial = spatial_tensor.clone().detach().requires_grad_(True)
        freq = freq_tensor.clone().detach()

        logits = self.forward(spatial, freq)
        score = logits[0, target_class]
        score.backward()

        if self.gradients is None or self.activations is None:
            # Fallback uniform attention if gradients unavailable
            return np.ones((256, 256), dtype=np.float32) * 0.5

        # Global average pool the gradients across spatial dimensions
        weights = torch.mean(self.gradients, dim=[2, 3], keepdim=True)
        cam = torch.sum(weights * self.activations, dim=1).squeeze(0)
        cam = F.relu(cam)  # Only features that positively influence target class

        cam_np = cam.detach().cpu().numpy()
        cam_min, cam_max = cam_np.min(), cam_np.max()
        if cam_max > cam_min:
            cam_np = (cam_np - cam_min) / (cam_max - cam_min)
        else:
            cam_np = np.zeros_like(cam_np)

        # Upscale to (256, 256) matching input resolution
        cam_resized = cv2.resize(cam_np, (256, 256), interpolation=cv2.INTER_CUBIC)
        return np.clip(cam_resized, 0.0, 1.0)
