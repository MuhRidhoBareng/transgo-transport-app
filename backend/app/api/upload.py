"""
Upload API Routes
Endpoint untuk upload file (foto profil).
"""

import os
import uuid
import shutil

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.api.deps import get_current_user

router = APIRouter(prefix="/api/upload", tags=["Upload"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "avatars")
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
MAX_SIZE = 5 * 1024 * 1024  # 5MB


@router.post("/avatar", response_model=UserResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Upload foto profil user."""
    # Validate extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Format file tidak didukung. Gunakan: {', '.join(ALLOWED_EXTENSIONS)}")

    # Read and validate size
    contents = await file.read()
    if len(contents) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="Ukuran file maksimal 5MB")

    # Create dir
    os.makedirs(UPLOAD_DIR, exist_ok=True)

    # Delete old avatar if exists
    if user.avatar_url:
        old_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), user.avatar_url.lstrip("/"))
        if os.path.exists(old_path):
            os.remove(old_path)

    # Save file
    filename = f"{user.id}_{uuid.uuid4().hex[:8]}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(contents)

    # Update user
    user.avatar_url = f"/uploads/avatars/{filename}"
    await db.commit()
    await db.refresh(user)

    return UserResponse.model_validate(user)
