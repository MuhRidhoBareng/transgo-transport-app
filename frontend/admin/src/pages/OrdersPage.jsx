import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'

const STATUS_BADGE = {
    mencari: { label: 'Mencari', bg: 'bg-amber-500/20 text-amber-400' },
    diterima: { label: 'Diterima', bg: 'bg-blue-500/20 text-blue-400' },
    berjalan: { label: 'Berjalan', bg: 'bg-green-500/20 text-green-400' },
    selesai: { label: 'Selesai', bg: 'bg-green-500/20 text-green-400' },
    dibatalkan: { label: 'Batal', bg: 'bg-red-500/20 text-red-400' },
}

export default function OrdersPage() {
    const [orders, setOrders] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)
    const [filterStatus, setFilterStatus] = useState('')
    const [filterType, setFilterType] = useState('')

    useEffect(() => { loadOrders() }, [filterStatus, filterType])

    const loadOrders = async () => {
        setLoading(true)
        try {
            let url = '/admin/orders?per_page=50'
            if (filterStatus) url += `&status=${filterStatus}`
            if (filterType) url += `&service_type=${filterType}`
            const res = await api.get(url)
            setOrders(res.orders || [])
            setTotal(res.total || 0)
        } catch { setOrders([]) }
        finally { setLoading(false) }
    }

    const formatCurrency = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`
    const formatDate = (d) => new Date(d).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold">Pesanan</h1>
                    <p className="text-txt-secondary text-sm">{total} pesanan total</p>
                </div>
                <button onClick={loadOrders} className="glass px-4 py-2 rounded-xl text-sm">🔄 Refresh</button>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-4 flex-wrap">
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="input-dark w-auto text-sm"
                >
                    <option value="">Semua Layanan</option>
                    <option value="ojek">🏍️ Ojek</option>
                    <option value="kurir">📦 Kurir</option>
                </select>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                    className="input-dark w-auto text-sm"
                >
                    <option value="">Semua Status</option>
                    <option value="mencari">Mencari</option>
                    <option value="diterima">Diterima</option>
                    <option value="berjalan">Berjalan</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                </select>
            </div>

            <div className="rounded-2xl glass-strong overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                    <thead>
                        <tr className="border-b border-dark-border text-left text-txt-secondary">
                            <th className="p-4">Layanan</th>
                            <th className="p-4">Jemput</th>
                            <th className="p-4">Tujuan</th>
                            <th className="p-4">Tarif</th>
                            <th className="p-4">KM</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Waktu</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(8)].map((_, i) => (
                                <tr key={i} className="border-b border-dark-border">
                                    {[...Array(7)].map((_, j) => (
                                        <td key={j} className="p-4"><div className="h-4 w-16 skeleton rounded" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : orders.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-txt-secondary">Tidak ada pesanan</td></tr>
                        ) : (
                            orders.map((o, i) => {
                                const badge = STATUS_BADGE[o.status] || STATUS_BADGE.mencari
                                return (
                                    <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.02 }}
                                        className="border-b border-dark-border hover:bg-dark-card transition-colors"
                                    >
                                        <td className="p-4">
                                            <span className={o.service_type === 'kurir' ? 'badge-kurir' : 'badge-ojek'}>
                                                {o.service_type === 'kurir' ? '📦 Kurir' : '🏍️ Ojek'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-txt-secondary max-w-[150px] truncate">{o.pickup_address}</td>
                                        <td className="p-4 text-txt-secondary max-w-[150px] truncate">{o.destination_address}</td>
                                        <td className="p-4 font-semibold">{formatCurrency(o.fare)}</td>
                                        <td className="p-4 text-txt-secondary">{o.distance_km}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${badge.bg}`}>
                                                {badge.label}
                                            </span>
                                        </td>
                                        <td className="p-4 text-txt-muted text-xs">{formatDate(o.created_at)}</td>
                                    </motion.tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
