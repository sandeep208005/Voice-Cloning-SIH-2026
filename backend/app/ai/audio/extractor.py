import os
import io
import base64
import numpy as np
import subprocess
import librosa
import soundfile as sf
from typing import Dict, Any, Tuple
from PIL import Image


class AudioFeatureExtractor:
    """Extracts acoustic, spectral, and prosodic features from audio for forensic detection."""

    def __init__(self, target_sr: int = 22050):
        self.target_sr = target_sr

    def load_audio(self, file_path: str) -> Tuple[np.ndarray, int]:
        """
        Loads and resamples audio to standard sampling rate.
        Supports standard formats (WAV, MP3, FLAC) via soundfile/librosa,
        with seamless FFmpeg pipe fallback for WebM, Opus, Ogg, and browser recordings.
        """
        # 1. Try standard librosa/soundfile loading first
        try:
            y, sr = librosa.load(file_path, sr=self.target_sr, mono=True)
            if len(y) > 0:
                return y, sr
        except Exception:
            pass

        # 2. Universal FFmpeg pipe decoding fallback (handles WebM, Opus, AAC, M4A, etc.)
        try:
            import imageio_ffmpeg
            ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
            cmd = [
                ffmpeg_exe,
                "-nostdin",
                "-threads", "1",
                "-i", file_path,
                "-vn",                 # Skip video streams
                "-ac", "1",            # Force mono
                "-ar", str(self.target_sr),  # Target sample rate
                "-f", "f32le",         # Raw 32-bit floating-point PCM
                "-"                    # Pipe to stdout
            ]
            proc = subprocess.run(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                check=True
            )
            raw_pcm = proc.stdout
            if len(raw_pcm) > 0:
                y = np.frombuffer(raw_pcm, dtype=np.float32)
                return y, self.target_sr
        except Exception as ffmpeg_err:
            raise ValueError(f"Failed to decode audio from {file_path}: {ffmpeg_err}")

        raise ValueError("Audio file contains zero readable samples or could not be decoded.")

    def extract_features(self, y: np.ndarray, sr: int) -> Dict[str, Any]:
        """Calculates comprehensive acoustic features from audio signal."""
        duration = float(librosa.get_duration(y=y, sr=sr))

        # 1. Mel-frequency cepstral coefficients (MFCCs)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=20)
        mfcc_mean = [float(x) for x in np.mean(mfccs, axis=1)]
        mfcc_std = [float(x) for x in np.std(mfccs, axis=1)]

        # 2. Spectral Centroid (timbral brightness)
        cent = librosa.feature.spectral_centroid(y=y, sr=sr)
        cent_mean = float(np.mean(cent))
        cent_std = float(np.std(cent))

        # 3. Spectral Rolloff (frequency below which 85% of energy lies)
        rolloff = librosa.feature.spectral_rolloff(y=y, sr=sr, roll_percent=0.85)
        rolloff_mean = float(np.mean(rolloff))
        rolloff_std = float(np.std(rolloff))

        # 4. Spectral Bandwidth
        bw = librosa.feature.spectral_bandwidth(y=y, sr=sr)
        bw_mean = float(np.mean(bw))

        # 5. Spectral Flatness (tonality vs noise)
        flatness = librosa.feature.spectral_flatness(y=y)
        flatness_mean = float(np.mean(flatness))

        # 6. Zero-Crossing Rate (roughness and noisy transitions)
        zcr = librosa.feature.zero_crossing_rate(y=y)
        zcr_mean = float(np.mean(zcr))
        zcr_std = float(np.std(zcr))

        # 7. Harmonic-to-percussive separation
        y_harm, y_perc = librosa.effects.hpss(y)
        harm_energy = float(np.sum(y_harm ** 2))
        perc_energy = float(np.sum(y_perc ** 2)) + 1e-9
        hp_ratio = float(harm_energy / perc_energy)

        # 8. Micro-pitch jitter / F0 tracking
        try:
            f0, voiced_flag, voiced_probs = librosa.pyin(
                y,
                fmin=librosa.note_to_hz('C2'),
                fmax=librosa.note_to_hz('C7'),
                sr=sr,
            )
            valid_f0 = f0[~np.isnan(f0)] if f0 is not None else np.array([])
            if len(valid_f0) > 2:
                # Frame-to-frame pitch perturbation (Jitter)
                f0_diffs = np.abs(np.diff(valid_f0))
                pitch_jitter = float(np.mean(f0_diffs) / (np.mean(valid_f0) + 1e-6))
                f0_mean = float(np.mean(valid_f0))
            else:
                pitch_jitter = 0.0
                f0_mean = 0.0
        except Exception:
            pitch_jitter = 0.0
            f0_mean = 0.0

        # 9. High-frequency energy cutoff ratio (vocoder check: >8kHz energy ratio)
        stft = np.abs(librosa.stft(y))
        freqs = librosa.fft_frequencies(sr=sr)
        high_freq_idx = np.where(freqs >= 7500)[0]
        if len(high_freq_idx) > 0:
            high_energy = np.sum(stft[high_freq_idx, :])
            total_energy = np.sum(stft) + 1e-9
            high_freq_ratio = float(high_energy / total_energy)
        else:
            high_freq_ratio = 0.0

        return {
            "duration_seconds": round(duration, 2),
            "sample_rate": sr,
            "spectral_centroid_mean": round(cent_mean, 2),
            "spectral_centroid_std": round(cent_std, 2),
            "spectral_rolloff_mean": round(rolloff_mean, 2),
            "spectral_rolloff_std": round(rolloff_std, 2),
            "spectral_bandwidth_mean": round(bw_mean, 2),
            "spectral_flatness_mean": round(flatness_mean, 5),
            "zero_crossing_rate_mean": round(zcr_mean, 4),
            "zero_crossing_rate_std": round(zcr_std, 4),
            "harmonic_percussive_ratio": round(hp_ratio, 3),
            "pitch_jitter": round(pitch_jitter, 5),
            "f0_mean_hz": round(f0_mean, 1),
            "high_freq_ratio": round(high_freq_ratio, 4),
            "mfcc_summary": {
                "c0_energy": round(mfcc_mean[0], 2),
                "c1_spectral_slope": round(mfcc_mean[1], 2),
                "c2_formant": round(mfcc_mean[2], 2),
                "higher_coefficients_variance": round(float(np.mean(mfcc_std[4:])), 2),
            },
        }

    def generate_spectrogram_image(self, y: np.ndarray, sr: int, output_path: str) -> str:
        """Generates a normalized Mel-Spectrogram grayscale/colormap image without matplotlib overhead."""
        S = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
        S_dB = librosa.power_to_db(S, ref=np.max)

        # Normalize to 0-255 uint8
        norm = np.clip((S_dB + 80) / 80.0, 0, 1)
        # Flip vertically so low frequencies are at bottom
        norm = np.flipud(norm)
        img_array = (norm * 255).astype(np.uint8)

        # Colorize using a custom cyber colormap (dark slate to electric cyan)
        r = np.clip(img_array * 0.1, 0, 255).astype(np.uint8)
        g = np.clip(img_array * 0.85 + 20, 0, 255).astype(np.uint8)
        b = np.clip(img_array * 1.0, 0, 255).astype(np.uint8)
        rgb_array = np.dstack((r, g, b))

        img = Image.fromarray(rgb_array)
        img = img.resize((600, 200), Image.Resampling.BILINEAR)
        img.save(output_path, format="PNG")
        return output_path
