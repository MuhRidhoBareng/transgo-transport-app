/**
 * API Client - Axios-like fetch wrapper untuk backend.
 */
const API_BASE = '/api'

class ApiClient {
    constructor() {
        this.token = localStorage.getItem('token') || null
    }

    setToken(token) {
        this.token = token
        if (token) localStorage.setItem('token', token)
        else localStorage.removeItem('token')
    }

    async request(path, options = {}) {
        const headers = { 'Content-Type': 'application/json', ...options.headers }
        if (this.token) headers['Authorization'] = `Bearer ${this.token}`

        const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

        // Only redirect on 401 if we had a token (session expired), not during login
        if (res.status === 401 && this.token) {
            this.setToken(null)
            window.location.href = '/login'
            throw new Error('Sesi berakhir, silakan login ulang')
        }

        const data = res.headers.get('content-type')?.includes('json')
            ? await res.json() : null

        if (!res.ok) throw new Error(data?.detail || 'Terjadi kesalahan')
        return data
    }

    get(path) { return this.request(path) }
    post(path, body) { return this.request(path, { method: 'POST', body: JSON.stringify(body) }) }
    put(path, body) { return this.request(path, { method: 'PUT', body: JSON.stringify(body) }) }
    delete(path) { return this.request(path, { method: 'DELETE' }) }

    // Auth
    register(data) { return this.post('/auth/register', data) }
    login(data) { return this.post('/auth/login', data) }
    getMe() { return this.get('/auth/me') }

    // Orders
    estimateFare(data) { return this.post('/orders/estimate', data) }
    createOrder(data) { return this.post('/orders', data) }
    acceptOrder(id) { return this.post(`/orders/${id}/accept`) }
    startRide(id) { return this.post(`/orders/${id}/start`) }
    completeOrder(id) { return this.post(`/orders/${id}/complete`) }
    cancelOrder(id) { return this.post(`/orders/${id}/cancel`) }
    getActiveOrder() { return this.get('/orders/active') }
    getOrderHistory(page = 1, serviceType = null) {
        let url = `/orders/history?page=${page}`
        if (serviceType) url += `&service_type=${serviceType}`
        return this.get(url)
    }
}

export const api = new ApiClient()
export default api
