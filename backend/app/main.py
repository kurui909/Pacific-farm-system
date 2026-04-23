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
except Exception as e:
    print("=" * 80)
    print("CRITICAL: Failed to import required modules during startup")
    print("=" * 80)
    import traceback
    traceback.print_exc()
    sys.exit(1)

# Setup logging
logging.basicConfig(
    stream=sys.stdout,
    level=logging.INFO,   # Use INFO in production (DEBUG is too noisy)
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up SmartPoultry API...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified/created.")
    except Exception as e:
        logger.exception("FATAL: Application startup failed due to an exception.")
        raise
    yield
    logger.info("Shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# CORS configuration - now dynamic from settings
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (uploads) - ensure directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include all routers
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

app.include_router(farms.router, prefix=f"{settings.API_V1_STR}/farms", tags=["farms"])

@app.get("/")
async def root():
    return {"message": "SmartPoultry API"}

# Optional: health check endpoint for Railway
@app.get("/health")
async def health():
    return {"status": "ok"}