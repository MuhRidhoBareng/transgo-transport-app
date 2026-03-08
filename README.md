# 🚀 TransGo — Sistem Pemesanan Transportasi (MVP)

Aplikasi ride-hailing & delivery berbasis **Progressive Web App** (PWA).  
Model gaji tetap bulanan untuk pengemudi (seperti Blue Bird).

## 📋 Fitur

| Fitur | Deskripsi |
|-------|-----------|
| 🏍️ **Ojek** | Antar penumpang point-to-point |
| 📦 **Kurir** | Pengiriman barang + detail penerima |
| 💰 **Tunai** | Pembayaran cash ke pengemudi |
| 📡 **GPS Real-time** | Tracking lokasi via Firebase |
| 🌐 **3 PWA Apps** | Penumpang, Pengemudi, Admin |

## 🏗️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Python 3.11 · FastAPI · SQLAlchemy Async |
| **Database** | PostgreSQL 16 |
| **Real-time** | Firebase Realtime Database |
| **Frontend** | React 19 · Tailwind CSS · Framer Motion |
| **Maps** | Leaflet · OpenStreetMap |
| **Routing** | OSRM (fallback: Haversine) |
| **Auth** | JWT · bcrypt |
| **Deploy** | Docker Compose |

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone <repo>
cd "SISTEM PEMESANAN TRANSPORTASI (MVP - FULL PWA)"
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # Edit environment variables
pip install -r requirements.txt

# Database migration
alembic revision --autogenerate -m "init"
alembic upgrade head

# Seed admin user
python scripts/seed_admin.py

# Run server
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend Apps

```bash
# Penumpang (port 3001)
cd frontend/passenger && npm install && npm run dev

# Pengemudi (port 3002)
cd frontend/driver && npm install && npm run dev

# Admin (port 3003)
cd frontend/admin && npm install && npm run dev
```

### 4. Docker (Opsional)

```bash
docker compose up -d
```

## 📁 Struktur Proyek

```
├── backend/
│   ├── app/
│   │   ├── api/           # Route handlers (auth, orders, drivers, admin)
│   │   ├── models/        # SQLAlchemy models (User, Order)
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── utils/         # security.py, geo.py
│   │   ├── config.py      # Environment settings
│   │   ├── database.py    # Async SQLAlchemy engine
│   │   └── main.py        # FastAPI entry point
│   ├── alembic/           # Database migrations
│   ├── scripts/           # Simulation & seeder
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── passenger/         # PWA Penumpang/Pengirim
│   ├── driver/            # PWA Pengemudi/Kurir
│   └── admin/             # Dashboard Admin
└── docker-compose.yml
```

## 🔐 Environment Variables

See `backend/.env.example` for all configurable values:
- `DATABASE_URL` — PostgreSQL connection string  
- `JWT_SECRET_KEY` — Secret for JWT tokens  
- `FIREBASE_CREDENTIALS_PATH` — Path to Firebase service account JSON  
- `FIREBASE_DATABASE_URL` — Firebase RTDB URL  

## 🧪 Testing

```bash
# Simulate 50 drivers with GPS movement
cd backend
python scripts/simulate_drivers.py --register --count 50 --duration 300
```

## 📱 API Documentation

Once backend is running, visit:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
