import sys
import logging
import os
from contextlib import asynccontextmanager

# ------------------------------------------------------------------
# Top-level exception handler to catch import/startup errors
# ------------------------------------------------------------------
try:
    from fastapi import FastAPI
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.staticfiles import StaticFiles

    from app.database import engine, Base
    from app.config import settings
    from app.routers import (
        auth, users, pens, production, dashboard, analytics,
        eggs, feed, trays, reports, notifications, alerts,
        subscription, payments, blocks, farms
    )
except Exception:
    print("=" * 80)
    print("CRITICAL: Failed to import required modules during startup")
    print("=" * 80)
    import traceback
    traceback.print_exc()
    sys.exit(1)

# ------------------------------------------------------------------
# Logging Configuration
# ------------------------------------------------------------------
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(name)s - %(message)s"
)
logger = logging.getLogger("smartpoultry")

# ------------------------------------------------------------------
# Lifespan (startup + shutdown)
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("🚀 Starting SmartPoultry API...")

    try:
        # ⚠️ Only auto-create tables in DEV
        if settings.ENVIRONMENT == "development":
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
            logger.info("✅ Database tables verified/created (DEV mode).")
        else:
            logger.info("ℹ️ Skipping auto table creation (production mode).")

    except Exception:
        logger.exception("❌ FATAL: Startup failed.")
        raise

    yield

    logger.info("🛑 Shutting down SmartPoultry API...")

# ------------------------------------------------------------------
# App Initialization
# ------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# ------------------------------------------------------------------
# CORS
# ------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Static Files (Uploads)
# ------------------------------------------------------------------
UPLOAD_DIR = settings.UPLOAD_DIR or "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount(
    "/uploads",
    StaticFiles(directory=UPLOAD_DIR),
    name="uploads"
)

# ------------------------------------------------------------------
# Routers
# ------------------------------------------------------------------
routers_list = [
    auth, users, pens, production, dashboard, analytics,
    eggs, feed, trays, reports, notifications, alerts,
    subscription, payments, blocks
]

for router_module in routers_list:
    app.include_router(
        router_module.router,
        prefix=settings.API_V1_STR
    )

# Farms (separate tagging)
app.include_router(
    farms.router,
    prefix=f"{settings.API_V1_STR}/farms",
    tags=["farms"]
)

# ------------------------------------------------------------------
# Root & Health
# ------------------------------------------------------------------
@app.get("/")
async def root():
    return {
        "message": "SmartPoultry API",
        "version": settings.VERSION
    }

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "smartpoultry"
    }