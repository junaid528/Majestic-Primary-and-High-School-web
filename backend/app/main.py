from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
import time

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import get_db, engine, SessionLocal
from app.models.base import Base
from app.models.enums import UserRole
from app.models.models import User
import app.models.models as _models
import app.models.future_models as _future_models
from app.api.v1.api import api_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set CORS origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_headers=["*"],
    allow_methods=["*"],
)

# Mount central REST API router
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup() -> None:
    """
    Ensure all SQLAlchemy models are loaded, tables are created, and
    the default Super Admin account exists before handling requests.
    """
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.email == "majestichps@gmail.com").first()
        if not existing_admin:
            admin_user = User(
                name="Super Admin",
                email="majestichps@gmail.com",
                password_hash=get_password_hash("admin123"),
                role=UserRole.SUPER_ADMIN,
                status="Active"
            )
            db.add(admin_user)
            db.commit()
    finally:
        db.close()

START_TIME = time.time()

# -------------------------------------------------------------
# 🌐 HEALTH & SYSTEM MONITORING CONFORMING TO SPECIFICATIONS
# -------------------------------------------------------------

@app.get("/api/health", tags=["system"])
def check_health(db: Session = Depends(get_db)):
    """
    Standard deployment verification and uptime diagnostic.
    Checks database connection viability.
    """
    try:
        # Simple query to verify engine connectivity
        db.execute("SELECT 1")
        database_active = True
    except Exception as e:
        database_active = False

    return {
        "status": "healthy" if database_active else "degraded",
        "database": "online" if database_active else "offline",
        "timestamp": time.time()
    }


@app.get("/api/version", tags=["system"])
def check_version():
    """
    Exposes software release version labels.
    """
    return {
        "version": "1.0.0-rc1",
        "codename": "Majestic-Phoenix-Python",
        "academic_year": "2026-2027"
    }


@app.get("/api/status", tags=["system"])
def check_status(db: Session = Depends(get_db)):
    """
    Tracks application load parameters and connection vitality metrics.
    """
    uptime_sec = time.time() - START_TIME
    
    # Calculate connection count or pool summary if available
    return {
        "ok": True,
        "uptime_seconds": int(uptime_sec),
        "workers": 1,
        "active_connections": engine.pool.checkedout(),
        "total_pool_size": engine.pool.size()
    }
