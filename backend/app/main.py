from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

# Import routers
from app.routers import (
    auth, users, pens, production, dashboard, analytics,
    eggs, feed, trays, reports, notifications, alerts,
    subscription, payments, blocks, farms
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting SmartPoultry API...")
    yield
    print("🛑 Shutting down SmartPoultry API...")

# Create FastAPI app
app = FastAPI(title="SmartPoultry API", version="1.0.0", lifespan=lifespan)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
app.include_router(users.router, prefix="/api/v1", tags=["users"])
app.include_router(pens.router, prefix="/api/v1", tags=["pens"])
app.include_router(production.router, prefix="/api/v1", tags=["production"])
app.include_router(dashboard.router, prefix="/api/v1", tags=["dashboard"])
app.include_router(analytics.router, prefix="/api/v1", tags=["analytics"])
app.include_router(eggs.router, prefix="/api/v1", tags=["eggs"])
app.include_router(feed.router, prefix="/api/v1", tags=["feed"])
app.include_router(trays.router, prefix="/api/v1", tags=["trays"])
app.include_router(reports.router, prefix="/api/v1", tags=["reports"])
app.include_router(notifications.router, prefix="/api/v1", tags=["notifications"])
app.include_router(alerts.router, prefix="/api/v1", tags=["alerts"])
app.include_router(subscription.router, prefix="/api/v1", tags=["subscription"])
app.include_router(payments.router, prefix="/api/v1", tags=["payments"])
app.include_router(blocks.router, prefix="/api/v1", tags=["blocks"])
app.include_router(farms.router, prefix="/api/v1", tags=["farms"])

@app.get("/")
def root():
    return {"message": "SmartPoultry API is running!"}