import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

export default function DashboardPage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const [isOnline, setIsOnline] = useState(false)
    const [incomingOrder, setIncomingOrder] = useState(null)
    const [todayCount, setTodayCount] = useState(0)
    const [menuOpen, setMenuOpen] = useState(false)
    const mapRef = useRef(null)
    const mapInstance = useRef(null)
    const markerRef = useRef(null)
    const gpsIntervalRef = useRef(null)
    const pollRef = useRef(null)
    const wakeLockRef = useRef(null)
    const [userLocation, setUserLocation] = useState({ lat: -6.2788, lng: 106.7105 })

    // Init Leaflet map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return
        const L = window.L
        if (!L) return

        const map = L.map(mapRef.current, {
            center: [userLocation.lat, userLocation.lng],
            zoom: 15,
            zoomControl: false,
            attributionControl: false,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map)

        const pulseIcon = L.divIcon({
            className: 'driver-marker',
            html: `<div class="driver-dot"></div><div class="driver-pulse"></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
        })

        markerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: pulseIcon }).addTo(map)
        mapInstance.current = map

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const { latitude, longitude } = pos.coords
                    setUserLocation({ lat: latitude, lng: longitude })
                    map.setView([latitude, longitude], 15)
                    markerRef.current.setLatLng([latitude, longitude])
                },
                () => { }
            )
        }

        return () => { map.remove(); mapInstance.current = null }
    }, [])

    // Check active order on load
    useEffect(() => {
        api.getActiveOrder().then(o => {
            if (o && o.driver_id) navigate(`/ride/${o.id}`)
        }).catch(() => { })
    }, [])

    // Poll when online
    useEffect(() => {
        if (isOnline) {
            pollRef.current = setInterval(checkIncomingOrders, 3000)
        } else {
            clearInterval(pollRef.current)
        }
        return () => clearInterval(pollRef.current)
    }, [isOnline])

    const checkIncomingOrders = async () => {
        try {
            const pending = await api.get('/orders/pending')
            if (pending && pending.length > 0 && !incomingOrder) {
                setIncomingOrder(pending[0])
            }
        } catch { }
    }

    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await navigator.wakeLock.request('screen')
            }
        } catch { }
    }

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release()
            wakeLockRef.current = null
        }
    }

    const goOnline = async () => {
        try {
            const pos = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true, timeout: 10000,
                })
            })
            await api.post('/drivers/online', { lat: pos.coords.latitude, lng: pos.coords.longitude })
            setIsOnline(true)
            setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
            if (mapInstance.current) mapInstance.current.setView([pos.coords.latitude, pos.coords.longitude], 15)
            if (markerRef.current) markerRef.current.setLatLng([pos.coords.latitude, pos.coords.longitude])
            await requestWakeLock()

            gpsIntervalRef.current = setInterval(async () => {
                navigator.geolocation.getCurrentPosition(
                    async (p) => {
                        const { latitude, longitude } = p.coords
                        setUserLocation({ lat: latitude, lng: longitude })
                        if (markerRef.current) markerRef.current.setLatLng([latitude, longitude])
                        if (mapInstance.current) mapInstance.current.panTo([latitude, longitude])
                        await api.put('/drivers/location', { lat: latitude, lng: longitude }).catch(() => { })
                    },
                    () => { },
                    { enableHighAccuracy: true }
                )
            }, 5000)
        } catch (err) {
            alert('Gagal go online: ' + (err.message || 'Cek izin GPS'))
        }
    }

    const goOffline = async () => {
        try { await api.post('/drivers/offline') } catch { }
        setIsOnline(false)
        clearInterval(gpsIntervalRef.current)
        releaseWakeLock()
    }

    const acceptOrder = async (orderId) => {
        try {
            const order = await api.acceptOrder(orderId)
            setIncomingOrder(null)
            navigate(`/ride/${order.id}`)
        } catch (err) { alert(err.message) }
    }

    useEffect(() => {
        return () => {
            clearInterval(gpsIntervalRef.current)
            clearInterval(pollRef.current)
            releaseWakeLock()
        }
    }, [])

    return (
        <div className="h-screen relative overflow-hidden bg-dark-primary">
            {/* Full-screen Map */}
            <div ref={mapRef} className="absolute inset-0 z-0" />

            {/* Top Bar */}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-0 left-0 right-0 z-20 p-4 pt-6"
            >
                <div className="flex items-center justify-between">
                    {/* Menu Button */}
                    <button onClick={() => setMenuOpen(true)}
                        className="w-10 h-10 rounded-full glass-strong backdrop-blur-xl flex items-center justify-center"
                    >☰</button>

                    {/* ONLINE/OFFLINE Toggle */}
                    <button
                        onClick={isOnline ? goOffline : goOnline}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-500 ${isOnline
                            ? 'bg-accent-green/20 border-2 border-accent-green text-accent-green shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                            : 'glass-strong border-2 border-dark-border text-txt-secondary hover:border-accent-green/40'
                            }`}
                    >
                        <span className="text-xs uppercase tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                        <div className={`w-8 h-5 rounded-full relative transition-all duration-300 ${isOnline ? 'bg-accent-green' : 'bg-dark-border'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-all duration-300 ${isOnline ? 'left-[14px]' : 'left-0.5'}`} />
                        </div>
                    </button>
                </div>
            </motion.div>

            {/* Today's Stats Chip */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute top-20 left-4 z-20"
            >
                <div className="px-4 py-2 rounded-full glass-strong backdrop-blur-xl text-sm">
                    📋 Pesanan Hari Ini: <span className="font-bold text-accent-purple">{todayCount}</span>
                </div>
            </motion.div>

            {/* GPS Recenter */}
            <button
                onClick={() => { if (mapInstance.current) mapInstance.current.setView([userLocation.lat, userLocation.lng], 15) }}
                className="absolute right-4 bottom-6 z-20 w-12 h-12 rounded-full glass-strong backdrop-blur-xl flex items-center justify-center shadow-lg text-lg"
            >
                ◎
            </button>

            {/* GPS Active indicator when online */}
            {isOnline && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute bottom-6 left-4 z-20 px-4 py-2 rounded-full bg-accent-green/10 border border-accent-green/30 text-accent-green text-xs font-medium backdrop-blur-xl"
                >
                    📡 GPS aktif · Layar terjaga
                </motion.div>
            )}

            {/* Slide-out Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                            onClick={() => setMenuOpen(false)}
                        />
                        {/* Sidebar */}
                        <motion.div
                            initial={{ x: -300 }}
                            animate={{ x: 0 }}
                            exit={{ x: -300 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            className="fixed top-0 left-0 bottom-0 w-72 z-50 glass-strong backdrop-blur-2xl border-r border-white/10"
                        >
                            <div className="flex flex-col h-full">
                                {/* Profile */}
                                <div className="p-6 border-b border-dark-border">
                                    <div className="w-16 h-16 rounded-full bg-gradient-success flex items-center justify-center text-2xl font-bold mb-3 shadow-glow-green">
                                        {(user?.name || 'D')[0].toUpperCase()}
                                    </div>
                                    <h3 className="font-bold text-lg">{user?.name || 'Driver'}</h3>
                                    <p className="text-txt-secondary text-sm">{user?.email}</p>
                                    <p className="text-txt-muted text-xs mt-1">🚗 Pengemudi TransGo</p>
                                </div>

                                {/* Menu items */}
                                <div className="flex-1 p-4 space-y-1">
                                    <div className="px-4 py-3 rounded-xl bg-accent-green/10 text-accent-green text-sm font-medium flex items-center gap-3">
                                        <span>🏠</span> Dashboard
                                    </div>
                                    <div onClick={() => { setMenuOpen(false); navigate('/history') }} className="px-4 py-3 rounded-xl text-txt-secondary text-sm flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer">
                                        <span>📋</span> Riwayat Pesanan
                                    </div>
                                    <div onClick={() => { setMenuOpen(false); navigate('/settings') }} className="px-4 py-3 rounded-xl text-txt-secondary text-sm flex items-center gap-3 hover:bg-white/5 transition-colors cursor-pointer">
                                        <span>⚙️</span> Pengaturan
                                    </div>

                                    <div className="pt-4">
                                        <p className="px-4 text-xs text-txt-muted mb-2">Layanan aktif:</p>
                                        <div className="flex gap-2 px-4">
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-purple/20 text-accent-purple">🏍️ Ojek</span>
                                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">📦 Kurir</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Logout */}
                                <div className="p-4 border-t border-dark-border">
                                    <button
                                        onClick={() => { setMenuOpen(false); logout() }}
                                        className="w-full py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                                    >
                                        🚪 Keluar
                                    </button>
                                    <p className="text-center text-txt-muted text-xs mt-3">TransGo Driver v1.0</p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Incoming Order Popup */}
            <AnimatePresence>
                {incomingOrder && (
                    <motion.div
                        initial={{ y: 300, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 300, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 80, damping: 15 }}
                        className="absolute bottom-0 left-0 right-0 z-50 p-4"
                    >
                        <div className="glass-strong backdrop-blur-2xl rounded-3xl p-6 border border-accent-green/30 shadow-[0_-4px_30px_rgba(16,185,129,0.15)]">
                            {/* Header */}
                            <div className="text-center mb-4">
                                <motion.p
                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                    transition={{ duration: 1.5, repeat: Infinity }}
                                    className="text-accent-green font-bold text-lg uppercase tracking-wider"
                                >
                                    PESANAN BARU
                                </motion.p>
                            </div>

                            {/* Passenger */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold">
                                    {(incomingOrder.passenger_name || 'P')[0]}
                                </div>
                                <div>
                                    <p className="text-xs text-txt-secondary">
                                        {incomingOrder.service_type === 'kurir' ? 'Pengirim' : 'Penumpang'}
                                    </p>
                                    <p className="font-bold">{incomingOrder.passenger_name || 'Pelanggan'}</p>
                                </div>
                                <span className={`ml-auto text-xs px-3 py-1 rounded-full font-semibold ${incomingOrder.service_type === 'kurir'
                                    ? 'bg-amber-500/20 text-amber-400'
                                    : 'bg-accent-purple/20 text-accent-purple'
                                    }`}>
                                    {incomingOrder.service_type === 'kurir' ? '📦 Kurir' : '🏍️ Ojek'}
                                </span>
                            </div>

                            {/* Route */}
                            <div className="space-y-2 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-accent-green shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                                    <div>
                                        <p className="text-[10px] text-txt-muted">Jemput</p>
                                        <p className="text-sm font-medium">{incomingOrder.pickup_address}</p>
                                    </div>
                                </div>
                                <div className="ml-1.5 border-l border-dashed border-dark-border h-3" />
                                <div className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-accent-red shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                                    <div>
                                        <p className="text-[10px] text-txt-muted">Tujuan</p>
                                        <p className="text-sm font-medium">{incomingOrder.destination_address}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Fare & Distance */}
                            <div className="flex items-center justify-between mb-5 px-2">
                                <div>
                                    <p className="text-xs text-txt-muted">Tarif</p>
                                    <p className="text-2xl font-extrabold">Rp {Number(incomingOrder.fare).toLocaleString('id-ID')}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-txt-muted">Jarak</p>
                                    <p className="text-lg font-bold">{incomingOrder.distance_km} KM</p>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => acceptOrder(incomingOrder.id)}
                                    className="flex-1 py-4 rounded-2xl bg-gradient-success text-white font-bold text-base shadow-glow-green active:scale-[0.97] transition-transform"
                                >
                                    TERIMA
                                </button>
                                <button
                                    onClick={() => setIncomingOrder(null)}
                                    className="flex-1 py-4 rounded-2xl bg-transparent border-2 border-accent-red text-accent-red font-bold text-base hover:bg-accent-red/10 active:scale-[0.97] transition-all"
                                >
                                    TOLAK
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Map marker styles */}
            <style>{`
        .driver-marker { position: relative; }
        .driver-dot {
          width: 16px; height: 16px;
          background: #10B981;
          border-radius: 50%;
          border: 3px solid white;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          box-shadow: 0 0 12px rgba(16,185,129,0.6);
        }
        .driver-pulse {
          width: 44px; height: 44px;
          background: rgba(16,185,129,0.2);
          border-radius: 50%;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          animation: dpulse 2s ease-out infinite;
        }
        @keyframes dpulse {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
        </div>
    )
}
