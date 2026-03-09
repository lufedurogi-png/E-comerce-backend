'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'

const Layout = ({ children }) => {
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })

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

    return (
        <div className={`min-h-screen transition-colors duration-300 flex flex-col ${
            darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 border-b transition-colors duration-300 flex-shrink-0 ${
                darkMode ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' : 'bg-white/95 backdrop-blur-sm border-gray-200'
            }`} style={{ height: '4rem' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/Imagenes/logo_en.png"
                                alt="NXT.IT"
                                width={120}
                                height={40}
                                className="h-8 w-auto"
                            />
                        </Link>
                        <div className="flex items-center space-x-4">
                            {/* Toggle Modo Oscuro/Claro */}
                            <div className="flex items-center space-x-2">
                                <div className="relative w-5 h-5">
                                    <Image
                                        src="/Imagenes/icon_modo.webp"
                                        alt="Modo"
                                        width={20}
                                        height={20}
                                        className={`object-contain transition-all duration-300 ${
                                            darkMode 
                                                ? 'brightness-0 invert' 
                                                : ''
                                        }`}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const newMode = !darkMode
                                        setDarkMode(newMode)
                                        localStorage.setItem('darkMode', JSON.stringify(newMode))
                                        // Disparar evento personalizado para sincronizar otros componentes
                                        window.dispatchEvent(new CustomEvent('darkModeChange', { detail: newMode }))
                                    }}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${
                                        darkMode 
                                            ? 'bg-[#2b4e94]' 
                                            : 'bg-gray-300'
                                    }`}
                                    aria-label="Toggle dark mode"
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                                            darkMode ? 'translate-x-8' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                                <span className={`text-xs font-medium ${
                                    darkMode ? 'text-[#FF8000]' : 'text-gray-500'
                                }`}>
                                    {darkMode ? 'Oscuro' : 'Claro'}
                                </span>
                            </div>
                            <Link
                                href="/"
                                className={`transition-colors font-medium ${
                                    darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'
                                }`}
                            >
                                Inicio
                            </Link>
                            <Link
                                href="/tienda"
                                className={`transition-colors font-medium ${
                                    darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'
                                }`}
                            >
                                Tienda
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido Principal: altura mínima para que la cortina/form lleguen hasta abajo en pantalla completa */}
            <main className="flex-1 flex flex-col relative min-h-0 min-h-[calc(100vh-4rem)]">
                {children}
            </main>

            {/* Footer: siempre abajo, se ajusta al viewport */}
            <footer className={`border-t transition-colors duration-300 flex-shrink-0 mt-auto ${
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
                                    <Link href="/login" className="hover:text-[#FF8000] transition-colors">
                                        Iniciar Sesión
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/admin-login" className="hover:text-[#FF8000] transition-colors">
                                        Admin
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/ventas-login" className="hover:text-[#FF8000] transition-colors">
                                        Ventas
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

export default Layout
