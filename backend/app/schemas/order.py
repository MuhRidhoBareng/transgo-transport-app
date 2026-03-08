"""
Order Schemas
Pydantic models untuk request/response pesanan ojek dan kurir.
"""

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field

from app.models.order import OrderStatus, ServiceType


# === Estimation ===

class FareEstimateRequest(BaseModel):
    """Request untuk estimasi tarif."""
    service_type: ServiceType = Field(..., examples=[ServiceType.OJEK])
    pickup_lat: float = Field(..., ge=-90, le=90, examples=[-6.2788])
    pickup_lng: float = Field(..., ge=-180, le=180, examples=[106.7105])
    destination_lat: float = Field(..., ge=-90, le=90, examples=[-6.3010])
    destination_lng: float = Field(..., ge=-180, le=180, examples=[106.7300])
    item_weight_kg: float | None = Field(None, ge=0, le=100, description="Berat barang (khusus kurir)")


class FareEstimateResponse(BaseModel):
    """Response estimasi tarif."""
    service_type: ServiceType
    distance_km: float
    duration_minutes: float | None = None
    fare: int
    breakdown: dict


# === Create Order ===

class CreateOrderRequest(BaseModel):
    """Request untuk membuat pesanan baru."""
    service_type: ServiceType = Field(..., examples=[ServiceType.OJEK])
    pickup_address: str = Field(..., max_length=500, examples=["Bintaro Plaza"])
    pickup_lat: float = Field(..., ge=-90, le=90)
    pickup_lng: float = Field(..., ge=-180, le=180)
    destination_address: str = Field(..., max_length=500, examples=["Universitas Budi Luhur"])
    destination_lat: float = Field(..., ge=-90, le=90)
    destination_lng: float = Field(..., ge=-180, le=180)

    # Khusus kurir
    item_description: str | None = Field(None, max_length=500, examples=["Dokumen penting"])
    item_weight_kg: float | None = Field(None, ge=0, le=100)
    recipient_name: str | None = Field(None, max_length=100, examples=["Budi"])
    recipient_phone: str | None = Field(None, max_length=20, examples=["081234567890"])


# === Response ===

class OrderResponse(BaseModel):
    """Response data pesanan."""
    id: uuid.UUID
    service_type: ServiceType
    passenger_id: uuid.UUID
    driver_id: uuid.UUID | None = None
    pickup_address: str
    pickup_lat: float
    pickup_lng: float
    destination_address: str
    dest_lat: float
    dest_lng: float
    distance_km: float
    fare: Decimal
    status: OrderStatus
    # Kurir fields
    item_description: str | None = None
    item_weight_kg: float | None = None
    recipient_name: str | None = None
    recipient_phone: str | None = None
    # Timestamps
    created_at: datetime
    accepted_at: datetime | None = None
    completed_at: datetime | None = None
    # From relationships
    passenger_name: str | None = None
    passenger_phone: str | None = None
    passenger_avatar_url: str | None = None
    driver_name: str | None = None
    driver_phone: str | None = None
    driver_avatar_url: str | None = None
    driver_vehicle_type: str | None = None
    driver_vehicle_plate: str | None = None
    driver_vehicle_color: str | None = None

    model_config = {"from_attributes": True}


class OrderListResponse(BaseModel):
    """Response daftar pesanan dengan pagination."""
    orders: list[OrderResponse]
    total: int
    page: int
    per_page: int
