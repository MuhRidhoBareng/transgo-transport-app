"""
Firebase Service
Integrasi Firebase Realtime Database untuk GPS dan order broadcast.
Semua method aman dipanggil meskipun Firebase tidak dikonfigurasi.
"""

import firebase_admin
from firebase_admin import credentials, db as firebase_db

from app.config import get_settings

settings = get_settings()
_firebase_app = None
_firebase_ready = False


def init_firebase():
    """Inisialisasi Firebase Admin SDK."""
    global _firebase_app, _firebase_ready
    if _firebase_app:
        return

    try:
        cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
        _firebase_app = firebase_admin.initialize_app(cred, {
            "databaseURL": settings.FIREBASE_DATABASE_URL,
        })
        _firebase_ready = True
        print("✅ Firebase initialized successfully")
    except Exception as e:
        print(f"⚠️ Firebase initialization failed: {e}")
        print("   Real-time features will be disabled.")
        _firebase_ready = False


def _is_ready():
    """Check apakah Firebase siap dipakai."""
    return _firebase_ready


class FirebaseService:
    """Service untuk interaksi dengan Firebase Realtime Database.
    Semua method gracefully skip jika Firebase belum dikonfigurasi."""

    # === Driver Location ===

    @staticmethod
    def update_driver_location(driver_id: str, lat: float, lng: float, name: str = ""):
        """Update lokasi GPS pengemudi."""
        if not _is_ready():
            return
        try:
            ref = firebase_db.reference(f"drivers_online/{driver_id}")
            ref.set({
                "lat": lat, "lng": lng, "name": name,
                "updated_at": {".sv": "timestamp"},
            })
        except Exception as e:
            print(f"⚠️ Firebase update_driver_location error: {e}")

    @staticmethod
    def remove_driver_location(driver_id: str):
        """Hapus lokasi pengemudi (offline)."""
        if not _is_ready():
            return
        try:
            firebase_db.reference(f"drivers_online/{driver_id}").delete()
        except Exception as e:
            print(f"⚠️ Firebase remove_driver_location error: {e}")

    @staticmethod
    def get_online_drivers() -> dict:
        """Ambil semua pengemudi online."""
        if not _is_ready():
            return {}
        try:
            return firebase_db.reference("drivers_online").get() or {}
        except Exception as e:
            print(f"⚠️ Firebase get_online_drivers error: {e}")
            return {}

    # === Order Broadcast ===

    @staticmethod
    def broadcast_order(
        order_id: str,
        service_type: str,
        passenger_name: str,
        pickup: dict,
        destination: dict,
        fare: int,
        target_driver_ids: list[str],
        item_description: str | None = None,
    ):
        """Broadcast pesanan baru ke pengemudi target."""
        if not _is_ready():
            return
        try:
            data = {
                "service_type": service_type,
                "passenger_name": passenger_name,
                "pickup": pickup,
                "destination": destination,
                "fare": fare,
                "target_drivers": target_driver_ids,
                "status": "mencari",
                "created_at": {".sv": "timestamp"},
            }
            if item_description:
                data["item_description"] = item_description

            firebase_db.reference(f"orders_broadcast/{order_id}").set(data)
        except Exception as e:
            print(f"⚠️ Firebase broadcast_order error: {e}")

    @staticmethod
    def remove_broadcast(order_id: str):
        """Hapus broadcast order."""
        if not _is_ready():
            return
        try:
            firebase_db.reference(f"orders_broadcast/{order_id}").delete()
        except Exception as e:
            print(f"⚠️ Firebase remove_broadcast error: {e}")

    # === Active Ride/Delivery ===

    @staticmethod
    def create_active_ride(order_id: str, driver_id: str, driver_lat: float, driver_lng: float):
        """Buat tracking perjalanan/pengiriman aktif."""
        if not _is_ready():
            return
        try:
            firebase_db.reference(f"active_rides/{order_id}").set({
                "driver_id": driver_id,
                "driver_location": {"lat": driver_lat, "lng": driver_lng},
                "status": "menuju_jemput",
                "updated_at": {".sv": "timestamp"},
            })
        except Exception as e:
            print(f"⚠️ Firebase create_active_ride error: {e}")

    @staticmethod
    def update_ride_driver_location(order_id: str, lat: float, lng: float):
        """Update lokasi driver di active ride."""
        if not _is_ready():
            return
        try:
            firebase_db.reference(f"active_rides/{order_id}/driver_location").set({"lat": lat, "lng": lng})
        except Exception as e:
            print(f"⚠️ Firebase update_ride_driver_location error: {e}")

    @staticmethod
    def update_ride_status(order_id: str, status: str):
        """Update status active ride."""
        if not _is_ready():
            return
        try:
            firebase_db.reference(f"active_rides/{order_id}/status").set(status)
        except Exception as e:
            print(f"⚠️ Firebase update_ride_status error: {e}")

    @staticmethod
    def remove_active_ride(order_id: str):
        """Hapus active ride (selesai/batal)."""
        if not _is_ready():
            return
        try:
            firebase_db.reference(f"active_rides/{order_id}").delete()
        except Exception as e:
            print(f"⚠️ Firebase remove_active_ride error: {e}")
