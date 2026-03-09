import axios from '@/lib/axios'

/**
 * Obtiene la base URL del backend (sin /api/v1).
 */
function getBackendBaseUrl() {
    return (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '')
}

/**
 * Resuelve la URL de una imagen de publicidad a una URL absoluta que apunte al backend.
 * - URLs relativas (/storage/publicidad/xxx.jpg) → se les antepone la base del backend.
 * - URLs absolutas con /storage/ → se reescriben con la base correcta (por si APP_URL en Laravel
 *   no incluye el puerto, ej. http://localhost en vez de http://localhost:8000).
 */
export function resolvePublicidadUrl(url) {
    if (!url || typeof url !== 'string') return ''
    const base = getBackendBaseUrl()
    // Extraer la ruta /storage/... (relativa o absoluta)
    const storageMatch = url.match(/(\/storage\/[^\s]*)/)
    const path = storageMatch ? storageMatch[1] : (url.startsWith('/') ? url : '/' + url)
    return base + path
}

/**
 * Obtiene las imágenes de publicidad para el carrusel (ruta pública).
 */
export async function getPublicidad() {
    const res = await axios.get('/publicidad')
    const items = Array.isArray(res.data) ? res.data : []
    return items.map((p) => ({ ...p, url: resolvePublicidadUrl(p.url) }))
}
