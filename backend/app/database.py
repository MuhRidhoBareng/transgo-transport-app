"""
Database Engine & Session
Async SQLAlchemy dengan aiomysql driver untuk MySQL.
Mendukung XAMPP (lokal) dan TiDB Serverless (cloud + SSL).
"""

import ssl as ssl_module
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase

from app.config import get_settings

settings = get_settings()

# Detect if cloud database (needs SSL)
_parsed = urlparse(settings.DATABASE_URL)
_is_cloud = "tidbcloud.com" in (_parsed.hostname or "") or "neon.tech" in (_parsed.hostname or "")

# Remove ssl params from URL (we handle SSL via connect_args)
_db_url = settings.DATABASE_URL.split("?")[0]

# Build connect_args with SSL if cloud
_connect_args = {}
if _is_cloud:
    _ssl_ctx = ssl_module.create_default_context()
    _ssl_ctx.check_hostname = True
    _ssl_ctx.verify_mode = ssl_module.CERT_REQUIRED
    _connect_args["ssl"] = _ssl_ctx

# Async engine
engine = create_async_engine(
    _db_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    connect_args=_connect_args,
)

# Session factory
async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class untuk semua model SQLAlchemy."""
    pass


async def get_db() -> AsyncSession:
    """Dependency injection untuk mendapatkan database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    """Inisialisasi database (create tables jika belum ada)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


async def close_db():
    """Tutup koneksi database."""
    await engine.dispose()
