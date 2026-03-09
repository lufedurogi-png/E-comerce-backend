import axios from '@/lib/axios'

const VISTOS_RECIENTES_PREFIX = 'tienda_vistos_recientes_'

/**
 * Resuelve URLs de storage (/storage/productos/, /storage/publicidad/, etc.) para que apunten
 * al backend correcto. Necesario cuando APP_URL en Laravel no incluye el puerto.
 */
export function resolveStorageUrl(url) {
    if (!url || typeof url !== 'string') return url
    if (!url.includes('/storage/')) return url
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '')
    const m = url.match(/(\/storage\/[^\s]*)/)
    const path = m ? m[1] : (url.startsWith('/') ? url : '/' + url)
    return base + path
}

function resolvePublicidadUrlForSSR(url) {
    if (!url || typeof url !== 'string') return ''
    const base = (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/v1').replace(/\/api\/v1\/?$/, '')
    const m = url.match(/(\/storage\/[^\s]*)/)
    const path = m ? m[1] : (url.startsWith('/') ? url : '/' + url)
    return base + path
}

/** Fetch de datos de tienda en el servidor (SSR) para que la página cargue al instante con datos de la BD */
export async function getTiendaDataForSSR() {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/v1'
    try {
        const opts = { next: { revalidate: 60 } }
        const [estadoRes, destRes, ultRes, catRes, marcasRes, publicidadRes] = await Promise.all([
            fetch(`${base}/productos/estado`, opts),
            fetch(`${base}/productos/destacados?limit=8`, opts),
            fetch(`${base}/productos/ultimos?limit=8`, opts),
            fetch(`${base}/catalogos/categorias-principales`, opts),
            fetch(`${base}/catalogos/marcas`, opts),
            fetch(`${base}/publicidad`, opts),
        ])
        const estado = await estadoRes.json()
        const dest = await destRes.json()
        const ult = await ultRes.json()
        const cat = await catRes.json()
        const marcas = await marcasRes.json()
        const publicidadRaw = await publicidadRes.json()
        const catalogDisponible = estado?.data?.disponible ?? false
        const publicidad = Array.isArray(publicidadRaw)
            ? publicidadRaw.map((p) => ({ ...p, url: resolvePublicidadUrlForSSR(p.url) }))
            : []
        return {
            catalogDisponible,
            destacados: dest?.success && Array.isArray(dest?.data) ? dest.data : [],
            ultimos: ult?.success && Array.isArray(ult?.data) ? ult.data : [],
            categoriasPrincipales: cat?.success && Array.isArray(cat?.data) ? cat.data : [],
            marcas: marcas?.success && Array.isArray(marcas?.data) ? marcas.data : [],
            publicidad,
        }
    } catch {
        return {
            catalogDisponible: false,
            destacados: [],
            ultimos: [],
            categoriasPrincipales: [],
            marcas: [],
            publicidad: [],
        }
    }
}

/** Fetch de productos y marcas para vista de subcategoría (SSR) - carga al instante */
export async function getSubcategoriaDataForSSR(categoria, subcategoria) {
    const base = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/v1'
    if (!categoria || !subcategoria) {
        return { catalogDisponible: false, productos: [], marcas: [] }
    }
    try {
        const isVerTodo = subcategoria === 'ver-todo'
        const params = new URLSearchParams()
        if (isVerTodo) params.set('categoria_principal', categoria)
        else params.set('grupo', subcategoria)
        params.set('per_page', '48')

        const marcasUrl = isVerTodo
            ? `${base}/catalogos/marcas?categoria_principal=${encodeURIComponent(categoria)}`
            : `${base}/catalogos/marcas?grupo=${encodeURIComponent(subcategoria)}`
        const [estadoRes, productosRes, marcasRes] = await Promise.all([
            fetch(`${base}/productos/estado`, { cache: 'no-store' }),
            fetch(`${base}/productos?${params.toString()}`, { cache: 'no-store' }),
            fetch(marcasUrl, { cache: 'no-store' }),
        ])
        const estado = await estadoRes.json()
        const productosData = await productosRes.json()
        const marcasData = await marcasRes.json()
        const catalogDisponible = estado?.data?.disponible ?? false
        const productos = productosData?.success && productosData?.data?.productos
            ? productosData.data.productos
            : []
        const marcas = marcasData?.success && Array.isArray(marcasData?.data) ? marcasData.data : []
        return { catalogDisponible, productos, marcas }
    } catch {
        return { catalogDisponible: false, productos: [], marcas: [] }
    }
}

const MAX_VISTOS = 8

export async function getCatalogEstado() {
    const { data } = await axios.get('/productos/estado')
    return data?.data ?? { configurado: false, total_productos: 0, disponible: false }
}

export async function getDestacados(limit = 8) {
    const { data } = await axios.get('/productos/destacados', { params: { limit } })
    if (data?.success && Array.isArray(data?.data)) return data.data
    return []
}

export async function getUltimos(limit = 8) {
    const { data } = await axios.get('/productos/ultimos', { params: { limit } })
    if (data?.success && Array.isArray(data?.data)) return data.data
    return []
}

export async function getPorClaves(claves) {
    if (!claves?.length) return []
    const { data } = await axios.get('/productos/por-claves', { params: { claves: claves.join(',') } })
    if (data?.success && Array.isArray(data?.data)) return data.data
    return []
}

/** Misma data que getPorClaves pero pide en chunks en paralelo para que lleguen antes (1–2 s los primeros). */
const CHUNK_SIZE = 6
export async function getPorClavesChunked(claves) {
    if (!claves?.length) return []
    const chunks = []
    for (let i = 0; i < claves.length; i += CHUNK_SIZE) {
        chunks.push(claves.slice(i, i + CHUNK_SIZE))
    }
    const results = await Promise.all(chunks.map((c) => getPorClaves(c)))
    return results.flat()
}

export async function getRecomendados(clavesVistos = [], limit = 8) {
    const params = { limit }
    if (clavesVistos?.length) params.claves = clavesVistos.join(',')
    const { data } = await axios.get('/productos/recomendados', { params })
    if (data?.success && Array.isArray(data?.data)) return data.data
    return []
}

export async function getProductos(filters = {}) {
    const { filtros, ...rest } = filters
    const params = { ...rest }
    if (filtros && typeof filtros === 'object' && Object.keys(filtros).length > 0) {
        Object.entries(filtros).forEach(([k, v]) => {
            if (v != null && String(v).trim() !== '') params[`filtros[${k}]`] = v
        })
    }
    const { data } = await axios.get('/productos', { params })
    if (data?.success && data?.data) return data.data
    return { productos: [], total: 0, per_page: 36, current_page: 1, last_page: 1 }
}

export async function getProductoByClave(clave) {
    try {
        const { data } = await axios.get(`/productos/${encodeURIComponent(clave)}`)
        if (data?.success && data?.data) return data.data
    } catch (err) {
        if (err.response?.status === 503 || err.response?.status === 404) return null
        throw err
    }
    return null
}

export async function getGrupos() {
    try {
        const { data } = await axios.get('/catalogos/grupos')
        if (data?.success && Array.isArray(data?.data)) return data.data
    } catch {
        return []
    }
    return []
}

/**
 * Categorías principales del proyecto con sus subcategorías (grupos CVA).
 * data[] = { id, nombre, orden, subcategorias: string[] }
 */
export async function getCategoriasPrincipales() {
    try {
        const { data } = await axios.get('/catalogos/categorias-principales')
        if (data?.success && Array.isArray(data?.data)) return data.data
    } catch {
        return []
    }
    return []
}

export async function getMarcas() {
    try {
        const { data } = await axios.get('/catalogos/marcas')
        if (data?.success && Array.isArray(data?.data)) return data.data
    } catch {
        return []
    }
    return []
}

export async function getSubgrupos(grupo) {
    if (!grupo) return []
    try {
        const { data } = await axios.get('/catalogos/subgrupos', { params: { grupo } })
        if (data?.success && Array.isArray(data?.data)) return data.data
    } catch {
        return []
    }
    return []
}

/**
 * Filtros dinámicos para una subcategoría (Información general + Especificaciones).
 * Respeta marca, precio y filtros ya seleccionados (cascada).
 * @param {string} categoria - categoria_principal (ej. laptops)
 * @param {string} subcategoria - grupo (ej. PORTATILES) o 'ver-todo'
 * @param {object} opts - { marca, precioMin, precioMax, filtros }
 * @returns {Promise<Record<string, string[]>>} { "Marca": ["Lenovo","HP"], "Memoria Ram": ["8GB","16GB"], ... }
 */
export async function getFiltrosDinamicos(categoria, subcategoria, opts = {}) {
    if (!categoria || !subcategoria) return {}
    try {
        const params = subcategoria === 'ver-todo'
            ? { categoria_principal: categoria }
            : { grupo: subcategoria }
        if (opts.marca) params.marca = opts.marca
        if (opts.precioMin != null) params.precio_min = opts.precioMin
        if (opts.precioMax != null) params.precio_max = opts.precioMax
        if (opts.filtros && Object.keys(opts.filtros).length > 0) {
            Object.entries(opts.filtros).forEach(([k, v]) => {
                if (v != null && String(v).trim() !== '') params[`filtros[${k}]`] = v
            })
        }
        const { data } = await axios.get('/catalogos/filtros-dinamicos', { params })
        if (data?.success && data?.data && typeof data.data === 'object') return data.data
    } catch {
        // ignore
    }
    return {}
}

/**
 * Claves de productos vistos recientemente. Por usuario o visitante (userId = user?.id ?? guestId).
 */
export function getVistosRecientesClaves(userId) {
    if (typeof window === 'undefined') return []
    const uid = userId ?? 'guest'
    try {
        const key = VISTOS_RECIENTES_PREFIX + String(uid)
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr : []
    } catch {
        return []
    }
}

/**
 * Añade una clave a vistos recientes. Por usuario o visitante (userId = user?.id ?? guestId).
 */
export function addVistoReciente(clave, userId) {
    if (typeof window === 'undefined' || !clave) return
    const uid = userId ?? 'guest'
    try {
        const key = VISTOS_RECIENTES_PREFIX + String(uid)
        let arr = getVistosRecientesClaves(uid)
        arr = arr.filter((c) => c !== clave)
        arr.unshift(clave)
        arr = arr.slice(0, MAX_VISTOS)
        localStorage.setItem(key, JSON.stringify(arr))
    } catch {
        //
    }
}

/** Normaliza la moneda al código a mostrar (MXN para peso mexicano, etc.). */
function normalizarMoneda(moneda) {
    if (!moneda || typeof moneda !== 'string') return 'MXN'
    const m = moneda.trim().toUpperCase()
    if (!m) return 'MXN'
    // Peso mexicano: variantes que envía la API (Pesos, Peso, MXN, etc.)
    if (m === 'PESOS' || m === 'PESO' || m === 'MXN' || m === 'PESOS MXN' || m.includes('MEXICAN') || m.includes('PESO MEXICANO')) return 'MXN'
    // Otras monedas: devolver código si son 3 letras, si no el texto normalizado
    if (m.length === 3 && /^[A-Z]{3}$/.test(m)) return m // USD, EUR, etc.
    return moneda.trim()
}

export function formatPrecio(precio, moneda = 'MXN') {
    const label = normalizarMoneda(moneda)
    if (precio == null) return `$0.00 ${label}`
    const n = Number(precio)
    if (Number.isNaN(n)) return `$0.00 ${label}`
    const str = `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    return `${str} ${label}`
}
