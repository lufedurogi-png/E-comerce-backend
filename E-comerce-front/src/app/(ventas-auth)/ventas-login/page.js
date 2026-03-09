'use client'

import NextImage from 'next/image'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import { useVentasAuth } from '@/hooks/useVentasAuth'
import { useVentasTheme } from '@/app/(ventas-auth)/VentasThemeContext'
import { useState, useEffect } from 'react'

export default function VentasLogin() {
    const { login } = useVentasAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/ventas-home',
    })

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState([])
    const [isMobile, setIsMobile] = useState(false)
    const [mounted, setMounted] = useState(false)
    const { darkMode } = useVentasTheme()

    useEffect(() => {
        setMounted(true)
    }, [])

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const submitForm = (e) => {
        e.preventDefault()
        login({ email, password, setErrors })
    }

    return (
        <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex flex-col lg:flex-row h-full w-full relative">
                {/* Cortina - efecto diagonal como admin-login */}
                <div
                    className="lg:absolute lg:left-0 lg:top-0 lg:bottom-0 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-indigo-600 transition-all duration-1000 ease-in-out z-50 order-1 h-auto lg:h-full min-h-[250px] sm:min-h-[300px] lg:min-h-0"
                    style={{
                        width: !isMobile ? '33.333%' : '100%',
                        height: !isMobile ? '100%' : 'auto',
                        clipPath: !isMobile ? 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)' : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                        boxShadow: !isMobile ? '4px 0 24px -4px rgba(0,0,0,0.15)' : 'none',
                    }}
                >
                    <div className="text-center px-6 sm:px-8 md:px-12 py-8 lg:py-0 transition-all duration-500 opacity-100 scale-100">
                        <div className="mb-6">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm mb-4 transition-transform duration-300 hover:scale-110">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6 drop-shadow-lg transition-all duration-300">
                                Panel de ventas
                            </h2>
                            <p className="text-lg sm:text-xl text-white/90 transition-all duration-300">
                                Acceso exclusivo para vendedores
                            </p>
                        </div>
                    </div>
                </div>

                <div
                    className={`flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 transition-all duration-700 ease-in-out min-w-0 order-2 w-full ${
                        mounted ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
                    } ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}
                    style={{ transitionProperty: 'opacity, transform' }}
                >
                    <div className="w-full max-w-sm">
                        <h2 className={`text-2xl sm:text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Iniciar sesión
                        </h2>

                        <form onSubmit={submitForm} className="space-y-4">
                            <div className="transition-all duration-300 hover:translate-x-0.5">
                                <Label htmlFor="email" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>Email</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        className={`block w-full px-4 py-3 pl-11 rounded-lg text-sm border-2 transition-all duration-300 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 ${
                                            darkMode
                                                ? (email.trim() ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-800 border-gray-700 text-white')
                                                : (email.trim() ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-900')
                                        }`}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
                                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError messages={errors.email} className="mt-1.5" />
                            </div>

                            <div className="transition-all duration-300 hover:translate-x-0.5">
                                <Label htmlFor="password" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        className={`block w-full px-4 py-3 pl-11 pr-12 rounded-lg text-sm border-2 transition-all duration-300 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 ${
                                            darkMode
                                                ? (password.trim() ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-800 border-gray-700 text-white')
                                                : (password.trim() ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-900')
                                        }`}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoComplete="current-password"
                                    />
                                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-transform hover:scale-110"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={0}
                                    >
                                        <NextImage src={showPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                    </button>
                                </div>
                                <InputError messages={errors.password} className="mt-1.5" />
                            </div>

                            {errors.general && <InputError messages={errors.general} className="mt-2" />}

                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-500 text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform mt-2"
                            >
                                INICIAR SESIÓN
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
