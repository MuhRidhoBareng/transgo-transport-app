"""
Auth API Routes
Endpoint untuk registrasi dan login.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import (
    RegisterRequest, LoginRequest, TokenResponse, UserResponse, UserUpdateRequest
)
from app.services.auth_service import AuthService
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/auth", tags=["Auth"])


@router.post("/register", response_model=TokenResponse)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    """Registrasi akun baru (penumpang/pengemudi)."""
    try:
        auth_service = AuthService(db)
        return await auth_service.register(data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Login dengan email/phone + PIN."""
    try:
        auth_service = AuthService(db)
        return await auth_service.login(data)
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def get_me(user: User = Depends(get_current_user)):
    """Ambil profil user saat ini."""
    return UserResponse.model_validate(user)


@router.put("/profile", response_model=UserResponse)
async def update_profile(
    data: UserUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Update profil user (nama, phone)."""
    if data.name is not None:
        user.name = data.name
    if data.phone is not None:
        user.phone = data.phone
    await db.commit()
    await db.refresh(user)
    return UserResponse.model_validate(user)
