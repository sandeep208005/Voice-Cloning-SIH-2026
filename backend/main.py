import os
import time
from typing import Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.session import engine
from app.models import Base
from app.api.v1 import api_router
from app.api.v1.realtime import router as realtime_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events."""
    # Initialize database tables
    Base.metadata.create_all(bind=engine)
    os.makedirs(settings.STORAGE_DIR, exist_ok=True)
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Multimodal AI platform for real-time detection of synthetic voice clones, image manipulation, and video deepfakes.",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for forensic spectrogram preview
if os.path.exists(settings.STORAGE_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.STORAGE_DIR), name="uploads")

# Mount WebSocket routes at root (/ws/realtime)
app.include_router(realtime_router)

# Mount API routes (/api/v1)
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.post("/api/detect/image")
async def detect_image_standalone(
    image: Optional[UploadFile] = File(None),
    file: Optional[UploadFile] = File(None),
):
    """
    Direct Real-Time Image Detection Inference Endpoint
    Accepts multipart/form-data with 'image' or 'file' field.
    Returns mathematically calibrated probability, classification, risk, and model metadata.
    """
    upload = image or file
    if upload is None:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"status": "error", "detail": "No image file provided in multipart payload."}
        )

    # Validate file extension
    valid_exts = {".jpg", ".jpeg", ".png", ".webp"}
    ext = os.path.splitext(upload.filename or "")[1].lower()
    if ext not in valid_exts:
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"status": "error", "detail": f"Unsupported image extension '{ext}'. Expected {valid_exts}"}
        )

    from app.ai.image.detector import DeepShieldVisionDetector
    detector = DeepShieldVisionDetector()
    if not detector.model_ready:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"status": "error", "detail": "MODEL NOT READY: Model checkpoint is missing or corrupted."}
        )

    # Save to temp location
    temp_dir = os.path.join(settings.STORAGE_DIR, "temp")
    os.makedirs(temp_dir, exist_ok=True)
    temp_path = os.path.join(temp_dir, f"detect_{int(time.time() * 1000)}_{upload.filename}")

    try:
        content = await upload.read()
        with open(temp_path, "wb") as f:
            f.write(content)

        result = detector.analyze(temp_path)
        return {
            "status": result["status"],
            "classification": result["classification"],
            "synthetic_probability": result["synthetic_probability"],
            "real_probability": result["real_probability"],
            "calibrated": result["calibrated"],
            "confidence": result["confidence"],
            "risk_level": result["risk_level"],
            "threshold": result["threshold"],
            "model_name": result["model_name"],
            "model_version": result["model_version"],
            "processing_time_ms": result["processing_time_ms"],
            "gradcam_heatmap": result.get("gradcam_heatmap"),
            "summary_explanation": result.get("summary_explanation"),
            "production_safety_notice": result.get("production_safety_notice"),
            "limitations": result.get("limitations")
        }
    finally:
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception:
                pass


@app.get("/")
def root():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health",
        "detect_image_endpoint": "/api/detect/image",
        "dashboard_stats": f"{settings.API_V1_STR}/dashboard/statistics",
    }


# Secure error handler avoiding internal stack trace leakage
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # Log exception internally
    print(f"[SECURITY ALERT] Unhandled exception on {request.url.path}: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal forensic processing anomaly occurred. Please inspect system logs."},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
