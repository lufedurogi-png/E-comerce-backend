'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import TiendaNavHeader from '@/components/TiendaNavHeader'
import { getProductos, getFiltrosDinamicos } from '@/lib/productos'

const RANGOS_PRECIO = [
    { value: '', label: 'Todos los precios', min: null, max: null },
    { value: '0-500', label: '$0 - $500', min: 0, max: 500 },
    { value: '500-1000', label: '$500 - $1,000', min: 500, max: 1000 },
    { value: '1000-5000', label: '$1,000 - $5,000', min: 1000, max: 5000 },
    { value: '5000-10000', label: '$5,000 - $10,000', min: 5000, max: 10000 },
    { value: '10000-20000', label: '$10,000 - $20,000', min: 10000, max: 20000 },
    { value: '20000-50000', label: '$20,000 - $50,000', min: 20000, max: 50000 },
    { value: '50000', label: 'Más de $50,000', min: 50000, max: null },
]

function parseUrlFilters(urlFilters = {}) {
    const marca = urlFilters.marca ?? ''
    const precio = urlFilters.precio ?? ''
    let filtros = {}
    try {
        if (urlFilters.filtros && typeof urlFilters.filtros === 'string') {
            filtros = JSON.parse(decodeURIComponent(urlFilters.filtros)) || {}
        }
    } catch {
        //
    }
    return { marca, precio, filtros }
}

