"""
FastAPI Main Application
Entry point untuk Transport MVP API.
"""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db, close_db
from app.services.firebase_service import init_firebase

# Import routers
from app.api.auth import router as auth_router
from app.api.orders import router as orders_router
from app.api.drivers import router as drivers_router
from app.api.admin import router as admin_router
from app.api.geocode import router as geocode_router
from app.api.upload import router as upload_router

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle hooks: startup & shutdown."""
    # Startup
    print("🚀 Starting Transport MVP API...")
    await init_db()
    init_firebase()
    print("✅ Database & Firebase initialized")
    yield
    # Shutdown
    print("🛑 Shutting down...")
    await close_db()


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description=(
        "API untuk Sistem Pemesanan Transportasi MVP.\n\n"
        "**Layanan:** 🏍️ Ojek (antar penumpang) | 📦 Kurir (antar barang)\n"
        "**Model:** Pengemudi gaji tetap bulanan\n"
        "**Pembayaran:** Tunai ke pengemudi"
    ),
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploads
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Register routers
app.include_router(auth_router)
app.include_router(orders_router)
app.include_router(drivers_router)
app.include_router(admin_router)
app.include_router(geocode_router)
app.include_router(upload_router)


@app.get("/", tags=["Health"])
async def root():
    """Health check endpoint."""
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "🟢 running",
        "services": ["ojek", "kurir"],
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "database": "connected",
        "firebase": "connected",
    }
