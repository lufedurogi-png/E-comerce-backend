'use client'

import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import { useState, useEffect } from 'react'
import AuthSessionStatus from '@/app/(auth)/AuthSessionStatus'

const Page = () => {
    const { forgotPassword } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/tienda',
    })

    const [email, setEmail] = useState('')
    const [errors, setErrors] = useState([])
    const [status, setStatus] = useState(null)

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
                setDarkMode(JSON.parse(e.newValue))
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const submitForm = (event) => {
        event.preventDefault()
        forgotPassword({ email, setErrors, setStatus })
    }

    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    return (
        <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex flex-col lg:flex-row h-full w-full relative">
                {/* Lado izquierdo - Cortina naranja (mismo estilo que login) */}
                <div
                    className="lg:absolute lg:left-0 lg:top-0 lg:bottom-0 flex items-center justify-center bg-gradient-to-br from-[#FF8000] to-[#FF9500] order-1 h-auto lg:h-full min-h-[250px] sm:min-h-[300px] lg:min-h-0"
                    style={{
                        width: !isMobile ? '33.333%' : '100%',
                        height: !isMobile ? '100%' : 'auto',
                        top: !isMobile ? 0 : 'auto',
                        bottom: !isMobile ? 0 : 'auto',
                        clipPath: !isMobile ? 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)' : 'none',
                    }}
                >
                    <div className="text-center px-6 sm:px-8 md:px-12 py-8 lg:py-0">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
                            ¿Olvidaste tu contraseña?
                        </h2>
                        <p className="text-lg sm:text-xl text-white/90 mb-6 md:mb-8">
                            Te enviaremos un enlace para restablecerla.
                        </p>
                        <Link
                            href="/login"
                            className="inline-block px-6 sm:px-8 py-2 sm:py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-[#FF8000] transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                        >
                            Volver a iniciar sesión
                        </Link>
                    </div>
                </div>

                {/* Lado derecho - Formulario */}
                <div
                    className={`flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 min-w-0 order-2 w-full ${
                        darkMode ? 'bg-gray-900' : 'bg-gray-50'
                    }`}
                >
                    <div className="w-full max-w-sm">
                        <h2
                            className={`text-2xl sm:text-3xl font-bold mb-2 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}
                        >
                            Restablecer contraseña
                        </h2>
                        <p
                            className={`text-sm mb-6 ${
                                darkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}
                        >
                            Indica tu correo y te enviaremos un enlace para elegir una nueva contraseña.
                        </p>

                        <AuthSessionStatus className="mb-4" status={status} />

                        <form onSubmit={submitForm} className="space-y-4">
                            <div>
                                <Label
                                    htmlFor="email"
                                    className={`text-sm font-medium mb-1.5 block ${
                                        darkMode ? 'text-white' : 'text-gray-700'
                                    }`}
                                >
                                    Email
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        value={email}
                                        className={`block w-full px-4 py-3 pl-11 rounded-lg text-sm transition-all duration-200 ${
                                            darkMode
                                                ? 'bg-gray-800 border-2 border-gray-700 text-white placeholder-gray-400 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20'
                                                : 'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20'
                                        }`}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2">
                                        <svg
                                            className={`w-5 h-5 ${
                                                darkMode ? 'text-gray-400' : 'text-gray-500'
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                </div>
                                <InputError messages={errors.email} className="mt-1.5" />
                            </div>

                            {errors.general && (
                                <div>
                                    <InputError messages={errors.general} className="mt-2" />
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FF8000] text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform mt-2"
                            >
                                ENVIAR ENLACE
                            </Button>

                            <div className="mt-4 text-center">
                                <Link
                                    href="/login"
                                    className={`text-sm transition-colors ${
                                        darkMode
                                            ? 'text-gray-200 hover:text-[#FF8000]'
                                            : 'text-gray-600 hover:text-[#FF8000]'
                                    }`}
                                >
                                    ← Volver a iniciar sesión
                                </Link>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Page
