import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

const EMPTY_FORM = { name: '', email: '', phone: '', pin: '1234', vehicle_type: '', vehicle_plate: '', vehicle_color: '' }

export default function DriversPage() {
    const [drivers, setDrivers] = useState([])
    const [loading, setLoading] = useState(true)
    const [modalMode, setModalMode] = useState(null) // 'create' | 'edit' | null
    const [editId, setEditId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [search, setSearch] = useState('')

    useEffect(() => { loadDrivers() }, [])

    const loadDrivers = async () => {
        setLoading(true)
        try { setDrivers(await api.get('/admin/drivers')) }
        catch { setDrivers([]) }
        finally { setLoading(false) }
    }

    const openCreate = () => {
        setForm(EMPTY_FORM)
        setEditId(null)
        setError('')
        setModalMode('create')
    }

    const openEdit = (d) => {
        setForm({
            name: d.name || '', email: d.email || '', phone: d.phone || '', pin: '',
            vehicle_type: d.vehicle_type || '', vehicle_plate: d.vehicle_plate || '', vehicle_color: d.vehicle_color || '',
        })
        setEditId(d.id)
        setError('')
        setModalMode('edit')
    }

    const closeModal = () => { setModalMode(null); setEditId(null); setError('') }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)
        try {
            if (modalMode === 'create') {
                await api.post('/auth/register', {
                    name: form.name, email: form.email, phone: form.phone, pin: form.pin || '1234',
                    role: 'pengemudi',
                    vehicle_type: form.vehicle_type || null,
                    vehicle_plate: form.vehicle_plate || null,
                    vehicle_color: form.vehicle_color || null,
                })
            } else {
                const body = { name: form.name, email: form.email, phone: form.phone }
                if (form.pin) body.pin = form.pin
                if (form.vehicle_type) body.vehicle_type = form.vehicle_type
                if (form.vehicle_plate) body.vehicle_plate = form.vehicle_plate
                if (form.vehicle_color) body.vehicle_color = form.vehicle_color
                await api.put(`/admin/drivers/${editId}`, body)
            }
            closeModal()
            await loadDrivers()
        } catch (err) { setError(err.message) }
        finally { setSubmitting(false) }
    }

    const toggleStatus = async (id, active) => {
        try { await api.put(`/admin/drivers/${id}/status`, { is_active: !active }); await loadDrivers() }
        catch (err) { alert(err.message) }
    }

    const deleteDriver = async (id, name) => {
        if (!confirm(`Yakin ingin menghapus pengemudi "${name}"? Tindakan ini tidak dapat dibatalkan.`)) return
        try { await api.delete(`/admin/drivers/${id}`); await loadDrivers() }
        catch (err) { alert(err.message) }
    }

    const filtered = drivers.filter(d =>
        !search || d.name?.toLowerCase().includes(search.toLowerCase()) ||
        d.email?.toLowerCase().includes(search.toLowerCase()) ||
        d.phone?.includes(search) ||
        d.vehicle_plate?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Pengemudi</h1>
                    <p className="text-txt-secondary text-sm">{drivers.length} pengemudi terdaftar</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={openCreate}
                        className="px-5 py-2.5 rounded-xl bg-gradient-success text-white font-semibold text-sm shadow-glow-green active:scale-95 transition-transform"
                    >+ Tambah Pengemudi</button>
                    <button onClick={loadDrivers} className="glass px-4 py-2.5 rounded-xl text-sm">🔄</button>
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                    className="input-dark max-w-sm" placeholder="🔍 Cari nama, email, phone, plat..." />
            </div>

            {/* Driver Table */}
            <div className="rounded-2xl glass-strong border border-white/5 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-dark-border text-left text-txt-secondary">
                            <th className="p-4">#</th>
                            <th className="p-4">Nama</th>
                            <th className="p-4">Kendaraan</th>
                            <th className="p-4">Phone</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Aksi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            [...Array(5)].map((_, i) => (
                                <tr key={i} className="border-b border-dark-border">
                                    {[...Array(6)].map((_, j) => (
                                        <td key={j} className="p-4"><div className="h-4 w-20 skeleton rounded" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={6} className="p-8 text-center text-txt-secondary">
                                {search ? 'Tidak ditemukan' : 'Belum ada pengemudi. Klik + Tambah Pengemudi'}
                            </td></tr>
                        ) : (
                            filtered.map((d, i) => (
                                <motion.tr key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="border-b border-dark-border hover:bg-white/[0.02] transition-colors"
                                >
                                    <td className="p-4 text-txt-muted">{i + 1}</td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-gradient-primary flex items-center justify-center text-xs font-bold">
                                                {d.avatar_url ? (
                                                    <img src={d.avatar_url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (d.name || '?')[0]
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold">{d.name}</p>
                                                <p className="text-xs text-txt-muted">{d.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-txt-secondary">
                                        {d.vehicle_type ? (
                                            <div>
                                                <p className="font-medium text-white">{d.vehicle_type}</p>
                                                <p className="text-xs">{d.vehicle_plate} {d.vehicle_color ? `• ${d.vehicle_color}` : ''}</p>
                                            </div>
                                        ) : <span className="text-txt-muted">-</span>}
                                    </td>
                                    <td className="p-4 text-txt-secondary">{d.phone}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${d.is_active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                                            {d.is_active ? 'Aktif' : 'Suspend'}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5">
                                            <button onClick={() => openEdit(d)}
                                                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-accent-blue/20 text-accent-blue hover:bg-accent-blue/30 transition-all"
                                            >✏️ Edit</button>
                                            <button onClick={() => toggleStatus(d.id, d.is_active)}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${d.is_active
                                                    ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                                                    : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                    }`}
                                            >{d.is_active ? '⏸ Suspend' : '▶ Aktifkan'}</button>
                                            <button onClick={() => deleteDriver(d.id, d.name)}
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

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {modalMode && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                        onClick={closeModal}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md glass-strong rounded-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            <h2 className="text-xl font-bold mb-1">
                                {modalMode === 'create' ? 'Tambah Pengemudi Baru' : '✏️ Edit Pengemudi'}
                            </h2>
                            <p className="text-txt-secondary text-sm mb-5">
                                {modalMode === 'create' ? 'Daftarkan akun pengemudi/kurir. PIN default: 1234' : 'Update data pengemudi. Kosongkan PIN jika tidak ingin diubah.'}
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">Nama Lengkap</label>
                                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        className="input-dark" placeholder="Ahmad Fauzi" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">Email</label>
                                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        className="input-dark" placeholder="driver@transgo.id" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">No WhatsApp</label>
                                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                        className="input-dark" placeholder="081234567890" required />
                                </div>
                                <div>
                                    <label className="block text-sm text-txt-secondary mb-1.5">
                                        PIN {modalMode === 'edit' ? '(kosongkan jika tidak diubah)' : '(default: 1234)'}
                                    </label>
                                    <input type="text" value={form.pin} onChange={e => setForm(f => ({ ...f, pin: e.target.value }))}
                                        className="input-dark" placeholder={modalMode === 'edit' ? '••••' : '1234'}
                                        maxLength={6} {...(modalMode === 'create' ? { required: true } : {})} />
                                </div>

                                <div className="border-t border-dark-border pt-4 mt-2">
                                    <p className="text-sm font-semibold text-txt-secondary mb-3">🏍️ Info Kendaraan</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2">
                                            <input type="text" value={form.vehicle_type} onChange={e => setForm(f => ({ ...f, vehicle_type: e.target.value }))}
                                                className="input-dark" placeholder="Jenis (Honda Beat, Yamaha NMAX...)" />
                                        </div>
                                        <div>
                                            <input type="text" value={form.vehicle_plate} onChange={e => setForm(f => ({ ...f, vehicle_plate: e.target.value }))}
                                                className="input-dark" placeholder="Plat (B 1234 XYZ)" />
                                        </div>
                                        <div>
                                            <input type="text" value={form.vehicle_color} onChange={e => setForm(f => ({ ...f, vehicle_color: e.target.value }))}
                                                className="input-dark" placeholder="Warna (Hitam)" />
                                        </div>
                                    </div>
                                </div>

                                {error && <p className="text-accent-red text-sm">{error}</p>}

                                <div className="flex gap-3 pt-2">
                                    <button type="button" onClick={closeModal}
                                        className="flex-1 py-3 rounded-xl glass border border-dark-border text-txt-secondary font-semibold hover:text-white transition-colors"
                                    >Batal</button>
                                    <button type="submit" disabled={submitting}
                                        className="flex-1 py-3 rounded-xl bg-gradient-success text-white font-semibold shadow-glow-green disabled:opacity-50"
                                    >{submitting ? 'Memproses...' : modalMode === 'create' ? '✅ Daftarkan' : '💾 Simpan'}</button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
