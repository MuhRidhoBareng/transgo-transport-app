"""
Geocode API Routes
Reverse geocoding (coordinates → address) using Nominatim.
"""

from fastapi import APIRouter, Query
import httpx

router = APIRouter(prefix="/api/geocode", tags=["Geocode"])

NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse"


@router.get("/reverse")
async def reverse_geocode(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
):
    """Convert koordinat GPS ke alamat menggunakan Nominatim."""
    try:
        async with httpx.AsyncClient() as client:
            res = await client.get(NOMINATIM_URL, params={
                "lat": lat,
                "lon": lng,
                "format": "json",
                "addressdetails": 1,
                "zoom": 18,
            }, headers={
                "User-Agent": "TransGo MVP/1.0",
                "Accept-Language": "id",
            }, timeout=5)

            if res.status_code == 200:
                data = res.json()
                return {
                    "display_name": data.get("display_name", ""),
                    "address": data.get("address", {}),
                    "road": data.get("address", {}).get("road", ""),
                    "suburb": data.get("address", {}).get("suburb", ""),
                    "city": data.get("address", {}).get("city", data.get("address", {}).get("town", "")),
                }
    except Exception:
        pass

    return {"display_name": f"{lat:.6f}, {lng:.6f}", "address": {}, "road": "", "suburb": "", "city": ""}


@router.get("/route")
async def get_route(
    pickup_lat: float = Query(...),
    pickup_lng: float = Query(...),
    dest_lat: float = Query(...),
    dest_lng: float = Query(...),
):
    """Get OSRM route polyline between two points."""
    try:
        url = f"https://router.project-osrm.org/route/v1/driving/{pickup_lng},{pickup_lat};{dest_lng},{dest_lat}"
        async with httpx.AsyncClient() as client:
            res = await client.get(url, params={
                "overview": "full",
                "geometries": "geojson",
            }, timeout=5)

            if res.status_code == 200:
                data = res.json()
                if data.get("routes"):
                    route = data["routes"][0]
                    return {
                        "coordinates": route["geometry"]["coordinates"],
                        "distance_km": round(route["distance"] / 1000, 2),
                        "duration_min": round(route["duration"] / 60, 1),
                    }
    except Exception:
        pass

    return {"coordinates": [], "distance_km": 0, "duration_min": 0}
