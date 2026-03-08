"""
Application Configuration
Menggunakan pydantic-settings untuk membaca environment variables.
"""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Konfigurasi aplikasi dari environment variables."""

    # App
    APP_NAME: str = "Transport MVP API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False

    # Database (PostgreSQL)
    DATABASE_URL: str = "postgresql+asyncpg://admin:password@localhost:5432/transport_mvp"

    # JWT Auth
    JWT_SECRET_KEY: str = "super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 1440  # 24 jam

    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"
    FIREBASE_DATABASE_URL: str = ""

    # Pricing
    BASE_FARE: int = 5000          # Rp 5.000 tarif dasar
    RATE_PER_KM: int = 4000        # Rp 4.000 per KM
    COMMISSION_PERCENT: float = 20.0  # 20% komisi

    # Matching
    MATCHING_RADIUS_KM: float = 3.0   # Radius pencarian driver (KM)
    ORDER_TIMEOUT_SECONDS: int = 60    # Timeout menunggu driver

    # OSRM
    OSRM_BASE_URL: str = "https://router.project-osrm.org"

    # CORS — accepts JSON string from env var or defaults to localhost
    CORS_ORIGINS: list[str] = [
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
    ]

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": True,
    }


@lru_cache()
def get_settings() -> Settings:
    """Cached settings instance."""
    return Settings()
