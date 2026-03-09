'use client'

import { useState, useEffect } from 'react'
import NextImage from 'next/image'
import useSWR from 'swr'
import axios from '@/lib/axios'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import { getPaginationWindow } from '@/lib/pagination'
import { swrFetcher } from '@/lib/swrFetcher'

const USUARIOS_KEY = '/admin/usuarios'
const TIPOS_KEY = '/admin/tipos-usuario'
const swrTiposConfig = { revalidateOnFocus: false, dedupingInterval: 300000 }
const swrUsersConfig = { revalidateOnFocus: false, dedupingInterval: 10000 }

function RoleBadge({ role, darkMode }) {
    const r = role?.toLowerCase?.() || role
    const styles = {
        admin: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
        customer: darkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200',
        seller: darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200',
    }
    const label = r === 'customer' ? 'Cliente' : r === 'seller' ? 'Vendedor' : r === 'admin' ? 'Admin' : r
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[r] || (darkMode ? 'bg-gray-500/20 text-gray-400 border-gray-500/40' : 'bg-gray-100 text-gray-600 border-gray-200')}`}>
            {label}
        </span>
    )
}

export default function AdminUsuarios() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [passwordConfirmation, setPasswordConfirmation] = useState('')
    const [type, setType] = useState(2)
    const [adminPassword, setAdminPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
    const [showAdminPassword, setShowAdminPassword] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [errors, setErrors] = useState({})
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [darkMode, setDarkMode] = useState(true)
    const [paginaUsuarios, setPaginaUsuarios] = useState(1)
    const [filterRol, setFilterRol] = useState('')
    const USUARIOS_POR_PAGINA = 3

    useEffect(() => {
        setDarkMode(JSON.parse(localStorage.getItem('darkMode') ?? 'true'))
    }, [])
    useEffect(() => {
        const onDarkModeChange = (e) => setDarkMode(!!e.detail)
        window.addEventListener('darkModeChange', onDarkModeChange)
        return () => window.removeEventListener('darkModeChange', onDarkModeChange)
    }, [])

    const { data: types = [], isLoading: loadingTypes } = useSWR(TIPOS_KEY, swrFetcher, swrTiposConfig)
    const { data: users = [], mutate: mutateUsers } = useSWR(USUARIOS_KEY, swrFetcher, swrUsersConfig)

    useEffect(() => { setPaginaUsuarios(1) }, [filterRol])

    const getRoleKey = (u) => u.roles?.[0] || (u.tipo === 1 ? 'admin' : u.tipo === 2 ? 'customer' : 'seller')
    const usersFiltrados = filterRol ? users.filter((u) => getRoleKey(u) === filterRol) : users

    const handleCreate = async (e) => {
        e.preventDefault()
        setErrors({})
        setSuccess('')
        setLoading(true)
        try {
            const res = await axios.post('/admin/usuarios', {
                name,
                email,
                password,
                password_confirmation: passwordConfirmation,
                type,
                adminPassword,
            })
            if (res.data?.success) {
                setSuccess('Usuario creado correctamente')
                setName('')
                setEmail('')
                setPassword('')
                setPasswordConfirmation('')
                setAdminPassword('')
                await mutateUsers()
            } else {
                setErrors({ general: [res.data?.message || 'Error'] })
            }
        } catch (err) {
            setErrors(err.response?.data?.errors || { general: ['Error al crear usuario'] })
        } finally {
            setLoading(false)
        }
    }

    // Input: fondo #E5EBFD cuando tiene contenido; sin placeholder de ejemplo
    const getInputClass = (hasValue) => darkMode
        ? `w-full px-4 py-2.5 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${hasValue ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-700/80 border-gray-600 text-white'}`
        : `w-full px-4 py-2.5 rounded-lg border transition-colors focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${hasValue ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-gray-50 border-gray-300 text-gray-900'}`
    const labelClass = darkMode ? 'text-gray-300 block mb-1.5 text-sm font-medium' : 'text-gray-700 block mb-1.5 text-sm font-medium'

    // Requisitos de contraseña (igual que register)
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
    const selectClass = darkMode
        ? 'w-full px-4 py-2.5 rounded-lg bg-gray-700/80 border border-gray-600 text-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition-colors'
        : 'w-full px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors'

    return (
        <div className="space-y-8">
            {/* Encabezado de página */}
            <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                </span>
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Crear usuarios</h1>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Añade nuevos usuarios y asígnales un rol.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Form crear usuario */}
                <div className={`rounded-xl overflow-hidden border shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`px-5 py-4 ${darkMode ? 'bg-emerald-600/25 border-b border-emerald-500/30' : 'bg-emerald-50 border-b border-emerald-200'}`}>
                        <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </span>
                            <h2 className={`text-lg font-bold ${darkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>Nuevo usuario</h2>
                        </div>
                    </div>
                    <div className="p-6">
                        <form onSubmit={handleCreate} className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <Label className={labelClass}>Nombre</Label>
                                    <Input value={name} onChange={(e) => setName(e.target.value)} className={getInputClass(name.trim())} required />
                                    <InputError messages={errors.name} />
                                </div>
                                <div>
                                    <Label className={labelClass}>Email</Label>
                                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={getInputClass(email.trim())} required />
                                    <InputError messages={errors.email} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div className={`${showPasswordModal ? 'z-[60]' : ''}`}>
                                    <Label className={labelClass}>Contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className={`${getInputClass(password.trim())} pr-12`}
                                            onFocus={() => setShowPasswordModal(true)}
                                            onBlur={() => setTimeout(() => setShowPasswordModal(false), 180)}
                                            required
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
                                                <div className={`absolute left-full top-1/2 z-50 w-56 -translate-y-1/2 ml-1.5 rounded-xl border-2 shadow-xl ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`} role="dialog" aria-labelledby="password-requirements-title">
                                                    <div className="p-3">
                                                        <p id="password-requirements-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Requisitos de la contraseña</p>
                                                        <ul className="space-y-1.5">
                                                            {passwordRequirements.map(({ key, label, met }) => (
                                                                <li key={key} className={`flex items-center gap-2 text-sm ${met ? 'text-green-600 dark:text-green-400' : darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${met ? 'border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-400' : darkMode ? 'border-red-400 bg-transparent' : 'border-red-500 bg-transparent'}`} aria-hidden>
                                                                        {met ? <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg> : null}
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
                                    <InputError messages={errors.password} />
                                </div>
                                <div className={`${showConfirmModal ? 'z-[60]' : ''}`}>
                                    <Label className={labelClass}>Confirmar contraseña</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswordConfirmation ? 'text' : 'password'}
                                            value={passwordConfirmation}
                                            onChange={(e) => setPasswordConfirmation(e.target.value)}
                                            className={`${getInputClass(passwordConfirmation.trim())} pr-12`}
                                            onFocus={() => setShowConfirmModal(true)}
                                            onBlur={() => setTimeout(() => setShowConfirmModal(false), 180)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswordConfirmation((s) => !s)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                            aria-label={showPasswordConfirmation ? 'Ocultar confirmación' : 'Ver confirmación'}
                                            tabIndex={0}
                                        >
                                            <NextImage src={showPasswordConfirmation ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                        </button>
                                        {showConfirmModal && (
                                            <>
                                                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowConfirmModal(false)} />
                                                <div className={`absolute right-full top-1/2 z-50 w-56 -translate-y-1/2 mr-1.5 rounded-xl border-2 shadow-xl ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`} role="dialog" aria-labelledby="confirm-password-modal-title">
                                                    <div className="p-3">
                                                        <p id="confirm-password-modal-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Confirmar contraseña</p>
                                                        <div>
                                                            {passwordConfirmation.length === 0 ? (
                                                                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Escribe la misma contraseña para confirmar.</p>
                                                            ) : password === passwordConfirmation ? (
                                                                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-500 text-white"><svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg></span>
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
                                    <InputError messages={errors.password_confirmation} />
                                </div>
                            </div>
                            <div>
                                <Label className={labelClass}>Rol</Label>
                                <select value={type} onChange={(e) => setType(Number(e.target.value))} className={selectClass}>
                                    {types.map((t) => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
                                <Label className={labelClass}>Tu contraseña de administrador</Label>
                                <div className="relative">
                                    <Input
                                        type={showAdminPassword ? 'text' : 'password'}
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        className={`${getInputClass(adminPassword.trim())} pr-12`}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowAdminPassword((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        aria-label={showAdminPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={0}
                                    >
                                        <NextImage src={showAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                    </button>
                                </div>
                                <InputError messages={errors.adminPassword} />
                            </div>
                            {success && (
                                <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${darkMode ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-emerald-50 border border-emerald-200'}`}>
                                    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{success}</p>
                                </div>
                            )}
                            <InputError messages={errors.general} />
                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-lg font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30 transition-all duration-200 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                        Crear usuario
                                    </>
                                )}
                            </Button>
                        </form>
                    </div>
                </div>

                {/* Tabla usuarios */}
                <div className={`rounded-xl overflow-hidden border shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`px-5 py-4 ${darkMode ? 'bg-emerald-600/25 border-b border-emerald-500/30' : 'bg-emerald-50 border-b border-emerald-200'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </span>
                                <h2 className={`text-lg font-bold ${darkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>Usuarios registrados</h2>
                            </div>
                            <div className="flex items-center gap-3">
                                <label className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Rol:</label>
                                <select value={filterRol} onChange={(e) => setFilterRol(e.target.value)} className={darkMode ? 'px-3 py-1.5 rounded-lg bg-gray-700 border border-gray-600 text-white text-sm focus:ring-2 focus:ring-emerald-500/40' : 'px-3 py-1.5 rounded-lg bg-white border border-gray-300 text-gray-800 text-sm focus:ring-2 focus:ring-emerald-500/30'}>
                                    <option value="">Todos</option>
                                    <option value="admin">Admin</option>
                                    <option value="customer">Cliente</option>
                                    <option value="seller">Vendedor</option>
                                </select>
                                <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>{usersFiltrados.length}</span>
                            </div>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        {usersFiltrados.length > 0 ? (
                            <>
                            {(() => {
                                const totalPaginas = Math.max(1, Math.ceil(usersFiltrados.length / USUARIOS_POR_PAGINA))
                                const paginaActual = Math.min(Math.max(1, paginaUsuarios), totalPaginas)
                                const inicio = (paginaActual - 1) * USUARIOS_POR_PAGINA
                                const usersPagina = usersFiltrados.slice(inicio, inicio + USUARIOS_POR_PAGINA)
                                return (
                                    <>
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className={darkMode ? 'bg-gray-700/50 border-b border-gray-600' : 'bg-gray-50 border-b border-gray-200'}>
                                        <th className={`py-3.5 px-4 text-left font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nombre</th>
                                        <th className={`py-3.5 px-4 text-left font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email</th>
                                        <th className={`py-3.5 px-4 text-left font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Rol</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {usersPagina.map((u, i) => (
                                        <tr
                                            key={u.id}
                                            className={`border-b transition-colors ${darkMode ? 'border-gray-700/80 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'} ${i % 2 === 1 ? (darkMode ? 'bg-gray-800/50' : 'bg-gray-50/50') : ''}`}
                                        >
                                            <td className={`py-3.5 px-4 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{u.name}</td>
                                            <td className={`py-3.5 px-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{u.email}</td>
                                            <td className="py-3.5 px-4">
                                                <RoleBadge role={getRoleKey(u)} darkMode={darkMode} />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {totalPaginas > 1 && (() => {
                                const totalP = totalPaginas
                                const { windowPages, showEllipsis, showLastPage } = getPaginationWindow(paginaActual, totalP)
                                const btn = (num) => (
                                    <button
                                        key={num}
                                        type="button"
                                        onClick={() => setPaginaUsuarios(num)}
                                        className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                                            num === paginaActual
                                                ? 'bg-emerald-600 text-white shadow-md focus:ring-emerald-500'
                                                : darkMode
                                                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500'
                                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'
                                        }`}
                                    >
                                        {num}
                                    </button>
                                )
                                return (
                                    <div className="mt-4 pb-4 flex flex-wrap items-center justify-center gap-2">
                                        {totalP > 1 && paginaActual > 1 && (
                                            <button key="first" type="button" onClick={() => setPaginaUsuarios(1)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'}`} title="Primera página">&laquo;&laquo;</button>
                                        )}
                                        {windowPages.map((num) => btn(num))}
                                        {showEllipsis && <span className={`min-w-[2.5rem] h-10 px-2 flex items-center justify-center rounded-lg text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>...</span>}
                                        {showLastPage && totalP > 7 && btn(totalP)}
                                        {totalP > 1 && paginaActual < totalP && (
                                            <button key="last" type="button" onClick={() => setPaginaUsuarios(totalP)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'}`} title="Última página">&raquo;&raquo;</button>
                                        )}
                                    </div>
                                )
                            })()}
                                    </>
                                )
                            })()}
                            </>
                        ) : (
                            <div className={`flex flex-col items-center justify-center py-16 px-6 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                <span className={`flex h-16 w-16 items-center justify-center rounded-full mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                    <svg className="w-8 h-8 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                </span>
                                <p className="font-medium">No hay usuarios</p>
                                <p className="text-sm mt-1 opacity-80">Crea el primero desde el formulario.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
