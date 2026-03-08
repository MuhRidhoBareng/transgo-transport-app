import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import HomePage from './pages/HomePage'
import OrderPage from './pages/OrderPage'
import TrackingPage from './pages/TrackingPage'
import HistoryPage from './pages/HistoryPage'
import ProfilePage from './pages/ProfilePage'

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return <LoadingScreen />
    if (!user) return <Navigate to="/login" replace />
    return children
}

function LoadingScreen() {
    return (
        <div className="h-screen flex items-center justify-center bg-dark-primary">
            <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center animate-pulse">
                    <span className="text-2xl">🚀</span>
                </div>
                <p className="text-txt-secondary animate-pulse">Memuat...</p>
            </div>
        </div>
    )
}

export default function App() {
    return (
        <div className="h-screen bg-dark-primary">
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/order" element={<ProtectedRoute><OrderPage /></ProtectedRoute>} />
                <Route path="/tracking/:orderId" element={<ProtectedRoute><TrackingPage /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    )
}
