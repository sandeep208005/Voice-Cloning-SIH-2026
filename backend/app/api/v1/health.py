import os
import time
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.db.session import get_db
from app.core.config import settings

router = APIRouter()
START_TIME = time.time()


@router.get("")
def health_check(db: Session = Depends(get_db)):
    """System health verification endpoint."""
    # Check DB
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    # Check storage
    storage_writable = os.access(settings.STORAGE_DIR, os.W_OK)

    return {
        "status": "healthy" if db_status == "healthy" and storage_writable else "degraded",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": db_status,
        "storage_writable": storage_writable,
        "uptime_seconds": round(time.time() - START_TIME, 2),
    }
