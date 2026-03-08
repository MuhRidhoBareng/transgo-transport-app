"""
Order Model
Tabel orders - mencatat riwayat perjalanan dan pengiriman.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import Enum as PyEnum

from sqlalchemy import String, Float, DateTime, Enum, ForeignKey, Numeric, Text, func, Uuid
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ServiceType(str, PyEnum):
    """Jenis layanan."""
    OJEK = "ojek"
    KURIR = "kurir"


class OrderStatus(str, PyEnum):
    """Status pesanan."""
    MENCARI = "mencari"
    DITERIMA = "diterima"
    BERJALAN = "berjalan"
    SELESAI = "selesai"
    DIBATALKAN = "dibatalkan"


class Order(Base):
    """Model untuk tabel orders."""

    __tablename__ = "orders"

    id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        primary_key=True,
        default=uuid.uuid4,
    )

    # Jenis layanan
    service_type: Mapped[ServiceType] = mapped_column(
        Enum(ServiceType, name="service_type"),
        nullable=False,
        default=ServiceType.OJEK,
    )

    # Relasi user
    passenger_id: Mapped[uuid.UUID] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    driver_id: Mapped[uuid.UUID | None] = mapped_column(
        Uuid,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Lokasi jemput
    pickup_address: Mapped[str] = mapped_column(String(500), nullable=False)
    pickup_lat: Mapped[float] = mapped_column(Float, nullable=False)
    pickup_lng: Mapped[float] = mapped_column(Float, nullable=False)

    # Lokasi tujuan
    destination_address: Mapped[str] = mapped_column(String(500), nullable=False)
    dest_lat: Mapped[float] = mapped_column(Float, nullable=False)
    dest_lng: Mapped[float] = mapped_column(Float, nullable=False)

    # Tarif
    distance_km: Mapped[float] = mapped_column(Float, nullable=False)
    fare: Mapped[Decimal] = mapped_column(
        Numeric(precision=12, scale=2),
        nullable=False,
    )

    # Status
    status: Mapped[OrderStatus] = mapped_column(
        Enum(OrderStatus, name="order_status"),
        default=OrderStatus.MENCARI,
    )

    # === Field khusus KURIR ===
    item_description: Mapped[str | None] = mapped_column(
        String(500), nullable=True,
        comment="Deskripsi barang (khusus kurir)",
    )
    item_weight_kg: Mapped[float | None] = mapped_column(
        Float, nullable=True,
        comment="Berat barang dalam KG (opsional)",
    )
    recipient_name: Mapped[str | None] = mapped_column(
        String(100), nullable=True,
        comment="Nama penerima (khusus kurir)",
    )
    recipient_phone: Mapped[str | None] = mapped_column(
        String(20), nullable=True,
        comment="No HP penerima (khusus kurir)",
    )

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    accepted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    passenger = relationship(
        "User",
        back_populates="orders_as_passenger",
        foreign_keys=[passenger_id],
    )
    driver = relationship(
        "User",
        back_populates="orders_as_driver",
        foreign_keys=[driver_id],
    )

    def __repr__(self) -> str:
        return f"<Order {self.id} type={self.service_type.value} status={self.status.value}>"
