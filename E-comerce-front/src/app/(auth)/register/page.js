'use client'

import NextImage from 'next/image'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const Page = () => {
    const router = useRouter()
    const { register } = useAuth({
        middleware: 'guest',
        redirectIfAuthenticated: '/tienda',
    })

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [remember, setRemember] = useState(false)
    const [errors, setErrors] = useState([])
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

    const handleSwitchToLogin = () => {
        setIsExpanded(true)
        // Esperar a que la cortina se expanda completamente (800ms)
        setTimeout(() => {
            setIsTransitioning(true)
            // Luego cambiar de vista después de que esté completamente expandida
            setTimeout(() => {
                router.push('/login')
            }, 200)
        }, 800)
    }

    // Requisitos de contraseña (alineados con el backend: min 8, letters, mixedCase, numbers, symbols)
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

    const submitForm = event => {
        event.preventDefault()

        register({
            name,
            email,
            password,
            password_confirmation: passwordConfirmation,
            remember,
            setErrors,
        })
    }

    return (
        <div className="relative w-full flex-1 flex flex-col min-h-0 h-full" style={{ minHeight: 'calc(100vh - 4rem)' }}>
            {/* Contenedor principal: desplazado a la derecha en lg+ para que se vea más centrado en la página */}
            <div className="flex flex-col lg:flex-row flex-1 min-h-0 w-full max-w-[1920px] mx-auto relative lg:pl-[14vw] xl:pl-[18vw] 2xl:pl-[22vw]">
                {/* Lado izquierdo - Formulario de Registro */}
                <div className={`flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:px-12 xl:px-16 2xl:px-24 transition-all duration-300 ease-out min-w-0 order-2 lg:order-1 lg:min-w-0 lg:max-w-[60%] xl:max-w-[55%] mt-40 sm:mt-56 md:mt-64 lg:mt-0 ${
                    (showPasswordModal || showConfirmModal) ? 'pr-44 sm:pr-48 lg:pr-52 z-[50]' : ''
                } ${
                    isExpanded ? 'opacity-0 translate-x-full lg:translate-x-0 lg:opacity-0' : 'opacity-100 translate-x-0'
                } ${
                    darkMode ? 'bg-gray-900' : 'bg-gray-50'
                }`}>
                    {/* Espaciadores en lg+: más espacio a la izquierda para que el formulario quede centrado en la vista */}
                    <div className="hidden lg:block flex-[28] min-w-0" aria-hidden />
                    <div className="w-full max-w-md shrink-0 -mt-[7cm]">
                        <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-6 md:mb-8 ${
                            darkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                            Registro
                        </h2>

                        <form onSubmit={submitForm} className="space-y-4 sm:space-y-5">
                            {/* Name */}
                            <div>
                                <Label htmlFor="name" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                    Nombre
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="name"
                                        type="text"
                                        value={name}
                                        className={`block w-full px-4 py-3 pl-12 rounded-lg text-sm transition-all duration-200 ${
                                            darkMode 
                                                ? (name.trim() ? 'bg-[#E5EBFD] border-2 border-gray-600 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-gray-800 border-2 border-gray-700 text-white placeholder-gray-400 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                                : (name.trim() ? 'bg-[#E5EBFD] border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                        }`}
                                        onChange={event => setName(event.target.value)}
                                        required
                                        autoFocus
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                </div>
                                <InputError messages={errors.name} className="mt-1.5" />
                            </div>

                            {/* Email */}
                            <div>
                                <Label htmlFor="email" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                    Email
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        className={`block w-full px-4 py-3 pl-12 rounded-lg text-sm transition-all duration-200 ${
                                            darkMode 
                                                ? (email.trim() ? 'bg-[#E5EBFD] border-2 border-gray-600 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-gray-800 border-2 border-gray-700 text-white placeholder-gray-400 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                                : (email.trim() ? 'bg-[#E5EBFD] border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                        }`}
                                        onChange={event => setEmail(event.target.value)}
                                        required
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
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
                                <div className={`relative ${showPasswordModal ? 'z-[60]' : ''}`}>
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        className={`block w-full px-4 py-3 pl-12 pr-12 rounded-lg text-sm transition-all duration-200 ${
                                            darkMode 
                                                ? (password.trim() ? 'bg-[#E5EBFD] border-2 border-gray-600 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-gray-800 border-2 border-gray-700 text-white placeholder-gray-400 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                                : (password.trim() ? 'bg-[#E5EBFD] border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                        }`}
                                        onChange={event => setPassword(event.target.value)}
                                        onFocus={() => setShowPasswordModal(true)}
                                        onBlur={() => setTimeout(() => setShowPasswordModal(false), 180)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
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
                                    {/* Modal de requisitos: dentro del contenedor del input para quedar pegado a su derecha */}
                                    {showPasswordModal && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                aria-hidden
                                                onClick={() => setShowPasswordModal(false)}
                                            />
                                            <div
                                                className={`absolute left-full top-1/2 z-50 w-56 max-w-[14rem] -translate-y-1/2 ml-1.5 rounded-xl border-2 shadow-xl transition-all duration-200 ${
                                                    darkMode
                                                        ? 'border-gray-600 bg-gray-800'
                                                        : 'border-gray-200 bg-white'
                                                }`}
                                                role="dialog"
                                                aria-labelledby="password-requirements-title"
                                                aria-describedby="password-requirements-desc"
                                            >
                                                <div className="p-3">
                                                    <p id="password-requirements-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                        Requisitos de la contraseña
                                                    </p>
                                                    <ul id="password-requirements-desc" className="space-y-1.5">
                                                        {passwordRequirements.map(({ key, label, met }) => (
                                                            <li
                                                                key={key}
                                                                className={`flex items-center gap-2 text-sm transition-colors duration-200 ${
                                                                    met ? 'text-green-600 dark:text-green-400' : (darkMode ? 'text-red-400' : 'text-red-600')
                                                                }`}
                                                            >
                                                                <span
                                                                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${
                                                                        met
                                                                            ? 'border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-400'
                                                                            : (darkMode ? 'border-red-400 bg-transparent' : 'border-red-500 bg-transparent')
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

                            {/* Confirm Password */}
                            <div>
                                <Label htmlFor="passwordConfirmation" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                    Confirmar contraseña
                                </Label>
                                <div className={`relative ${showConfirmModal ? 'z-[60]' : ''}`}>
                                    <Input
                                        id="passwordConfirmation"
                                        type={showPasswordConfirmation ? 'text' : 'password'}
                                        value={passwordConfirmation}
                                        className={`block w-full px-4 py-3 pl-12 pr-12 rounded-lg text-sm transition-all duration-200 ${
                                            darkMode 
                                                ? (passwordConfirmation.trim() ? 'bg-[#E5EBFD] border-2 border-gray-600 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-gray-800 border-2 border-gray-700 text-white placeholder-gray-400 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                                : (passwordConfirmation.trim() ? 'bg-[#E5EBFD] border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                        }`}
                                        onChange={event => setPasswordConfirmation(event.target.value)}
                                        onFocus={() => setShowConfirmModal(true)}
                                        onBlur={() => setTimeout(() => setShowConfirmModal(false), 180)}
                                        required
                                    />
                                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                        <svg className={`w-5 h-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setShowPasswordConfirmation((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#FF8000]/50"
                                        aria-label={showPasswordConfirmation ? 'Ocultar confirmación' : 'Ver confirmación'}
                                        tabIndex={0}
                                    >
                                        <NextImage
                                            src={showPasswordConfirmation ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'}
                                            alt=""
                                            width={22}
                                            height={22}
                                            className="object-contain"
                                        />
                                    </button>
                                    {/* Modal confirmar contraseña: indica si coincide o no con la contraseña */}
                                    {showConfirmModal && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                aria-hidden
                                                onClick={() => setShowConfirmModal(false)}
                                            />
                                            <div
                                                className={`absolute left-full top-1/2 z-50 w-56 max-w-[14rem] -translate-y-1/2 ml-1.5 rounded-xl border-2 shadow-xl transition-all duration-200 ${
                                                    darkMode
                                                        ? 'border-gray-600 bg-gray-800'
                                                        : 'border-gray-200 bg-white'
                                                }`}
                                                role="dialog"
                                                aria-labelledby="confirm-password-modal-title"
                                                aria-describedby="confirm-password-modal-desc"
                                            >
                                                <div className="p-3">
                                                    <p id="confirm-password-modal-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                                        Confirmar contraseña
                                                    </p>
                                                    <div id="confirm-password-modal-desc">
                                                        {passwordConfirmation.length === 0 ? (
                                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                Escribe la misma contraseña para confirmar.
                                                            </p>
                                                        ) : password === passwordConfirmation ? (
                                                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-500 text-white">
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

                            {/* Remember Me */}
                            <div className="block">
                                <label
                                    htmlFor="remember"
                                    className={`inline-flex items-center cursor-pointer ${
                                        darkMode ? 'text-white' : 'text-gray-700'
                                    }`}>
                                    <input
                                        id="remember"
                                        type="checkbox"
                                        name="remember"
                                        className={`rounded border-gray-300 text-[#FF8000] shadow-sm focus:border-[#FF8000] focus:ring focus:ring-[#FF8000] focus:ring-opacity-50 ${
                                            darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white'
                                        }`}
                                        checked={remember}
                                        onChange={event => setRemember(event.target.checked)}
                                    />
                                    <span className="ml-2 text-sm">
                                        Recordarme
                                    </span>
                                </label>
                            </div>

                            {/* Error general */}
                            {errors.general && (
                                <div>
                                    <InputError messages={errors.general} className="mt-2" />
                                </div>
                            )}

                            <Button 
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FF8000] text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 transform"
                            >
                                Registrarse
                            </Button>

                            <div className="mt-4 text-center">
                                <button
                                    type="button"
                                    onClick={handleSwitchToLogin}
                                    className={`text-sm transition-colors ${
                                        darkMode 
                                            ? 'text-gray-200 hover:text-[#FF8000]' 
                                            : 'text-gray-600 hover:text-[#FF8000]'
                                    }`}
                                >
                                    ¿Ya tienes cuenta? <span className="font-semibold">Iniciar sesión</span>
                                </button>
                            </div>
                        </form>
                    </div>
                    <div className="hidden lg:block flex-1 min-w-0" aria-hidden />
                </div>

                {/* Franja naranja: en vista dividida arriba (order-1) con altura fija; en lg a la derecha a altura completa */}
                <div 
                    className={`lg:absolute lg:right-0 lg:top-0 lg:bottom-0 flex items-center justify-center bg-gradient-to-br from-[#FF8000] to-[#FF9500] transition-all duration-1000 ease-in-out z-30 order-1 lg:order-2 flex-none h-[220px] sm:h-[260px] lg:flex-initial lg:min-h-0 ${
                        isExpanded 
                            ? 'h-full fixed top-0 bottom-0 right-0' 
                            : 'lg:h-full min-h-0'
                    }`}
                    style={{
                        width: isExpanded 
                            ? '100vw' 
                            : (!isMobile ? 'min(52%, 620px)' : '100%'),
                        height: isExpanded 
                            ? '100vh' 
                            : (!isMobile ? '100%' : 'auto'),
                        top: !isMobile && !isExpanded ? 0 : 'auto',
                        bottom: !isMobile && !isExpanded ? 0 : 'auto',
                        clipPath: isExpanded 
                            ? 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                            : !isMobile
                                ? 'polygon(20% 0%, 100% 0%, 100% 100%, 0% 100%)'
                                : 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)'
                    }}
                >
                    <div className={`text-center px-6 sm:px-8 md:px-12 py-8 lg:py-0 transition-all duration-500 ${
                        isExpanded ? 'opacity-0 scale-110' : 'opacity-100 scale-100'
                    }`}>
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6">
                            ¡Hola, Bienvenido!
                        </h2>
                        <p className="text-lg sm:text-xl text-white/90 mb-6 md:mb-8">
                            ¿Ya tienes cuenta?
                        </p>
                        <button
                            onClick={handleSwitchToLogin}
                            className="px-6 sm:px-8 py-2 sm:py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-[#FF8000] transition-all duration-300 transform hover:scale-105 text-sm sm:text-base"
                        >
                            Iniciar sesión
                        </button>
                    </div>
                </div>
            </div>

        </div>
    )
}

export default Page
