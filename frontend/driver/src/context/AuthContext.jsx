import { createContext, useContext, useState, useEffect } from 'react'
import api from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const token = localStorage.getItem('token')
        if (token) {
            api.setToken(token)
            api.getMe()
                .then(u => setUser(u))
                .catch(() => { api.setToken(null); setUser(null) })
                .finally(() => setLoading(false))
        } else {
            setLoading(false)
        }
    }, [])

    const login = async (identifier, pin) => {
        const res = await api.login({ identifier, pin })
        api.setToken(res.access_token)
        setUser(res.user)
        return res.user
    }

    const register = async (data) => {
        const res = await api.register(data)
        api.setToken(res.access_token)
        setUser(res.user)
        return res.user
    }

    const logout = () => {
        api.setToken(null)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
