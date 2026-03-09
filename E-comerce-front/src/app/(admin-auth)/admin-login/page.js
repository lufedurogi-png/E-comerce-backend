'use client'

import NextImage from 'next/image'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useAdminTheme } from '@/app/(admin-auth)/AdminThemeContext'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const accentColor = 'emerald'
const accentFrom = '#059669'
const accentTo = '#10b981'

export default function AdminLogin() {
    const router = useRouter()
    const { login } = useAdminAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/admin-home',
    })

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [errors, setErrors] = useState([])
    const [isExpanded, setIsExpanded] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const { darkMode } = useAdminTheme()

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleSwitchToRegister = () => {
        setIsExpanded(true)
        setTimeout(() => {
            router.push('/admin-register')
        }, 800)
    }

    const submitForm = (e) => {
        e.preventDefault()
        login({ email, password, setErrors })
    }

    return (
        <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex flex-col lg:flex-row h-full w-full relative">
                <div
                    className={`lg:absolute lg:left-0 lg:top-0 lg:bottom-0 flex items-center justify-center bg-gradient-to-br from-[#059669] to-[#10b981] transition-all duration-1000 ease-in-out z-50 order-1 ${
                        isExpanded ? 'h-full fixed top-0 bottom-0 left-0' : 'h-auto lg:h-full min-h-[250px] sm:min-h-[300px] lg:min-h-0'
                    }`}
                    style={{
                        width: isExpanded ? '100vw' : (!isMobile ? '33.333%' : '100%'),
                        height: isExpanded ? '100vh' : (!isMobile ? '100%' : 'auto'),
                        clipPath: isExpanded ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)' : !isMobile ? 'polygon(0% 0%, 80% 0%, 100% 100%, 0% 100%)' : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
                    }}
                >
                    <div className={`text-center px-6 sm:px-8 md:px-12 py-8 lg:py-0 transition-all duration-500 ${isExpanded ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">Panel de administración</h2>
                        <p className="text-lg sm:text-xl text-white/90 mb-6 md:mb-8">¿No tienes cuenta de administrador?</p>
                        <button
                            onClick={handleSwitchToRegister}
                            className="px-6 sm:px-8 py-2 sm:py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                        >
                            Crear administrador
                        </button>
                    </div>
                </div>

                <div className={`flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 transition-all duration-700 ease-in-out min-w-0 order-2 w-full ${
                    isExpanded ? 'opacity-0 translate-x-full lg:translate-x-0 lg:opacity-0' : 'opacity-100 translate-x-0'
                } ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <div className="w-full max-w-sm">
                        <h2 className={`text-2xl sm:text-3xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Iniciar sesión
                        </h2>

                        <form onSubmit={submitForm} className="space-y-4">
                            <div>
                                <Label htmlFor="email" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>Email</Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        className={`block w-full px-4 py-3 pl-11 rounded-lg text-sm border-2 transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
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

                            <div>
                                <Label htmlFor="password" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        className={`block w-full px-4 py-3 pl-11 pr-12 rounded-lg text-sm border-2 transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
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
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={0}
                                    >
                                        <NextImage src={showPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                    </button>
                                </div>
                                <InputError messages={errors.password} className="mt-1.5" />
                            </div>

                            {errors.general && <InputError messages={errors.general} className="mt-2" />}

                            <Button type="submit" className="w-full bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#10b981] hover:to-[#059669] text-white px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform mt-2">
                                INICIAR SESIÓN
                            </Button>

                            <div className="mt-4 text-center">
                                <button type="button" onClick={handleSwitchToRegister} className={`text-sm ${darkMode ? 'text-gray-200 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'}`}>
                                    ¿No tienes cuenta admin? <span className="font-semibold">Crear administrador</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
}
