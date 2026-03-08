import { useState } from 'react'
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { motion } from 'framer-motion'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DriversPage from './pages/DriversPage'
import PassengersPage from './pages/PassengersPage'
import OrdersPage from './pages/OrdersPage'

const NAV_ITEMS = [
    { path: '/', icon: '📊', label: 'Dashboard' },
    { path: '/drivers', icon: '🚗', label: 'Pengemudi' },
    { path: '/passengers', icon: '👥', label: 'Penumpang' },
    { path: '/orders', icon: '📋', label: 'Pesanan' },
]

function AdminLayout({ children }) {
    const { user, logout } = useAuth()
    const location = useLocation()

    return (
        <div className="h-screen flex bg-dark-primary">
            {/* Sidebar */}
            <aside className="w-64 glass-strong border-r border-dark-border flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-primary">
                        TransGo
                    </h1>
                    <p className="text-txt-muted text-xs">Admin Dashboard</p>
                </div>

                <nav className="flex-1 px-3 space-y-1">
                    {NAV_ITEMS.map(item => {
                        const active = location.pathname === item.path
                        return (
                            <Link key={item.path} to={item.path}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active
                                    ? 'bg-accent-purple/20 text-accent-purple'
                                    : 'text-txt-secondary hover:text-white hover:bg-dark-card'
                                    }`}
                            >
                                <span>{item.icon}</span>
                                <span>{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-dark-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-accent-purple/20 flex items-center justify-center">👤</div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{user?.name}</p>
                            <p className="text-xs text-txt-muted">Admin</p>
                        </div>
                        <button onClick={logout} className="text-txt-muted hover:text-white">🚪</button>
                    </div>
                </div>
            </aside>

            {/* Main */}
            <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
    )
}

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <div className="h-screen flex items-center justify-center bg-dark-primary">
        <div className="animate-pulse text-txt-secondary">Memuat...</div>
    </div>
    if (!user) return <Navigate to="/login" replace />
    return <AdminLayout>{children}</AdminLayout>
}

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/drivers" element={<ProtectedRoute><DriversPage /></ProtectedRoute>} />
            <Route path="/passengers" element={<ProtectedRoute><PassengersPage /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}
