import sys
import logging
import os
from contextlib import asynccontextmanager

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

# ------------------------------------------------------------------
# Setup logging to capture startup errors on Render
# ------------------------------------------------------------------
logging.basicConfig(
    stream=sys.stdout,
    level=logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# Lifespan context manager (replaces on_event)
# ------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):
    # --- Startup ---
    logger.info("Starting up SmartPoultry API...")
    try:
        # Create database tables (for development; use Alembic in production)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified/created.")
    except Exception as e:
        logger.exception("FATAL: Failed to initialize database")
        raise
    yield
    # --- Shutdown ---
    logger.info("Shutting down...")


# ------------------------------------------------------------------
# FastAPI application instance
# ------------------------------------------------------------------
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    lifespan=lifespan
)

# ------------------------------------------------------------------
# CORS configuration (single instance, using your origins)
# ------------------------------------------------------------------
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://192.168.1.133:3000",
    "http://192.168.1.133",
    "http://192.168.1.133:8000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ------------------------------------------------------------------
# Static files (uploads)
# ------------------------------------------------------------------
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ------------------------------------------------------------------
# Include all routers (subscription is included exactly once)
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

# Include farms router separately (absolute import used)
app.include_router(farms.router, prefix=f"{settings.API_V1_STR}/farms", tags=["farms"])

# ------------------------------------------------------------------
# Root endpoint
# ------------------------------------------------------------------
@app.get("/")
async def root():
    return {"message": "SmartPoultry API"}