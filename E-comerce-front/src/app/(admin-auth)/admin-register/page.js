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

export default function AdminRegister() {
    const router = useRouter()
    const { register } = useAdminAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/admin-home',
    })

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [errors, setErrors] = useState([])
    const { darkMode } = useAdminTheme()
    const [isExpanded, setIsExpanded] = useState(false)
    const [curtainSliding, setCurtainSliding] = useState(false) // para animar ancho de la cortina
    const [isMobile, setIsMobile] = useState(false)

    // Cuando isExpanded se activa, dar un frame para que la cortina tenga ancho inicial y luego animar a 100%
    useEffect(() => {
        if (!isExpanded) return
        const frame = requestAnimationFrame(() => {
            requestAnimationFrame(() => setCurtainSliding(true))
        })
        return () => cancelAnimationFrame(frame)
    }, [isExpanded])

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024)
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const handleSwitchToLogin = () => {
        setIsExpanded(true)
        setTimeout(() => router.push('/admin-login'), 800)
    }

    const submitForm = (e) => {
        e.preventDefault()
        register({
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            setErrors,
        })
    }

    // Requisitos de contraseña (admin: mismo criterio que backend)
    const passwordChecks = {
        minLength: password.length >= 8,
        hasUppercase: /[A-Z]/.test(password),
        hasLowercase: /[a-z]/.test(password),
        hasNumber: /\d/.test(password),
        hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    }
    const passwordRequirements = [
        { key: 'minLength', label: 'Mínimo 8 caracteres', met: passwordChecks.minLength },
        { key: 'hasUppercase', label: 'Al menos una mayúscula', met: passwordChecks.hasUppercase },
        { key: 'hasLowercase', label: 'Al menos una minúscula', met: passwordChecks.hasLowercase },
        { key: 'hasNumber', label: 'Al menos un número', met: passwordChecks.hasNumber },
        { key: 'hasSymbol', label: 'Al menos un carácter especial (!@#$%&*...)', met: passwordChecks.hasSymbol },
    ]

    return (
        <div className="relative w-full overflow-hidden" style={{ height: 'calc(100vh - 4rem)' }}>
            <div className="flex flex-col lg:flex-row h-full w-full relative">
                {/* Lado izquierdo - Formulario (estructura igual que admin-login) */}
                <div className={`flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-10 transition-all duration-300 ease-out min-w-0 order-2 lg:order-1 ${
                    isExpanded ? 'opacity-0' : 'opacity-100'
                } ${(showPasswordModal || showConfirmModal) ? 'z-30' : ''} ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
                    <div className="w-full max-w-md">
                        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            Crear administrador
                        </h2>

                        <form onSubmit={submitForm} className="space-y-4 sm:space-y-5">
                            <div>
                                <Label htmlFor="name" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>Nombre</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={name}
                                    className={`block w-full px-4 py-3 rounded-lg text-sm border-2 transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                                        darkMode
                                            ? (name.trim() ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-800 border-gray-700 text-white')
                                            : (name.trim() ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-900')
                                    }`}
                                    onChange={(e) => setName(e.target.value)}
                                    required
                                />
                                <InputError messages={errors.name} className="mt-1.5" />
                            </div>

                            <div>
                                <Label htmlFor="email" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    className={`block w-full px-4 py-3 rounded-lg text-sm border-2 transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                                        darkMode
                                            ? (email.trim() ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-800 border-gray-700 text-white')
                                            : (email.trim() ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-900')
                                    }`}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <InputError messages={errors.email} className="mt-1.5" />
                            </div>

                            <div>
                                <Label htmlFor="password" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>Contraseña</Label>
                                <div className={`relative ${showPasswordModal ? 'z-[60]' : ''}`}>
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        className={`block w-full px-4 py-3 pr-12 rounded-lg text-sm border-2 transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                                            darkMode
                                                ? (password.trim() ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-800 border-gray-700 text-white')
                                                : (password.trim() ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-900')
                                        }`}
                                        onChange={(e) => setPassword(e.target.value)}
                                        onFocus={() => setShowPasswordModal(true)}
                                        onBlur={() => setTimeout(() => setShowPasswordModal(false), 180)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={0}
                                    >
                                        <NextImage src={showPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                    </button>
                                    {showPasswordModal && (
                                        <>
                                            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowPasswordModal(false)} />
                                            <div
                                                className={`absolute left-full top-1/2 z-50 w-56 max-w-[14rem] -translate-y-1/2 ml-1.5 rounded-xl border-2 shadow-xl transition-all duration-200 ${
                                                    darkMode ? 'border-emerald-600/50 bg-gray-800' : 'border-emerald-200 bg-white'
                                                }`}
                                                role="dialog"
                                                aria-labelledby="admin-password-requirements-title"
                                                aria-describedby="admin-password-requirements-desc"
                                            >
                                                <div className="p-3">
                                                    <p id="admin-password-requirements-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                        Requisitos de la contraseña (admin)
                                                    </p>
                                                    <ul id="admin-password-requirements-desc" className="space-y-1.5">
                                                        {passwordRequirements.map(({ key, label, met }) => (
                                                            <li
                                                                key={key}
                                                                className={`flex items-center gap-2 text-sm ${met ? 'text-emerald-600 dark:text-emerald-400' : (darkMode ? 'text-red-400' : 'text-red-600')}`}
                                                            >
                                                                <span
                                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                                                        met ? 'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-400' : (darkMode ? 'border-red-400 bg-transparent' : 'border-red-500 bg-transparent')
                                                                    }`}
                                                                    aria-hidden
                                                                >
                                                                    {met ? (
                                                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                                                                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                                                        </svg>
                                                                    ) : null}
                                                                </span>
                                                                <span>{label}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <InputError messages={errors.password} className="mt-1.5" />
                            </div>

                            <div>
                                <Label htmlFor="passwordConfirmation" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>Confirmar contraseña</Label>
                                <div className={`relative ${showConfirmModal ? 'z-[60]' : ''}`}>
                                    <Input
                                        id="passwordConfirmation"
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        value={passwordConfirmation}
                                        className={`block w-full px-4 py-3 pr-12 rounded-lg text-sm border-2 transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${
                                            darkMode
                                                ? (passwordConfirmation.trim() ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-800 border-gray-700 text-white')
                                                : (passwordConfirmation.trim() ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-900')
                                        }`}
                                        onChange={(e) => setPasswordConfirmation(e.target.value)}
                                        onFocus={() => setShowConfirmModal(true)}
                                        onBlur={() => setTimeout(() => setShowConfirmModal(false), 180)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirmation((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        aria-label={showPasswordConfirmation ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={0}
                                    >
                                        <NextImage src={showPasswordConfirmation ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                    </button>
                                    {showConfirmModal && (
                                        <>
                                            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowConfirmModal(false)} />
                                            <div
                                                className={`absolute left-full top-1/2 z-50 w-56 max-w-[14rem] -translate-y-1/2 ml-1.5 rounded-xl border-2 shadow-xl transition-all duration-200 ${
                                                    darkMode ? 'border-emerald-600/50 bg-gray-800' : 'border-emerald-200 bg-white'
                                                }`}
                                                role="dialog"
                                                aria-labelledby="admin-confirm-password-title"
                                                aria-describedby="admin-confirm-password-desc"
                                            >
                                                <div className="p-3">
                                                    <p id="admin-confirm-password-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                        Confirmar contraseña
                                                    </p>
                                                    <div id="admin-confirm-password-desc">
                                                        {passwordConfirmation.length === 0 ? (
                                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                Escribe la misma contraseña para confirmar.
                                                            </p>
                                                        ) : password === passwordConfirmation ? (
                                                            <p className="text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-500 text-white">
                                                                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12">
                                                                        <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                                                    </svg>
                                                                </span>
                                                                Las contraseñas coinciden
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-red-500 bg-transparent text-red-500">!</span>
                                                                La contraseña no coincide
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <InputError messages={errors.password_confirmation} className="mt-1.5" />
                            </div>

                            {errors.general && <InputError messages={errors.general} className="mt-2" />}

                            <Button type="submit" className="w-full bg-gradient-to-r from-[#059669] to-[#10b981] hover:from-[#10b981] hover:to-[#059669] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform">
                                Crear administrador
                            </Button>

                            <div className="mt-4 text-center">
                                <button type="button" onClick={handleSwitchToLogin} className={`text-sm ${darkMode ? 'text-gray-200 hover:text-emerald-400' : 'text-gray-600 hover:text-emerald-600'}`}>
                                    ¿Ya tienes cuenta? <span className="font-semibold">Iniciar sesión</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Cortina verde: en mobile arriba con altura fija; en lg absolute derecha de arriba a abajo (como register) */}
                <div
                    className={`lg:absolute lg:right-0 lg:top-0 lg:bottom-0 flex items-center justify-center bg-gradient-to-br from-[#059669] to-[#10b981] z-20 order-1 lg:order-2 flex-none h-48 sm:h-56 lg:flex-initial lg:min-h-0 ${
                        isExpanded
                            ? 'fixed top-0 bottom-0 right-0'
                            : 'lg:h-full min-h-0'
                    }`}
                    style={{
                        ...(isExpanded
                            ? {
                                  position: 'fixed',
                                  top: 0,
                                  right: 0,
                                  bottom: 0,
                                  height: '100vh',
                                  width: curtainSliding ? '100vw' : (!isMobile ? '45vw' : '100vw'),
                                  transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                              }
                            : {}),
                        ...(!isExpanded
                            ? {
                                  width: !isMobile ? 'min(45%, 520px)' : '100%',
                                  height: !isMobile ? '100%' : 'auto',
                                  top: !isMobile ? 0 : 'auto',
                                  bottom: !isMobile ? 0 : 'auto',
                              }
                            : {}),
                        ...(!isExpanded && !isMobile ? { clipPath: 'polygon(15% 0%, 100% 0%, 100% 100%, 0% 100%)' } : {}),
                    }}
                >
                    <div className={`text-center px-6 sm:px-8 md:px-12 py-8 lg:py-0 transition-all duration-500 ${
                        isExpanded ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                    }`}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">¡Hola, Administrador!</h2>
                        <p className="text-lg sm:text-xl text-white/90 mb-6 md:mb-8">¿Ya tienes cuenta?</p>
                        <button
                            onClick={handleSwitchToLogin}
                            className="px-6 sm:px-8 py-2 sm:py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-emerald-600 transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                        >
                            Iniciar sesión
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
