import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

export default function HomePage() {
    const { user, logout } = useAuth()
    const navigate = useNavigate()
    const mapRef = useRef(null)
    const mapInstance = useRef(null)
    const markerRef = useRef(null)
    const [activeOrder, setActiveOrder] = useState(null)
    const [sheetOpen, setSheetOpen] = useState(true)
    const [selectedService, setSelectedService] = useState('ojek')
    const [pickupAddress, setPickupAddress] = useState('')
    const [destAddress, setDestAddress] = useState('')
    const [userLocation, setUserLocation] = useState({ lat: -6.2788, lng: 106.7105 })

    // Check active order
    useEffect(() => {
        api.getActiveOrder().then(o => {
            if (o) setActiveOrder(o)
        }).catch(() => { })
    }, [])

    // Initialize Leaflet map
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

        // Dark map tiles
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map)

        // User location marker with pulse
        const pulseIcon = L.divIcon({
            className: 'user-marker-pulse',
            html: `<div class="marker-dot"></div><div class="marker-pulse"></div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
        })

        markerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: pulseIcon }).addTo(map)
        mapInstance.current = map

        // Get actual user location
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords
                    setUserLocation({ lat: latitude, lng: longitude })
                    map.setView([latitude, longitude], 15)
                    markerRef.current.setLatLng([latitude, longitude])
                    // Auto-fill pickup address via reverse geocode
                    try {
                        const geo = await api.get(`/geocode/reverse?lat=${latitude}&lng=${longitude}`)
                        if (geo.display_name) {
                            const short = geo.road
                                ? `${geo.road}${geo.suburb ? ', ' + geo.suburb : ''}`
                                : geo.display_name.split(',').slice(0, 2).join(',')
                            setPickupAddress(short)
                        }
                    } catch { }
                },
                () => { }
            )
        }

        return () => {
            map.remove()
            mapInstance.current = null
        }
    }, [])

    const handleOrder = () => {
        navigate('/order', {
            state: {
                serviceType: selectedService,
                pickupAddress,
                destAddress,
                pickupLat: userLocation.lat,
                pickupLng: userLocation.lng,
            }
        })
    }

    return (
        <div className="h-screen relative overflow-hidden bg-dark-primary">
            {/* Full-screen Map */}
            <div ref={mapRef} className="absolute inset-0 z-0" />

            {/* Top Bar — Greeting + notification*/}
            <motion.div
                initial={{ y: -30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="absolute top-0 left-0 right-0 z-20 p-4 pt-6"
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-gradient-primary flex items-center justify-center text-lg font-bold shadow-glow-purple">
                            {(user?.name || 'U')[0].toUpperCase()}
                        </div>
                        <div>
                            <p className="text-xs text-txt-secondary">Selamat datang 👋</p>
                            <p className="text-base font-bold">Halo, <span className="text-white">{user?.name?.split(' ')[0] || 'User'}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => navigate('/history')}
                            className="w-10 h-10 rounded-full glass-strong flex items-center justify-center backdrop-blur-xl"
                        >
                            📋
                        </button>
                        <button onClick={() => navigate('/profile')}
                            className="w-10 h-10 rounded-full glass-strong flex items-center justify-center backdrop-blur-xl"
                        >
                            👤
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Active Order Banner */}
            <AnimatePresence>
                {activeOrder && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-20 left-4 right-4 z-20 cursor-pointer"
                        onClick={() => navigate(`/tracking/${activeOrder.id}`)}
                    >
                        <div className="p-3 rounded-2xl glass-strong border border-accent-green/40 backdrop-blur-xl flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-accent-green/20 flex items-center justify-center pulse-ring">
                                <span>{activeOrder.service_type === 'ojek' ? '🏍️' : '📦'}</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">Pesanan Aktif</p>
                                <p className="text-txt-secondary text-xs truncate">
                                    {activeOrder.status === 'mencari' ? 'Mencari pengemudi...' :
                                        activeOrder.status === 'diterima' ? 'Pengemudi menuju lokasi' :
                                            'Dalam perjalanan'}
                                </p>
                            </div>
                            <span className="text-accent-green text-xl animate-pulse">→</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* GPS Recenter Button */}
            <button
                onClick={() => {
                    if (mapInstance.current) {
                        mapInstance.current.setView([userLocation.lat, userLocation.lng], 15)
                    }
                }}
                className="absolute right-4 z-20 w-11 h-11 rounded-full glass-strong backdrop-blur-xl flex items-center justify-center shadow-lg"
                style={{ bottom: sheetOpen ? '380px' : '100px', transition: 'bottom 0.3s ease' }}
            >
                ◎
            </button>

            {/* Bottom Sheet */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="absolute bottom-0 left-0 right-0 z-30"
            >
                <div className="glass-strong backdrop-blur-2xl rounded-t-3xl border-t border-white/10 shadow-2xl">
                    {/* Handle */}
                    <div className="flex justify-center pt-3 pb-2">
                        <div className="w-10 h-1 rounded-full bg-white/20" />
                    </div>

                    <div className="px-5 pb-6 space-y-4">
                        {/* Search Bar */}
                        <div
                            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-dark-card border border-dark-border cursor-pointer hover:border-accent-purple/40 transition-all"
                            onClick={() => navigate('/order', { state: { serviceType: selectedService } })}
                        >
                            <span className="text-txt-muted text-lg">🔍</span>
                            <span className="text-txt-muted text-sm">Mau kemana?</span>
                        </div>

                        {/* Pickup & Destination */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col items-center">
                                    <div className="w-3 h-3 rounded-full bg-accent-green shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    <div className="w-0.5 h-6 bg-dark-border" />
                                    <div className="w-3 h-3 rounded-full bg-accent-red shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <input
                                        value={pickupAddress}
                                        onChange={e => setPickupAddress(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm text-white placeholder:text-txt-muted focus:border-accent-green/50 focus:outline-none transition-colors"
                                        placeholder="Lokasi Penjemputan"
                                    />
                                    <input
                                        value={destAddress}
                                        onChange={e => setDestAddress(e.target.value)}
                                        className="w-full px-3 py-2.5 rounded-xl bg-dark-card border border-dark-border text-sm text-white placeholder:text-txt-muted focus:border-accent-red/50 focus:outline-none transition-colors"
                                        placeholder="Tujuan"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Service Type Selector */}
                        <div className="flex gap-2">
                            <button
                                onClick={() => setSelectedService('ojek')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${selectedService === 'ojek'
                                    ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/40 shadow-[0_0_12px_rgba(124,58,237,0.15)]'
                                    : 'bg-dark-card border border-dark-border text-txt-secondary hover:border-dark-border/80'
                                    }`}
                            >
                                <span>🏍️</span> Ojek
                            </button>
                            <button
                                onClick={() => setSelectedService('kurir')}
                                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${selectedService === 'kurir'
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(245,158,11,0.15)]'
                                    : 'bg-dark-card border border-dark-border text-txt-secondary hover:border-dark-border/80'
                                    }`}
                            >
                                <span>📦</span> Kurir
                            </button>
                        </div>

                        {/* Order Button */}
                        <button
                            onClick={handleOrder}
                            className={`w-full py-4 rounded-2xl font-bold text-base shadow-lg transition-all active:scale-[0.98] ${selectedService === 'kurir'
                                ? 'bg-gradient-kurir shadow-[0_4px_20px_rgba(245,158,11,0.25)]'
                                : 'bg-gradient-primary shadow-glow-purple'
                                }`}
                        >
                            {selectedService === 'kurir' ? '📦 Kirim Barang' : '🏍️ Pesan Ojek'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Marker CSS */}
            <style>{`
        .user-marker-pulse {
          position: relative;
        }
        .marker-dot {
          width: 14px;
          height: 14px;
          background: #3B82F6;
          border-radius: 50%;
          border: 3px solid white;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 2;
          box-shadow: 0 0 10px rgba(59,130,246,0.6);
        }
        .marker-pulse {
          width: 40px;
          height: 40px;
          background: rgba(59,130,246,0.2);
          border-radius: 50%;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
          animation: pulse-ring 2s ease-out infinite;
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.5); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; }
        }
      `}</style>
        </div>
    )
}
