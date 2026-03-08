"""
Orders API Routes
Endpoint untuk pesanan ojek dan kurir.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
import httpx

from app.database import get_db
from app.models.user import User
from app.models.order import Order, OrderStatus, ServiceType
from app.schemas.order import (
    FareEstimateRequest, FareEstimateResponse,
    CreateOrderRequest, OrderResponse, OrderListResponse,
)
from app.services.order_service import OrderService
from app.services.pricing_service import PricingService
from app.api.deps import get_current_user, get_passenger, get_driver

router = APIRouter(prefix="/api/orders", tags=["Orders"])


@router.post("/estimate", response_model=FareEstimateResponse)
async def estimate_fare(data: FareEstimateRequest):
    """Estimasi tarif (ojek atau kurir)."""
    result = await PricingService.estimate_fare(
        service_type=data.service_type,
        pickup_lat=data.pickup_lat,
        pickup_lng=data.pickup_lng,
        dest_lat=data.destination_lat,
        dest_lng=data.destination_lng,
        item_weight_kg=data.item_weight_kg,
    )
    return FareEstimateResponse(**result)


@router.post("", response_model=OrderResponse)
async def create_order(
    data: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_passenger),
):
    """Buat pesanan baru (ojek atau kurir)."""
    try:
        order_service = OrderService(db)
        order = await order_service.create_order(user, data)
        return _order_to_response(order, user.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/accept", response_model=OrderResponse)
async def accept_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_driver),
):
    """Pengemudi menerima pesanan."""
    try:
        order_service = OrderService(db)
        order = await order_service.accept_order(order_id, user)
        return _order_to_response(order, driver_name=user.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/start", response_model=OrderResponse)
async def start_ride(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_driver),
):
    """Mulai perjalanan/pengiriman."""
    try:
        order_service = OrderService(db)
        order = await order_service.start_ride(order_id, user.id)
        return _order_to_response(order, driver_name=user.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/complete", response_model=OrderResponse)
async def complete_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_driver),
):
    """Selesaikan perjalanan/pengiriman."""
    try:
        order_service = OrderService(db)
        order = await order_service.complete_order(order_id, user.id)
        return _order_to_response(order, driver_name=user.name)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{order_id}/cancel", response_model=OrderResponse)
async def cancel_order(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Batalkan pesanan (penumpang atau pengemudi)."""
    try:
        order_service = OrderService(db)
        order = await order_service.cancel_order(order_id, user.id)
        return _order_to_response(order)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/active", response_model=OrderResponse | None)
async def get_active_order(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Ambil pesanan aktif saat ini."""
    order_service = OrderService(db)
    order = await order_service.get_active_order(user.id)
    if not order:
        return None
    return _order_to_response(order)


@router.get("/history", response_model=OrderListResponse)
async def get_order_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    service_type: ServiceType | None = None,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Riwayat pesanan user (bisa filter per layanan)."""
    order_service = OrderService(db)
    orders, total = await order_service.get_order_history(
        user.id, page, per_page, service_type
    )
    return OrderListResponse(
        orders=[_order_to_response(o) for o in orders],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/pending")
async def get_pending_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_driver),
):
    """
    Ambil pesanan yang sedang mencari driver (untuk polling).
    Driver online memanggil endpoint ini setiap 3 detik.
    """
    result = await db.execute(
        select(Order).where(
            Order.status == OrderStatus.MENCARI,
            Order.driver_id.is_(None),
        ).order_by(Order.created_at.desc()).limit(5)
    )
    orders = list(result.scalars().all())
    if not orders:
        return []
    return [_order_to_response(o) for o in orders]


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order_detail(
    order_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Ambil detail pesanan."""
    order_service = OrderService(db)
    order = await order_service._get_order(order_id)
    return _order_to_response(order)


def _order_to_response(
    order,
    passenger_name: str | None = None,
    driver_name: str | None = None,
) -> OrderResponse:
    """Helper convert Order model to response."""
    data = OrderResponse.model_validate(order)
    if passenger_name:
        data.passenger_name = passenger_name
    if driver_name:
        data.driver_name = driver_name
    # Populate driver info from relationship if available
    try:
        if order.driver:
            data.driver_name = data.driver_name or order.driver.name
            data.driver_phone = order.driver.phone
            data.driver_avatar_url = order.driver.avatar_url
            data.driver_vehicle_type = order.driver.vehicle_type
            data.driver_vehicle_plate = order.driver.vehicle_plate
            data.driver_vehicle_color = order.driver.vehicle_color
    except Exception:
        pass
    # Populate passenger info from relationship if available
    try:
        if order.passenger:
            data.passenger_name = data.passenger_name or order.passenger.name
            data.passenger_phone = order.passenger.phone
            data.passenger_avatar_url = order.passenger.avatar_url
    except Exception:
        pass
    return data
