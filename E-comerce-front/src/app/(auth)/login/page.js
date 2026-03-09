'use client'

import NextImage from 'next/image'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AuthSessionStatus from '@/app/(auth)/AuthSessionStatus'

const Login = () => {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnUrl = searchParams?.get?.('returnUrl') || '/tienda'

    const { login } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: returnUrl,
    })

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [shouldRemember, setShouldRemember] = useState(false)
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)
    const [isTransitioning, setIsTransitioning] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [isMobile, setIsMobile] = useState(false)

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
        const handleDarkModeChange = (e) => {
            setDarkMode(e.detail)
        }
        const handleStorageChange = (e) => {
            if (e.key === 'darkMode') {
                const newMode = JSON.parse(e.newValue)
                setDarkMode(newMode)
            }
        }
        window.addEventListener('darkModeChange', handleDarkModeChange)
        window.addEventListener('storage', handleStorageChange)
        return () => {
            window.removeEventListener('darkModeChange', handleDarkModeChange)
            window.removeEventListener('storage', handleStorageChange)
        }
    }, [])

    // Detectar tamaño de pantalla
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 1024)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    useEffect(() => {
        if (router.reset?.length > 0 && errors.length === 0) {
            setStatus(atob(router.reset))
        } else {
            setStatus(null)
        }
    })

    const handleSwitchToRegister = () => {
        setIsExpanded(true)
        // Esperar a que la cortina se expanda completamente (800ms)
        setTimeout(() => {
            setIsTransitioning(true)
            // Luego cambiar de vista después de que esté completamente expandida
            setTimeout(() => {
                router.push('/register')
            }, 200)
        }, 800)
    }

    const submitForm = async event => {
        event.preventDefault()

        login({
            email,
            password,
            remember: shouldRemember,
            setErrors,
            setStatus,
        })
    }

    return (
        <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
            {/* Contenedor principal split-screen */}
            <div className="flex flex-col lg:flex-row h-full w-full relative">
                {/* Lado izquierdo - Cortina Naranja - Se expande de izquierda a derecha */}
                <div 
                    className={`lg:absolute lg:left-0 lg:top-0 lg:bottom-0 flex items-center justify-center bg-gradient-to-br from-[#FF8000] to-[#FF9500] transition-all duration-1000 ease-in-out z-50 order-1 ${
                        isExpanded 
                            ? 'h-full fixed top-0 bottom-0 left-0' 
                            : 'h-auto lg:h-full min-h-[250px] sm:min-h-[300px] lg:min-h-0'
                    }`}
                    style={{
                        width: isExpanded 
                            ? '100vw' 
                            : (!isMobile ? '33.333%' : '100%'),
                        height: isExpanded 
                            ? '100vh' 
                            : (!isMobile ? '100%' : 'auto'),
                        top: !isMobile && !isExpanded ? 0 : 'auto',
                        bottom: !isMobile && !isExpanded ? 0 : 'auto',
                        clipPath: isExpanded
                            ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                            : !isMobile
                                ? 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)'
                                : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                    }}
                >
                    <div className={`text-center px-6 sm:px-8 md:px-12 py-8 lg:py-0 transition-all duration-500 ${
                        isExpanded ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                    }`}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
                            ¡Bienvenido de vuelta!
                        </h2>
                        <p className="text-lg sm:text-xl text-white/90 mb-6 md:mb-8">
                            ¿No tienes cuenta?
                        </p>
                        <button
                            onClick={handleSwitchToRegister}
                            className="px-6 sm:px-8 py-2 sm:py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-[#FF8000] transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                        >
                            Registrarse
                        </button>
                    </div>
                </div>

                {/* Lado derecho - Formulario de Login */}
                <div className={`flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 transition-all duration-700 ease-in-out min-w-0 order-2 w-full ${
                    isExpanded ? 'opacity-0 translate-x-full lg:translate-x-0 lg:opacity-0' : 'opacity-100 translate-x-0'
                } ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                    <div className="w-full max-w-sm">
                        <h2 className={`text-2xl sm:text-3xl font-bold mb-6 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Iniciar sesión
                        </h2>

                        <AuthSessionStatus className="mb-4" status={status} />
                        
                        <form onSubmit={submitForm} className="space-y-4">
                            {/* Email Address */}
                            <div>
                                <Label htmlFor="email" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                    Email
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        className={`block w-full px-4 py-3 pl-11 rounded-lg text-sm transition-all duration-200 ${
                                            darkMode 
                                                ? (email.trim() ? 'bg-[#E5EBFD] border-2 border-gray-600 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-gray-800 border-2 border-gray-700 text-white placeholder-gray-400 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                                : (email.trim() ? 'bg-[#E5EBFD] border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                        }`}
                                        onChange={event => setEmail(event.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2">
                                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError messages={errors.email} className="mt-1.5" />
                            </div>

                            {/* Password */}
                            <div>
                                <Label htmlFor="password" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                    Contraseña
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        className={`block w-full px-4 py-3 pl-11 pr-12 rounded-lg text-sm transition-all duration-200 ${
                                            darkMode 
                                                ? (password.trim() ? 'bg-[#E5EBFD] border-2 border-gray-600 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-gray-800 border-2 border-gray-700 text-white placeholder-gray-400 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                                : (password.trim() ? 'bg-[#E8EDFF] border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                        }`}
                                        onChange={event => setPassword(event.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#FF8000]/50"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={0}
                                    >
                                        <NextImage
                                            src={showPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'}
                                            alt=""
                                            width={22}
                                            height={22}
                                            className="object-contain"
                                        />
                                    </button>
                                </div>
                                <InputError messages={errors.password} className="mt-1.5" />
                            </div>

                            {/* Remember Me y Forgot Password */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <label
                                    htmlFor="remember_me"
                                    className={`inline-flex items-center cursor-pointer ${
                                        darkMode ? 'text-white' : 'text-gray-700'
                                    }`}>
                                    <input
                                        id="remember_me"
                                        type="checkbox"
                                        name="remember"
                                        className={`rounded border-gray-300 text-[#FF8000] shadow-sm focus:border-[#FF8000] focus:ring focus:ring-[#FF8000] focus:ring-opacity-50 w-4 h-4 ${
                                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'
                                        }`}
                                        onChange={event => setShouldRemember(event.target.checked)}
                                    />
                                    <span className="ml-2 text-sm font-medium">
                                        Recordarme
                                    </span>
                                </label>
                                <Link
                                    href="/forgot-password"
                                    className={`text-sm transition-colors whitespace-nowrap font-medium ${
                                        darkMode 
                                            ? 'text-gray-200 hover:text-[#FF8000]' 
                                            : 'text-gray-600 hover:text-[#FF8000]'
                                    }`}>
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            {/* Error general */}
                            {errors.general && (
                                <div>
                                    <InputError messages={errors.general} className="mt-2" />
                                </div>
                            )}

                            <Button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FF8000] text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform mt-2"
                            >
                                INICIAR SESIÓN
                            </Button>

                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={handleSwitchToRegister}
                                    className={`text-sm transition-colors ${
                                        darkMode 
                                            ? 'text-gray-200 hover:text-[#FF8000]' 
                                            : 'text-gray-600 hover:text-[#FF8000]'
                                    }`}
                                >
                                    ¿No tienes cuenta? <span className="font-semibold">Regístrate</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Login
