'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import TiendaNavHeader from '@/components/TiendaNavHeader'
import { getProductoByClave, formatPrecio, resolveStorageUrl } from '@/lib/productos'

const FALLBACK_IMAGE = '/Imagenes/caja.png'

// Mismos campos que no se muestran en Información general del detalle de producto
const CAMPOS_OCULTOS_RAW = ['id', 'requiere_serie', 'grupo', 'disponible', 'principal', 'brand_image', 'imagen', 'moneda', 'precio']

const palabrasMinusculas = new Set(['de', 'del', 'la', 'el', 'y', 'a', 'e', 'o', 'u', 'en', 'con', 'al', 'los', 'las', 'un', 'una', 'por', 'para', 'da', 'do'])
function formatLabel(str) {
    if (str == null || typeof str !== 'string') return ''
    const limpio = String(str).replace(/_/g, ' ').trim()
    return limpio.toLowerCase().split(/\s+/).map((palabra, i) => {
        if (!palabra) return palabra
        if (i > 0 && palabrasMinusculas.has(palabra.toLowerCase())) return palabra.toLowerCase()
        return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
    }).join(' ')
}

function getFirstImageUrl(producto) {
    if (producto?.imagen) return resolveStorageUrl(producto.imagen)
    const arr = producto?.imagenes
    if (Array.isArray(arr) && arr.length > 0) return resolveStorageUrl(arr[0])
    return FALLBACK_IMAGE
}

