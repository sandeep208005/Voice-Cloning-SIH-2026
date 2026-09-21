from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.analyses import router as analyses_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.verification import router as verification_router
from app.api.v1.models_status import router as models_router
from app.api.v1.health import router as health_router
from app.api.v1.realtime import router as realtime_router

api_router = APIRouter()

api_router.include_router(auth_router, prefix="/auth", tags=["Authentication"])
api_router.include_router(analyses_router, prefix="/analyses", tags=["Forensic Analyses"])
api_router.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])
api_router.include_router(verification_router, prefix="/verification", tags=["Challenge Verification"])
api_router.include_router(models_router, prefix="/models", tags=["Model Provenance"])
api_router.include_router(health_router, prefix="/health", tags=["Health"])
api_router.include_router(realtime_router, prefix="", tags=["Real-time Streaming"])
