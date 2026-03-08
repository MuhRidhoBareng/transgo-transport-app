import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

export default function ProfilePage() {
    const { user, setUser, logout } = useAuth()
    const navigate = useNavigate()
    const [notifEnabled, setNotifEnabled] = useState(true)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editForm, setEditForm] = useState({ name: user?.name || '', phone: user?.phone || '' })
    const [saving, setSaving] = useState(false)
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
        } catch (err) { alert(err.message) }
        finally { setUploading(false) }
    }

    const handleSaveProfile = async () => {
        setSaving(true)
        try {
            const updated = await api.put('/auth/profile', {
                name: editForm.name,
                phone: editForm.phone,
            })
            setUser(updated)
            setShowEditModal(false)
        } catch (err) { alert(err.message) }
        finally { setSaving(false) }
    }

    const Toggle = ({ value, onChange }) => (
        <button onClick={() => onChange(!value)}
            className={`w-12 h-7 rounded-full relative transition-all duration-300 ${value ? 'bg-accent-green' : 'bg-dark-border'}`}
        >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${value ? 'left-[22px]' : 'left-1'}`} />
        </button>
    )

    const menuItems = [
        { icon: '📋', label: 'Riwayat Pesanan', desc: 'Lihat pesanan sebelumnya', action: () => navigate('/history') },
        { icon: '🔔', label: 'Notifikasi', desc: 'Atur pemberitahuan', toggle: true },
        { icon: '❓', label: 'Bantuan', desc: 'Pusat bantuan & FAQ', action: () => { } },
        { icon: '📄', label: 'Syarat & Ketentuan', desc: 'Baca kebijakan layanan', action: () => { } },
    ]

    return (
        <div className="h-screen bg-dark-primary overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 z-10 glass-strong backdrop-blur-2xl p-4 pt-6 border-b border-dark-border">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="w-10 h-10 rounded-full glass flex items-center justify-center">←</button>
                    <h1 className="text-xl font-bold">Akun Saya</h1>
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
                                className="relative w-16 h-16 rounded-full overflow-hidden shadow-glow-purple focus:outline-none"
                            >
                                {avatarSrc ? (
                                    <img src={avatarSrc} alt="Avatar" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-2xl font-bold">
                                        {(user?.name || 'P')[0].toUpperCase()}
                                    </div>
                                )}
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
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">{user?.name || 'Penumpang'}</h3>
                            <p className="text-txt-secondary text-sm">{user?.email}</p>
                            <p className="text-txt-muted text-xs mt-0.5">{user?.phone || '-'}</p>
                        </div>
                        <button onClick={() => { setEditForm({ name: user?.name || '', phone: user?.phone || '' }); setShowEditModal(true) }}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium glass text-accent-blue hover:text-white transition-colors"
                        >Edit</button>
                    </div>
                </motion.div>

                {/* Quick Stats */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                    className="grid grid-cols-3 gap-3"
                >
                    {[
                        { label: 'Pesanan', value: '—', icon: '🛒' },
                        { label: 'Ojek', value: '—', icon: '🏍️' },
                        { label: 'Kurir', value: '—', icon: '📦' },
                    ].map((stat, i) => (
                        <div key={i} className="p-4 rounded-2xl glass border border-dark-border text-center">
                            <p className="text-xl mb-1">{stat.icon}</p>
                            <p className="text-lg font-bold">{stat.value}</p>
                            <p className="text-txt-muted text-xs">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>

                {/* Menu Items */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="rounded-2xl glass-strong border border-white/5 divide-y divide-dark-border"
                >
                    {menuItems.map((item, i) => (
                        <div key={i} onClick={item.toggle ? undefined : item.action}
                            className={`p-4 flex items-center justify-between ${!item.toggle ? 'cursor-pointer hover:bg-white/[0.02]' : ''} transition-colors`}
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-lg">{item.icon}</span>
                                <div>
                                    <p className="font-medium text-sm">{item.label}</p>
                                    <p className="text-txt-muted text-xs">{item.desc}</p>
                                </div>
                            </div>
                            {item.toggle ? (
                                <Toggle value={notifEnabled} onChange={setNotifEnabled} />
                            ) : (
                                <span className="text-txt-muted">›</span>
                            )}
                        </div>
                    ))}
                </motion.div>

                {/* App Info */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="rounded-2xl glass-strong border border-white/5 p-4"
                >
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-txt-secondary">Versi Aplikasi</p>
                        <p className="text-sm text-txt-muted">TransGo v1.0.0</p>
                    </div>
                </motion.div>

                {/* Logout */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <button onClick={logout}
                        className="w-full py-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 font-semibold hover:bg-red-500/20 transition-colors"
                    >🚪 Keluar</button>
                </motion.div>
            </div>

            {/* Edit Profile Modal */}
            <AnimatePresence>
                {showEditModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={() => setShowEditModal(false)}
                    >
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md glass-strong rounded-2xl border border-white/10 p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-4">Edit Profil</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">Nama</label>
                                    <input type="text" value={editForm.name}
                                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                                        className="input-dark" placeholder="Nama lengkap" />
                                </div>
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">No WhatsApp</label>
                                    <input type="tel" value={editForm.phone}
                                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                                        className="input-dark" placeholder="081234567890" />
                                </div>
                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setShowEditModal(false)}
                                        className="flex-1 py-3 rounded-xl glass border border-dark-border text-txt-secondary font-medium"
                                    >Batal</button>
                                    <button onClick={handleSaveProfile} disabled={saving}
                                        className="flex-1 py-3 rounded-xl bg-gradient-primary text-white font-semibold shadow-glow-purple disabled:opacity-50"
                                    >{saving ? 'Menyimpan...' : '💾 Simpan'}</button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