export default function CompararClient() {
    const searchParams = useSearchParams()
    const clavesParam = searchParams.get('claves') || ''
    const categoria = searchParams.get('categoria') || ''
    const subcategoria = searchParams.get('subcategoria') || ''
    const claves = useMemo(() => {
        const list = clavesParam.split(',').map((c) => c.trim()).filter(Boolean)
        return [...new Set(list)].slice(0, 4)
    }, [clavesParam])
    const volverHref = categoria && subcategoria
        ? `/tienda/${encodeURIComponent(categoria)}/${encodeURIComponent(subcategoria)}`
        : '/tienda'

    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })
    const [productos, setProductos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        if (claves.length < 2) {
            setProductos([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(false)
        Promise.all(claves.map((c) => getProductoByClave(c)))
            .then((results) => {
                const valid = results.filter(Boolean)
                setProductos(valid)
                if (valid.length < 2) setError(true)
            })
            .catch(() => setError(true))
            .finally(() => setLoading(false))
    }, [claves.join(',')])

    const allRawKeys = useMemo(() => {
        const set = new Set()
        productos.forEach((p) => {
            if (p?.raw_data && typeof p.raw_data === 'object') {
                Object.keys(p.raw_data).forEach((k) => {
                    if (!CAMPOS_OCULTOS_RAW.includes(String(k).toLowerCase())) set.add(k)
                })
            }
        })
        return Array.from(set).sort()
    }, [productos])

    const allSpecKeys = useMemo(() => {
        const set = new Set()
        productos.forEach((p) => {
            const specs = Array.isArray(p?.especificaciones_tecnicas) ? p.especificaciones_tecnicas : []
            specs.forEach((s) => {
                const name = s?.nombre ?? s?.name ?? s?.campo
                if (name && typeof name === 'string') set.add(name)
            })
        })
        return Array.from(set).sort()
    }, [productos])

    const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50'
    const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    const text = darkMode ? 'text-gray-100' : 'text-gray-900'
    const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'

    if (claves.length < 2) {
        return (
            <div className={`min-h-screen ${bg} ${text}`}>
                <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
                <main className="max-w-2xl mx-auto px-4 py-12 text-center">
                    <h1 className="text-2xl font-bold mb-4">Comparar productos</h1>
                    <p className={textMuted}>Selecciona al menos 2 productos (máximo 4) en una subcategoría para compararlos.</p>
                    <Link href="/tienda" className="inline-block mt-6 text-[#FF8000] hover:underline font-medium">
                        Ir a la tienda
                    </Link>
                </main>
            </div>
        )
    }

    if (loading) {
        return (
            <div className={`min-h-screen ${bg} ${text}`}>
                <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
                <main className="max-w-7xl mx-auto px-4 py-12">
                    <p className={textMuted}>Cargando productos…</p>
                </main>
            </div>
        )
    }

    if (error || productos.length < 2) {
        return (
            <div className={`min-h-screen ${bg} ${text}`}>
                <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
                <main className="max-w-2xl mx-auto px-4 py-12 text-center">
                    <h1 className="text-2xl font-bold mb-4">No se pudieron cargar los productos</h1>
                    <p className={textMuted}>Algunos productos no están disponibles. Vuelve a la subcategoría y selecciona otros.</p>
                    <Link href="/tienda" className="inline-block mt-6 text-[#FF8000] hover:underline font-medium">
                        Ir a la tienda
                    </Link>
                </main>
            </div>
        )
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${bg} ${text}`}>
            <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <nav className={`text-sm mb-6 ${textMuted}`}>
                    <Link href="/tienda" className="hover:text-[#FF8000] transition-colors">Tienda</Link>
                    <span className="mx-2">/</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-800'}>Comparar productos</span>
                </nav>

                <h1 className="text-2xl md:text-3xl font-bold mb-2">Comparar productos</h1>
                <p className={`mb-8 ${textMuted}`}>Comparando {productos.length} producto{productos.length > 1 ? 's' : ''}.</p>

                {/* Una sola tabla: columnas = productos, filas = imagen + datos generales + datos para comparar */}
                <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'}>
                                    <th className="text-left font-semibold px-4 sm:px-6 py-3 border-b w-48 min-w-[140px] whitespace-nowrap align-top" scope="col">
                                        Campo
                                    </th>
                                    {productos.map((p) => (
                                        <th key={p.clave} className="text-left font-semibold px-4 sm:px-6 py-3 border-b min-w-[160px] align-top" scope="col">
                                            {p.clave}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {/* Fila: Imagen */}
                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="px-4 sm:px-6 py-3 font-medium align-top">Imagen</td>
                                    {productos.map((p) => (
                                        <td key={p.clave} className="px-4 sm:px-6 py-3 align-top">
                                            <div className="relative aspect-square max-w-[180px] bg-gray-100 dark:bg-gray-700/50 rounded-lg overflow-hidden">
                                                <Image
                                                    src={getFirstImageUrl(p)}
                                                    alt={p.descripcion?.slice(0, 60) || p.clave}
                                                    fill
                                                    className="object-contain p-2"
                                                    sizes="180px"
                                                    unoptimized={getFirstImageUrl(p).startsWith('http')}
                                                />
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                                {/* Datos generales */}
                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="px-4 sm:px-6 py-3 font-medium align-top">Descripción</td>
                                    {productos.map((p) => (
                                        <td key={p.clave} className={`px-4 sm:px-6 py-3 break-words ${textMuted}`}>
                                            {(p.descripcion || '-').slice(0, 120)}
                                            {(p.descripcion?.length || 0) > 120 ? '…' : ''}
                                        </td>
                                    ))}
                                </tr>
                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="px-4 sm:px-6 py-3 font-medium align-top">Marca</td>
                                    {productos.map((p) => (
                                        <td key={p.clave} className={`px-4 sm:px-6 py-3 ${textMuted}`}>{p.marca || '-'}</td>
                                    ))}
                                </tr>
                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="px-4 sm:px-6 py-3 font-medium align-top">Precio</td>
                                    {productos.map((p) => (
                                        <td key={p.clave} className="px-4 sm:px-6 py-3 font-semibold text-[#FF8000]">
                                            {formatPrecio(p.precio, p.moneda)}
                                        </td>
                                    ))}
                                </tr>
                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="px-4 sm:px-6 py-3 font-medium align-top">Stock</td>
                                    {productos.map((p) => {
                                        const total = (p.disponible ?? 0) + (p.disponible_cd ?? 0)
                                        return (
                                            <td key={p.clave} className={`px-4 sm:px-6 py-3 ${total > 0 ? (darkMode ? 'text-emerald-400' : 'text-emerald-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                                                {total > 0 ? `En stock: ${total}` : 'Sin stock'}
                                            </td>
                                        )
                                    })}
                                </tr>
                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="px-4 sm:px-6 py-3 font-medium align-top">Garantía</td>
                                    {productos.map((p) => (
                                        <td key={p.clave} className={`px-4 sm:px-6 py-3 ${textMuted}`}>{p.garantia || '-'}</td>
                                    ))}
                                </tr>
                                <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <td className="px-4 sm:px-6 py-3 font-medium align-top">Clave / Cód. fabricante</td>
                                    {productos.map((p) => (
                                        <td key={p.clave} className={`px-4 sm:px-6 py-3 ${textMuted}`}>
                                            {p.clave || '-'}
                                            {p.codigo_fabricante ? ` · ${p.codigo_fabricante}` : ''}
                                        </td>
                                    ))}
                                </tr>
                                {/* Información general (raw_data sin campos ocultos) */}
                                {allRawKeys.map((key) => (
                                    <tr key={`raw-${key}`} className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <td className="px-4 sm:px-6 py-3 font-medium align-top whitespace-nowrap">{formatLabel(key)}</td>
                                        {productos.map((p) => {
                                            const v = p.raw_data?.[key]
                                            if (v == null || typeof v === 'object') return <td key={p.clave} className={`px-4 sm:px-6 py-3 break-words ${textMuted}`}>—</td>
                                            return (
                                                <td key={p.clave} className={`px-4 sm:px-6 py-3 break-words ${textMuted}`}>
                                                    {String(v)}
                                                </td>
                                            )
                                        })}
                                    </tr>
                                ))}
                                {/* Especificaciones técnicas (si hay) */}
                                {allSpecKeys.length > 0 && (
                                    <>
                                        <tr className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            <td colSpan={productos.length + 1} className={`px-4 sm:px-6 py-2 font-bold text-[#FF8000] border-l-4 border-[#FF8000] ${darkMode ? 'bg-gray-800/60' : 'bg-amber-50'}`}>
                                                Especificaciones técnicas
                                            </td>
                                        </tr>
                                        {allSpecKeys.map((specName) => (
                                            <tr key={`spec-${specName}`} className={`border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                                <td className="px-4 sm:px-6 py-3 font-medium align-top whitespace-nowrap">{formatLabel(specName)}</td>
                                                {productos.map((p) => {
                                                    const specs = Array.isArray(p?.especificaciones_tecnicas) ? p.especificaciones_tecnicas : []
                                                    const spec = specs.find((s) => (s?.nombre ?? s?.name ?? s?.campo) === specName)
                                                    const v = spec?.valor ?? spec?.value
                                                    if (v == null || v === '') return <td key={p.clave} className={`px-4 sm:px-6 py-3 break-words ${textMuted}`}>—</td>
                                                    return (
                                                        <td key={p.clave} className={`px-4 sm:px-6 py-3 break-words ${textMuted}`}>
                                                            {String(v)}
                                                        </td>
                                                    )
                                                })}
                                            </tr>
                                        ))}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="mt-8">
                    <Link
                        href={volverHref}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium border transition-colors ${cardBg} hover:text-[#FF8000] hover:border-[#FF8000]`}
                    >
                        ← Volver {categoria && subcategoria ? `a ${subcategoria}` : 'a la tienda'}
                    </Link>
                </div>
            </main>
        </div>
    )
}
