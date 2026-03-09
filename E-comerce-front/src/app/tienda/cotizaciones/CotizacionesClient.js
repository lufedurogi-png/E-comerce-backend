'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import TiendaNavHeader from '@/components/TiendaNavHeader'
import { getPorClaves, formatPrecio, resolveStorageUrl } from '@/lib/productos'
import { saveCotizacionActual, useCotizacion, getEffectiveUserId } from '@/lib/cotizaciones'
import { saveCotizacionApi, isLoggedInUserId } from '@/lib/cotizacionesApi'
import { downloadCotizacionPdf } from '@/lib/cotizacionPdf'
import LoginRequiredModal from '@/components/LoginRequiredModal'
import CheckoutModal from '@/components/CheckoutModal'

const METODOS_PAGO = [
    { value: 'Efectivo', label: 'Efectivo' },
    { value: 'Transferencia', label: 'Transferencia' },
    { value: 'Tarjeta', label: 'Tarjeta' },
    { value: 'Otro', label: 'Otro' },
]

const FALLBACK_IMAGE = '/Imagenes/caja.png'

function getFirstImageUrl(producto) {
    if (producto?.imagen) return resolveStorageUrl(producto.imagen)
    const imagenes = producto?.imagenes
    if (Array.isArray(imagenes) && imagenes.length > 0) return resolveStorageUrl(imagenes[0])
    return null
}

