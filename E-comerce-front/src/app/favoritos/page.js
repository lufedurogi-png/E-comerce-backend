'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/auth'
import Link from 'next/link'
import Image from 'next/image'
import TiendaNavHeader from '@/components/TiendaNavHeader'
import { useFavoritos } from '@/lib/favoritos'
import { useCarrito } from '@/lib/carrito'
import { formatPrecio } from '@/lib/productos'

const FALLBACK_IMAGE = '/Imagenes/caja.png'

function getFirstImageUrl(producto) {
    if (producto?.imagen) return producto.imagen
    const imagenes = producto?.imagenes
    if (Array.isArray(imagenes) && imagenes.length > 0) return imagenes[0]
    return null
}

const Favoritos = () => {
    const { user } = useAuth({ middleware: 'auth' })
    const isLogged = !!user
    const { claves, productByClave, remove: removeFavorito, isLoading } = useFavoritos(isLogged)
    const { items: cartItems, add: addToCart, isInCart } = useCarrito(isLogged)
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })
    const [activeAddToCartClave, setActiveAddToCartClave] = useState(null)
    const [addToCartQuantity, setAddToCartQuantity] = useState(1)
    const [addToCartMessage, setAddToCartMessage] = useState(null)

    const handleActivateAddToCart = (clave) => {
        setActiveAddToCartClave((prev) => (prev === clave ? null : clave))
        setAddToCartQuantity(1)
        setAddToCartMessage(null)
    }
    const handleEnviar = async (clave, cantidad, disponibleParaAgregar) => {
        setAddToCartMessage(null)
        if (cantidad > disponibleParaAgregar) {
            setAddToCartMessage('No se puede agregar más: ya tienes el máximo disponible en el carrito.')
            return
        }
        try {
            await addToCart(clave, Math.max(1, cantidad))
            setActiveAddToCartClave(null)
        } catch {}
    }
    const handleCancelarAddToCart = () => {
        setActiveAddToCartClave(null)
        setAddToCartMessage(null)
    }

    const handleQuitar = async (clave) => {
        try {
            await removeFavorito(clave)
        } catch {}
    }

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'darkMode') {
                const newMode = JSON.parse(e.newValue)
                setDarkMode(newMode)
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    if (!user) {
        return null
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />

            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    <nav className={`text-sm mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <Link href="/tienda" className="hover:text-[#FF8000] transition-colors">Tienda</Link>
                        <span className="mx-2">/</span>
                        <span className={darkMode ? 'text-gray-300' : 'text-gray-800'}>Favoritos</span>
                    </nav>
                    <h1 className={`text-3xl font-bold mb-8 ${
                        darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        Favoritos
                    </h1>

                    {isLoading && claves.length === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((i) => (
                                <div
                                    key={i}
                                    className={`rounded-lg border overflow-hidden animate-pulse ${
                                        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                    }`}
                                >
                                    <div className="h-48 bg-gray-200 dark:bg-gray-700" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mt-2" />
                                    </div>
                                    <div className="px-4 pb-4">
                                        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : claves.length === 0 ? (
                        <div className={`rounded-xl p-8 border-2 ${
                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                            <p className={`text-center text-lg ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                No tienes productos en favoritos.
                            </p>
                            <Link href="/tienda" className="inline-block mt-4 text-[#FF8000] hover:underline font-medium">
                                Ir a la tienda
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {claves.map((clave) => {
                                const p = productByClave[clave]
                                const loadingCard = p == null
                                const totalStock = p != null ? (Number(p.disponible) || 0) + (Number(p.disponible_cd) || 0) : 0
                                const quantityInCart = (cartItems || []).find((i) => i.clave === clave)?.cantidad ?? 0
                                const disponibleParaAgregar = Math.max(0, totalStock - quantityInCart)
                                const hasStock = totalStock >= 1
                                const puedeAgregarMas = disponibleParaAgregar >= 1
                                const inCart = isInCart(clave)
                                const isActiveAdd = activeAddToCartClave === clave
                                const maxQty = Math.max(1, disponibleParaAgregar)
                                const displayQty = Math.min(Math.max(1, addToCartQuantity), maxQty)
                                const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'
                                return (
                                    <div
                                        key={clave}
                                        className={`rounded-lg border overflow-hidden transition-all ${
                                            darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <Link href={`/tienda/producto/${encodeURIComponent(clave)}`} className="block">
                                            <div className="relative h-48 bg-gray-100">
                                                <Image
                                                    src={loadingCard ? FALLBACK_IMAGE : (getFirstImageUrl(p) || FALLBACK_IMAGE)}
                                                    alt={loadingCard ? '' : (p?.descripcion?.slice(0, 60) || 'Producto')}
                                                    fill
                                                    className="object-contain p-2"
                                                    unoptimized={!loadingCard && getFirstImageUrl(p)?.startsWith('http')}
                                                />
                                                {loadingCard && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-gray-200/50 dark:bg-gray-700/50">
                                                        <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando…</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4">
                                                <h3 className={`font-semibold line-clamp-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {loadingCard ? clave : (p?.descripcion || clave)}
                                                </h3>
                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                    <p className="text-lg font-bold text-[#FF8000]">
                                                        {loadingCard ? '—' : formatPrecio(p?.precio, p?.moneda)}
                                                    </p>
                                                    {!loadingCard && (
                                                        <p className={`text-sm font-semibold shrink-0 ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                            Stock: {totalStock > 0 ? totalStock : 'Sin stock'}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </Link>
                                        <div className="px-4 pb-4 space-y-2">
                                            {hasStock && !loadingCard && (
                                                <>
                                                    {inCart ? (
                                                        <button
                                                            type="button"
                                                            disabled
                                                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white border border-gray-500 bg-gray-500 cursor-not-allowed opacity-80"
                                                        >
                                                            En el carrito
                                                        </button>
                                                    ) : !isActiveAdd ? (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.preventDefault(); handleActivateAddToCart(clave) }}
                                                            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-white border transition-colors bg-[#FF8000] hover:bg-[#e67300] border-[#FF8000]"
                                                        >
                                                            Agregar a carrito
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <div className="flex items-center gap-2">
                                                                <label className={`text-sm font-semibold uppercase tracking-wide shrink-0 ${textMuted}`} htmlFor={`qty-fav-${clave}`}>
                                                                    Cantidad
                                                                </label>
                                                                <div className={`flex items-center gap-0 rounded-xl border-2 border-l-4 overflow-hidden ${
                                                                    darkMode
                                                                        ? 'bg-gray-700/80 border-gray-600 border-l-[#FF8000]'
                                                                        : 'bg-amber-50/80 border-amber-200 border-l-[#FF8000] shadow-sm'
                                                                }`}>
                                                                    <span className="pl-2.5 shrink-0 text-[#FF8000]" aria-hidden>
                                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                                                                        </svg>
                                                                    </span>
                                                                    <input
                                                                        id={`qty-fav-${clave}`}
                                                                        type="number"
                                                                        min={1}
                                                                        max={maxQty}
                                                                        value={displayQty}
                                                                        onChange={(e) => {
                                                                            const raw = Number(e.target.value)
                                                                            const v = Math.max(1, Math.min(maxQty, (raw >= 1 && !Number.isNaN(raw)) ? raw : 1))
                                                                            setAddToCartQuantity(v)
                                                                        }}
                                                                        onBlur={() => {
                                                                            if (addToCartQuantity < 1 || addToCartQuantity > maxQty) setAddToCartQuantity(displayQty)
                                                                        }}
                                                                        className={`w-14 py-2 pr-0 text-base font-semibold text-center bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                                                            darkMode ? 'text-white' : 'text-gray-900'
                                                                        }`}
                                                                    />
                                                                    <div className="flex flex-col shrink-0 border-l border-gray-300 dark:border-gray-600">
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setAddToCartQuantity((q) => Math.min(maxQty, q + 1))}
                                                                            aria-label="Aumentar cantidad"
                                                                            className={`p-1 flex items-center justify-center ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-amber-100 text-gray-600'}`}
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => setAddToCartQuantity((q) => Math.max(1, q - 1))}
                                                                            aria-label="Disminuir cantidad"
                                                                            className={`p-1 flex items-center justify-center border-t border-gray-300 dark:border-gray-600 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-amber-100 text-gray-600'}`}
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                            </svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleEnviar(clave, displayQty, disponibleParaAgregar)}
                                                                    className="flex-1 inline-flex justify-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-[#FF8000] hover:bg-[#e67300] transition-colors"
                                                                >
                                                                    Enviar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={handleCancelarAddToCart}
                                                                    className={`flex-1 inline-flex justify-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                                                        darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                                    }`}
                                                                >
                                                                    Cancelar
                                                                </button>
                                                            </div>
                                                            {isActiveAdd && addToCartMessage && (
                                                                <p className={`text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} role="alert">
                                                                    {addToCartMessage}
                                                                </p>
                                                            )}
                                                        </>
                                                    )}
                                                </>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => handleQuitar(clave)}
                                                disabled={loadingCard}
                                                className="inline-flex items-center gap-2 w-full justify-center px-3 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-red-600 hover:border-red-700 transition-colors disabled:opacity-70"
                                            >
                                                <Image
                                                    src="/Imagenes/icon_basura.png"
                                                    alt=""
                                                    width={18}
                                                    height={18}
                                                    className="object-contain brightness-0 invert"
                                                />
                                                Quitar de favoritos
                                            </button>
                                        </div>
                                    </div>
                                )
                            })}
                            </div>
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

            {/* Footer */}
            <footer className={`border-t transition-colors duration-300 ${
                darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Información de Contacto */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative w-8 h-8">
                                    <Image
                                        src="/Imagenes/icon_contacto.png"
                                        alt="Contacto"
                                        fill
                                        className={`object-contain ${
                                            darkMode ? 'brightness-0 invert' : ''
                                        }`}
                                    />
                                </div>
                                <h3 className={`text-xl font-bold ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    Contáctanos
                                </h3>
                            </div>
                            <div className={`space-y-2 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <p className="text-lg font-semibold text-[#FF8000]">333 616-7279</p>
                                <p className="text-base">desarrollo@nxt.it.com</p>
                                <p className="text-sm leading-relaxed">
                                    Av. Lopez Mateos #1038-11, Col Italia Providencia CP 44630<br />
                                    Jalisco, Guadalajara
                                </p>
                            </div>
                        </div>

                        {/* Enlaces Rápidos */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Enlaces rápidos
                            </h3>
                            <ul className={`space-y-2 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <li>
                                    <Link href="/" className="hover:text-[#FF8000] transition-colors">
                                        Inicio
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tienda" className="hover:text-[#FF8000] transition-colors">
                                        Tienda
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard" className="hover:text-[#FF8000] transition-colors">
                                        Home
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Información de la Empresa */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Sobre nosotros
                            </h3>
                            <p className={`text-sm leading-relaxed ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Fundada en 2009 como Arrcuss Comercial de S de RL de CV, ahora NXT.IT, 
                                nació como un proyecto emprendedor para democratizar la creciente necesidad 
                                por equipo de cómputo y electrónica de las PYMES.
                            </p>
                        </div>

                        {/* Redes Sociales / Información Adicional */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Información
                            </h3>
                            <div className={`space-y-2 text-sm ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <p>
                                    <span className="font-semibold">Misión:</span> Incrementar las capacidades 
                                    de nuestros clientes mediante innovadoras soluciones de software, hardware 
                                    y tecnología de consumo.
                                </p>
                                <p>
                                    <span className="font-semibold">Visión:</span> Ser una empresa reconocida 
                                    por su liderazgo en el mercado de Tecnologías de la Información.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className={`mt-8 pt-8 border-t text-center text-sm ${
                        darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'
                    }`}>
                        <p>&copy; {new Date().getFullYear()} NXT.IT. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default Favoritos
