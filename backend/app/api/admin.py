"""
Admin API Routes
Endpoint untuk dashboard admin.
"""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import select, func, delete as sa_delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.user import User, UserRole
from app.models.order import Order, OrderStatus, ServiceType
from app.schemas.user import UserResponse
from app.schemas.order import OrderResponse, OrderListResponse
from app.services.order_service import OrderService
from app.api.deps import get_admin
from app.utils.security import hash_pin

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class DriverStatusUpdate(BaseModel):
    """Request update status driver."""
    is_active: bool


class UserUpdateAdmin(BaseModel):
    """Request update user oleh admin."""
    name: str | None = Field(None, min_length=2, max_length=100)
    email: EmailStr | None = None
    phone: str | None = Field(None, min_length=10, max_length=20)
    pin: str | None = Field(None, min_length=4, max_length=6)
    is_active: bool | None = None
    vehicle_type: str | None = None
    vehicle_plate: str | None = None
    vehicle_color: str | None = None


class StatsResponse(BaseModel):
    """Response statistik dashboard."""
    total_drivers: int
    active_drivers: int
    total_passengers: int
    total_orders_today: int
    orders_ojek_today: int
    orders_kurir_today: int
    completed_today: int


# ======================== DRIVERS ========================

@router.get("/drivers", response_model=list[UserResponse])
async def list_drivers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Daftar semua pengemudi."""
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.PENGEMUDI)
        .order_by(User.created_at.desc())
    )
    drivers = result.scalars().all()
    return [UserResponse.model_validate(d) for d in drivers]


@router.put("/drivers/{driver_id}", response_model=UserResponse)
async def update_driver(
    driver_id: uuid.UUID,
    data: UserUpdateAdmin,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Edit data pengemudi."""
    result = await db.execute(
        select(User).where(User.id == driver_id, User.role == UserRole.PENGEMUDI)
    )
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Pengemudi tidak ditemukan")

    if data.name is not None: driver.name = data.name
    if data.email is not None: driver.email = data.email
    if data.phone is not None: driver.phone = data.phone
    if data.pin is not None: driver.pin_hash = hash_pin(data.pin)
    if data.is_active is not None: driver.is_active = data.is_active
    if data.vehicle_type is not None: driver.vehicle_type = data.vehicle_type
    if data.vehicle_plate is not None: driver.vehicle_plate = data.vehicle_plate
    if data.vehicle_color is not None: driver.vehicle_color = data.vehicle_color

    await db.commit()
    await db.refresh(driver)
    return UserResponse.model_validate(driver)


