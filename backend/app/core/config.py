import os
from typing import List
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    ENVIRONMENT: str = "development"
    PROJECT_NAME: str = "DeepShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"

    # Security
    JWT_SECRET: str = "deepshield_secure_multimodal_forensic_jwt_secret_key_2026_x89f"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite:///./deepshield.db"
    POSTGRES_SERVER: str = ""
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = ""
    POSTGRES_PASSWORD: str = ""
    POSTGRES_DB: str = ""

    def get_database_uri(self) -> str:
        if self.DATABASE_URL and not self.DATABASE_URL.startswith("sqlite:///./deepshield.db"):
            return self.DATABASE_URL
        if self.POSTGRES_SERVER and self.POSTGRES_USER:
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        return self.DATABASE_URL

    # Storage & Uploads
    STORAGE_DIR: str = "./uploads"
    MAX_UPLOAD_SIZE_MB: int = 100

    # CORS
    CORS_ORIGINS: List[str] = [
        "*",
        "https://voice-cloning-nahk.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://localhost:4173",
    ]

    # Model paths
    AI_DEVICE: str = "cpu"
    MODEL_AUDIO_PATH: str = "models/audio/vocoder_artifact_detector.pkl"
    MODEL_IMAGE_PATH: str = "models/image/spatial_freq_detector.pkl"
    MODEL_VIDEO_PATH: str = "models/video/temporal_consistency_detector.pkl"

    # Allowed MIME types
    ALLOWED_AUDIO_MIMES: List[str] = [
        "audio/wav",
        "audio/x-wav",
        "audio/wave",
        "audio/mpeg",
        "audio/mp3",
        "audio/flac",
        "audio/x-flac",
        "audio/m4a",
        "audio/x-m4a",
        "audio/ogg",
        "audio/webm",
        "video/webm",
        "audio/mp4",
        "video/mp4",
    ]
    ALLOWED_IMAGE_MIMES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
    ]
    ALLOWED_VIDEO_MIMES: List[str] = [
        "video/mp4",
        "video/webm",
        "video/quicktime",
    ]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()

# Ensure storage directory exists
os.makedirs(settings.STORAGE_DIR, exist_ok=True)
