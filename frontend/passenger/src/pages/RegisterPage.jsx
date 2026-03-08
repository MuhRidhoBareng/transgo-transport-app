import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', phone: '', pin: '', role: 'penumpang' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { register } = useAuth()
    const navigate = useNavigate()

    const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            await register(form)
            navigate('/')
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="h-screen flex flex-col items-center justify-center p-6 bg-dark-primary overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-sm py-8"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold">Buat Akun Baru</h1>
                    <p className="text-txt-secondary mt-1">Gabung ke TransGo sekarang</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm text-txt-secondary mb-1.5">Nama Lengkap</label>
                        <input
                            type="text" value={form.name} onChange={e => update('name', e.target.value)}
                            className="input-dark" placeholder="Ahmad Fauzi" required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-txt-secondary mb-1.5">Email</label>
                        <input
                            type="email" value={form.email} onChange={e => update('email', e.target.value)}
                            className="input-dark" placeholder="email@contoh.com" required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-txt-secondary mb-1.5">No WhatsApp</label>
                        <input
                            type="tel" value={form.phone} onChange={e => update('phone', e.target.value)}
                            className="input-dark" placeholder="081234567890" required
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-txt-secondary mb-1.5">PIN (4-6 digit)</label>
                        <input
                            type="password" value={form.pin} onChange={e => update('pin', e.target.value)}
                            className="input-dark" placeholder="••••" maxLength={6} minLength={4} required
                        />
                    </div>

                    {error && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-accent-red text-sm text-center">{error}</motion.p>
                    )}

                    <button type="submit" disabled={loading}
                        className="btn-primary w-full disabled:opacity-50"
                    >
                        {loading ? 'Memuat...' : 'Daftar'}
                    </button>
                </form>

                <p className="text-center text-txt-secondary mt-6 text-sm">
                    Sudah punya akun?{' '}
                    <Link to="/login" className="text-accent-purple font-semibold hover:underline">Masuk</Link>
                </p>
            </motion.div>
        </div>
    )
}
