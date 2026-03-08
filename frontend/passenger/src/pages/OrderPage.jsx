import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../lib/api'

export default function OrderPage() {
    const { state } = useLocation()
    const navigate = useNavigate()
    const serviceType = state?.serviceType || 'ojek'
    const isKurir = serviceType === 'kurir'

    const [step, setStep] = useState('input') // input | estimate | loading
    const [form, setForm] = useState({
        pickup_address: state?.pickupAddress || '',
        pickup_lat: state?.pickupLat || -6.2788,
        pickup_lng: state?.pickupLng || 106.7105,
        destination_address: state?.destAddress || '',
        destination_lat: state?.destLat || '',
        destination_lng: state?.destLng || '',
        item_description: '', item_weight_kg: '', recipient_name: '', recipient_phone: '',
    })
    const [estimate, setEstimate] = useState(null)
    const [error, setError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [geocoding, setGeocoding] = useState(false)

    // Geocode suggestions
    const [pickupSuggestions, setPickupSuggestions] = useState([])
    const [destSuggestions, setDestSuggestions] = useState([])
    const pickupTimer = useRef(null)
    const destTimer = useRef(null)

    const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

    // Debounced geocode search
    const searchAddress = async (query, setter) => {
        if (!query || query.length < 3) { setter([]); return }
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=id&limit=5`)
            const data = await res.json()
            setter(data.map(d => ({
                display: d.display_name.split(',').slice(0, 3).join(','),
                full: d.display_name,
                lat: parseFloat(d.lat),
                lng: parseFloat(d.lon),
            })))
        } catch { setter([]) }
    }

    const handlePickupChange = (val) => {
        update('pickup_address', val)
        clearTimeout(pickupTimer.current)
        pickupTimer.current = setTimeout(() => searchAddress(val, setPickupSuggestions), 500)
    }

    const handleDestChange = (val) => {
        update('destination_address', val)
        clearTimeout(destTimer.current)
        destTimer.current = setTimeout(() => searchAddress(val, setDestSuggestions), 500)
    }

    const selectPickup = (s) => {
        setForm(f => ({ ...f, pickup_address: s.display, pickup_lat: s.lat, pickup_lng: s.lng }))
        setPickupSuggestions([])
    }

    const selectDest = (s) => {
        setForm(f => ({ ...f, destination_address: s.display, destination_lat: s.lat, destination_lng: s.lng }))
        setDestSuggestions([])
    }

    // Get user's current GPS for pickup if not provided via state
    useEffect(() => {
        if (state?.pickupLat) return // already have coords from HomePage
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    update('pickup_lat', pos.coords.latitude)
                    update('pickup_lng', pos.coords.longitude)
                },
                () => { }
            )
        }
    }, [])

    const getEstimate = async () => {
        setError('')
        if (!form.pickup_address || !form.destination_address) {
            setError('Isi alamat jemput dan tujuan')
            return
        }
        if (!form.destination_lat || !form.destination_lng) {
            setError('Pilih alamat tujuan dari daftar saran')
            return
        }
        try {
            setStep('loading')
            const res = await api.estimateFare({
                service_type: serviceType,
                pickup_lat: form.pickup_lat,
                pickup_lng: form.pickup_lng,
                destination_lat: form.destination_lat,
                destination_lng: form.destination_lng,
                item_weight_kg: form.item_weight_kg ? parseFloat(form.item_weight_kg) : null,
            })
            setEstimate(res)
            setStep('estimate')
        } catch (err) {
            setError(err.message)
            setStep('input')
        }
    }

    const placeOrder = async () => {
        setSubmitting(true)
        try {
            const order = await api.createOrder({
                service_type: serviceType,
                pickup_address: form.pickup_address,
                pickup_lat: form.pickup_lat,
                pickup_lng: form.pickup_lng,
                destination_address: form.destination_address,
                destination_lat: form.destination_lat,
                destination_lng: form.destination_lng,
                ...(isKurir && {
                    item_description: form.item_description,
                    item_weight_kg: form.item_weight_kg ? parseFloat(form.item_weight_kg) : null,
                    recipient_name: form.recipient_name,
                    recipient_phone: form.recipient_phone,
                }),
            })
            navigate(`/tracking/${order.id}`)
        } catch (err) {
            setError(err.message)
            setSubmitting(false)
        }
    }

    const formatCurrency = (n) => `Rp ${Number(n).toLocaleString('id-ID')}`

    const SuggestionList = ({ items, onSelect }) => items.length > 0 && (
        <div className="rounded-xl glass border border-dark-border overflow-hidden mt-1 max-h-40 overflow-y-auto">
            {items.map((s, i) => (
                <button key={i} onClick={() => onSelect(s)}
                    className="w-full text-left px-3 py-2.5 text-sm text-txt-secondary hover:bg-white/5 hover:text-white transition-colors border-b border-dark-border last:border-0 flex items-center gap-2"
                >
                    <span className="text-accent-blue">📍</span>
                    <span className="truncate">{s.display}</span>
                </button>
            ))}
        </div>
    )

    return (
        <div className="h-screen flex flex-col bg-dark-primary">
            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                className="flex items-center gap-3 p-4 pt-6"
            >
                <button onClick={() => navigate(-1)}
                    className="w-10 h-10 rounded-xl glass flex items-center justify-center"
                >←</button>
                <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${isKurir ? 'bg-amber-500/20 text-amber-400' : 'bg-accent-purple/20 text-accent-purple'}`}>
                        {isKurir ? '📦 Kurir' : '🏍️ Ojek'}
                    </span>
                    <h1 className="font-bold text-lg">{isKurir ? 'Kirim Barang' : 'Pesan Ojek'}</h1>
                </div>
            </motion.header>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence mode="wait">
                    {step === 'input' && (
                        <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            {/* Pickup */}
                            <div className="p-4 rounded-2xl glass-strong space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-accent-green" />
                                    <span className="text-sm font-semibold text-txt-secondary">Titik Jemput</span>
                                </div>
                                <input value={form.pickup_address} onChange={e => handlePickupChange(e.target.value)}
                                    className="input-dark" placeholder="Ketik alamat jemput..." />
                                <SuggestionList items={pickupSuggestions} onSelect={selectPickup} />
                                {form.pickup_lat && (
                                    <p className="text-[10px] text-txt-muted">📍 {Number(form.pickup_lat).toFixed(5)}, {Number(form.pickup_lng).toFixed(5)}</p>
                                )}
                            </div>

                            {/* Destination */}
                            <div className="p-4 rounded-2xl glass-strong space-y-2">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-3 h-3 rounded-full bg-accent-red" />
                                    <span className="text-sm font-semibold text-txt-secondary">Tujuan</span>
                                </div>
                                <input value={form.destination_address} onChange={e => handleDestChange(e.target.value)}
                                    className="input-dark" placeholder="Ketik alamat tujuan..." />
                                <SuggestionList items={destSuggestions} onSelect={selectDest} />
                                {form.destination_lat && (
                                    <p className="text-[10px] text-txt-muted">📍 {Number(form.destination_lat).toFixed(5)}, {Number(form.destination_lng).toFixed(5)}</p>
                                )}
                            </div>

                            {/* Kurir Fields */}
                            {isKurir && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                    className="p-4 rounded-2xl glass-strong space-y-3"
                                >
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-semibold text-amber-400">📦 Detail Barang</span>
                                    </div>
                                    <input value={form.item_description} onChange={e => update('item_description', e.target.value)}
                                        className="input-dark" placeholder="Deskripsi barang (misal: Dokumen penting)" />
                                    <input type="number" step="0.1" value={form.item_weight_kg} onChange={e => update('item_weight_kg', e.target.value)}
                                        className="input-dark" placeholder="Berat barang (KG, opsional)" />
                                    <input value={form.recipient_name} onChange={e => update('recipient_name', e.target.value)}
                                        className="input-dark" placeholder="Nama penerima *" required />
                                    <input type="tel" value={form.recipient_phone} onChange={e => update('recipient_phone', e.target.value)}
                                        className="input-dark" placeholder="No HP penerima *" required />
                                </motion.div>
                            )}

                            {error && <p className="text-accent-red text-sm text-center">{error}</p>}

                            <button onClick={getEstimate}
                                className={`${isKurir ? 'btn-kurir' : 'btn-primary'} w-full`}
                            >
                                Lihat Estimasi Harga
                            </button>
                        </motion.div>
                    )}

                    {step === 'loading' && (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="flex flex-col items-center justify-center py-20"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gradient-primary flex items-center justify-center animate-pulse mb-4 shadow-glow-purple">
                                <span className="text-3xl">{isKurir ? '📦' : '🏍️'}</span>
                            </div>
                            <p className="text-txt-secondary animate-pulse">Menghitung estimasi...</p>
                        </motion.div>
                    )}

                    {step === 'estimate' && estimate && (
                        <motion.div key="estimate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                            {/* Estimate Card */}
                            <div className="p-6 rounded-2xl glass-strong text-center">
                                <p className="text-txt-secondary text-sm mb-2">Estimasi Tarif</p>
                                <p className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-primary">
                                    {formatCurrency(estimate.fare)}
                                </p>
                                <div className="flex justify-center gap-6 mt-4 text-sm text-txt-secondary">
                                    <div>
                                        <p className="font-semibold text-white">{estimate.distance_km} KM</p>
                                        <p>Jarak</p>
                                    </div>
                                    {estimate.duration_minutes && (
                                        <div>
                                            <p className="font-semibold text-white">{estimate.duration_minutes} mnt</p>
                                            <p>Waktu</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Route Summary */}
                            <div className="p-4 rounded-2xl glass space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                                    <span className="text-txt-secondary">{form.pickup_address}</span>
                                </div>
                                <div className="ml-1 border-l border-dashed border-dark-border h-4" />
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full bg-accent-red" />
                                    <span className="text-txt-secondary">{form.destination_address}</span>
                                </div>
                            </div>

                            {/* Breakdown */}
                            <div className="p-4 rounded-2xl glass text-sm space-y-1">
                                <p className="font-semibold mb-2">Rincian</p>
                                <div className="flex justify-between"><span className="text-txt-secondary">Tarif dasar</span><span>{formatCurrency(estimate.breakdown?.base_fare)}</span></div>
                                <div className="flex justify-between"><span className="text-txt-secondary">Jarak ({estimate.distance_km} KM × {formatCurrency(estimate.breakdown?.rate_per_km)}/KM)</span><span>{formatCurrency(estimate.breakdown?.distance_cost)}</span></div>
                                {estimate.breakdown?.weight_surcharge > 0 && (
                                    <div className="flex justify-between"><span className="text-amber-400">Kelebihan berat</span><span>{formatCurrency(estimate.breakdown.weight_surcharge)}</span></div>
                                )}
                            </div>

                            {error && <p className="text-accent-red text-sm text-center">{error}</p>}

                            <div className="flex gap-3">
                                <button onClick={() => setStep('input')} className="btn-danger flex-1">Ubah</button>
                                <button onClick={placeOrder} disabled={submitting}
                                    className={`${isKurir ? 'btn-kurir' : 'btn-primary'} flex-1 disabled:opacity-50`}
                                >
                                    {submitting ? 'Memproses...' : isKurir ? '📦 Kirim Sekarang' : '🏍️ Pesan Sekarang'}
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
