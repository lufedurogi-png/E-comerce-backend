'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import SearchBar from '@/components/SearchBar'
import { useCarrito } from '@/lib/carrito'
import { useFavoritos } from '@/lib/favoritos'
import { useProductosByClaves } from '@/hooks/useProductosChunked'

/**
 * Barra de navegación de la tienda: logo, toggle oscuro, Favoritos, Carrito, Tienda, Inicio.
 * Prefetch de datos de favoritos y carrito para que al abrir esas vistas carguen al instante.
 */
export default function TiendaNavHeader({ darkMode, setDarkMode }) {
    const { user, logout } = useAuth({ middleware: 'guest' })
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const [hasToken, setHasToken] = useState(false)
    useEffect(() => {
        setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('auth_token'))
    }, [])
    const isLogged = !!user || hasToken
    const { items: cartItems } = useCarrito(isLogged)
    const cartCount = (cartItems || []).reduce((s, i) => s + (Number(i.cantidad) || 0), 0)
    const { claves: favoritosClaves } = useFavoritos(isLogged)
    const favoritosCount = favoritosClaves?.length ?? 0

    const cartKeys = (cartItems || []).map((i) => i.clave)

    // Carrito invitado: prefetch productos para que cargue rápido. Logueado y favoritos: una petición trae todo.
    useProductosByClaves(isLogged ? [] : cartKeys, 'cart-productos')

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userDropdownOpen && !e.target.closest('.tienda-nav-user-dropdown')) {
                setUserDropdownOpen(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [userDropdownOpen])

    const toggleDark = () => {
        const next = !darkMode
        setDarkMode(next)
        localStorage.setItem('darkMode', JSON.stringify(next))
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('darkModeChange', { detail: next }))
        }
    }

    return (
        <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
            darkMode ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' : 'bg-white/95 backdrop-blur-sm border-gray-200'
        }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 gap-4">
                        <Link href="/" className="flex items-center shrink-0">
                            <Image src="/Imagenes/logo_en.png" alt="NXT.IT" width={120} height={40} className="h-8 w-auto" />
                        </Link>
                        <div className="hidden sm:block flex-1 max-w-md">
                            <SearchBar darkMode={darkMode} />
                        </div>
                    <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                        {/* Toggle modo oscuro / claro */}
                        <div className="flex items-center space-x-2">
                            <div className="relative w-5 h-5">
                                <Image
                                    src="/Imagenes/icon_modo.webp"
                                    alt="Modo"
                                    width={20}
                                    height={20}
                                    className={`object-contain transition-all duration-300 ${darkMode ? 'brightness-0 invert' : ''}`}
                                />
                            </div>
                            <button
                                onClick={toggleDark}
                                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${
                                    darkMode ? 'bg-[#2b4e94]' : 'bg-gray-300'
                                }`}
                                aria-label="Cambiar tema"
                            >
                                <span className={`inline-block h-5 w-5 rounded-full bg-white transition-transform duration-300 ${darkMode ? 'translate-x-8' : 'translate-x-1'}`} />
                            </button>
                            <span className={`text-xs font-medium ${darkMode ? 'text-[#FF8000]' : 'text-gray-500'}`}>
                                {darkMode ? 'Oscuro' : 'Claro'}
                            </span>
                        </div>
                        {user && (
                            <Link
                                href="/favoritos"
                                className={`flex items-center gap-1.5 transition-colors font-medium ${darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'}`}
                                aria-label="Favoritos"
                            >
                                <Image
                                    src="/Imagenes/icon_favoritos.png"
                                    alt="Favoritos"
                                    width={22}
                                    height={22}
                                    className={`object-contain ${darkMode ? 'brightness-0 invert' : ''}`}
                                />
                                <span>Favoritos</span>
                                {favoritosCount > 0 && (
                                    <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#FF8000] text-white text-xs font-semibold">
                                        {favoritosCount > 99 ? '99+' : favoritosCount}
                                    </span>
                                )}
                            </Link>
                        )}
                        <Link
                            href="/tienda/carrito"
                            className={`flex items-center gap-1.5 transition-colors font-medium ${darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'}`}
                            aria-label="Carrito"
                        >
                            <Image
                                src="/Imagenes/icon_carrito.png"
                                alt="Carrito"
                                width={22}
                                height={22}
                                className={`object-contain ${darkMode ? 'brightness-0 invert' : ''}`}
                            />
                            <span>Carrito</span>
                            {cartCount > 0 && (
                                <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full bg-[#FF8000] text-white text-xs font-semibold">
                                    {cartCount > 99 ? '99+' : cartCount}
                                </span>
                            )}
                        </Link>
                        <Link
                            href="/tienda"
                            className={`transition-colors font-medium ${darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'}`}
                        >
                            Tienda
                        </Link>
                        <Link
                            href="/"
                            className={`transition-colors font-medium ${darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'}`}
                        >
                            Inicio
                        </Link>
                        {user ? (
                            <div className="relative tienda-nav-user-dropdown">
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className={`flex items-center space-x-2 transition-colors font-medium ${darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'}`}
                                >
                                    <span>Tienda: {user?.name || user?.email}</span>
                                    <svg className={`w-4 h-4 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {userDropdownOpen && (
                                    <>
                                        <div className="fixed inset-0 z-10" onClick={() => setUserDropdownOpen(false)} aria-hidden />
                                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-20 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                            <div className="py-1">
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className={`flex items-center px-4 py-2 text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-[#FF8000]' : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]'}`}
                                                >
                                                    <Image src="/Imagenes/icon_home.webp" alt="" width={20} height={20} className={`mr-3 object-contain ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                    Home
                                                </Link>
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className={`flex items-center px-4 py-2 text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-[#FF8000]' : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]'}`}
                                                >
                                                    <Image src="/Imagenes/icon_pedidos.png" alt="" width={20} height={20} className={`mr-3 object-contain ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                    Mis pedidos
                                                </Link>
                                                <Link
                                                    href="/favoritos"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className={`flex items-center px-4 py-2 text-sm transition-colors ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-[#FF8000]' : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]'}`}
                                                >
                                                    <Image src="/Imagenes/icon_favoritos.png" alt="" width={20} height={20} className={`mr-3 object-contain ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                    Favoritos
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setUserDropdownOpen(false)
                                                        logout()
                                                    }}
                                                    className={`w-full flex items-center px-4 py-2 text-sm transition-colors text-left ${darkMode ? 'text-gray-300 hover:bg-gray-700 hover:text-[#FF8000]' : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]'}`}
                                                >
                                                    <Image src="/Imagenes/icon_cerrar_sesion.webp" alt="" width={20} height={20} className={`mr-3 object-contain ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                    Cerrar
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className={`transition-colors font-medium ${darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'}`}
                            >
                                Iniciar sesión
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </header>
    )
}
