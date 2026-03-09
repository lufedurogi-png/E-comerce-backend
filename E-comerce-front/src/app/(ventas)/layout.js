'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useVentasAuth } from '@/hooks/useVentasAuth'

const navItems = [
    { href: '/ventas-home', label: 'Inicio', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { href: '/ventas-mensajes', label: 'Mensajería', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
]

export default function VentasLayout({ children }) {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useVentasAuth({ middleware: 'auth' })
    const [darkMode, setDarkMode] = useState(true)
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [mounted, setMounted] = useState(false)
    const [ventasMenuOpen, setVentasMenuOpen] = useState(false)
    const ventasMenuRef = useRef(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        if (!mounted) return
        if (typeof window !== 'undefined') {
            setDarkMode(JSON.parse(localStorage.getItem('darkMode') ?? 'true'))
        }
    }, [mounted])

    useEffect(() => {
        if (!mounted) return
        const token = localStorage.getItem('auth_token')
        const isVentas = localStorage.getItem('auth_ventas')
        if (!token || !isVentas) {
            router.push('/ventas-login')
        }
    }, [mounted, router])

    useEffect(() => {
        if (darkMode) document.documentElement.classList.add('dark')
        else document.documentElement.classList.remove('dark')
    }, [darkMode])

    useEffect(() => {
        if (!mounted) return
        const onToggle = (e) => {
            setDarkMode(!!e.detail)
        }
        window.addEventListener('darkModeChange', onToggle)
        return () => window.removeEventListener('darkModeChange', onToggle)
    }, [mounted])

    useEffect(() => {
        function handleClickOutside(event) {
            if (ventasMenuRef.current && !ventasMenuRef.current.contains(event.target)) {
                setVentasMenuOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    if (mounted && !user && typeof window !== 'undefined' && localStorage.getItem('auth_token')) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">Cargando...</div>
    }

    return (
        <div className={`min-h-screen flex transition-colors ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Sidebar - color indigo (representativo para vendedores) */}
            <aside className={`fixed left-0 top-0 z-40 h-screen transition-all duration-300 flex flex-col ${
                sidebarOpen ? 'w-64' : 'w-20'
            } ${darkMode ? 'bg-gray-800 border-r border-gray-700' : 'bg-white border-r border-gray-200'}`}>
                <div className={`flex items-center justify-between h-16 px-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {sidebarOpen && <span className="font-bold text-indigo-400">Panel Ventas</span>}
                    <button onClick={() => setSidebarOpen((s) => !s)} className="p-2 rounded hover:bg-gray-700">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>
                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-lg transition-colors ${
                                pathname === item.href
                                    ? 'bg-indigo-600 text-white'
                                    : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                            </svg>
                            {sidebarOpen && <span>{item.label}</span>}
                        </Link>
                    ))}
                </nav>
            </aside>

            <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'}`}>
                <header className={`sticky top-0 z-30 flex items-center justify-end h-14 px-6 border-b shrink-0 ${
                    darkMode ? 'bg-gray-800/95 border-gray-700 backdrop-blur' : 'bg-white/95 border-gray-200 backdrop-blur'
                }`}>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3">
                            <span className={`flex h-8 w-8 items-center justify-center rounded-full border ${darkMode ? 'border-gray-600 bg-gray-700/50' : 'border-gray-300 bg-gray-100'}`}>
                                <Image src="/Imagenes/icon_modo.webp" alt="" width={16} height={16} className="w-4 h-4 object-contain" />
                            </span>
                            <button
                                onClick={() => {
                                    const newMode = !darkMode
                                    setDarkMode(newMode)
                                    if (typeof window !== 'undefined') {
                                        localStorage.setItem('darkMode', JSON.stringify(newMode))
                                        window.dispatchEvent(new CustomEvent('darkModeChange', { detail: newMode }))
                                    }
                                }}
                                className={`relative inline-flex h-7 w-14 shrink-0 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                                    darkMode ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                                aria-label="Modo oscuro / claro"
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                                        darkMode ? 'translate-x-8' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                            <span className={`text-sm font-medium min-w-[3.5rem] ${darkMode ? 'text-indigo-400/90' : 'text-gray-500'}`}>
                                {darkMode ? 'Oscuro' : 'Claro'}
                            </span>
                        </div>

                        <div className="relative" ref={ventasMenuRef}>
                            <button
                                type="button"
                                onClick={() => setVentasMenuOpen((o) => !o)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                                    darkMode ? 'border-gray-600 text-gray-200 hover:bg-gray-700' : 'border-gray-300 text-gray-800 hover:bg-gray-100'
                                }`}
                            >
                                <span className="text-sm">
                                    <span className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Vendedor: </span>
                                    <span className="font-medium">{user?.name || user?.nombre || 'Vendedor'}</span>
                                </span>
                                <svg className={`w-4 h-4 transition-transform ${ventasMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                            {ventasMenuOpen && (
                                <div className={`absolute right-0 top-full mt-1 min-w-[180px] rounded-lg border shadow-lg overflow-hidden ${
                                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                }`}>
                                    <button
                                        type="button"
                                        onClick={() => { setVentasMenuOpen(false); logout() }}
                                        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-red-400 hover:bg-gray-700/50 transition-colors"
                                    >
                                        <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-1 p-6 overflow-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
