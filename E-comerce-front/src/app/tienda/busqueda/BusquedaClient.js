'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import ProductCard from '@/components/ProductCard'
import TiendaNavHeader from '@/components/TiendaNavHeader'
import { getCatalogEstado } from '@/lib/productos'
import { getBusqueda, getBusquedaSessionId } from '@/lib/busqueda'

const emptyResult = {
    busqueda_id: 0,
    texto_original: '',
    texto_normalizado: '',
    correccion_aplicada: false,
    productos: [],
}

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

export default function BusquedaClient({ initialData = null, initialQuery = '' }) {
    const searchParams = useSearchParams()
    const querySearch = searchParams.get('q') ?? ''
    const initialTrimmed = typeof initialQuery === 'string' ? initialQuery.trim() : ''

    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })
    const [catalogDisponible, setCatalogDisponible] = useState(false)
    const [resultadoBusqueda, setResultadoBusqueda] = useState(() =>
        initialData && (initialData.productos?.length > 0 || initialData.texto_original !== undefined)
            ? initialData
            : null
    )
    const [loadingBusqueda, setLoadingBusqueda] = useState(() =>
        initialTrimmed ? !(initialData?.productos?.length || (initialData?.texto_original !== undefined && initialData?.texto_original !== '')) : false
    )
    const [orden, setOrden] = useState('reciente')
    const [rangoPrecio, setRangoPrecio] = useState('')
    const [selectedMarca, setSelectedMarca] = useState('')
    const initialDataRef = useRef(initialData)
    initialDataRef.current = initialData

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        getCatalogEstado()
            .then((estado) => setCatalogDisponible(estado?.disponible ?? false))
            .catch(() => setCatalogDisponible(false))
    }, [])

    useEffect(() => {
        const q = typeof querySearch === 'string' ? querySearch.trim() : ''
        if (!catalogDisponible || !q) {
            setResultadoBusqueda(q ? null : (initialData || null))
            setLoadingBusqueda(false)
            return
        }
        if (q === initialTrimmed && initialDataRef.current) {
            setResultadoBusqueda(initialDataRef.current)
            setLoadingBusqueda(false)
            return
        }
        setLoadingBusqueda(true)
        const sessionId = getBusquedaSessionId()
        getBusqueda(q, sessionId)
            .then((res) => setResultadoBusqueda(res))
            .catch(() => setResultadoBusqueda(emptyResult))
            .finally(() => setLoadingBusqueda(false))
    }, [catalogDisponible, querySearch, initialTrimmed])

    // Marcas únicas de los resultados de búsqueda
    const marcas = useMemo(() => {
        if (!resultadoBusqueda?.productos?.length) return []
        const set = new Set()
        resultadoBusqueda.productos.forEach((p) => {
            if (p?.marca && String(p.marca).trim()) set.add(String(p.marca).trim())
        })
        return Array.from(set).sort((a, b) => a.localeCompare(b))
    }, [resultadoBusqueda?.productos])

    // Filtrar y ordenar resultados según la barra de filtros
    const productosFiltrados = useMemo(() => {
        if (!resultadoBusqueda?.productos?.length) return []
        let list = [...resultadoBusqueda.productos]

        if (selectedMarca) {
            list = list.filter((p) => p?.marca && String(p.marca).trim() === selectedMarca)
        }
        const rango = RANGOS_PRECIO.find((r) => r.value === rangoPrecio)
        if (rango && (rango.min != null || rango.max != null)) {
            list = list.filter((p) => {
                const precio = Number(p?.precio)
                if (Number.isNaN(precio)) return false
                if (rango.min != null && precio < rango.min) return false
                if (rango.max != null && precio > rango.max) return false
                return true
            })
        }
        if (orden === 'precio_asc') {
            list.sort((a, b) => (Number(a?.precio) ?? 0) - (Number(b?.precio) ?? 0))
        } else if (orden === 'precio_desc') {
            list.sort((a, b) => (Number(b?.precio) ?? 0) - (Number(a?.precio) ?? 0))
        }
        return list
    }, [resultadoBusqueda?.productos, selectedMarca, rangoPrecio, orden])

    const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50'
    const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'
    const tieneResultados = resultadoBusqueda?.productos?.length > 0

    return (
        <div className={`min-h-screen transition-colors duration-300 ${bg} ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
            <div className="flex">
                {/* Barra de filtros (misma que en subcategoría) */}
                {tieneResultados && (
                    <aside className={`w-64 min-h-screen border-r shrink-0 transition-colors duration-300 ${
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
                        </div>
                    </aside>
                )}

                <main className="flex-1 p-8">
                    <div className="max-w-7xl mx-auto">
                        <nav className={`text-sm mb-6 ${textMuted}`}>
                            <Link href="/tienda" className="hover:text-[#FF8000] transition-colors">Tienda</Link>
                            <span className="mx-2">/</span>
                            <span className={darkMode ? 'text-gray-300' : 'text-gray-800'}>Buscar</span>
                        </nav>

                        <h1 className="text-2xl md:text-3xl font-bold mb-2">Resultados de búsqueda</h1>
                        {querySearch.trim() && (
                            <p className={`mb-6 ${textMuted}`}>
                                Buscando: «{querySearch.trim()}»
                            </p>
                        )}

                        {!catalogDisponible && (
                            <div className={`rounded-lg border p-6 ${darkMode ? 'bg-gray-800 border-amber-900/50' : 'bg-amber-50 border-amber-200'}`}>
                                <p className={darkMode ? 'text-amber-400' : 'text-amber-800'}>
                                    Catálogo no disponible. Intenta más tarde.
                                </p>
                                <Link href="/tienda" className="inline-block mt-2 text-[#FF8000] hover:underline">
                                    Volver a la tienda
                                </Link>
                            </div>
                        )}

                        {catalogDisponible && !querySearch.trim() && (
                            <p className={textMuted}>Escribe algo en el buscador para ver resultados.</p>
                        )}

                        {catalogDisponible && querySearch.trim() !== '' && (
                            <>
                                {loadingBusqueda ? (
                                    <p className={textMuted}>Buscando…</p>
                                ) : resultadoBusqueda && (
                                    <>
                                        {resultadoBusqueda.correccion_aplicada && (
                                            <p className={`mb-4 text-sm rounded-lg px-3 py-2 ${
                                                darkMode ? 'bg-gray-800 text-amber-300 border border-amber-700/50' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                            }`}>
                                                Se mostraron resultados para «{resultadoBusqueda.texto_normalizado}» (se aplicó una corrección).
                                            </p>
                                        )}
                                        {resultadoBusqueda.productos.length === 0 ? (
                                            <p className={textMuted}>
                                                No se encontraron productos para «{resultadoBusqueda.texto_original}».
                                            </p>
                                        ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {productosFiltrados.map((producto) => (
                                                    <ProductCard
                                                        key={producto.clave}
                                                        producto={producto}
                                                        darkMode={darkMode}
                                                        busquedaId={resultadoBusqueda.busqueda_id || undefined}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {resultadoBusqueda.productos.length > 0 && productosFiltrados.length === 0 && (
                                            <p className={textMuted}>
                                                Ningún producto coincide con los filtros seleccionados. Prueba con otra marca o rango de precio.
                                            </p>
                                        )}
                                    </>
                                )}
                            </>
                        )}

                        <div className="mt-8">
                            <Link
                                href="/tienda"
                                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium border transition-colors ${
                                    darkMode ? 'bg-gray-800 border-gray-700 hover:text-[#FF8000] hover:border-[#FF8000]' : 'bg-white border-gray-200 hover:text-[#FF8000] hover:border-[#FF8000]'
                                }`}
                            >
                                ← Volver a la tienda
                            </Link>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
