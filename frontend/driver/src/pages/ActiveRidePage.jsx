import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/api'

const STEPS = {
    diterima: { label: 'Menuju Titik Jemput', icon: '📍', action: 'Sudah Sampai & Mulai', next: 'start' },
    berjalan: { label: 'Dalam Perjalanan', icon: '🚗', action: 'Selesai & Sampai Tujuan', next: 'complete' },
}

export default function ActiveRidePage() {
    const { orderId } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(true)
    const [acting, setActing] = useState(false)
    const pollRef = useRef(null)

    useEffect(() => {
        fetchOrder()
        pollRef.current = setInterval(fetchOrder, 5000)
        return () => clearInterval(pollRef.current)
    }, [orderId])

    const fetchOrder = async () => {
        try {
            const o = await api.getActiveOrder()
            if (o) setOrder(o)
            else {
                clearInterval(pollRef.current)
            }
        } catch { } finally {
            setLoading(false)
        }
    }

    const handleAction = async () => {
        if (!order) return
        setActing(true)
        try {
            if (order.status === 'diterima') {
                await api.startRide(orderId)
            } else if (order.status === 'berjalan') {
                await api.completeOrder(orderId)
                navigate('/')
                return
            }
            await fetchOrder()
        } catch (err) {
            alert(err.message)
        } finally {
            setActing(false)
        }
    }

    const cancelRide = async () => {
        if (!confirm('Yakin ingin membatalkan?')) return
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
                <div className="w-16 h-16 rounded-2xl bg-gradient-success flex items-center justify-center animate-pulse">
                    <span className="text-2xl">🚗</span>
                </div>
            </div>
        )
    }

    if (!order) {
        return (
            <div className="h-screen flex flex-col items-center justify-center bg-dark-primary p-6">
                <p className="text-txt-secondary mb-4">Tidak ada pesanan aktif</p>
                <button onClick={() => navigate('/')} className="btn-success">Kembali</button>
            </div>
        )
    }

    const step = STEPS[order.status]
    const isKurir = order.service_type === 'kurir'
    const formatCurrency = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`

    return (
        <div className="h-screen flex flex-col bg-dark-primary">
            {/* Status Bar */}
            <motion.div
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className={`p-4 pt-6 text-center ${isKurir ? 'bg-amber-500/10' : 'bg-accent-green/10'}`}
            >
                <div className="flex items-center justify-center gap-2">
                    <span className={isKurir ? 'badge-kurir' : 'badge-ojek'}>
                        {isKurir ? '📦 Kurir' : '🏍️ Ojek'}
                    </span>
                </div>
                {step && (
                    <p className="text-lg font-bold mt-2">
                        <span className="mr-1">{step.icon}</span> {step.label}
                    </p>
                )}
            </motion.div>

            {/* Order Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Passenger / Sender Info */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl glass-strong"
                >
                    <p className="text-txt-secondary text-xs mb-2">{isKurir ? 'Pengirim' : 'Penumpang'}</p>
                    <div className="flex items-center gap-3">
                        {/* Passenger Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 shadow-glow-purple">
                            {order.passenger_avatar_url ? (
                                <img src={order.passenger_avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-lg font-bold">
                                    {(order.passenger_name || '?')[0].toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="font-bold text-lg">{order.passenger_name || 'Pelanggan'}</p>
                            {order.passenger_phone && <p className="text-txt-muted text-xs">{order.passenger_phone}</p>}
                        </div>
                        {order.passenger_phone && (
                            <a
                                href={`https://wa.me/${order.passenger_phone.replace(/^0/, '62').replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Halo, saya driver TransGo. Saya sedang menuju lokasi Anda 🚗')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#25D366]/20 border border-[#25D366]/30 text-[#25D366] text-xs font-semibold hover:bg-[#25D366]/30 active:scale-95 transition-all"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                                WhatsApp
                            </a>
                        )}
                    </div>
                </motion.div>

                {/* Route */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-4 rounded-2xl glass-strong space-y-3"
                >
                    <div className="flex items-start gap-3">
                        <div className="mt-1.5 w-3 h-3 rounded-full bg-accent-green flex-shrink-0" />
                        <div>
                            <p className="text-xs text-txt-muted">Jemput</p>
                            <p className="font-semibold">{order.pickup_address}</p>
                        </div>
                    </div>
                    <div className="ml-1.5 border-l border-dashed border-dark-border h-4" />
                    <div className="flex items-start gap-3">
                        <div className="mt-1.5 w-3 h-3 rounded-full bg-accent-red flex-shrink-0" />
                        <div>
                            <p className="text-xs text-txt-muted">Tujuan</p>
                            <p className="font-semibold">{order.destination_address}</p>
                        </div>
                    </div>
                </motion.div>

                {/* Kurir Details */}
                {isKurir && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2"
                    >
                        <p className="text-amber-400 font-semibold text-sm">📦 Detail Pengiriman</p>
                        {order.item_description && (
                            <p className="text-sm"><span className="text-txt-secondary">Barang:</span> {order.item_description}</p>
                        )}
                        {order.item_weight_kg && (
                            <p className="text-sm"><span className="text-txt-secondary">Berat:</span> {order.item_weight_kg} KG</p>
                        )}
                        {order.recipient_name && (
                            <p className="text-sm"><span className="text-txt-secondary">Penerima:</span> {order.recipient_name}</p>
                        )}
                        {order.recipient_phone && (
                            <p className="text-sm">
                                <span className="text-txt-secondary">HP:</span>{' '}
                                <a href={`tel:${order.recipient_phone}`} className="text-accent-blue underline">{order.recipient_phone}</a>
                            </p>
                        )}
                    </motion.div>
                )}

                {/* Fare */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-4 rounded-2xl glass-strong flex justify-between items-center"
                >
                    <div>
                        <p className="text-xs text-txt-muted">Tarif (Bayar Tunai)</p>
                        <p className="text-2xl font-extrabold">{formatCurrency(order.fare)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-txt-muted">Jarak</p>
                        <p className="font-bold">{order.distance_km} KM</p>
                    </div>
                </motion.div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-3">
                {step && (
                    <button onClick={handleAction} disabled={acting}
                        className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${order.status === 'berjalan'
                            ? 'bg-gradient-success text-white shadow-glow-green'
                            : 'bg-gradient-primary text-white shadow-glow-purple'
                            } disabled:opacity-50`}
                    >
                        {acting ? '⏳ Memproses...' : step.action}
                    </button>
                )}
                {order.status === 'diterima' && (
                    <button onClick={cancelRide} className="btn-danger w-full text-sm">
                        Batalkan
                    </button>
                )}
            </div>
        </div>
    )
}
