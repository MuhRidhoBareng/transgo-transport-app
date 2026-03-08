"""
Auth Dependencies
FastAPI dependency injection untuk autentikasi JWT.
"""

import uuid

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.services.auth_service import AuthService
from app.utils.security import decode_access_token

security_scheme = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """Ambil user saat ini dari JWT token."""
    payload = decode_access_token(credentials.credentials)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid atau sudah expired",
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token tidak valid",
        )

    auth_service = AuthService(db)
    user = await auth_service.get_user_by_id(uuid.UUID(user_id))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User tidak ditemukan",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda dinonaktifkan",
        )
    return user


async def require_role(*roles: UserRole):
    """Factory untuk membatasi akses berdasarkan role."""
    async def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Anda tidak memiliki akses untuk ini",
            )
        return user
    return _check


async def get_passenger(user: User = Depends(get_current_user)) -> User:
    """Hanya penumpang yang bisa akses."""
    if user.role != UserRole.PENUMPANG:
        raise HTTPException(status_code=403, detail="Hanya penumpang yang bisa akses")
    return user


async def get_driver(user: User = Depends(get_current_user)) -> User:
    """Hanya pengemudi yang bisa akses."""
    if user.role != UserRole.PENGEMUDI:
        raise HTTPException(status_code=403, detail="Hanya pengemudi yang bisa akses")
    return user


async def get_admin(user: User = Depends(get_current_user)) -> User:
    """Hanya admin yang bisa akses."""
    if user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Hanya admin yang bisa akses")
    return user
