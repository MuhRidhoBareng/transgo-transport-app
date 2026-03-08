import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'
import api from '../lib/api'

export default function SettingsPage() {
    const { user, setUser, logout } = useAuth()
    const navigate = useNavigate()
    const [notifEnabled, setNotifEnabled] = useState(true)
    const [soundEnabled, setSoundEnabled] = useState(true)
    const [autoAccept, setAutoAccept] = useState(false)
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef(null)

    const avatarSrc = user?.avatar_url || null

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        try {
            const updated = await api.uploadAvatar(file)
            setUser(updated)
        } catch (err) {
            alert(err.message)
        } finally {
            setUploading(false)
        }
    }

    const Toggle = ({ value, onChange }) => (
        <button onClick={() => onChange(!value)}
            className={`w-12 h-7 rounded-full relative transition-all duration-300 ${value ? 'bg-accent-green' : 'bg-dark-border'}`}
        >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${value ? 'left-[22px]' : 'left-1'}`} />
        </button>
    )

    return (
        <div className="h-screen bg-dark-primary overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 glass-strong backdrop-blur-2xl p-4 pt-6 border-b border-dark-border">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full glass flex items-center justify-center">←</button>
                    <h1 className="text-xl font-bold">Pengaturan</h1>
                </div>
            </div>

            <div className="p-4 space-y-4 pb-20">
                {/* Profile Card */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl glass-strong border border-white/5"
                >
                    <div className="flex items-center gap-4">
                        {/* Avatar with upload */}
                        <div className="relative group">
                            <input type="file" ref={fileRef} className="hidden" accept="image/*"
                                onChange={handleAvatarChange} />
                            <button onClick={() => fileRef.current?.click()} disabled={uploading}
                                className="relative w-16 h-16 rounded-full overflow-hidden shadow-glow-green focus:outline-none"
                            >
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-success flex items-center justify-center text-2xl font-bold">
                                        {(user?.name || 'D')[0].toUpperCase()}
                                    </div>
                                )}
                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-xs">📷</span>
                                </div>
                                {uploading && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    </div>
                                )}
                            </button>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">{user?.name || 'Driver'}</h3>
                            <p className="text-txt-secondary text-sm">{user?.email}</p>
                            <p className="text-txt-muted text-xs mt-1">{user?.phone}</p>
                        </div>
                    </div>
                    {/* Vehicle info */}
                    {user?.vehicle_type && (
                        <div className="mt-3 pt-3 border-t border-dark-border flex items-center gap-2 text-sm">
                            <span>🏍️</span>
                            <span className="font-medium text-accent-green">{user.vehicle_type}</span>
                            {user.vehicle_plate && <span className="text-txt-muted">• {user.vehicle_plate}</span>}
                            {user.vehicle_color && <span className="text-txt-muted">• {user.vehicle_color}</span>}
                        </div>
                    )}
                </motion.div>

                {/* Notification Settings */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="rounded-2xl glass-strong border border-white/5 divide-y divide-dark-border"
                >
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Notifikasi Pesanan</p>
                            <p className="text-txt-muted text-xs">Pemberitahuan saat ada pesanan baru</p>
                        </div>
                        <Toggle value={notifEnabled} onChange={setNotifEnabled} />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Suara Notifikasi</p>
                            <p className="text-txt-muted text-xs">Bunyi saat pesanan masuk</p>
                        </div>
                        <Toggle value={soundEnabled} onChange={setSoundEnabled} />
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium text-sm">Auto-accept Pesanan</p>
                            <p className="text-txt-muted text-xs">Terima pesanan secara otomatis</p>
                        </div>
                        <Toggle value={autoAccept} onChange={setAutoAccept} />
                    </div>
                </motion.div>

                {/* About */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl glass-strong border border-white/5 divide-y divide-dark-border"
                >
                    <div className="p-4">
                        <p className="font-medium text-sm">Layanan Aktif</p>
                        <div className="flex gap-2 mt-2">
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-accent-purple/20 text-accent-purple">🏍️ Ojek</span>
                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400">📦 Kurir</span>
                        </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                        <p className="text-sm text-txt-secondary">Versi Aplikasi</p>
                        <p className="text-sm text-txt-muted">v1.0.0</p>
                    </div>
                </motion.div>

                {/* Logout */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <button onClick={logout}
                        className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold hover:bg-red-500/20 transition-colors"
                    >🚪 Keluar</button>
                </motion.div>
            </div>
        </div>
    )
}
