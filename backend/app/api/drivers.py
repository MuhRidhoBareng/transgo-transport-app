"""
Drivers API Routes
Endpoint untuk pengemudi (GPS, online/offline).
"""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.models.user import User
from app.services.firebase_service import FirebaseService
from app.api.deps import get_driver

router = APIRouter(prefix="/api/drivers", tags=["Drivers"])


class LocationUpdate(BaseModel):
    """Request body untuk update lokasi GPS."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class DriverStatusResponse(BaseModel):
    """Response status driver."""
    status: str
    message: str


@router.post("/online", response_model=DriverStatusResponse)
async def go_online(
    location: LocationUpdate,
    user: User = Depends(get_driver),
):
    """Pengemudi go online — mulai terima pesanan."""
    FirebaseService.update_driver_location(
        driver_id=str(user.id),
        lat=location.lat,
        lng=location.lng,
        name=user.name,
    )
    return DriverStatusResponse(status="online", message="Anda sekarang online dan siap menerima pesanan")


@router.post("/offline", response_model=DriverStatusResponse)
async def go_offline(user: User = Depends(get_driver)):
    """Pengemudi go offline — berhenti terima pesanan."""
    FirebaseService.remove_driver_location(str(user.id))
    return DriverStatusResponse(status="offline", message="Anda sekarang offline")


@router.put("/location", response_model=DriverStatusResponse)
async def update_location(
    location: LocationUpdate,
    user: User = Depends(get_driver),
):
    """Update lokasi GPS pengemudi (dipanggil setiap 5 detik)."""
    FirebaseService.update_driver_location(
        driver_id=str(user.id),
        lat=location.lat,
        lng=location.lng,
        name=user.name,
    )
    return DriverStatusResponse(status="ok", message="Lokasi diperbarui")
