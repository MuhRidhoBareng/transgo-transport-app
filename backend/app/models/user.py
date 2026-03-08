"""
User Model
Tabel users - menyimpan data penumpang, pengemudi, dan admin.
"""

import uuid
from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import String, Boolean, DateTime, Enum, func, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserRole(str, PyEnum):
    """Role pengguna."""
    PENUMPANG = "penumpang"
    PENGEMUDI = "pengemudi"
    ADMIN = "admin"


class User(Base):
    """Model untuk tabel users."""

    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    pin_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, name="user_role"),
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    # Vehicle info (pengemudi only)
    vehicle_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    vehicle_plate: Mapped[str | None] = mapped_column(String(20), nullable=True)
    vehicle_color: Mapped[str | None] = mapped_column(String(30), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )

    # Relationships
    orders_as_passenger = relationship(
        "Order",
        back_populates="passenger",
        foreign_keys="Order.passenger_id",
    )
    orders_as_driver = relationship(
        "Order",
        back_populates="driver",
        foreign_keys="Order.driver_id",
    )

    def __repr__(self) -> str:
        return f"<User {self.name} ({self.role.value})>"
