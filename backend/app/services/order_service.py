"""
Order Service
Business logic untuk pesanan ojek dan kurir.
"""

import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import select, func, or_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.order import Order, OrderStatus, ServiceType
from app.models.user import User
from app.services.pricing_service import PricingService
from app.services.matching_service import MatchingService
from app.services.firebase_service import FirebaseService
from app.schemas.order import CreateOrderRequest


class OrderService:
    """Service untuk manajemen pesanan ojek dan kurir."""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_order(
        self, passenger: User, data: CreateOrderRequest
    ) -> Order:
        """
        Buat pesanan baru (ojek atau kurir).
        1. Kalkulasi harga via PricingService
        2. Simpan ke database
        3. Cari driver terdekat via MatchingService
        4. Broadcast ke Firebase
        """
        # Validasi kurir fields
        if data.service_type == ServiceType.KURIR:
            if not data.recipient_name or not data.recipient_phone:
                raise ValueError("Nama dan nomor HP penerima wajib diisi untuk layanan kurir")

        # Kalkulasi harga
        estimate = await PricingService.estimate_fare(
            service_type=data.service_type,
            pickup_lat=data.pickup_lat,
            pickup_lng=data.pickup_lng,
            dest_lat=data.destination_lat,
            dest_lng=data.destination_lng,
            item_weight_kg=data.item_weight_kg,
        )

        # Buat order
        order = Order(
            service_type=data.service_type,
            passenger_id=passenger.id,
            pickup_address=data.pickup_address,
            pickup_lat=data.pickup_lat,
            pickup_lng=data.pickup_lng,
            destination_address=data.destination_address,
            dest_lat=data.destination_lat,
            dest_lng=data.destination_lng,
            distance_km=estimate["distance_km"],
            fare=Decimal(str(estimate["fare"])),
            status=OrderStatus.MENCARI,
            # Kurir fields
            item_description=data.item_description,
            item_weight_kg=data.item_weight_kg,
            recipient_name=data.recipient_name,
            recipient_phone=data.recipient_phone,
        )
        self.db.add(order)
        await self.db.commit()
        await self.db.refresh(order)

        # Cari driver terdekat
        nearby_drivers = MatchingService.find_nearby_drivers(
            data.pickup_lat, data.pickup_lng
        )

        # Broadcast ke Firebase
        if nearby_drivers:
            MatchingService.broadcast_to_drivers(
                order_id=str(order.id),
                service_type=data.service_type.value,
                passenger_name=passenger.name,
                pickup={
                    "lat": data.pickup_lat,
                    "lng": data.pickup_lng,
                    "address": data.pickup_address,
                },
                destination={
                    "lat": data.destination_lat,
                    "lng": data.destination_lng,
                    "address": data.destination_address,
                },
                fare=estimate["fare"],
                nearby_drivers=nearby_drivers,
                item_description=data.item_description,
            )

        return order

    async def accept_order(
        self, order_id: uuid.UUID, driver: User
    ) -> Order:
        """Pengemudi menerima pesanan."""
        order = await self._get_order(order_id)

        if order.status != OrderStatus.MENCARI:
            raise ValueError("Pesanan sudah diterima atau dibatalkan")

        order.driver_id = driver.id
        order.status = OrderStatus.DITERIMA
        order.accepted_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(order)

        # Hapus broadcast, buat active ride/delivery di Firebase
        FirebaseService.remove_broadcast(str(order.id))
        FirebaseService.create_active_ride(
            order_id=str(order.id),
            driver_id=str(driver.id),
            driver_lat=0,
            driver_lng=0,
        )

        return order

    async def start_ride(self, order_id: uuid.UUID, driver_id: uuid.UUID) -> Order:
        """Mulai perjalanan/pengiriman (penumpang naik / barang diambil)."""
        order = await self._get_order(order_id)

        if order.status != OrderStatus.DITERIMA:
            raise ValueError("Pesanan belum diterima atau sudah berjalan")
        if order.driver_id != driver_id:
            raise ValueError("Anda bukan pengemudi pesanan ini")

        order.status = OrderStatus.BERJALAN
        await self.db.commit()
        await self.db.refresh(order)

        FirebaseService.update_ride_status(str(order.id), "berjalan")
        return order

    async def complete_order(
        self, order_id: uuid.UUID, driver_id: uuid.UUID
    ) -> Order:
        """
        Selesaikan pesanan (sampai tujuan / barang diterima).
        """
        order = await self._get_order(order_id)

        if order.status != OrderStatus.BERJALAN:
            raise ValueError("Perjalanan/pengiriman belum dimulai")
        if order.driver_id != driver_id:
            raise ValueError("Anda bukan pengemudi pesanan ini")

        order.status = OrderStatus.SELESAI
        order.completed_at = datetime.now(timezone.utc)
        await self.db.commit()
        await self.db.refresh(order)

        # Cleanup Firebase
        FirebaseService.remove_active_ride(str(order.id))
        return order

    async def cancel_order(
        self, order_id: uuid.UUID, user_id: uuid.UUID
    ) -> Order:
        """Batalkan pesanan."""
        order = await self._get_order(order_id)

        if order.status in (OrderStatus.SELESAI, OrderStatus.DIBATALKAN):
            raise ValueError("Pesanan sudah selesai atau dibatalkan")
        if order.passenger_id != user_id and order.driver_id != user_id:
            raise ValueError("Anda tidak berhak membatalkan pesanan ini")

        order.status = OrderStatus.DIBATALKAN
        await self.db.commit()
        await self.db.refresh(order)

        FirebaseService.remove_broadcast(str(order.id))
        FirebaseService.remove_active_ride(str(order.id))
        return order

    async def get_active_order(self, user_id: uuid.UUID) -> Order | None:
        """Ambil pesanan aktif user."""
        result = await self.db.execute(
            select(Order)
            .options(selectinload(Order.driver), selectinload(Order.passenger))
            .where(
                or_(Order.passenger_id == user_id, Order.driver_id == user_id),
                Order.status.in_([
                    OrderStatus.MENCARI,
                    OrderStatus.DITERIMA,
                    OrderStatus.BERJALAN,
                ]),
            ).order_by(Order.created_at.desc())
        )
        return result.scalar_one_or_none()

    async def get_order_history(
        self,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
        service_type: ServiceType | None = None,
    ) -> tuple[list[Order], int]:
        """Ambil riwayat pesanan (bisa filter per layanan)."""
        base_filter = or_(Order.passenger_id == user_id, Order.driver_id == user_id)
        conditions = [base_filter]
        if service_type:
            conditions.append(Order.service_type == service_type)

        count_result = await self.db.execute(
            select(func.count(Order.id)).where(*conditions)
        )
        total = count_result.scalar()

        result = await self.db.execute(
            select(Order)
            .where(*conditions)
            .order_by(Order.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        orders = list(result.scalars().all())
        return orders, total

    async def get_all_orders(
        self,
        page: int = 1,
        per_page: int = 20,
        status: OrderStatus | None = None,
        service_type: ServiceType | None = None,
    ) -> tuple[list[Order], int]:
        """Admin: ambil semua pesanan."""
        conditions = []
        if status:
            conditions.append(Order.status == status)
        if service_type:
            conditions.append(Order.service_type == service_type)

        count_query = select(func.count(Order.id))
        data_query = select(Order)

        if conditions:
            count_query = count_query.where(*conditions)
            data_query = data_query.where(*conditions)

        count_result = await self.db.execute(count_query)
        total = count_result.scalar()

        result = await self.db.execute(
            data_query
            .order_by(Order.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        orders = list(result.scalars().all())
        return orders, total

    async def _get_order(self, order_id: uuid.UUID) -> Order:
        """Helper: ambil order atau raise error."""
        result = await self.db.execute(
            select(Order).where(Order.id == order_id)
        )
        order = result.scalar_one_or_none()
        if not order:
            raise ValueError("Pesanan tidak ditemukan")
        return order
