import axios from '@/lib/axios'

const SESSION_ID_KEY = 'busqueda_session_id'

/** Base URL para llamadas desde el servidor (SSR). */
const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/v1'

/**
 * Búsqueda desde el servidor (Server Components). No usa session_id.
 * Respuesta: { busqueda_id, texto_original, texto_normalizado, correccion_aplicada, productos }
 */
export async function getBusquedaForSSR(q) {
    const query = typeof q === 'string' ? q.trim() : ''
    if (!query) {
        return {
            busqueda_id: 0,
            texto_original: '',
            texto_normalizado: '',
            correccion_aplicada: false,
            productos: [],
        }
    }
    try {
        const url = `${BASE}/busqueda?q=${encodeURIComponent(query)}`
        const res = await fetch(url, { next: { revalidate: 30 } })
        const data = await res.json()
        if (data?.success && data?.data) return data.data
        return {
            busqueda_id: 0,
            texto_original: query,
            texto_normalizado: query,
            correccion_aplicada: false,
            productos: [],
        }
    } catch {
        return {
            busqueda_id: 0,
            texto_original: query,
            texto_normalizado: query,
            correccion_aplicada: false,
            productos: [],
        }
    }
}

/**
 * Obtiene o genera un session_id para búsquedas (invitados).
 * Se usa para agrupar búsquedas por sesión sin requerir login.
 */
export function getBusquedaSessionId() {
    if (typeof window === 'undefined') return null
    try {
        let id = sessionStorage.getItem(SESSION_ID_KEY)
        if (!id) {
            id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
            sessionStorage.setItem(SESSION_ID_KEY, id)
        }
        return id
    } catch {
        return null
    }
}

/**
 * Búsqueda tolerante a errores.
 * Respuesta: { busqueda_id, texto_original, texto_normalizado, correccion_aplicada, productos }
 */
export async function getBusqueda(q, sessionId = null) {
    const params = { q: typeof q === 'string' ? q.trim() : '' }
    if (sessionId) params.session_id = sessionId
    const { data } = await axios.get('/busqueda', { params })
    if (data?.success && data?.data) return data.data
    return {
        busqueda_id: 0,
        texto_original: '',
        texto_normalizado: '',
        correccion_aplicada: false,
        productos: [],
    }
}

/**
 * Registra que el usuario hizo clic en un producto dentro de los resultados de una búsqueda.
 */
export async function registrarSeleccionBusqueda(busquedaId, productoClave) {
    if (!busquedaId || !productoClave) return
    try {
        await axios.post('/busqueda/seleccion', {
            busqueda_id: Number(busquedaId),
            producto_clave: String(productoClave).trim(),
        })
    } catch {
        // Fire-and-forget: no bloquear navegación ni mostrar error al usuario
    }
}
