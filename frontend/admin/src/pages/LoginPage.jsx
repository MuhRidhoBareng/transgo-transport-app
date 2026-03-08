import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function LoginPage() {
    const [identifier, setIdentifier] = useState('')
    const [pin, setPin] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const { login } = useAuth()
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)
        try {
            const user = await login(identifier, pin)
            if (user.role !== 'admin') { setError('Akun ini bukan admin'); return }
            navigate('/')
        } catch (err) { setError(err.message) }
        finally { setLoading(false) }
    }

    return (
        <div className="h-screen relative overflow-hidden bg-dark-primary flex items-center justify-center">
            {/* Animated Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -left-40 w-96 h-96 rounded-full bg-accent-purple/8 blur-[120px] animate-pulse" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full bg-accent-blue/8 blur-[120px] animate-pulse" style={{ animationDelay: '1.5s' }} />
                <div className="absolute top-1/4 right-1/3 w-72 h-72 rounded-full bg-amber-500/5 blur-[100px] animate-pulse" style={{ animationDelay: '3s' }} />
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-[0.02]"
                style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-md px-6"
            >
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center mb-10"
                >
                    <div className="relative w-20 h-20 mx-auto mb-5">
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-accent-purple via-accent-blue to-accent-purple rotate-6 opacity-40 blur-lg" />
                        <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="url(#shieldGrad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <defs><linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#3B82F6" /></linearGradient></defs>
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            </svg>
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-purple via-white to-accent-blue">TransGo</span>
                    </h1>
                    <div className="flex items-center justify-center gap-3 mt-3">
                        <div className="h-px w-12 bg-gradient-to-r from-transparent to-accent-purple/40" />
                        <p className="text-txt-secondary text-xs font-bold tracking-[0.2em] uppercase">Admin Dashboard</p>
                        <div className="h-px w-12 bg-gradient-to-l from-transparent to-accent-blue/40" />
                    </div>
                </motion.div>

                {/* Login Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="p-8 rounded-3xl glass-strong border border-white/[0.08] backdrop-blur-2xl"
                >
                    <div className="text-center mb-6">
                        <h2 className="text-lg font-bold text-white">Masuk ke Dashboard</h2>
                        <p className="text-txt-muted text-xs mt-1">Kelola seluruh sistem TransGo</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
                        <div>
                            <label className="flex items-center gap-2 text-xs font-medium text-txt-secondary mb-2 uppercase tracking-wider">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
                                Email Admin
                            </label>
                            <input type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                                className="input-dark" placeholder="Masukkan email admin" autoComplete="off" required />
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-xs font-medium text-txt-secondary mb-2 uppercase tracking-wider">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                                PIN
                            </label>
                            <input type="password" value={pin} onChange={e => setPin(e.target.value)}
                                className="input-dark" placeholder="Masukkan PIN (6 digit)" autoComplete="new-password" maxLength={6} required />
                        </div>

                        {error && (
                            <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20"
                            >
                                <p className="text-red-400 text-sm text-center">{error}</p>
                            </motion.div>
                        )}

                        <button type="submit" disabled={loading}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-accent-purple via-accent-blue to-accent-purple bg-[length:200%_100%] hover:bg-right text-white font-bold text-base shadow-glow-purple hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Memverifikasi...
                                </span>
                            ) : 'Masuk ke Dashboard'}
                        </button>
                    </form>

                    <div className="mt-5 pt-4 border-t border-dark-border">
                        <p className="text-center text-txt-muted text-[10px] tracking-wider uppercase">
                            Akses terbatas — hanya untuk administrator
                        </p>
                    </div>
                </motion.div>

                {/* Security Badge */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center justify-center gap-2 mt-6 text-txt-muted text-xs"
                >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
                    <span>Koneksi terenkripsi</span>
                </motion.div>
            </motion.div>
        </div>
    )
}
