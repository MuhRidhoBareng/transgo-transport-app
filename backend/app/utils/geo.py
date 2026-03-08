"""
Geo Utilities
Haversine distance calculation dan OSRM routing integration.
"""

import math
import httpx

from app.config import get_settings

settings = get_settings()


def haversine_distance(
    lat1: float, lng1: float, lat2: float, lng2: float
) -> float:
    """
    Hitung jarak antara 2 titik koordinat menggunakan formula Haversine.

    Args:
        lat1, lng1: Koordinat titik 1
        lat2, lng2: Koordinat titik 2

    Returns:
        Jarak dalam kilometer (KM)
    """
    R = 6371  # Radius bumi dalam KM

    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


async def get_osrm_route(
    start_lat: float, start_lng: float,
    end_lat: float, end_lng: float,
) -> dict | None:
    """
    Dapatkan rute dari OSRM (Open Source Routing Machine).

    Returns:
        Dict dengan keys: distance_km, duration_minutes, geometry
        atau None jika gagal
    """
    url = (
        f"{settings.OSRM_BASE_URL}/route/v1/driving/"
        f"{start_lng},{start_lat};{end_lng},{end_lat}"
        f"?overview=full&geometries=geojson"
    )

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            data = response.json()

            if data.get("code") != "Ok" or not data.get("routes"):
                return None

            route = data["routes"][0]
            return {
                "distance_km": round(route["distance"] / 1000, 2),
                "duration_minutes": round(route["duration"] / 60, 1),
                "geometry": route["geometry"],
            }
    except (httpx.HTTPError, KeyError, IndexError):
        return None


async def geocode_reverse(lat: float, lng: float) -> str | None:
    """
    Reverse geocoding menggunakan Nominatim (OpenStreetMap).

    Returns:
        Alamat dalam format string, atau None jika gagal
    """
    url = (
        f"https://nominatim.openstreetmap.org/reverse"
        f"?lat={lat}&lon={lng}&format=json&addressdetails=1"
    ) 
    headers = {"User-Agent": "TransportMVP/1.0"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()
            return data.get("display_name")
    except (httpx.HTTPError, KeyError):
        return None
