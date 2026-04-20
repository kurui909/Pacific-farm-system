from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from app.database import engine, Base
from app.config import settings
from app.routers import auth, users, pens, production, dashboard, analytics, eggs, feed, trays, reports, notifications, alerts, subscription, payments, blocks
from .routers.farms import router as farms_router

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include all routers with API prefix
for router in [auth, users, pens, production, dashboard, analytics, eggs, feed, trays, reports, notifications, alerts, subscription, payments, blocks]:
    app.include_router(router.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root():
    return {"message": "SmartPoultry API"}

from app.routers.subscription import router as subscription_router
app.include_router(subscription_router, prefix="/api/v1/subscription", tags=["subscription"])

app.include_router(farms_router, prefix="/farms", tags=["farms"])