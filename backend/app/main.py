import sys
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI

logging.basicConfig(stream=sys.stdout, level=logging.DEBUG)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting app...")
    try:
        # your startup logic here
        pass
    except Exception:
        logger.exception("Startup failed")
        raise
    yield
    logger.info("Shutting down")

app = FastAPI(lifespan=lifespan)

# CORS – single instance
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

# Static files
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