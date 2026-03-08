import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/api'

const STATUS_BADGE = {
    mencari: { label: 'Mencari', bg: 'bg-amber-500/20 text-amber-400' },
    diterima: { label: 'Diterima', bg: 'bg-blue-500/20 text-blue-400' },
    berjalan: { label: 'Berjalan', bg: 'bg-green-500/20 text-green-400' },
    selesai: { label: 'Selesai', bg: 'bg-green-500/20 text-green-400' },
    dibatalkan: { label: 'Batal', bg: 'bg-red-500/20 text-red-400' },
}

export default function HistoryPage() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState(null) // null | 'ojek' | 'kurir'

    useEffect(() => {
        loadOrders()
    }, [filter])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const res = await api.getOrderHistory(1, filter)
            setOrders(res.orders || [])
        } catch {
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`
    const formatDate = (d) => new Date(d).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })

    return (
        <div className="h-screen flex flex-col bg-dark-primary">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 p-4 pt-6"
            >
                <button onClick={() => navigate('/')}
                    className="w-10 h-10 rounded-xl glass flex items-center justify-center"
                >←</button>
                <h1 className="text-xl font-bold">Riwayat Pesanan</h1>
            </motion.header>

            {/* Filter */}
            <div className="flex gap-2 px-4 pb-3">
                {[
                    { key: null, label: 'Semua' },
                    { key: 'ojek', label: '🏍️ Ojek' },
                    { key: 'kurir', label: '📦 Kurir' },
                ].map(f => (
                    <button key={f.key || 'all'} onClick={() => setFilter(f.key)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === f.key
                                ? 'bg-gradient-primary text-white shadow-glow-purple'
                                : 'glass text-txt-secondary hover:text-white'
                            }`}
                    >{f.label}</button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3">
                {loading ? (
                    // Skeleton
                    [...Array(4)].map((_, i) => (
                        <div key={i} className="p-4 rounded-2xl glass-strong">
                            <div className="h-4 w-1/3 skeleton rounded mb-3" />
                            <div className="h-3 w-2/3 skeleton rounded mb-2" />
                            <div className="h-3 w-1/2 skeleton rounded" />
                        </div>
                    ))
                ) : orders.length === 0 ? (
                    <div className="text-center py-20">
                        <span className="text-4xl">📭</span>
                        <p className="text-txt-secondary mt-3">Belum ada pesanan</p>
                    </div>
                ) : (
                    orders.map((order, i) => {
                        const badge = STATUS_BADGE[order.status] || STATUS_BADGE.mencari
                        const isKurir = order.service_type === 'kurir'
                        return (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-4 rounded-2xl glass-strong"
                            >
                                {/* Top row */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className={isKurir ? 'badge-kurir' : 'badge-ojek'}>
                                            {isKurir ? '📦 Kurir' : '🏍️ Ojek'}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg}`}>
                                            {badge.label}
                                        </span>
                                    </div>
                                    <span className="text-lg font-bold">{formatCurrency(order.fare)}</span>
                                </div>

                                {/* Route */}
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent-green" />
                                        <span className="text-txt-secondary truncate">{order.pickup_address}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-accent-red" />
                                        <span className="text-txt-secondary truncate">{order.destination_address}</span>
                                    </div>
                                </div>

                                {/* Meta */}
                                <div className="flex justify-between mt-3 text-xs text-txt-muted">
                                    <span>{order.distance_km} KM</span>
                                    <span>{formatDate(order.created_at)}</span>
                                </div>
                            </motion.div>
                        )
                    })
                )}
            </div>
        </div>
    )
}
