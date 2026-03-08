"""
Seed Admin Script
Buat akun admin default untuk pertama kali.

Usage:
    python scripts/seed_admin.py
"""

import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.config import get_settings
from app.database import async_session_factory as async_session_maker, init_db
from app.models.user import User, UserRole
from app.utils.security import hash_pin


async def seed():
    settings = get_settings()
    await init_db()

    async with async_session_maker() as db:
        # Cek apakah admin sudah ada
        result = await db.execute(
            select(User).where(User.role == UserRole.ADMIN)
        )
        existing = result.scalar_one_or_none()

        if existing:
            print(f"⚠️  Admin sudah ada: {existing.email}")
            return

        admin = User(
            name="Admin TransGo",
            email="admin@transgo.id",
            phone="081000000000",
            pin_hash=hash_pin("123456"),
            role=UserRole.ADMIN,
            is_active=True,
        )
        db.add(admin)
        await db.commit()
        print(f"✅ Admin dibuat!")
        print(f"   Email: admin@transgo.id")
        print(f"   PIN:   123456")
        print(f"   ⚠️  Ganti PIN setelah login!")


if __name__ == "__main__":
    asyncio.run(seed())
