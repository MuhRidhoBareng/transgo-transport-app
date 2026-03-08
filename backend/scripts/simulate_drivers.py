"""
GPS Simulation Script
Simulasi 50 driver online dengan lokasi GPS random di area Tangerang Selatan.
Berguna untuk testing matching & broadcast tanpa perlu HP fisik.

Usage:
    python simulate_drivers.py --count 50
    python simulate_drivers.py --count 10 --register
"""

import asyncio
import argparse
import random
import sys
import httpx

API_BASE = "http://localhost:8000/api"

# Bounding box area Tangerang Selatan
TANGSEL_BOUNDS = {
    "lat_min": -6.36,
    "lat_max": -6.26,
    "lng_min": 106.66,
    "lng_max": 106.76,
}

# Nama driver sample
NAMES = [
    "Ahmad", "Budi", "Cahyo", "Dedi", "Eko", "Fajar", "Gilang", "Hadi",
    "Irfan", "Joko", "Kurnia", "Lukman", "Maman", "Nanda", "Oka",
    "Purnomo", "Qori", "Rudi", "Sandi", "Tono", "Udin", "Vino",
    "Wahyu", "Xander", "Yanto", "Zainal", "Arif", "Bambang", "Candra",
    "Dimas", "Erfan", "Firman", "Gunawan", "Hari", "Imam", "Joni",
    "Kiki", "Luthfi", "Mulya", "Nur", "Opik", "Putra", "Rachmat",
    "Slamet", "Teguh", "Utomo", "Viktor", "Wawan", "Yogi", "Zaki",
]


def random_coord():
    """Generate random coordinate within Tangsel area."""
    lat = random.uniform(TANGSEL_BOUNDS["lat_min"], TANGSEL_BOUNDS["lat_max"])
    lng = random.uniform(TANGSEL_BOUNDS["lng_min"], TANGSEL_BOUNDS["lng_max"])
    return round(lat, 6), round(lng, 6)


def move_coord(lat, lng, max_delta=0.001):
    """Simulate movement by slightly changing coordinates."""
    lat += random.uniform(-max_delta, max_delta)
    lng += random.uniform(-max_delta, max_delta)
    lat = max(TANGSEL_BOUNDS["lat_min"], min(TANGSEL_BOUNDS["lat_max"], lat))
    lng = max(TANGSEL_BOUNDS["lng_min"], min(TANGSEL_BOUNDS["lng_max"], lng))
    return round(lat, 6), round(lng, 6)


async def register_drivers(client: httpx.AsyncClient, count: int) -> list[dict]:
    """Register new driver accounts and return their credentials."""
    drivers = []
    for i in range(count):
        name = NAMES[i % len(NAMES)]
        suffix = random.randint(1000, 9999)
        data = {
            "name": f"{name} Driver",
            "email": f"driver_{name.lower()}_{suffix}@test.com",
            "phone": f"08{random.randint(1000000000, 9999999999)}",
            "pin": "1234",
            "role": "pengemudi",
        }
        try:
            res = await client.post(f"{API_BASE}/auth/register", json=data)
            if res.status_code == 200:
                token = res.json()["access_token"]
                drivers.append({"name": data["name"], "token": token, "email": data["email"]})
                print(f"  ✅ Registered: {data['name']} ({data['email']})")
            else:
                print(f"  ❌ Failed: {data['name']} — {res.text[:80]}")
        except Exception as e:
            print(f"  ❌ Error: {e}")
    return drivers


async def simulate_driver(client: httpx.AsyncClient, token: str, name: str, duration_seconds: int):
    """Simulate one driver going online and moving around."""
    lat, lng = random_coord()
    headers = {"Authorization": f"Bearer {token}"}

    # Go online
    try:
        await client.post(f"{API_BASE}/drivers/online", json={"lat": lat, "lng": lng}, headers=headers)
        print(f"  🟢 {name} online at ({lat}, {lng})")
    except Exception as e:
        print(f"  ❌ {name} failed to go online: {e}")
        return

    # Move around
    elapsed = 0
    interval = 5
    while elapsed < duration_seconds:
        await asyncio.sleep(interval)
        lat, lng = move_coord(lat, lng)
        try:
            await client.put(f"{API_BASE}/drivers/location", json={"lat": lat, "lng": lng}, headers=headers)
        except:
            pass
        elapsed += interval

    # Go offline
    try:
        await client.post(f"{API_BASE}/drivers/offline", headers=headers)
        print(f"  🔴 {name} offline")
    except:
        pass


async def main():
    parser = argparse.ArgumentParser(description="Simulate GPS drivers for TransGo")
    parser.add_argument("--count", type=int, default=10, help="Number of drivers")
    parser.add_argument("--duration", type=int, default=300, help="Duration in seconds (default: 5 min)")
    parser.add_argument("--register", action="store_true", help="Register new driver accounts first")
    args = parser.parse_args()

    print(f"\n🚗 TransGo GPS Simulator")
    print(f"   Drivers: {args.count}")
    print(f"   Duration: {args.duration}s")
    print(f"   Area: Tangerang Selatan\n")

    async with httpx.AsyncClient(timeout=10) as client:
        if args.register:
            print("📝 Registering drivers...")
            drivers = await register_drivers(client, args.count)
            if not drivers:
                print("❌ No drivers registered. Is the backend running?")
                return
        else:
            # Login existing test drivers
            print("🔑 Logging in existing drivers...")
            drivers = []
            for i in range(args.count):
                name = NAMES[i % len(NAMES)]
                try:
                    res = await client.post(f"{API_BASE}/auth/login", json={
                        "identifier": f"driver_{name.lower()}_test@test.com",
                        "pin": "1234",
                    })
                    if res.status_code == 200:
                        drivers.append({"name": name, "token": res.json()["access_token"]})
                except:
                    pass

            if not drivers:
                print("⚠️  No existing drivers found. Use --register to create them first.")
                return

        print(f"\n📡 Starting simulation with {len(drivers)} drivers...\n")
        tasks = [
            simulate_driver(client, d["token"], d["name"], args.duration)
            for d in drivers
        ]
        await asyncio.gather(*tasks)
        print(f"\n✅ Simulation complete!")


if __name__ == "__main__":
    asyncio.run(main())