@router.put("/drivers/{driver_id}/status", response_model=UserResponse)
async def update_driver_status(
    driver_id: uuid.UUID,
    data: DriverStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Aktifkan atau suspend pengemudi."""
    result = await db.execute(
        select(User).where(User.id == driver_id, User.role == UserRole.PENGEMUDI)
    )
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Pengemudi tidak ditemukan")

    driver.is_active = data.is_active
    await db.commit()
    await db.refresh(driver)
    return UserResponse.model_validate(driver)


@router.delete("/drivers/{driver_id}")
async def delete_driver(
    driver_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Hapus akun pengemudi."""
    result = await db.execute(
        select(User).where(User.id == driver_id, User.role == UserRole.PENGEMUDI)
    )
    driver = result.scalar_one_or_none()
    if not driver:
        raise HTTPException(status_code=404, detail="Pengemudi tidak ditemukan")

    await db.delete(driver)
    await db.commit()
    return {"detail": "Pengemudi berhasil dihapus"}


# ======================== PASSENGERS ========================

@router.get("/passengers", response_model=list[UserResponse])
async def list_passengers(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Daftar semua penumpang."""
    result = await db.execute(
        select(User)
        .where(User.role == UserRole.PENUMPANG)
        .order_by(User.created_at.desc())
    )
    passengers = result.scalars().all()
    return [UserResponse.model_validate(p) for p in passengers]


@router.put("/passengers/{passenger_id}", response_model=UserResponse)
async def update_passenger(
    passenger_id: uuid.UUID,
    data: UserUpdateAdmin,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Edit data penumpang."""
    result = await db.execute(
        select(User).where(User.id == passenger_id, User.role == UserRole.PENUMPANG)
    )
    passenger = result.scalar_one_or_none()
    if not passenger:
        raise HTTPException(status_code=404, detail="Penumpang tidak ditemukan")

    if data.name is not None: passenger.name = data.name
    if data.email is not None: passenger.email = data.email
    if data.phone is not None: passenger.phone = data.phone
    if data.pin is not None: passenger.pin_hash = hash_pin(data.pin)
    if data.is_active is not None: passenger.is_active = data.is_active

    await db.commit()
    await db.refresh(passenger)
    return UserResponse.model_validate(passenger)


@router.put("/passengers/{passenger_id}/status", response_model=UserResponse)
async def update_passenger_status(
    passenger_id: uuid.UUID,
    data: DriverStatusUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Aktifkan atau suspend penumpang."""
    result = await db.execute(
        select(User).where(User.id == passenger_id, User.role == UserRole.PENUMPANG)
    )
    passenger = result.scalar_one_or_none()
    if not passenger:
        raise HTTPException(status_code=404, detail="Penumpang tidak ditemukan")

    passenger.is_active = data.is_active
    await db.commit()
    await db.refresh(passenger)
    return UserResponse.model_validate(passenger)


@router.delete("/passengers/{passenger_id}")
async def delete_passenger(
    passenger_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Hapus akun penumpang."""
    result = await db.execute(
        select(User).where(User.id == passenger_id, User.role == UserRole.PENUMPANG)
    )
    passenger = result.scalar_one_or_none()
    if not passenger:
        raise HTTPException(status_code=404, detail="Penumpang tidak ditemukan")

    await db.delete(passenger)
    await db.commit()
    return {"detail": "Penumpang berhasil dihapus"}


@router.get("/orders", response_model=OrderListResponse)
async def list_orders(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    status: OrderStatus | None = None,
    service_type: ServiceType | None = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Monitor semua pesanan (filter by status/layanan)."""
    order_service = OrderService(db)
    orders, total = await order_service.get_all_orders(
        page, per_page, status, service_type
    )
    return OrderListResponse(
        orders=[OrderResponse.model_validate(o) for o in orders],
        total=total,
        page=page,
        per_page=per_page,
    )


@router.get("/stats", response_model=StatsResponse)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_admin),
):
    """Statistik dashboard admin."""
    from datetime import datetime, timezone, timedelta

    today_start = datetime.now(timezone.utc).replace(
        hour=0, minute=0, second=0, microsecond=0
    )

    # Total drivers
    total_drivers = (await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.PENGEMUDI)
    )).scalar()

    # Active drivers
    active_drivers = (await db.execute(
        select(func.count(User.id)).where(
            User.role == UserRole.PENGEMUDI, User.is_active == True
        )
    )).scalar()

    # Total passengers
    total_passengers = (await db.execute(
        select(func.count(User.id)).where(User.role == UserRole.PENUMPANG)
    )).scalar()

    # Orders today
    today_filter = Order.created_at >= today_start

    total_orders_today = (await db.execute(
        select(func.count(Order.id)).where(today_filter)
    )).scalar()

    orders_ojek_today = (await db.execute(
        select(func.count(Order.id)).where(
            today_filter, Order.service_type == ServiceType.OJEK
        )
    )).scalar()

    orders_kurir_today = (await db.execute(
        select(func.count(Order.id)).where(
            today_filter, Order.service_type == ServiceType.KURIR
        )
    )).scalar()

    completed_today = (await db.execute(
        select(func.count(Order.id)).where(
            today_filter, Order.status == OrderStatus.SELESAI
        )
    )).scalar()

    return StatsResponse(
        total_drivers=total_drivers or 0,
        active_drivers=active_drivers or 0,
        total_passengers=total_passengers or 0,
        total_orders_today=total_orders_today or 0,
        orders_ojek_today=orders_ojek_today or 0,
        orders_kurir_today=orders_kurir_today or 0,
        completed_today=completed_today or 0,
    )
