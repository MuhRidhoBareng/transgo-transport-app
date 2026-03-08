import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import api from '../lib/api'

export default function HistoryPage() {
    const navigate = useNavigate()
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')

    useEffect(() => { loadHistory() }, [filter])

    const loadHistory = async () => {
        setLoading(true)
        try {
            const params = filter !== 'all' ? `?service_type=${filter}` : ''
            const data = await api.get(`/orders/history${params}`)
            setOrders(data.orders || [])
        } catch { setOrders([]) }
        finally { setLoading(false) }
    }

    const statusColors = {
        selesai: 'bg-green-500/20 text-green-400',
        dibatalkan: 'bg-red-500/20 text-red-400',
        berjalan: 'bg-blue-500/20 text-blue-400',
        mencari: 'bg-amber-500/20 text-amber-400',
        diterima: 'bg-purple-500/20 text-purple-400',
    }

    return (
        <div className="h-screen bg-dark-primary overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 glass-strong backdrop-blur-2xl p-4 pt-6 border-b border-dark-border">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full glass flex items-center justify-center">←</button>
                    <h1 className="text-xl font-bold">Riwayat Pesanan</h1>
                </div>
                <div className="flex gap-2">
                    {[['all', 'Semua'], ['ojek', '🏍️ Ojek'], ['kurir', '📦 Kurir']].map(([key, label]) => (
                        <button key={key} onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === key ? 'bg-gradient-primary text-white' : 'glass text-txt-secondary'
                                }`}
                        >{label}</button>
                    ))}
                </div>
            </div>

            {/* List */}
            <div className="p-4 space-y-3 pb-20">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <div key={i} className="p-4 rounded-2xl glass border border-dark-border">
                            <div className="flex gap-3">
                                <div className="w-10 h-10 skeleton rounded-xl" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 skeleton rounded" />
                                    <div className="h-3 w-1/2 skeleton rounded" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-4xl mb-3">📋</p>
                        <p className="text-txt-secondary">Belum ada riwayat pesanan</p>
                    </div>
                ) : (
                    orders.map((order, i) => (
                        <motion.div
                            key={order.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="p-4 rounded-2xl glass border border-dark-border"
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${order.service_type === 'kurir' ? 'bg-amber-500/20' : 'bg-accent-purple/20'
                                    }`}>
                                    {order.service_type === 'kurir' ? '📦' : '🏍️'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="font-semibold text-sm truncate">{order.destination_address || 'Tujuan'}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusColors[order.status] || ''}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className="text-txt-muted text-xs truncate">{order.pickup_address || 'Pickup'}</p>
                                    <div className="flex items-center gap-3 mt-2 text-xs">
                                        <span className="font-bold text-accent-green">Rp {Number(order.fare).toLocaleString('id-ID')}</span>
                                        <span className="text-txt-muted">{order.distance_km} km</span>
                                        <span className="text-txt-muted">{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    )
}
