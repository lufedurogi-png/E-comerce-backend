'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import TiendaNavHeader from '@/components/TiendaNavHeader'
import { formatPrecio, resolveStorageUrl } from '@/lib/productos'
import { useProductosByClaves } from '@/hooks/useProductosChunked'
import { getOrCreateGuestId } from '@/lib/guestId'
import {
    getGuestCart,
    setGuestCart,
    addToCart,
    useCarrito,
    checkoutCart,
} from '@/lib/carrito'
import LoginRequiredModal from '@/components/LoginRequiredModal'
import CheckoutModal from '@/components/CheckoutModal'

const FALLBACK_IMAGE = '/Imagenes/caja.png'

function getFirstImageUrl(producto) {
    if (producto?.imagen) return resolveStorageUrl(producto.imagen)
    const imagenes = producto?.imagenes
    if (Array.isArray(imagenes) && imagenes.length > 0) return resolveStorageUrl(imagenes[0])
    return null
}

export default function CarritoClient() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { user } = useAuth({ middleware: 'guest' })
    const [mounted, setMounted] = useState(false)
    const [hasToken, setHasToken] = useState(false)
    useEffect(() => {
        setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('auth_token'))
        setMounted(true)
    }, [])
    const isLogged = !!user || hasToken
    const { items: cartItems, total: cartTotal, isLoading, remove: removeFromCarrito, setQuantity: setCartQuantity, flushQuantity: flushCartQuantity, flushAllQuantities: flushAllCartQuantities } = useCarrito(isLogged)

    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })
    const [syncingGuest, setSyncingGuest] = useState(false)
    const [pagarModal, setPagarModal] = useState(false)
    const [loginRequiredOpen, setLoginRequiredOpen] = useState(false)
    const [metodoPago, setMetodoPago] = useState('Efectivo')
    const [checkoutLoading, setCheckoutLoading] = useState(false)
    const [checkoutError, setCheckoutError] = useState(null)

    // Usuario logueado: GET /carrito ya trae imagen y stock → una sola petición. Invitado: necesita getPorClaves.
    const cartKeys = cartItems?.map((i) => i.clave) ?? []
    const { productByClave } = useProductosByClaves(isLogged ? [] : cartKeys, 'cart-productos')

    const itemsToShow = useMemo(() => {
        const list = cartItems || []
        if (!list.length) return []
        return list.map((item) => {
            if (isLogged) {
                const totalStock = (Number(item.disponible) || 0) + (Number(item.disponible_cd) || 0)
                const rawImg = item.imagen || (Array.isArray(item.imagenes) && item.imagenes[0]) || null
                const imagen = rawImg ? resolveStorageUrl(rawImg) : null
                const q = Math.max(1, Number(item.cantidad) || 1)
                const cappedQty = totalStock >= 1 ? Math.min(q, totalStock) : q
                return {
                    ...item,
                    imagen: imagen || null,
                    totalStock: totalStock >= 0 ? totalStock : undefined,
                    cantidad: cappedQty,
                    subtotal: (item.precio_unitario ?? 0) * cappedQty,
                }
            }
            const p = productByClave[item.clave]
            const totalStock = p != null ? (Number(p.disponible) || 0) + (Number(p.disponible_cd) || 0) : undefined
            const imagen = p ? getFirstImageUrl(p) : (item.imagen || null)
            const q = Math.max(1, Number(item.cantidad) || 1)
            const cappedQty = totalStock != null && totalStock >= 1 ? Math.min(q, totalStock) : q
            const precio = p ? Number(p.precio) : 0
            return {
                ...item,
                nombre_producto: p?.descripcion || item.clave,
                precio_unitario: precio,
                subtotal: cappedQty * precio,
                imagen: imagen || null,
                totalStock,
                cantidad: cappedQty,
            }
        })
    }, [cartItems, productByClave, isLogged])

    const totalComputed = useMemo(
        () => (isLogged ? 0 : itemsToShow.reduce((s, i) => s + (Number(i.subtotal) || 0), 0)),
        [isLogged, itemsToShow]
    )

    // Sincronizar cantidad > stock al backend (logueado: datos vienen en cada item del carrito).
    useEffect(() => {
        if (!isLogged || !cartItems?.length) return
        ;(cartItems || []).forEach((cartItem) => {
            const totalStock = (Number(cartItem.disponible) || 0) + (Number(cartItem.disponible_cd) || 0)
            const qty = Number(cartItem.cantidad) || 1
            if (totalStock >= 1 && qty > totalStock) setCartQuantity(cartItem.clave, totalStock)
        })
    }, [isLogged, cartItems?.map((i) => `${i.clave}-${i.cantidad}-${i.disponible}-${i.disponible_cd}`).join(',')])

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        if (!isLogged || !syncingGuest) return
        const guestId = getOrCreateGuestId()
        if (!guestId) {
            setSyncingGuest(false)
            return
        }
        const guestItems = getGuestCart(guestId)
        if (guestItems.length === 0) {
            setSyncingGuest(false)
            return
        }
        let cancelled = false
        ;(async () => {
            try {
                for (const { clave, cantidad } of guestItems) {
                    if (cancelled) return
                    await addToCart(clave, Number(cantidad) || 1)
                }
                if (!cancelled) setGuestCart([], guestId)
            } finally {
                if (!cancelled) setSyncingGuest(false)
            }
        })()
        return () => { cancelled = true }
    }, [isLogged, syncingGuest])

    useEffect(() => {
        if (!isLogged) return
        const guestId = getOrCreateGuestId()
        if (guestId && getGuestCart(guestId).length > 0) setSyncingGuest(true)
    }, [isLogged])

    // Abrir modal de checkout si viene de "Comprar ahora" (?pagar=1)
    useEffect(() => {
        if (!mounted || !isLogged) return
        if (searchParams?.get('pagar') === '1' && cartItems?.length > 0) {
            setPagarModal(true)
            router.replace('/tienda/carrito', { scroll: false })
        }
    }, [mounted, isLogged, searchParams, cartItems?.length, router])

    const displayTotal = isLogged ? cartTotal : totalComputed
    const handleQuitar = async (clave) => {
        try {
            await removeFromCarrito(clave)
        } catch {}
    }

    const handlePagar = async () => {
        if (!isLogged) {
            setLoginRequiredOpen(true)
            return
        }
        setCheckoutError(null)
        await flushAllCartQuantities()
        setPagarModal(true)
    }

    const handleCheckout = async () => {
        // Pago real aún no implementado: el botón no hace nada por ahora (solo usuario logueado llega aquí)
        return
        // --- Cuando implementes el pago real, descomenta lo siguiente y borra el return de arriba ---
        // setCheckoutError(null)
        // setCheckoutLoading(true)
        // try {
        //     const data = await checkoutCart(metodoPago)
        //     setPagarModal(false)
        //     router.push('/dashboard?tab=pedidos')
        // } catch (err) {
        //     setCheckoutError(err?.message || 'Error al crear el pedido')
        // } finally {
        //     setCheckoutLoading(false)
        // }
    }

    const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50'
    const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'
    const isEmpty = !cartItems?.length
    const showSkeleton = !mounted || (isLogged && isLoading && !cartItems?.length)

    return (
        <div className={`min-h-screen transition-colors duration-300 ${bg} ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
            <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
                <nav className={`text-sm mb-6 ${textMuted}`}>
                    <Link href="/tienda" className="hover:text-[#FF8000] transition-colors">Tienda</Link>
                    <span className="mx-2">/</span>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-800'}>Carrito</span>
                </nav>

                <h1 className="text-2xl md:text-3xl font-bold mb-6">Carrito</h1>

                {showSkeleton ? (
                    <div className="space-y-4 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`flex flex-col sm:flex-row gap-4 p-4 rounded-lg border animate-pulse ${
                                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                }`}
                            >
                                <div className="w-full sm:w-32 h-32 sm:h-24 rounded bg-gray-200 dark:bg-gray-700 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : isEmpty ? (
                    <div className={`rounded-lg border p-8 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>Tu carrito está vacío.</p>
                        <Link href="/tienda" className="inline-block mt-4 text-[#FF8000] hover:underline font-medium">
                            Ir a la tienda
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4 mb-8">
                            {itemsToShow.map((item) => {
                                const currentQty = cartItems?.find((c) => c.clave === item.clave)?.cantidad ?? item.cantidad
                                const maxQty = Math.max(1, item.totalStock ?? 999)
                                const displayQty = Math.min(Math.max(1, Number(currentQty) || 1), maxQty)
                                const displaySubtotal = (item.precio_unitario ?? 0) * displayQty
                                return (
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
                                        {!item.imagen && (
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
                                        <p className={`mt-2 ${darkMode ? 'text-[#FF8000]' : 'text-[#FF8000]'}`}>
                                            {formatPrecio(item.precio_unitario)} × {displayQty} = {formatPrecio(displaySubtotal)}
                                        </p>
                                        <p className={`mt-1 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                            Stock: {item.totalStock != null && item.totalStock > 0 ? item.totalStock : 'Sin stock'}
                                        </p>
                                    </div>
                                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                                        <div className="flex items-center gap-3">
                                            <label className={`text-sm font-semibold uppercase tracking-wide shrink-0 ${textMuted}`} htmlFor={`qty-cart-${item.clave}`}>
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
                                                    id={`qty-cart-${item.clave}`}
                                                    type="number"
                                                    min={1}
                                                    max={maxQty}
                                                    value={displayQty}
                                                    onChange={(e) => {
                                                        const raw = Number(e.target.value)
                                                        const v = Math.max(1, Math.min(maxQty, (raw >= 1 && !Number.isNaN(raw)) ? raw : 1))
                                                        setCartQuantity(item.clave, v)
                                                    }}
                                                    onBlur={(e) => {
                                                        const raw = Number(e.target.value)
                                                        if (Number.isNaN(raw) || raw < 1 || e.target.value === '') {
                                                            setCartQuantity(item.clave, 1)
                                                        } else if (raw > maxQty) {
                                                            setCartQuantity(item.clave, maxQty)
                                                        }
                                                        flushCartQuantity(item.clave)
                                                    }}
                                                    className={`w-14 py-2 pr-0 text-base font-semibold text-center bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                        darkMode ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                                                    }`}
                                                />
                                                <div className="flex flex-col shrink-0 border-l border-gray-300 dark:border-gray-600">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const v = Math.min(maxQty, displayQty + 1)
                                                            setCartQuantity(item.clave, v)
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
                                                            const v = Math.max(1, displayQty - 1)
                                                            setCartQuantity(item.clave, v)
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
                                        <button
                                            type="button"
                                            onClick={() => handleQuitar(item.clave)}
                                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700 transition-colors"
                                        >
                                            <Image
                                                src="/Imagenes/icon_basura.png"
                                                alt="Quitar"
                                                width={18}
                                                height={18}
                                                className="object-contain shrink-0 brightness-0 invert"
                                            />
                                            Quitar de carrito
                                        </button>
                                    </div>
                                </div>
                                )
                            })}
                        </div>

                        <div className={`flex flex-wrap items-center justify-between gap-4 p-6 rounded-lg border ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Total: {formatPrecio(displayTotal)}
                            </p>
                            <button
                                type="button"
                                onClick={handlePagar}
                                className="px-6 py-3 rounded-lg font-semibold bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors"
                            >
                                Pagar
                            </button>
                        </div>

                        {!isLogged && (
                            <p className={`mt-4 text-sm ${textMuted}`}>
                                Al pagar deberás iniciar sesión o registrarte para completar el pedido.
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
                open={loginRequiredOpen}
                onClose={() => setLoginRequiredOpen(false)}
                returnUrl="/tienda/carrito"
                darkMode={darkMode}
            />

            <CheckoutModal
                open={pagarModal}
                onClose={() => !checkoutLoading && setPagarModal(false)}
                darkMode={darkMode}
                onConfirm={handleCheckout}
                loading={checkoutLoading}
                error={checkoutError}
            />
        </div>
    )
}
