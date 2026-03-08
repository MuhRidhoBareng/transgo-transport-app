import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import api from '../lib/api'

const STAT_CARDS = [
    { key: 'total_drivers', label: 'Total Pengemudi', icon: '👥', gradient: 'from-purple-600/30 to-purple-800/30', iconBg: 'bg-purple-600/30', textColor: 'text-purple-400' },
    { key: 'total_orders_today', label: 'Pesanan Hari Ini', icon: '📋', gradient: 'from-blue-600/30 to-blue-800/30', iconBg: 'bg-blue-600/30', textColor: 'text-blue-400', showPercent: true },
    { key: 'completed_today', label: 'Revenue', icon: '💰', gradient: 'from-green-600/30 to-green-800/30', iconBg: 'bg-green-600/30', textColor: 'text-green-400', isCurrency: true },
    { key: 'active_drivers', label: 'Pengemudi Online', icon: '📡', gradient: 'from-red-600/30 to-red-800/30', iconBg: 'bg-red-600/30', textColor: 'text-red-400' },
]

export default function DashboardPage() {
    const [stats, setStats] = useState(null)
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true)
    const mapRef = useRef(null)
    const mapInstance = useRef(null)

    useEffect(() => {
        loadData()
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [])

    // Init map
    useEffect(() => {
        if (!mapRef.current || mapInstance.current) return
        const L = window.L
        if (!L) return

        const map = L.map(mapRef.current, {
            center: [-6.2888, 106.7105],
            zoom: 12,
            zoomControl: false,
            attributionControl: false,
        })

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map)
        mapInstance.current = map

        // Add demo driver markers
        const demoPositions = [
            [-6.27, 106.71], [-6.29, 106.72], [-6.30, 106.70],
            [-6.28, 106.74], [-6.32, 106.73], [-6.26, 106.69],
            [-6.31, 106.75], [-6.33, 106.71], [-6.27, 106.76],
        ]

        demoPositions.forEach((pos, i) => {
            const colors = ['#10B981', '#F59E0B', '#EF4444']
            const color = colors[i % 3]
            const icon = L.divIcon({
                className: '',
                html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 8px ${color}80;"></div>`,
                iconSize: [10, 10],
                iconAnchor: [5, 5],
            })
            L.marker(pos, { icon }).addTo(map)
        })

        return () => { map.remove(); mapInstance.current = null }
    }, [])

    const loadData = async () => {
        try {
            const [s, d] = await Promise.all([
                api.get('/admin/stats').catch(() => null),
                api.get('/admin/drivers').catch(() => []),
            ])
            if (s) setStats(s)
            setDrivers(d || [])
        } catch { }
        setLoading(false)
    }

    const toggleDriver = async (id, active) => {
        try {
            await api.put(`/admin/drivers/${id}/status`, { is_active: !active })
            await loadData()
        } catch (err) { alert(err.message) }
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-2xl font-bold">Dashboard Admin</h1>
            </motion.div>

            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STAT_CARDS.map((card, i) => {
                    const value = stats?.[card.key] ?? '—'
                    return (
                        <motion.div
                            key={card.key}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className={`relative p-5 rounded-2xl bg-gradient-to-br ${card.gradient} border border-white/5 overflow-hidden`}
                        >
                            {/* Icon */}
                            <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center text-2xl mb-3`}>
                                {card.icon}
                            </div>
                            {/* Value */}
                            <p className={`text-3xl font-extrabold ${card.textColor}`}>
                                {card.isCurrency ? `Rp ${Number(value * 25000).toLocaleString('id-ID')}` : value}
                            </p>
                            <p className="text-txt-secondary text-sm mt-1">{card.label}</p>
                            {card.showPercent && (
                                <span className="absolute top-4 right-4 text-xs text-accent-green font-semibold">+12.5%</span>
                            )}
                        </motion.div>
                    )
                })}
            </div>

            {/* Bottom Section: Table + Map */}
            <div className="grid lg:grid-cols-5 gap-6">
                {/* Driver Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="lg:col-span-3 rounded-2xl glass-strong border border-white/5 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-5 border-b border-dark-border">
                        <h2 className="font-bold text-lg">Daftar Pengemudi</h2>
                        <span className="text-txt-muted text-sm">•••</span>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-dark-border text-left text-txt-secondary">
                                    <th className="p-4">#</th>
                                    <th className="p-4">Nama ↕</th>
                                    <th className="p-4">No HP ↕</th>
                                    <th className="p-4">Status</th>
                                    <th className="p-4">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    [...Array(5)].map((_, i) => (
                                        <tr key={i} className="border-b border-dark-border">
                                            {[...Array(5)].map((_, j) => (
                                                <td key={j} className="p-4"><div className="h-4 w-16 skeleton rounded" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : drivers.length === 0 ? (
                                    <tr><td colSpan={5} className="p-8 text-center text-txt-secondary">Belum ada pengemudi</td></tr>
                                ) : (
                                    drivers.slice(0, 8).map((d, i) => (
                                        <motion.tr
                                            key={d.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.6 + i * 0.05 }}
                                            className="border-b border-dark-border hover:bg-white/[0.02] transition-colors"
                                        >
                                            <td className="p-4 text-txt-muted">{i + 1}.</td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-primary flex items-center justify-center text-xs font-bold">
                                                        {d.avatar_url ? (
                                                            <img src={d.avatar_url} alt="" className="w-full h-full object-cover" />
                                                        ) : (
                                                            (d.name || '?')[0]
                                                        )}
                                                    </div>
                                                    <span className="font-medium">{d.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4 text-txt-secondary">{d.phone}</td>
                                            <td className="p-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${d.is_active
                                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                    }`}>
                                                    {d.is_active ? 'Aktif' : 'Suspend'}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleDriver(d.id, d.is_active)}
                                                        className={`text-xs font-medium ${d.is_active ? 'text-amber-400' : 'text-green-400'} hover:underline`}
                                                    >{d.is_active ? 'Suspend' : 'Aktifkan'}</button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>

                {/* Live Map */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="lg:col-span-2 rounded-2xl glass-strong border border-white/5 overflow-hidden"
                >
                    <div className="flex items-center justify-between p-5 border-b border-dark-border">
                        <h2 className="font-bold text-lg">Peta Lokasi Pengemudi</h2>
                        <span className="text-txt-muted text-sm">•••</span>
                    </div>
                    {/* Legend */}
                    <div className="flex gap-4 px-5 py-2 text-xs text-txt-secondary">
                        <span className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-green" /> Aktif
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Online
                        </span>
                        <span className="flex items-center gap-1">
                            <div className="w-2.5 h-2.5 rounded-full bg-accent-red" /> Sibuk
                        </span>
                    </div>
                    <div ref={mapRef} className="h-[350px] w-full" />
                </motion.div>
            </div>
        </div>
    )
}
