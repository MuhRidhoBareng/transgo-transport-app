"""
Pricing Service
Kalkulasi tarif berdasarkan jarak dan jenis layanan.
"""

from app.config import get_settings
from app.models.order import ServiceType
from app.utils.geo import haversine_distance, get_osrm_route

settings = get_settings()

# Tarif per jenis layanan
PRICING = {
    ServiceType.OJEK: {
        "base_fare": 5000,       # Rp 5.000 tarif dasar
        "rate_per_km": 4000,     # Rp 4.000 per KM
        "min_fare": 8000,        # Rp 8.000 tarif minimum
    },
    ServiceType.KURIR: {
        "base_fare": 7000,       # Rp 7.000 tarif dasar (lebih tinggi)
        "rate_per_km": 3500,     # Rp 3.500 per KM
        "min_fare": 10000,       # Rp 10.000 tarif minimum
        "weight_surcharge_per_kg": 1000,  # Rp 1.000 per KG tambahan (> 5 KG)
        "weight_threshold_kg": 5,
    },
}


class PricingService:
    """Service untuk kalkulasi harga perjalanan/pengiriman."""

    @staticmethod
    async def estimate_fare(
        service_type: ServiceType,
        pickup_lat: float, pickup_lng: float,
        dest_lat: float, dest_lng: float,
        item_weight_kg: float | None = None,
    ) -> dict:
        """
        Estimasi tarif berdasarkan jenis layanan dan jarak.

        Returns:
            Dict: service_type, distance_km, duration_minutes, fare, breakdown
        """
        duration_minutes = None
        pricing = PRICING[service_type]

        # Coba OSRM dulu
        osrm_result = await get_osrm_route(
            pickup_lat, pickup_lng, dest_lat, dest_lng
        )

        if osrm_result:
            distance_km = osrm_result["distance_km"]
            duration_minutes = osrm_result["duration_minutes"]
        else:
            # Fallback ke Haversine × 1.3
            straight_distance = haversine_distance(
                pickup_lat, pickup_lng, dest_lat, dest_lng
            )
            distance_km = round(straight_distance * 1.3, 2)

        # Hitung tarif dasar
        fare = pricing["base_fare"] + int(distance_km * pricing["rate_per_km"])

        # Surcharge berat (khusus kurir)
        weight_surcharge = 0
        if service_type == ServiceType.KURIR and item_weight_kg:
            threshold = pricing["weight_threshold_kg"]
            if item_weight_kg > threshold:
                weight_surcharge = int(
                    (item_weight_kg - threshold) * pricing["weight_surcharge_per_kg"]
                )
                fare += weight_surcharge

        # Minimum fare
        fare = max(fare, pricing["min_fare"])

        # Bulatkan ke 500 terdekat
        fare = int(round(fare / 500) * 500)

        return {
            "service_type": service_type,
            "distance_km": distance_km,
            "duration_minutes": duration_minutes,
            "fare": fare,
            "breakdown": {
                "base_fare": pricing["base_fare"],
                "rate_per_km": pricing["rate_per_km"],
                "distance_km": distance_km,
                "distance_cost": int(distance_km * pricing["rate_per_km"]),
                "weight_surcharge": weight_surcharge,
                "min_fare": pricing["min_fare"],
            },
        }
