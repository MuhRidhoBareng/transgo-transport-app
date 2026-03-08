"""
Auth Service
Business logic untuk registrasi dan login.
"""

import uuid
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User, UserRole
from app.schemas.user import RegisterRequest, LoginRequest, TokenResponse, UserResponse
from app.utils.security import hash_pin, verify_pin, create_access_token


class AuthService:
    """Service untuk autentikasi pengguna."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def register(self, data: RegisterRequest) -> TokenResponse:
        """Registrasi user baru."""
        # Cek duplikat email/phone
        existing = await self.db.execute(
            select(User).where(
                or_(User.email == data.email, User.phone == data.phone)
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Email atau nomor HP sudah terdaftar")

        # Buat user
        user = User(
            name=data.name,
            email=data.email,
            phone=data.phone,
            pin_hash=hash_pin(data.pin),
            role=data.role,
            vehicle_type=data.vehicle_type,
            vehicle_plate=data.vehicle_plate,
            vehicle_color=data.vehicle_color,
        )
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)

        # Buat token
        token = create_access_token({
            "sub": str(user.id),
            "role": user.role.value,
        })

        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )

    async def login(self, data: LoginRequest) -> TokenResponse:
        """Login dengan email/phone + PIN."""
        result = await self.db.execute(
            select(User).where(
                or_(
                    User.email == data.identifier,
                    User.phone == data.identifier,
                )
            )
        )
        user = result.scalar_one_or_none()

        if not user or not verify_pin(data.pin, user.pin_hash):
            raise ValueError("Email/HP atau PIN salah")

        if not user.is_active:
            raise ValueError("Akun Anda dinonaktifkan")

        token = create_access_token({
            "sub": str(user.id),
            "role": user.role.value,
        })

        return TokenResponse(
            access_token=token,
            user=UserResponse.model_validate(user),
        )

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        """Ambil user berdasarkan ID."""
        result = await self.db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()