export default function VistaSubcategoriaClient({ categoria, subcategoria, initialData = {}, urlFilters = {} }) {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    // Prioridad: params de la URL actual (persisten al volver desde producto) > props del servidor
    const urlFiltersFromRoute = useMemo(() => {
        const m = {}
        searchParams.forEach((v, k) => { m[k] = v })
        return m
    }, [searchParams])
    const parsed = parseUrlFilters(Object.keys(urlFiltersFromRoute).length > 0 ? urlFiltersFromRoute : urlFilters)

    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })

    const [catalogDisponible, setCatalogDisponible] = useState(() => initialData?.catalogDisponible ?? true)
    const [marcas, setMarcas] = useState(() => initialData?.marcas ?? [])
    const [selectedMarca, setSelectedMarca] = useState(() => parsed.marca)
    const [orden, setOrden] = useState('reciente')
    const [rangoPrecio, setRangoPrecio] = useState(() => parsed.precio)
    const [filtrosDinamicos, setFiltrosDinamicos] = useState({})
    const [filtrosDinamicosSeleccionados, setFiltrosDinamicosSeleccionados] = useState(() => parsed.filtros)
    const [compararSeleccionados, setCompararSeleccionados] = useState([])

    const MAX_COMPARAR = 4

    const toggleComparar = (clave, checked) => {
        if (checked) {
            setCompararSeleccionados((prev) => (prev.length >= MAX_COMPARAR ? prev : [...prev, clave]))
        } else {
            setCompararSeleccionados((prev) => prev.filter((c) => c !== clave))
        }
    }

    const isVerTodo = subcategoria === 'ver-todo'
    const rango = RANGOS_PRECIO.find((r) => r.value === rangoPrecio)
    const filtrosActivos = Object.fromEntries(
        Object.entries(filtrosDinamicosSeleccionados).filter(([, v]) => v != null && String(v).trim() !== '')
    )

    const filtrosKeyRaw = categoria && subcategoria
        ? ['filtros-dinamicos', categoria, subcategoria, selectedMarca, rango?.min, rango?.max, JSON.stringify(filtrosActivos)]
        : null
    const filtrosKeyStr = filtrosKeyRaw ? JSON.stringify(filtrosKeyRaw) : ''
    const [filtrosKeyDebounced, setFiltrosKeyDebounced] = useState(() => filtrosKeyRaw)
    useEffect(() => {
        if (!filtrosKeyRaw) {
            setFiltrosKeyDebounced(null)
            return
        }
        const t = setTimeout(() => setFiltrosKeyDebounced(filtrosKeyRaw), 180)
        return () => clearTimeout(t)
    }, [filtrosKeyStr])
    const { data: filtrosDinamicosData } = useSWR(
        filtrosKeyDebounced,
        async () => {
            const f = await getFiltrosDinamicos(categoria, subcategoria, {
                marca: selectedMarca || undefined,
                precioMin: rango?.min ?? undefined,
                precioMax: rango?.max ?? undefined,
                filtros: filtrosActivos,
            })
            return f
        },
        { revalidateOnFocus: false, dedupingInterval: 30000 }
    )
    useEffect(() => {
        setFiltrosDinamicos(filtrosDinamicosData ?? {})
    }, [filtrosDinamicosData])
    useEffect(() => {
        setFiltrosDinamicosSeleccionados({})
        setProductosAnteriores([])
    }, [categoria, subcategoria])

    // Sincronizar estado con URL cuando vuelves desde producto (navegación con filtros en query)
    const parsedKey = `${parsed.marca}|${parsed.precio}|${JSON.stringify(parsed.filtros)}`
    useEffect(() => {
        setSelectedMarca(parsed.marca)
        setRangoPrecio(parsed.precio)
        setFiltrosDinamicosSeleccionados(parsed.filtros)
    }, [parsedKey])

    const actualizarUrl = useCallback(() => {
        const params = new URLSearchParams()
        if (selectedMarca) params.set('marca', selectedMarca)
        if (rangoPrecio) params.set('precio', rangoPrecio)
        const fActivos = Object.fromEntries(
            Object.entries(filtrosDinamicosSeleccionados).filter(([, v]) => v != null && String(v).trim() !== '')
        )
        if (Object.keys(fActivos).length > 0) {
            params.set('filtros', encodeURIComponent(JSON.stringify(fActivos)))
        }
        const qs = params.toString()
        const url = qs ? `${pathname}?${qs}` : pathname
        router.replace(url, { scroll: false })
    }, [pathname, router, selectedMarca, rangoPrecio, filtrosDinamicosSeleccionados])

    useEffect(() => {
        actualizarUrl()
    }, [selectedMarca, rangoPrecio, filtrosDinamicosSeleccionados])

    const productosKeyRaw = categoria
        ? ['subcategoria-productos', categoria, subcategoria, isVerTodo, selectedMarca, orden, rangoPrecio, rango?.min, rango?.max, JSON.stringify(filtrosActivos)]
        : null
    const productosKeyStr = productosKeyRaw ? JSON.stringify(productosKeyRaw) : ''
    const [productosKeyDebounced, setProductosKeyDebounced] = useState(() => productosKeyRaw)
    useEffect(() => {
        if (!productosKeyRaw) {
            setProductosKeyDebounced(null)
            return
        }
        const t = setTimeout(() => setProductosKeyDebounced(productosKeyRaw), 250)
        return () => clearTimeout(t)
    }, [productosKeyStr])
    const [productosAnteriores, setProductosAnteriores] = useState([])
    const { data: productosData, isLoading: loading } = useSWR(
        productosKeyDebounced,
        async () => {
            const filters = {}
            if (isVerTodo) filters.categoria_principal = categoria
            else filters.grupo = subcategoria
            if (selectedMarca) filters.marca = selectedMarca
            filters.orden = orden === 'precio_asc' ? 'precio_asc' : orden === 'precio_desc' ? 'precio_desc' : 'reciente'
            if (rango?.min != null) filters.precio_min = rango.min
            if (rango?.max != null) filters.precio_max = rango.max
            if (Object.keys(filtrosActivos).length > 0) filters.filtros = filtrosActivos
            const res = await getProductos(filters)
            return res?.productos ?? []
        },
        {
            revalidateOnFocus: false,
            dedupingInterval: 15000,
            fallbackData: !selectedMarca && orden === 'reciente' && !rangoPrecio && Object.keys(filtrosActivos).length === 0 && initialData?.productos ? initialData.productos : undefined,
            revalidateOnMount: !(!selectedMarca && orden === 'reciente' && !rangoPrecio && Object.keys(filtrosActivos).length === 0 && initialData?.productos),
        }
    )
    const productos = productosData ?? []

    useEffect(() => {
        if (productos.length > 0) setProductosAnteriores(productos)
    }, [productos])

    const productosAMostrar = loading && productos.length === 0 && productosAnteriores.length > 0
        ? productosAnteriores
        : productos

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'darkMode') setDarkMode(JSON.parse(e.newValue))
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const tituloSubcategoria = isVerTodo ? 'Ver todo' : subcategoria

    const paramsParaUrl = new URLSearchParams()
    if (selectedMarca) paramsParaUrl.set('marca', selectedMarca)
    if (rangoPrecio) paramsParaUrl.set('precio', rangoPrecio)
    const fAct = Object.fromEntries(
        Object.entries(filtrosDinamicosSeleccionados).filter(([, v]) => v != null && String(v).trim() !== '')
    )
    if (Object.keys(fAct).length > 0) paramsParaUrl.set('filtros', encodeURIComponent(JSON.stringify(fAct)))
    const urlConFiltros = paramsParaUrl.toString() ? `${pathname}?${paramsParaUrl.toString()}` : pathname

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
            <div className="flex">
                <aside className={`w-64 min-h-screen border-r transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}>
                    <div className="p-6 space-y-8">
                        <div>
                            <h3 className={`text-sm font-bold uppercase mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                ORDENAR POR
                            </h3>
                            <select
                                value={orden}
                                onChange={(e) => setOrden(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border text-sm ${
                                    darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            >
                                <option value="reciente">Más recientes</option>
                                <option value="precio_asc">Precio: menor a mayor</option>
                                <option value="precio_desc">Precio: mayor a menor</option>
                            </select>
                        </div>

                        <div>
                            <h3 className={`text-sm font-bold uppercase mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                PRECIO
                            </h3>
                            <select
                                value={rangoPrecio}
                                onChange={(e) => setRangoPrecio(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border text-sm ${
                                    darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            >
                                {RANGOS_PRECIO.map((r) => (
                                    <option key={r.value || 'todos'} value={r.value}>
                                        {r.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <h3 className={`text-sm font-bold uppercase mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                MARCA
                            </h3>
                            <select
                                value={selectedMarca}
                                onChange={(e) => setSelectedMarca(e.target.value)}
                                className={`w-full px-4 py-2 rounded-lg border text-sm ${
                                    darkMode
                                        ? 'bg-gray-700 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                }`}
                            >
                                <option value="">Todas</option>
                                {marcas.map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>

                        <div className="overflow-y-auto max-h-[430px] pr-1 -mr-1">
                            <div className="space-y-4 pt-2 border-t border-gray-200 dark:border-gray-600">
                                {Object.entries(filtrosDinamicos)
                                    .filter(([nombre]) => nombre.toLowerCase() !== 'marca')
                                    .map(([nombre, opciones]) => (
                                        <div key={nombre} className="space-y-1.5">
                                            <h3 className={`text-xs font-bold uppercase ${
                                                darkMode ? 'text-gray-300' : 'text-gray-600'
                                            }`}>
                                                {nombre}
                                            </h3>
                                            <select
                                                value={filtrosDinamicosSeleccionados[nombre] ?? ''}
                                                onChange={(e) => setFiltrosDinamicosSeleccionados((s) => ({ ...s, [nombre]: e.target.value }))}
                                                className={`w-full px-3 py-1.5 rounded border text-xs ${
                                                    darkMode
                                                        ? 'bg-gray-700 border-gray-600 text-white'
                                                        : 'bg-white border-gray-300 text-gray-900'
                                                }`}
                                            >
                                                <option value="">Todas</option>
                                                {(opciones || []).map((opt) => (
                                                    <option key={opt} value={opt}>{opt}</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </aside>

                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <nav className={`text-sm mb-6 ${
                            darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                            <Link href="/tienda" className="hover:text-[#FF8000] transition-colors">Tienda</Link>
                            <span className="mx-2">/</span>
                            <Link
                                href={`/tienda/${encodeURIComponent(categoria)}/ver-todo`}
                                className="hover:text-[#FF8000] transition-colors"
                            >
                                {categoria}
                            </Link>
                            {!isVerTodo && (
                                <>
                                    <span className="mx-2">/</span>
                                    <span className={darkMode ? 'text-white' : 'text-gray-900'}>
                                        {tituloSubcategoria}
                                    </span>
                                </>
                            )}
                        </nav>

                        <div className="flex flex-wrap items-center gap-4 mb-8">
                            <h1 className={`text-2xl md:text-3xl font-bold ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                {tituloSubcategoria.toUpperCase()}
                            </h1>
                            {compararSeleccionados.length >= 2 && (
                                <Link
                                    href={`/tienda/comparar?claves=${compararSeleccionados.map((c) => encodeURIComponent(c)).join(',')}&categoria=${encodeURIComponent(categoria)}&subcategoria=${encodeURIComponent(subcategoria)}`}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors"
                                >
                                    Comparar ({compararSeleccionados.length})
                                </Link>
                            )}
                        </div>

                        {!catalogDisponible && (
                            <div className={`rounded-lg border p-6 ${
                                darkMode ? 'bg-gray-800 border-amber-900/50' : 'bg-amber-50 border-amber-200'
                            }`}>
                                <p className={darkMode ? 'text-amber-400' : 'text-amber-800'}>
                                    Catálogo no disponible. Intenta más tarde.
                                </p>
                                <Link href="/tienda" className="inline-block mt-2 text-[#FF8000] hover:underline">
                                    Volver a la tienda
                                </Link>
                            </div>
                        )}

                        {catalogDisponible && loading && productosAMostrar.length === 0 && (
                            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cargando…</p>
                        )}

                        {catalogDisponible && (productosAMostrar.length > 0 || !loading) && (
                            <div className="relative">
                                {loading && (
                                    <div className="absolute top-0 right-0 z-10 px-3 py-1 rounded-full text-sm font-medium bg-[#FF8000]/90 text-white">
                                        {productosAMostrar.length > 0 ? 'Filtrando…' : 'Cargando…'}
                                    </div>
                                )}
                                <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-opacity duration-200 ${loading ? 'opacity-70 pointer-events-none' : ''}`}>
                                    {productosAMostrar.map((producto) => (
                                        <ProductCard
                                            key={producto.clave}
                                            producto={producto}
                                            darkMode={darkMode}
                                            comparar
                                            seleccionado={compararSeleccionados.includes(producto.clave)}
                                            onCompararChange={toggleComparar}
                                            compararLleno={compararSeleccionados.length >= MAX_COMPARAR}
                                            returnUrl={urlConFiltros}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {catalogDisponible && !loading && productosAMostrar.length === 0 && (
                            <div className={`text-center py-12 ${
                                darkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                                <p>No hay productos en esta subcategoría.</p>
                                <Link href="/tienda" className="inline-block mt-2 text-[#FF8000] hover:underline">
                                    Volver a la tienda
                                </Link>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </div>
    )
}
