"""
Matching Service
Logic untuk mencocokkan pesanan dengan pengemudi terdekat.
"""

from app.config import get_settings
from app.utils.geo import haversine_distance
from app.services.firebase_service import FirebaseService

settings = get_settings()


class MatchingService:
    """Service untuk mencocokkan order ke pengemudi."""

    @staticmethod
    def find_nearby_drivers(
        pickup_lat: float,
        pickup_lng: float,
        radius_km: float | None = None,
    ) -> list[dict]:
        """
        Cari pengemudi online dalam radius dari titik jemput.
        Sorted by distance (terdekat dulu).
        """
        if radius_km is None:
            radius_km = settings.MATCHING_RADIUS_KM

        online_drivers = FirebaseService.get_online_drivers()
        nearby = []

        for driver_id, driver_data in online_drivers.items():
            if not isinstance(driver_data, dict):
                continue

            driver_lat = driver_data.get("lat")
            driver_lng = driver_data.get("lng")
            if driver_lat is None or driver_lng is None:
                continue

            distance = haversine_distance(
                pickup_lat, pickup_lng, driver_lat, driver_lng
            )

            if distance <= radius_km:
                nearby.append({
                    "driver_id": driver_id,
                    "distance_km": round(distance, 2),
                    "lat": driver_lat,
                    "lng": driver_lng,
                    "name": driver_data.get("name", ""),
                })

        nearby.sort(key=lambda x: x["distance_km"])
        return nearby

    @staticmethod
    def broadcast_to_drivers(
        order_id: str,
        service_type: str,
        passenger_name: str,
        pickup: dict,
        destination: dict,
        fare: int,
        nearby_drivers: list[dict],
        item_description: str | None = None,
    ):
        """Broadcast pesanan ke semua pengemudi yang ditemukan."""
        target_ids = [d["driver_id"] for d in nearby_drivers]
        if not target_ids:
            return

        FirebaseService.broadcast_order(
            order_id=order_id,
            service_type=service_type,
            passenger_name=passenger_name,
            pickup=pickup,
            destination=destination,
            fare=fare,
            target_driver_ids=target_ids,
            item_description=item_description,
        )
