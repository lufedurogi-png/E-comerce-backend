'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/hooks/auth'

const Home = () => {
    const { user, logout } = useAuth({ middleware: 'guest' })
    const [currentSlide, setCurrentSlide] = useState(0)
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const images = ['/Imagenes/f1.jpg', '/Imagenes/f2.png', '/Imagenes/f3.png', '/Imagenes/f4.png', '/Imagenes/f5.png']

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % images.length)
        }, 5000) // Cambia cada 5 segundos

        return () => clearInterval(interval)
    }, [images.length])

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownOpen && !event.target.closest('.relative')) {
                setUserDropdownOpen(false)
            }
        }
        if (userDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [userDropdownOpen])

    return (
        <div className="min-h-screen bg-black text-white overflow-hidden">
            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/Imagenes/logo_en.png"
                                alt="NXT.IT"
                                width={120}
                                height={40}
                                className="h-8 w-auto"
                            />
                        </Link>

                        {/* Login/Register Links o Usuario */}
                        <div className="flex items-center space-x-4">
                            <Link
                                href="/tienda"
                                className="text-white hover:text-[#FF8000] transition-colors font-medium"
                            >
                                Tienda
                            </Link>
                            
                            {/* Mostrar dropdown del usuario si está logueado, sino mostrar "Iniciar sesión" y "Registrarse" */}
                            {user ? (
                                <div className="relative">
                                    <button
                                        onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                        className="flex items-center space-x-2 text-white hover:text-[#FF8000] transition-colors font-medium"
                                    >
                                        <span>{user?.name || user?.email}</span>
                                        <svg
                                            className={`w-4 h-4 transition-transform duration-200 ${
                                                userDropdownOpen ? 'rotate-180' : ''
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {userDropdownOpen && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setUserDropdownOpen(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-20 bg-white border-gray-200">
                                                <div className="py-1">
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center px-4 py-2 text-sm transition-colors text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]"
                                                    >
                                                        <div className="relative w-5 h-5 mr-3">
                                                            <Image
                                                                src="/Imagenes/icon_home.webp"
                                                                alt="Home"
                                                                fill
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        Home
                                                    </Link>
                                                    <Link
                                                        href="/dashboard"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center px-4 py-2 text-sm transition-colors text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]"
                                                    >
                                                        <div className="relative w-5 h-5 mr-3">
                                                            <Image
                                                                src="/Imagenes/icon_pedidos.png"
                                                                alt="Mis pedidos"
                                                                fill
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        Mis pedidos
                                                    </Link>
                                                    <Link
                                                        href="/favoritos"
                                                        onClick={() => setUserDropdownOpen(false)}
                                                        className="flex items-center px-4 py-2 text-sm transition-colors text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]"
                                                    >
                                                        <div className="relative w-5 h-5 mr-3">
                                                            <Image
                                                                src="/Imagenes/icon_favoritos.png"
                                                                alt="Favoritos"
                                                                fill
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        Favoritos
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            setUserDropdownOpen(false)
                                                            logout()
                                                        }}
                                                        className="w-full flex items-center px-4 py-2 text-sm transition-colors text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]"
                                                    >
                                                        <div className="relative w-5 h-5 mr-3">
                                                            <Image
                                                                src="/Imagenes/icon_cerrar_sesion.webp"
                                                                alt="Cerrar sesión"
                                                                fill
                                                                className="object-contain"
                                                            />
                                                        </div>
                                                        Cerrar
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <>
                                    <Link
                                        href="/login"
                                        className="text-white hover:text-[#FF8000] transition-colors font-medium"
                                    >
                                        Iniciar sesión
                                    </Link>
                                    <Link
                                        href="/register"
                                        className="text-white hover:text-[#FF8000] transition-colors font-medium"
                                    >
                                        Registrarse
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero Section with Carousel */}
            <div className="relative h-screen w-full">
                {/* Carousel Images */}
                <div className="absolute inset-0">
                    {images.map((img, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-1000 ${
                                index === currentSlide ? 'opacity-100' : 'opacity-0'
                            }`}
                        >
                            <Image
                                src={img}
                                alt={`Slide ${index + 1}`}
                                fill
                                className="object-cover"
                                priority={index === 0}
                            />
                            <div className="absolute inset-0 bg-black/40" />
                        </div>
                    ))}
                </div>

                {/* Carousel Navigation Arrows */}
                <button
                    onClick={() => setCurrentSlide((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                    aria-label="Previous slide"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % images.length)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full transition-all"
                    aria-label="Next slide"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Content Overlay */}
                <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
                    {/* Logo/Branding */}
                    <div className="mb-8">
                        <Image
                            src="/Imagenes/logo_en.png"
                            alt="NXT.IT"
                            width={400}
                            height={150}
                            className="w-auto h-32 md:h-40 mx-auto"
                            priority
                        />
                    </div>

                    {/* Main Headline */}
                    <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', letterSpacing: '-0.03em', fontWeight: 700 }}>
                        <span className="text-white">Tu Hub</span>{' '}
                        <span className="text-[#FF8000]">Integrador</span>{' '}
                        <span className="text-white">de</span>{' '}
                        <br />
                        <span className="text-white">Soluciones</span>{' '}
                        <span className="text-white">Tecnológicas</span>
                    </h2>

                    {/* Sub-headline */}
                    <p className="text-lg md:text-xl text-gray-200 max-w-3xl mx-auto mb-10 leading-relaxed">
                        Desde una PC hasta un centro de datos completo: impulsamos a empresas y gobiernos con tecnología de vanguardia.
                    </p>

                    {/* CTA Button */}
                    <Link
                        href="/tienda"
                        className="px-8 py-4 border-2 border-gray-700 bg-black/40 backdrop-blur-sm text-white hover:border-[#FF8000] hover:text-[#FF8000] transition-all duration-300 font-medium text-lg tracking-wide"
                    >
                        CONOCE NUESTRAS SOLUCIONES
                    </Link>
                </div>

                {/* Carousel Indicators */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
                    {images.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                                index === currentSlide ? 'bg-[#FF8000] w-8' : 'bg-gray-500'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            {/* Contact and About Section */}
            <section className="bg-gray-900 text-gray-100 py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 lg:gap-24">
                        {/* Contáctanos */}
                        <div className="text-center lg:text-left">
                            <h2 
                                className="text-3xl md:text-4xl font-bold mb-12 text-white"
                                style={{ 
                                    fontFamily: "'Playfair Display', serif",
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                Contáctanos
                            </h2>
                            <div className="space-y-8">
                                <div>
                                    <p 
                                        className="text-lg md:text-xl text-gray-300 hover:text-[#FF8000] transition-colors"
                                        style={{ 
                                            fontFamily: "'VT323', monospace",
                                            letterSpacing: '0.08em'
                                        }}
                                    >
                                        333 616-7279
                                    </p>
                                </div>
                                <div>
                                    <p 
                                        className="text-lg md:text-xl text-gray-300 hover:text-[#FF8000] transition-colors"
                                        style={{ 
                                            fontFamily: "'VT323', monospace",
                                            letterSpacing: '0.08em'
                                        }}
                                    >
                                        desarrollo@nxt.it.com
                                    </p>
                                </div>
                                <div>
                                    <p 
                                        className="text-base md:text-lg text-gray-400 leading-relaxed"
                                        style={{ 
                                            fontFamily: "'VT323', monospace",
                                            letterSpacing: '0.05em',
                                            lineHeight: '1.7'
                                        }}
                                    >
                                        Av. Lopez Mateos #1038-11, Col Italia Providencia CP 44630<br />
                                        Jalisco, Guadalajara
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Nosotros */}
                        <div className="text-center lg:text-left">
                            <h2 
                                className="text-3xl md:text-4xl font-bold mb-12 text-white"
                                style={{ 
                                    fontFamily: "'Playfair Display', serif",
                                    fontWeight: 700,
                                    letterSpacing: '-0.02em'
                                }}
                            >
                                Nosotros
                            </h2>
                            <div className="space-y-10">
                                {/* Historia */}
                                <div>
                                    <h3 
                                        className="text-lg md:text-xl font-semibold mb-3 text-[#FF8000]"
                                        style={{ 
                                            fontFamily: "'Playfair Display', serif",
                                            fontWeight: 600
                                        }}
                                    >
                                        Historia:
                                    </h3>
                                    <p 
                                        className="text-sm md:text-base leading-relaxed text-gray-300"
                                        style={{ 
                                            fontFamily: "'VT323', monospace",
                                            letterSpacing: '0.04em',
                                            lineHeight: '1.8'
                                        }}
                                    >
                                        Fundada en 2009 como Arrcuss Comercial de S de RL de CV, ahora NXT.IT, nació como un proyecto emprendedor para democratizar la creciente necesidad por equipo de cómputo y electrónica de las PYMES. Con el paso del tiempo, el mercado fue madurando y NXT.IT incorporó nuevas verticales de negocio, convirtiéndonos en un hub integrador de soluciones tecnológicas. nxt.it.com
                                    </p>
                                </div>

                                {/* Misión */}
                                <div>
                                    <h3 
                                        className="text-lg md:text-xl font-semibold mb-3 text-[#FF8000]"
                                        style={{ 
                                            fontFamily: "'Playfair Display', serif",
                                            fontWeight: 600
                                        }}
                                    >
                                        Misión:
                                    </h3>
                                    <p 
                                        className="text-sm md:text-base leading-relaxed text-gray-300"
                                        style={{ 
                                            fontFamily: "'VT323', monospace",
                                            letterSpacing: '0.04em',
                                            lineHeight: '1.8'
                                        }}
                                    >
                                        Incrementar las capacidades de nuestros clientes mediante innovadoras soluciones de software, hardware y tecnología de consumo.
                                    </p>
                                </div>

                                {/* Visión */}
                                <div>
                                    <h3 
                                        className="text-lg md:text-xl font-semibold mb-3 text-[#FF8000]"
                                        style={{ 
                                            fontFamily: "'Playfair Display', serif",
                                            fontWeight: 600
                                        }}
                                    >
                                        Visión:
                                    </h3>
                                    <p 
                                        className="text-sm md:text-base leading-relaxed text-gray-300"
                                        style={{ 
                                            fontFamily: "'VT323', monospace",
                                            letterSpacing: '0.04em',
                                            lineHeight: '1.8'
                                        }}
                                    >
                                        Ser una empresa reconocida por su liderazgo en el mercado de Tecnologías de la Información, por sus soluciones innovadoras, mejores prácticas, calidad de servicio y compromiso con nuestros clientes.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default Home