export default function CotizacionesClient() {
    const router = useRouter()
    const { user } = useAuth({ middleware: 'guest' })
    const { items: quoteItems, refresh, setCantidad: setCantidadCotizacion, clearItems, removeItem } = useCotizacion(user)
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })
    const [productos, setProductos] = useState({})
    const [loadingDetails, setLoadingDetails] = useState(true)
    const [guardando, setGuardando] = useState(false)
    const [guardarError, setGuardarError] = useState(null)
    const [verProductosExpandido, setVerProductosExpandido] = useState(true)
    const [loginModalOpen, setLoginModalOpen] = useState(false)
    const [pagarModal, setPagarModal] = useState(false)
    const [checkoutLoading, setCheckoutLoading] = useState(false)
    const [checkoutError, setCheckoutError] = useState(null)

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        const claves = quoteItems.map((i) => i.clave)
        if (!claves.length) {
            setProductos({})
            setLoadingDetails(false)
            return
        }
        setLoadingDetails(true)
        getPorClaves(claves).then((list) => {
            const byClave = {}
            ;(list || []).forEach((p) => { if (p?.clave) byClave[p.clave] = p })
            setProductos(byClave)
        }).catch(() => {}).finally(() => setLoadingDetails(false))
    }, [quoteItems.map((i) => i.clave).join(',')])

    const itemsConProducto = quoteItems.map((item) => {
        const p = productos[item.clave]
        const precio = p ? Number(p.precio) : 0
        const totalStock = (Number(p?.disponible) || 0) + (Number(p?.disponible_cd) || 0)
        const sinStock = totalStock <= 0
        const q = sinStock ? 0 : Math.min(Math.max(1, Number(item.cantidad) || 1), totalStock)
        const subtotal = sinStock ? 0 : precio * q
        return {
            ...item,
            cantidad: sinStock ? 0 : (Number(item.cantidad) || 1),
            nombre_producto: p?.descripcion || item.clave,
            precio_unitario: precio,
            subtotal,
            imagen: p ? getFirstImageUrl(p) : null,
            totalStock,
            sinStock,
            qtyEfectiva: q,
        }
    })
    const total = itemsConProducto.reduce((s, i) => s + (i.subtotal || 0), 0)
    const isEmpty = !quoteItems.length

    const handleGuardar = async () => {
        if (isEmpty) return
        const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token')
        if (!user && !hasToken) {
            setGuardando(true)
            try {
                await downloadCotizacionPdf(itemsConProducto, total)
            } finally {
                setGuardando(false)
            }
            return
        }
        setGuardando(true)
        setGuardarError(null)
        try {
            // Usar API si hay token; obtener userId de user o de auth_user (user puede estar cargando)
            let userId = user?.id
            if (userId == null && hasToken && typeof window !== 'undefined') {
                try {
                    const u = localStorage.getItem('auth_user')
                    userId = u ? JSON.parse(u)?.id : null
                } catch { /* ignore */ }
            }
            if (isLoggedInUserId(userId)) {
                await saveCotizacionApi(itemsConProducto, total)
            } else {
                saveCotizacionActual(itemsConProducto, total, getEffectiveUserId(user))
            }
            clearItems()
            refresh()
            router.push('/dashboard?tab=cotizaciones')
        } catch (err) {
            const d = err?.response?.data
            const msg = d?.message || (typeof d?.errors === 'object' ? Object.values(d.errors).flat().join(' ') : null) || err?.message || 'Error al guardar la cotización.'
            setGuardarError(msg)
        } finally {
            setGuardando(false)
        }
    }

    const handlePagar = () => {
        if (!user) {
            setLoginModalOpen(true)
            return
        }
        if (isEmpty) return
        setPagarModal(true)
    }

    // Pago real aún no implementado: no hace nada por ahora (igual que en carrito)
    const handleConfirmarPedido = () => {}

    const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50'
    const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'

    return (
        <div className={`min-h-screen transition-colors duration-300 ${bg} ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <nav className={`text-sm mb-6 ${textMuted}`}>
                    <Link href="/tienda" className="hover:text-[#FF8000] transition-colors">Tienda</Link>
                    <span className="mx-2">/</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-800'}>Mis cotizaciones</span>
                </nav>

                <h1 className="text-2xl md:text-3xl font-bold mb-6">Mis cotizaciones</h1>

                {isEmpty ? (
                    <div className={`rounded-lg border p-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>No tienes productos en la cotización.</p>
                        <p className={`mt-2 text-sm ${textMuted}`}>Activa el modo cotización en el menú Cotizaciones y selecciona productos en la tienda.</p>
                        <Link href="/tienda" className="inline-block mt-4 text-[#FF8000] hover:underline font-medium">
                            Ir a la tienda
                        </Link>
                    </div>
                ) : (
                    <>
                        {/* Resumen y botón Ver productos */}
                        <div
                            className={`mb-6 p-4 rounded-lg border ${
                                darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-4">
                                <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                    Tienes {itemsConProducto.length} {itemsConProducto.length === 1 ? 'producto' : 'productos'} en tu cotización. Total: {formatPrecio(total)}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setVerProductosExpandido(!verProductosExpandido)}
                                    className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                                        darkMode
                                            ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
                                    }`}
                                >
                                    {verProductosExpandido ? 'Ocultar productos' : 'Ver productos'}
                                    <svg className={`w-4 h-4 transition-transform ${verProductosExpandido ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Lista de productos: fotos, datos, cantidad, precios */}
                        {verProductosExpandido && (
                            <div className="space-y-4 mb-8" id="lista-productos-cotizacion">
                                <h2 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    Productos en tu cotización
                                </h2>
                                {itemsConProducto.map((item) => (
                                    <div
                                        key={item.clave}
                                        className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg border ${
                                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <div className="relative w-full sm:w-32 h-32 sm:h-24 shrink-0 rounded overflow-hidden bg-gray-100">
                                            <Image
                                                src={item.imagen || FALLBACK_IMAGE}
                                                alt={item.nombre_producto?.slice(0, 60) || 'Producto'}
                                                fill
                                                className="object-contain"
                                                unoptimized={item.imagen?.startsWith('http')}
                                            />
                                            {loadingDetails && !item.imagen && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 dark:bg-gray-700/50">
                                                    <span className={`text-xs ${textMuted}`}>Cargando…</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                href={`/tienda/producto/${encodeURIComponent(item.clave)}`}
                                                className={`font-semibold line-clamp-2 hover:text-[#FF8000] ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                            >
                                                {item.nombre_producto}
                                            </Link>
                                            <p className={`mt-1 text-sm ${textMuted}`}>Clave: {item.clave}</p>
                                            <p className={`mt-1 text-xs ${textMuted}`}>
                                                {item.sinStock ? (
                                                    <span className={darkMode ? 'text-red-400' : 'text-red-600'}>Sin stock</span>
                                                ) : (
                                                    <span>En stock: {item.totalStock} disponible(s)</span>
                                                )}
                                            </p>
                                            <p className={`mt-1 ${darkMode ? 'text-[#FF8000]' : 'text-[#FF8000]'}`}>
                                                {formatPrecio(item.precio_unitario)} × {item.qtyEfectiva} = {item.sinStock ? (
                                                    <span className={`text-sm font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Sin stock</span>
                                                ) : (
                                                    formatPrecio(item.subtotal)
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                                            {item.sinStock ? (
                                                <div className={`flex items-center gap-2 rounded-xl border-2 border-l-4 px-3 py-2 ${darkMode ? 'bg-gray-700/80 border-gray-600 border-l-red-500' : 'bg-red-50/80 border-red-200 border-l-red-500'}`}>
                                                    <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>0</span>
                                                    <span className={`text-xs font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Sin stock</span>
                                                </div>
                                            ) : (
                                            <div className="flex items-center gap-3">
                                                <label className={`text-sm font-semibold uppercase tracking-wide shrink-0 ${textMuted}`} htmlFor={`qty-cot-${item.clave}`}>
                                                    Cantidad
                                                </label>
                                                <div className={`relative flex items-center gap-0 rounded-xl border-2 border-l-4 transition-colors focus-within:ring-2 focus-within:ring-[#FF8000] focus-within:ring-offset-2 focus-within:ring-offset-transparent overflow-hidden ${
                                                    darkMode
                                                        ? 'bg-gray-700/80 border-gray-600 border-l-[#FF8000] focus-within:border-[#FF8000]'
                                                        : 'bg-amber-50/80 border-amber-200 border-l-[#FF8000] focus-within:border-[#FF8000] shadow-sm'
                                                }`}>
                                                    <span className="pl-2.5 shrink-0 text-[#FF8000]" aria-hidden>
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                        </svg>
                                                    </span>
                                                    <input
                                                        id={`qty-cot-${item.clave}`}
                                                        type="number"
                                                        min={1}
                                                        max={Math.max(1, item.totalStock)}
                                                        value={item.qtyEfectiva}
                                                        onChange={(e) => {
                                                            const raw = Number(e.target.value)
                                                            const v = Math.max(1, Math.min(item.totalStock, (raw >= 1 && !Number.isNaN(raw)) ? raw : 1))
                                                            setCantidadCotizacion(item.clave, v)
                                                            refresh()
                                                        }}
                                                        onBlur={(e) => {
                                                            const raw = Number(e.target.value)
                                                            if (Number.isNaN(raw) || raw < 1 || e.target.value === '') {
                                                                setCantidadCotizacion(item.clave, 1)
                                                                refresh()
                                                            } else if (raw > item.totalStock) {
                                                                setCantidadCotizacion(item.clave, item.totalStock)
                                                                refresh()
                                                            }
                                                        }}
                                                        className={`w-14 py-2 pr-0 text-base font-semibold text-center bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                            darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                                                        }`}
                                                    />
                                                    <div className="flex flex-col shrink-0 border-l border-gray-300 dark:border-gray-600">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const v = Math.min(item.totalStock, item.qtyEfectiva + 1)
                                                                setCantidadCotizacion(item.clave, v)
                                                                refresh()
                                                            }}
                                                            aria-label="Aumentar cantidad"
                                                            className={`p-1 flex items-center justify-center transition-colors ${
                                                                darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-amber-100 text-gray-600'
                                                            }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const v = Math.max(1, item.qtyEfectiva - 1)
                                                                setCantidadCotizacion(item.clave, v)
                                                                refresh()
                                                            }}
                                                            aria-label="Disminuir cantidad"
                                                            className={`p-1 flex items-center justify-center transition-colors border-t border-gray-300 dark:border-gray-600 ${
                                                                darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-amber-100 text-gray-600'
                                                            }`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    removeItem(item.clave)
                                                    refresh()
                                                }}
                                                className={`inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                    darkMode
                                                        ? 'bg-red-900/50 hover:bg-red-800 text-red-300 border border-red-700'
                                                        : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                                }`}
                                                aria-label="Eliminar de la cotización"
                                            >
                                                <Image
                                                    src="/Imagenes/icon_basura.png"
                                                    alt=""
                                                    width={18}
                                                    height={18}
                                                    className={`object-contain shrink-0 ${darkMode ? 'brightness-0 invert' : ''}`}
                                                />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={`flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg border ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Total: {formatPrecio(total)}
                            </p>
                            <div className="flex flex-col items-end gap-2">
                                {guardarError && (
                                    <p className="text-sm text-red-500">{guardarError}</p>
                                )}
                                <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleGuardar}
                                    disabled={guardando}
                                    className={`px-5 py-2.5 rounded-lg font-medium border-2 transition-colors disabled:opacity-70 ${
                                        darkMode ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-800'
                                    }`}
                                >
                                    {guardando ? 'Guardando…' : 'Guardar cotización'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePagar}
                                    className="px-6 py-3 rounded-lg font-semibold bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors"
                                >
                                    Pagar
                                </button>
                                </div>
                            </div>
                        </div>

                        {!user && (
                            <p className={`mt-4 text-sm ${textMuted}`}>
                                Para pagar deberás iniciar sesión o registrarte.
                            </p>
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
            </main>

            <LoginRequiredModal
                open={loginModalOpen}
                onClose={() => setLoginModalOpen(false)}
                returnUrl="/tienda/cotizaciones"
                darkMode={darkMode}
            />

            <CheckoutModal
                open={pagarModal}
                onClose={() => !checkoutLoading && setPagarModal(false)}
                darkMode={darkMode}
                onConfirm={handleConfirmarPedido}
                loading={checkoutLoading}
                error={checkoutError}
            />
        </div>
    )
}
