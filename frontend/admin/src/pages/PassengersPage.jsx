import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

const EMPTY_FORM = { name: '', email: '', phone: '', pin: '' }

export default function PassengersPage() {
    const [passengers, setPassengers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [modalMode, setModalMode] = useState(null) // 'edit' | null
    const [editId, setEditId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => { loadPassengers() }, [])

    const loadPassengers = async () => {
        setLoading(true)
        try { setPassengers(await api.get('/admin/passengers')) }
        catch { setPassengers([]) }
        finally { setLoading(false) }
    }

    const openEdit = (p) => {
        setForm({ name: p.name || '', email: p.email || '', phone: p.phone || '', pin: '' })
        setEditId(p.id)
        setError('')
        setModalMode('edit')
    }

    const closeModal = () => { setModalMode(null); setEditId(null); setError('') }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            const body = { name: form.name, email: form.email, phone: form.phone }
            if (form.pin) body.pin = form.pin
            await api.put(`/admin/passengers/${editId}`, body)
            closeModal()
            await loadPassengers()
        } catch (err) { setError(err.message) }
        finally { setSubmitting(false) }
    }

    const toggleStatus = async (id, active) => {
        try { await api.put(`/admin/passengers/${id}/status`, { is_active: !active }); await loadPassengers() }
        catch (err) { alert(err.message) }
    }

    const deletePassenger = async (id, name) => {
        if (!confirm(`Yakin ingin menghapus akun penumpang "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
        try { await api.delete(`/admin/passengers/${id}`); await loadPassengers() }
        catch (err) { alert(err.message) }
    }

    const filtered = passengers.filter(p =>
        !search || p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.email?.toLowerCase().includes(search.toLowerCase()) ||
        p.phone?.includes(search)
    )

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Penumpang</h1>
                    <p className="text-txt-secondary text-sm">{passengers.length} penumpang terdaftar</p>
                </div>
                <button onClick={loadPassengers} className="glass px-4 py-2.5 rounded-xl text-sm">🔄</button>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    className="input-dark max-w-sm" placeholder="🔍 Cari nama, email, atau no HP..." />
            </div>

            {/* Table */}
            <div className="rounded-2xl glass-strong border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-dark-border text-left text-txt-secondary">
                            <th className="p-4">#</th>
                            <th className="p-4">Nama</th>
                            <th className="p-4">Email</th>
                            <th className="p-4">No HP</th>
                            <th className="p-4">Bergabung</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-dark-border">
                                    {[...Array(7)].map((_, j) => (
                                        <td key={j} className="p-4"><div className="h-4 w-20 skeleton rounded" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={7} className="p-8 text-center text-txt-secondary">
                                {search ? 'Tidak ditemukan' : 'Belum ada penumpang terdaftar'}
                            </td></tr>
                        ) : (
                            filtered.map((p, i) => (
                                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-dark-border hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="p-4 text-txt-muted">{i + 1}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-primary flex items-center justify-center text-xs font-bold">
                                                {p.avatar_url ? (
                                                    <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (p.name || '?')[0]
                                                )}
                                            </div>
                                            <span className="font-semibold">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-txt-secondary">{p.email}</td>
                                    <td className="p-4 text-txt-secondary">{p.phone || '-'}</td>
                                    <td className="p-4 text-txt-muted text-xs">
                                        {p.created_at ? new Date(p.created_at).toLocaleDateString('id-ID') : '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${p.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {p.is_active ? 'Aktif' : 'Suspend'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => openEdit(p)}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 transition-all"
                                            >✏️ Edit</button>
                                            <button onClick={() => toggleStatus(p.id, p.is_active)}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${p.is_active
                                                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    }`}
                                            >{p.is_active ? '⏸ Suspend' : '▶ Aktifkan'}</button>
                                            <button onClick={() => deletePassenger(p.id, p.name)}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all"
                                            >🗑️</button>
                                        </div>
                                    </td>
                                </motion.tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {modalMode && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md glass-strong rounded-2xl border border-white/10 p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-1">✏️ Edit Penumpang</h2>
                            <p className="text-txt-secondary text-sm mb-5">Update data penumpang. Kosongkan PIN jika tidak ingin diubah.</p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">Nama Lengkap</label>
                                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="input-dark" placeholder="Nama lengkap" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">Email</label>
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className="input-dark" placeholder="email@example.com" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">No HP</label>
                                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        className="input-dark" placeholder="081234567890" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">PIN (kosongkan jika tidak diubah)</label>
                                    <input type="text" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                                        className="input-dark" placeholder="••••" maxLength={6} />
                                </div>

                                {error && <p className="text-accent-red text-sm">{error}</p>}

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={closeModal}
                                        className="flex-1 py-3 rounded-xl glass border border-dark-border text-txt-secondary font-semibold hover:text-white transition-colors"
                                    >Batal</button>
                                    <button type="submit" disabled={submitting}
                                        className="flex-1 py-3 rounded-xl bg-gradient-success text-white font-semibold shadow-glow-green disabled:opacity-50"
                                    >{submitting ? 'Memproses...' : '💾 Simpan'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    )
}
