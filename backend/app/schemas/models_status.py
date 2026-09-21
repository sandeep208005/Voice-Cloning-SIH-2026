from typing import List, Dict, Any
from pydantic import BaseModel


class ModelInfo(BaseModel):
    name: str
    version: str
    media_type: str
    status: str  # online, loaded, unconfigured
    device: str
    features_extracted: List[str]
    description: str


class SystemHealthResponse(BaseModel):
    status: str
    database: str
    storage_writable: bool
    version: str
    uptime_seconds: float
    models: List[ModelInfo]
