import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ActiveRidePage from './pages/ActiveRidePage'
import HistoryPage from './pages/HistoryPage'
import SettingsPage from './pages/SettingsPage'

function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()
    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-dark-primary">
            <div className="w-16 h-16 rounded-2xl bg-gradient-success flex items-center justify-center animate-pulse">
                <span className="text-2xl">🚗</span>
            </div>
        </div>
    )
    if (!user) return <Navigate to="/login" replace />
    return children
}

export default function App() {
    return (
        <div className="h-screen bg-dark-primary">
            <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
                <Route path="/ride/:orderId" element={<ProtectedRoute><ActiveRidePage /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><HistoryPage /></ProtectedRoute>} />
                <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    )
}
