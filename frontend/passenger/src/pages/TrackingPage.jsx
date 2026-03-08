import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

const STATUS_INFO = {
    mencari: { label: 'Mencari Pengemudi...', icon: '🔍', color: 'text-accent-amber', anim: true },
    diterima: { label: 'Pengemudi Menuju Lokasi', icon: '🚗', color: 'text-accent-blue', anim: false },
    berjalan: { label: 'Dalam Perjalanan', icon: '🏍️', color: 'text-accent-green', anim: false },
    selesai: { label: 'Perjalanan Selesai!', icon: '✅', color: 'text-accent-green', anim: false },
    dibatalkan: { label: 'Pesanan Dibatalkan', icon: '❌', color: 'text-accent-red', anim: false },
}

export default function TrackingPage() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const pollRef = useRef(null)
    const mapRef = useRef(null)
    const mapInstance = useRef(null)

    useEffect(() => {
        fetchOrder()
        pollRef.current = setInterval(fetchOrder, 5000)
        return () => clearInterval(pollRef.current)
    }, [orderId])

    // Initialize map after order loads
    useEffect(() => {
        if (!order || !mapRef.current || mapInstance.current) return
        const L = window.L
        if (!L) return

        const map = L.map(mapRef.current, {
            center: [order.pickup_lat, order.pickup_lng],
            zoom: 14,
            zoomControl: false,
            attributionControl: false,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            maxZoom: 19,
        }).addTo(map)

        // Pickup marker (green)
        const pickupIcon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;background:#10B981;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(16,185,129,0.6)"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7],
        })
        L.marker([order.pickup_lat, order.pickup_lng], { icon: pickupIcon }).addTo(map)

        // Destination marker (red)
        const destIcon = L.divIcon({
            className: '',
            html: `<div style="width:14px;height:14px;background:#EF4444;border:3px solid white;border-radius:50%;box-shadow:0 0 10px rgba(239,68,68,0.6)"></div>`,
            iconSize: [14, 14], iconAnchor: [7, 7],
        })
        L.marker([order.dest_lat, order.dest_lng], { icon: destIcon }).addTo(map)

        // Fit bounds
        const bounds = L.latLngBounds(
            [order.pickup_lat, order.pickup_lng],
            [order.dest_lat, order.dest_lng]
        )
        map.fitBounds(bounds, { padding: [40, 40] })

        // Route line
        fetchRoute(map, L, order)

        mapInstance.current = map

        return () => { map.remove(); mapInstance.current = null }
    }, [order?.id])

    const fetchRoute = async (map, L, ord) => {
        try {
            const res = await api.get(`/geocode/route?pickup_lat=${ord.pickup_lat}&pickup_lng=${ord.pickup_lng}&dest_lat=${ord.dest_lat}&dest_lng=${ord.dest_lng}`)
            if (res.coordinates && res.coordinates.length > 0) {
                const latlngs = res.coordinates.map(c => [c[1], c[0]])
                L.polyline(latlngs, {
                    color: '#7C3AED',
                    weight: 4,
                    opacity: 0.8,
                    dashArray: '8 4',
                }).addTo(map)
            }
        } catch { }
    }

    const fetchOrder = async () => {
        try {
            const o = await api.getActiveOrder()
            if (o) {
                setOrder(o)
                if (['selesai', 'dibatalkan'].includes(o.status)) {
                    clearInterval(pollRef.current)
                }
            }
        } catch {
        } finally {
            setLoading(false)
        }
    }

    const cancelOrder = async () => {
        if (!confirm('Yakin ingin membatalkan pesanan?')) return
        try {
            await api.cancelOrder(orderId)
            navigate('/')
        } catch (err) {
            alert(err.message)
        }
    }

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-dark-primary">
                <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center animate-pulse">
                    <span className="text-2xl">🔍</span>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-dark-primary p-6">
                <p className="text-txt-secondary mb-4">Pesanan tidak ditemukan</p>
                <button onClick={() => navigate('/')} className="btn-primary">Kembali</button>
            </div>
        )
    }

    const info = STATUS_INFO[order.status] || STATUS_INFO.mencari
    const isKurir = order.service_type === 'kurir'
    const formatCurrency = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`
    const hasDriver = order.driver_name || order.driver_id

    return (
        <div className="h-screen flex flex-col bg-dark-primary">
            {/* Live Map */}
            <div ref={mapRef} className="flex-1 relative z-0" />

            {/* Top Badge */}
            <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full glass-strong backdrop-blur-xl ${isKurir ? 'bg-amber-500/20' : 'bg-accent-purple/20'}`}
                >
                    <span>{isKurir ? '📦' : '🏍️'}</span>
                    <span className="text-sm font-semibold">{isKurir ? 'Kurir' : 'Ojek'}</span>
                </motion.div>
                <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full glass-strong backdrop-blur-xl flex items-center justify-center">✕</button>
            </div>

            {/* Bottom Sheet */}
            <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="glass-strong rounded-t-3xl border-t border-white/10 p-5 space-y-4 z-30"
            >
                <div className="bottom-sheet-handle" />

                {/* Status */}
                <div className="text-center">
                    <div className={`inline-flex items-center gap-2 text-lg font-bold ${info.color}`}>
                        <span className={info.anim ? 'animate-pulse' : ''}>{info.icon}</span>
                        {info.label}
                    </div>
                </div>

                {/* Driver Profile Card */}
                <AnimatePresence>
                    {hasDriver && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-2xl glass border border-accent-blue/30"
                        >
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-14 h-14 rounded-full overflow-hidden shadow-glow-purple flex-shrink-0">
                                    {order.driver_avatar_url ? (
                                        <img src={order.driver_avatar_url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-xl font-bold">
                                            {(order.driver_name || '?')[0].toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-base">{order.driver_name || 'Pengemudi'}</p>
                                    <p className="text-txt-secondary text-xs">{order.driver_phone || ''}</p>
                                    {order.driver_vehicle_type && (
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className="text-sm">🏍️</span>
                                            <span className="text-sm font-medium text-accent-blue">
                                                {order.driver_vehicle_type}
                                            </span>
                                            {order.driver_vehicle_color && (
                                                <span className="text-txt-muted text-xs">• {order.driver_vehicle_color}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {/* Plate */}
                                {order.driver_vehicle_plate && (
                                    <div className="px-3 py-1.5 rounded-lg bg-dark-card border border-dark-border text-center">
                                        <p className="text-[10px] text-txt-muted">Plat</p>
                                        <p className="font-bold text-xs tracking-wider">{order.driver_vehicle_plate}</p>
                                    </div>
                                )}
                            </div>
                            {/* WhatsApp Button */}
                            {order.driver_phone && (
                                <a
                                    href={`https://wa.me/${order.driver_phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya penumpang TransGo. Saya menunggu di titik jemput 🙏')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] font-semibold text-sm hover:bg-[#25D366]/30 active:scale-[0.98] transition-all"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                    Chat WhatsApp
                                </a>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Route */}
                <div className="p-3 rounded-xl glass space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                        <span className="text-txt-secondary flex-1 truncate">{order.pickup_address}</span>
                    </div>
                    <div className="ml-1 border-l border-dashed border-dark-border h-3" />
                    <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full bg-accent-red" />
                        <span className="text-txt-secondary flex-1 truncate">{order.destination_address}</span>
                    </div>
                </div>

                {/* Fare & Details */}
                <div className="flex justify-between items-center text-sm">
                    <div>
                        <p className="text-txt-secondary">Tarif</p>
                        <p className="text-xl font-bold">{formatCurrency(order.fare)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-txt-secondary">Jarak</p>
                        <p className="font-semibold">{order.distance_km} KM</p>
                    </div>
                </div>

                {/* Kurir Info */}
                {isKurir && order.recipient_name && (
                    <div className="p-3 rounded-xl bg-amber-500/10 text-sm">
                        <p className="text-amber-400 font-semibold mb-1">📦 Info Pengiriman</p>
                        <p className="text-txt-secondary">{order.item_description}</p>
                        <p className="text-white mt-1">Penerima: {order.recipient_name} ({order.recipient_phone})</p>
                    </div>
                )}

                {/* Actions */}
                {order.status === 'selesai' ? (
                    <button onClick={() => navigate('/')} className="btn-success w-full">
                        ✅ Kembali ke Beranda
                    </button>
                ) : order.status === 'dibatalkan' ? (
                    <button onClick={() => navigate('/')} className="btn-primary w-full">
                        Kembali ke Beranda
                    </button>
                ) : order.status === 'mencari' ? (
                    <button onClick={cancelOrder} className="btn-danger w-full">
                        Batalkan Pesanan
                    </button>
                ) : null}
            </motion.div>
        </div>
    )
}
