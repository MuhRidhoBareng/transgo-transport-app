"""
User Schemas
Pydantic models untuk request/response user dan auth.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field

from app.models.user import UserRole


# === Auth Schemas ===

class RegisterRequest(BaseModel):
    """Request body untuk registrasi."""
    name: str = Field(..., min_length=2, max_length=100, examples=["Ahmad Fauzi"])
    email: EmailStr = Field(..., examples=["ahmad@email.com"])
    phone: str = Field(..., min_length=10, max_length=20, examples=["081234567890"])
    pin: str = Field(..., min_length=4, max_length=6, examples=["1234"])
    role: UserRole = Field(..., examples=[UserRole.PENUMPANG])
    # Vehicle info (pengemudi only)
    vehicle_type: str | None = Field(None, max_length=50, examples=["Honda Beat"])
    vehicle_plate: str | None = Field(None, max_length=20, examples=["B 1234 XYZ"])
    vehicle_color: str | None = Field(None, max_length=30, examples=["Hitam"])


class LoginRequest(BaseModel):
    """Request body untuk login (bisa pakai email atau phone)."""
    identifier: str = Field(..., description="Email atau nomor HP", examples=["ahmad@email.com"])
    pin: str = Field(..., min_length=4, max_length=6, examples=["1234"])


class TokenResponse(BaseModel):
    """Response setelah login berhasil."""
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# === User Schemas ===

class UserResponse(BaseModel):
    """Response data user."""
    id: uuid.UUID
    name: str
    email: str
    phone: str
    role: UserRole
    is_active: bool
    avatar_url: str | None = None
    vehicle_type: str | None = None
    vehicle_plate: str | None = None
    vehicle_color: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserUpdateRequest(BaseModel):
    """Request body untuk update profil."""
    name: str | None = Field(None, min_length=2, max_length=100)
    phone: str | None = Field(None, min_length=10, max_length=20)


# Rebuild untuk mengatasi forward reference
TokenResponse.model_rebuild()
