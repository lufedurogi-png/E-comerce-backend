/**
 * Solo para uso en Server Components (SSR).
 * No importar axios ni nada que use React/context para evitar "useContext" null en el servidor.
 */

const BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/v1'

export async function getSubcategoriaDataForSSR(categoria, subcategoria) {
    if (!categoria || !subcategoria) {
        return { catalogDisponible: false, productos: [], marcas: [] }
    }
    try {
        const isVerTodo = subcategoria === 'ver-todo'
        const params = new URLSearchParams()
        if (isVerTodo) params.set('categoria_principal', categoria)
        else params.set('grupo', subcategoria)
        params.set('per_page', '36')

        const marcasUrl = isVerTodo
            ? `${BASE}/catalogos/marcas?categoria_principal=${encodeURIComponent(categoria)}`
            : `${BASE}/catalogos/marcas?grupo=${encodeURIComponent(subcategoria)}`
        const opts = { next: { revalidate: 120 } }
        const [estadoRes, productosRes, marcasRes] = await Promise.all([
            fetch(`${BASE}/productos/estado`, opts),
            fetch(`${BASE}/productos?${params.toString()}`, opts),
            fetch(marcasUrl, opts),
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

/** Un solo producto por clave, para vista de detalle (SSR). */
export async function getProductoByClaveForSSR(clave) {
    if (!clave) return { producto: null, errorCatalog: false }
    try {
        const res = await fetch(`${BASE}/productos/${encodeURIComponent(clave)}`, { next: { revalidate: 60 } })
        const data = await res.json()
        if (data?.success && data?.data) return { producto: data.data, errorCatalog: false }
        if (res.status === 503) return { producto: null, errorCatalog: true }
        return { producto: null, errorCatalog: false }
    } catch {
        return { producto: null, errorCatalog: false }
    }
}
