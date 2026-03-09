'use client'

import { useState, useEffect, useRef } from 'react'
import NextImage from 'next/image'
import useSWR from 'swr'
import axios from '@/lib/axios'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import { getPaginationWindow } from '@/lib/pagination'
import { swrFetcher } from '@/lib/swrFetcher'
import { useDebounce } from '@/hooks/useDebounce'

function RoleBadge({ role, darkMode }) {
    const r = (role || '').toLowerCase()
    const styles = {
        admin: darkMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-emerald-100 text-emerald-700 border-emerald-200',
        customer: darkMode ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200',
        seller: darkMode ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200',
    }
    const label = r === 'customer' ? 'Cliente' : r === 'seller' ? 'Vendedor' : r === 'admin' ? 'Admin' : role || '-'
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${styles[r] || (darkMode ? 'bg-gray-500/20 text-gray-400 border-gray-500/40' : 'bg-gray-100 text-gray-600 border-gray-200')}`}>
            {label}
        </span>
    )
}

const swrTiposPermsConfig = { revalidateOnFocus: false, dedupingInterval: 300000 }
const swrUsersConfig = { revalidateOnFocus: false, dedupingInterval: 5000 }

export default function AdminGestionUsuarios() {
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 350)
    const [filterRole, setFilterRole] = useState('')
    const [filterPermission, setFilterPermission] = useState('')
    const [editingUser, setEditingUser] = useState(null)
    const [editName, setEditName] = useState('')
    const [editEmail, setEditEmail] = useState('')
    const [editRole, setEditRole] = useState(2)
    const [adminPassword, setAdminPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [newPasswordConfirmation, setNewPasswordConfirmation] = useState('')
    const [resettingUserId, setResettingUserId] = useState(null)
    const [errors, setErrors] = useState({})
    const [deletingId, setDeletingId] = useState(null)
    const [darkMode, setDarkMode] = useState(true)
    const [addingRoleUserId, setAddingRoleUserId] = useState(null)
    const [addingRoleTipo, setAddingRoleTipo] = useState('')
    const [removingRoleUserId, setRemovingRoleUserId] = useState(null)
    const [removingRoleName, setRemovingRoleName] = useState(null)
    const [grantingPermissionUserId, setGrantingPermissionUserId] = useState(null)
    const [grantingPermissionValue, setGrantingPermissionValue] = useState('')
    const [revokingPermissionUserId, setRevokingPermissionUserId] = useState(null)
    const [revokingPermissionName, setRevokingPermissionName] = useState(null)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showNewPasswordConfirmation, setShowNewPasswordConfirmation] = useState(false)
    const [showAdminPassword, setShowAdminPassword] = useState(false)
    const [showPasswordModal, setShowPasswordModal] = useState(false)
    const [showConfirmModal, setShowConfirmModal] = useState(false)
    const [actionMessage, setActionMessage] = useState(null)
    const [paginaListado, setPaginaListado] = useState(1)
    const [createName, setCreateName] = useState('')
    const [createEmail, setCreateEmail] = useState('')
    const [createPassword, setCreatePassword] = useState('')
    const [createPasswordConfirmation, setCreatePasswordConfirmation] = useState('')
    const [createType, setCreateType] = useState(2)
    const [createAdminPassword, setCreateAdminPassword] = useState('')
    const [showCreatePassword, setShowCreatePassword] = useState(false)
    const [showCreatePasswordConfirmation, setShowCreatePasswordConfirmation] = useState(false)
    const [showCreateAdminPassword, setShowCreateAdminPassword] = useState(false)
    const [showCreatePasswordModal, setShowCreatePasswordModal] = useState(false)
    const [showCreateConfirmModal, setShowCreateConfirmModal] = useState(false)
    const [createLoading, setCreateLoading] = useState(false)
    const [createSuccess, setCreateSuccess] = useState('')
    const USUARIOS_POR_PAGINA = 3
    const addRoleSelectRef = useRef(null)

    useEffect(() => {
        setDarkMode(JSON.parse(localStorage.getItem('darkMode') ?? 'true'))
    }, [])
    useEffect(() => {
        const onDarkModeChange = (e) => setDarkMode(!!e.detail)
        window.addEventListener('darkModeChange', onDarkModeChange)
        return () => window.removeEventListener('darkModeChange', onDarkModeChange)
    }, [])

    const usersParams = new URLSearchParams()
    if (debouncedSearch) usersParams.set('search', debouncedSearch)
    if (filterRole) usersParams.set('role', filterRole)
    if (filterPermission) usersParams.set('permission', filterPermission)
    const usersKey = usersParams.toString() ? `/admin/usuarios?${usersParams}` : '/admin/usuarios'

    const { data: users = [], isLoading: loading, mutate: mutateUsers } = useSWR(usersKey, swrFetcher, swrUsersConfig)
    const { data: types = [] } = useSWR('/admin/tipos-usuario', swrFetcher, swrTiposPermsConfig)
    const { data: permissions = [] } = useSWR('/admin/permisos', swrFetcher, swrTiposPermsConfig)

    useEffect(() => { setPaginaListado(1) }, [debouncedSearch, filterRole, filterPermission])

    const handleEdit = (u) => {
        setEditingUser(u.id)
        setEditName(u.name)
        setEditEmail(u.email)
        setEditRole(u.tipo || 2)
        setAdminPassword('')
        setErrors({})
    }

    const handleSaveEdit = async (e) => {
        e.preventDefault()
        if (!editingUser) return
        setErrors({})
        try {
            const payload = { adminPassword }
            if (editName) payload.name = editName
            if (editEmail) payload.email = editEmail
            const res = await axios.put(`/admin/usuarios/${editingUser}`, payload)
            if (res.data?.success) {
                setEditingUser(null)
                mutateUsers()
            } else { setErrors({ general: [res.data?.message] }) }
        } catch (err) { setErrors(err.response?.data?.errors || {}) }
    }

    const handleSetRole = async (userId) => {
        if (!adminPassword) { setErrors({ adminPassword: ['Requerido'] }); return }
        setErrors({})
        try {
            const res = await axios.put(`/admin/usuarios/${userId}/rol`, { tipoUsuario: editRole, adminPassword })
            if (res.data?.success) {
                setEditingUser(null)
                mutateUsers()
            } else { setErrors({ general: [res.data?.message] }) }
        } catch (err) { setErrors(err.response?.data?.errors || {}) }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!resettingUserId || !newPassword || newPassword !== newPasswordConfirmation) return
        setErrors({})
        try {
            const res = await axios.put(`/admin/usuarios/${resettingUserId}/password`, { password: newPassword, password_confirmation: newPasswordConfirmation, adminPassword })
            if (res.data?.success) {
                setResettingUserId(null); setNewPassword(''); setNewPasswordConfirmation(''); setAdminPassword('')
                mutateUsers()
            } else { setErrors({ general: [res.data?.message] }) }
        } catch (err) { setErrors(err.response?.data?.errors || {}) }
    }

    const handleDelete = async (userId) => {
        if (!adminPassword) { setErrors({ adminPassword: ['Escribe tu contraseña para confirmar'] }); return }
        setDeletingId(userId)
        setErrors({})
        try {
            const res = await axios.delete(`/admin/usuarios/${userId}`, { data: { adminPassword } })
            if (res.data?.success) {
                setDeletingId(null)
                setAdminPassword('')
                mutateUsers()
            } else { setErrors({ general: [res.data?.message] }) }
        } catch (err) { setErrors(err.response?.data?.errors || { general: ['Error al eliminar'] }) }
        finally { setDeletingId(null) }
    }

    // users.tipo: 1=Admin, 2=Cliente, 3=Vendedor (UserType enum - NO es el id de la tabla roles)
    const tipoToRoleName = (tipoId) => ({ 1: 'admin', 2: 'customer', 3: 'seller' }[Number(tipoId)] || 'customer')
    const roleLabel = (u) => {
        const roleFromSpatie = u.roles?.[0]
        if (roleFromSpatie) return roleFromSpatie
        const tipoNum = typeof u.tipo === 'object' && u.tipo?.value != null ? u.tipo.value : Number(u.tipo)
        return tipoToRoleName(tipoNum)
    }
    const userRolesList = (u) => (u.roles && u.roles.length) ? u.roles : [roleLabel(u)].filter(Boolean)
    const permissionLabel = (value) => permissions.find((p) => p.value === value)?.label || value

    const handleAddRole = async (userId) => {
        if (!addingRoleTipo || !adminPassword) { setErrors({ adminPassword: ['Contraseña requerida'] }); setActionMessage(null); return }
        setErrors({})
        setActionMessage({ type: 'info', text: 'Enviando...' })
        try {
            const payload = { tipoUsuario: Number(addingRoleTipo), adminPassword }
            const res = await axios.put(`/admin/usuarios/${userId}/rol`, payload)
            const data = res?.data
            if (data && data.success === true) {
                setActionMessage({ type: 'success', text: data.message || 'Rol asignado correctamente.' })
                setAddingRoleUserId(null)
                setAddingRoleTipo('')
                setAdminPassword('')
                mutateUsers()
                setTimeout(() => setActionMessage(null), 5000)
            } else {
                const msg = (data && data.message) || (data && typeof data === 'object' ? 'Respuesta: ' + JSON.stringify(data) : '') || 'No se pudo asignar el rol.'
                setActionMessage({ type: 'error', text: msg })
                setErrors({ general: [msg] })
            }
        } catch (err) {
            const d = err.response?.data
            const msg = d?.message || (d?.errors && Object.values(d.errors).flat().length ? Object.values(d.errors).flat().join(', ') : null) || (d && typeof d === 'object' ? 'Error: ' + JSON.stringify(d) : null) || err.message || 'Error de red o servidor.'
            setActionMessage({ type: 'error', text: msg })
            setErrors(d?.errors || { general: [msg] })
        }
    }

    const handleRemoveRole = async (userId, roleName) => {
        if (!adminPassword) { setErrors({ adminPassword: ['Contraseña requerida'] }); return }
        setErrors({})
        try {
            const res = await axios.delete(`/admin/usuarios/${userId}/rol`, { data: { role: roleName, adminPassword } })
            if (res.data?.success) {
                setRemovingRoleUserId(null); setRemovingRoleName(null); setAdminPassword('')
                mutateUsers()
            } else { setErrors({ general: [res.data?.message] }) }
        } catch (err) { setErrors(err.response?.data?.errors || { general: ['Error al quitar rol'] }) }
    }

    const handleGrantPermission = async (userId) => {
        if (!grantingPermissionValue || !adminPassword) { setErrors({ adminPassword: ['Contraseña requerida'] }); return }
        setErrors({})
        try {
            const res = await axios.post(`/admin/usuarios/${userId}/permisos`, { permission: grantingPermissionValue, adminPassword })
            if (res.data?.success) {
                setGrantingPermissionUserId(null); setGrantingPermissionValue(''); setAdminPassword('')
                mutateUsers()
            } else { setErrors({ general: [res.data?.message] }) }
        } catch (err) { setErrors(err.response?.data?.errors || { general: ['Error al conceder permiso'] }) }
    }

    const handleRevokePermission = async (userId, permissionName) => {
        if (!adminPassword) { setErrors({ adminPassword: ['Contraseña requerida'] }); return }
        setErrors({})
        try {
            const res = await axios.post(`/admin/usuarios/${userId}/permisos/revocar`, { permission: permissionName, adminPassword })
            if (res.data?.success) {
                setRevokingPermissionUserId(null); setRevokingPermissionName(null); setAdminPassword('')
                mutateUsers()
            } else { setErrors({ general: [res.data?.message] }) }
        } catch (err) { setErrors(err.response?.data?.errors || { general: ['Error al revocar permiso'] }) }
    }

    const handleCreateUser = async (e) => {
        e.preventDefault()
        setErrors({})
        setCreateSuccess('')
        setCreateLoading(true)
        try {
            const res = await axios.post('/admin/usuarios', {
                name: createName,
                email: createEmail,
                password: createPassword,
                password_confirmation: createPasswordConfirmation,
                type: createType,
                adminPassword: createAdminPassword,
            })
            if (res.data?.success) {
                setCreateSuccess('Usuario creado correctamente')
                setCreateName('')
                setCreateEmail('')
                setCreatePassword('')
                setCreatePasswordConfirmation('')
                setCreateAdminPassword('')
                setErrors({})
                await mutateUsers()
                setTimeout(() => setCreateSuccess(''), 5000)
            } else {
                setErrors({ general: [res.data?.message || 'Error'] })
            }
        } catch (err) {
            setErrors(err.response?.data?.errors || { general: ['Error al crear usuario'] })
        } finally {
            setCreateLoading(false)
        }
    }

    const getFilterInputClass = (hasValue) => darkMode
        ? `w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 ${hasValue ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-700/80 border-gray-600 text-white'}`
        : `w-full px-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 ${hasValue ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-900'}`
    const getTableInputClass = (hasValue) => darkMode
        ? `w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500/40 ${hasValue ? 'bg-[#E5EBFD] border-gray-600 text-gray-900' : 'bg-gray-700 border-gray-600 text-white'}`
        : `w-full px-2 py-1.5 text-sm border rounded focus:ring-1 focus:ring-emerald-500/30 ${hasValue ? 'bg-[#E5EBFD] border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-900'}`
    const filterSelectClass = darkMode ? 'px-4 py-2.5 rounded-lg bg-gray-700/80 border border-gray-600 text-white focus:ring-2 focus:ring-emerald-500/40' : 'px-4 py-2.5 rounded-lg bg-white border border-gray-300 text-gray-900 focus:ring-2 focus:ring-emerald-500/30'
    const filterLabelClass = darkMode ? 'text-gray-400 block mb-1.5 text-sm font-medium' : 'text-gray-600 block mb-1.5 text-sm font-medium'
    const tableSelectClass = darkMode ? 'px-2 py-1.5 text-sm border rounded bg-gray-700 text-white border-gray-600' : 'px-2 py-1.5 text-sm border rounded bg-white text-gray-900 border-gray-300'
    const cellTextClass = darkMode ? 'text-gray-200' : 'text-gray-800'
    const cellMutedClass = darkMode ? 'text-gray-500' : 'text-gray-600'
    const tableBorderClass = darkMode ? 'border-gray-600' : 'border-gray-200'

    const passwordChecks = {
        minLength: newPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(newPassword),
        hasLowercase: /[a-z]/.test(newPassword),
        hasNumber: /\d/.test(newPassword),
        hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword),
    }
    const createPasswordChecks = {
        minLength: createPassword.length >= 8,
        hasUppercase: /[A-Z]/.test(createPassword),
        hasLowercase: /[a-z]/.test(createPassword),
        hasNumber: /\d/.test(createPassword),
        hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(createPassword),
    }
    const createPasswordRequirements = [
        { key: 'minLength', label: 'Mínimo 8 caracteres', met: createPasswordChecks.minLength },
        { key: 'hasUppercase', label: 'Al menos una mayúscula', met: createPasswordChecks.hasUppercase },
        { key: 'hasLowercase', label: 'Al menos una minúscula', met: createPasswordChecks.hasLowercase },
        { key: 'hasNumber', label: 'Al menos un número', met: createPasswordChecks.hasNumber },
        { key: 'hasSymbol', label: 'Al menos un carácter especial (!@#$%&*...)', met: createPasswordChecks.hasSymbol },
    ]
    const passwordRequirements = [
        { key: 'minLength', label: 'Mínimo 8 caracteres', met: passwordChecks.minLength },
        { key: 'hasUppercase', label: 'Al menos una mayúscula', met: passwordChecks.hasUppercase },
        { key: 'hasLowercase', label: 'Al menos una minúscula', met: passwordChecks.hasLowercase },
        { key: 'hasNumber', label: 'Al menos un número', met: passwordChecks.hasNumber },
        { key: 'hasSymbol', label: 'Al menos un carácter especial (!@#$%&*...)', met: passwordChecks.hasSymbol },
    ]

    const btn = (color, extra = '') => {
        const base = 'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200'
        const colors = {
            emerald: 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 border border-emerald-500/40',
            amber: 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border border-amber-500/40',
            red: 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40',
            muted: darkMode ? 'bg-gray-600/30 text-gray-400 hover:bg-gray-600/50 border border-gray-500/40' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200',
        }
        return `${base} ${colors[color] || colors.muted} ${extra}`.trim()
    }

    return (
        <div className="space-y-8">
            {/* Encabezado */}
            <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                </span>
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Gestionar usuarios</h1>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Busca, edita roles y permisos o elimina usuarios.</p>
                </div>
            </div>

            {/* Form Crear usuario */}
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
                    <form onSubmit={handleCreateUser} className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div>
                                <Label className={filterLabelClass}>Nombre</Label>
                                <Input value={createName} onChange={(e) => setCreateName(e.target.value)} className={getFilterInputClass(createName.trim())} required />
                                <InputError messages={errors.name} />
                            </div>
                            <div>
                                <Label className={filterLabelClass}>Email</Label>
                                <Input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className={getFilterInputClass(createEmail.trim())} required />
                                <InputError messages={errors.email} />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                            <div className={`${showCreatePasswordModal ? 'z-[60]' : ''}`}>
                                <Label className={filterLabelClass}>Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        type={showCreatePassword ? 'text' : 'password'}
                                        value={createPassword}
                                        onChange={(e) => setCreatePassword(e.target.value)}
                                        className={`${getFilterInputClass(createPassword.trim())} pr-12`}
                                        onFocus={() => setShowCreatePasswordModal(true)}
                                        onBlur={() => setTimeout(() => setShowCreatePasswordModal(false), 180)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCreatePassword((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        aria-label={showCreatePassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                        tabIndex={0}
                                    >
                                        <NextImage src={showCreatePassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                    </button>
                                    {showCreatePasswordModal && (
                                        <>
                                            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowCreatePasswordModal(false)} />
                                            <div className={`absolute left-full top-1/2 z-50 w-56 -translate-y-1/2 ml-1.5 rounded-xl border-2 shadow-xl ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`} role="dialog" aria-labelledby="create-password-requirements-title">
                                                <div className="p-3">
                                                    <p id="create-password-requirements-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Requisitos de la contraseña</p>
                                                    <ul className="space-y-1.5">
                                                        {createPasswordRequirements.map(({ key, label, met }) => (
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
                            <div className={`${showCreateConfirmModal ? 'z-[60]' : ''}`}>
                                <Label className={filterLabelClass}>Confirmar contraseña</Label>
                                <div className="relative">
                                    <Input
                                        type={showCreatePasswordConfirmation ? 'text' : 'password'}
                                        value={createPasswordConfirmation}
                                        onChange={(e) => setCreatePasswordConfirmation(e.target.value)}
                                        className={`${getFilterInputClass(createPasswordConfirmation.trim())} pr-12`}
                                        onFocus={() => setShowCreateConfirmModal(true)}
                                        onBlur={() => setTimeout(() => setShowCreateConfirmModal(false), 180)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowCreatePasswordConfirmation((s) => !s)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                        aria-label={showCreatePasswordConfirmation ? 'Ocultar confirmación' : 'Ver confirmación'}
                                        tabIndex={0}
                                    >
                                        <NextImage src={showCreatePasswordConfirmation ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                    </button>
                                    {showCreateConfirmModal && (
                                        <>
                                            <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowCreateConfirmModal(false)} />
                                            <div className={`absolute right-full top-1/2 z-50 w-56 -translate-y-1/2 mr-1.5 rounded-xl border-2 shadow-xl ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`} role="dialog" aria-labelledby="create-confirm-password-modal-title">
                                                <div className="p-3">
                                                    <p id="create-confirm-password-modal-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Confirmar contraseña</p>
                                                    <div>
                                                        {createPasswordConfirmation.length === 0 ? (
                                                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Escribe la misma contraseña para confirmar.</p>
                                                        ) : createPassword === createPasswordConfirmation ? (
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
                            <Label className={filterLabelClass}>Rol</Label>
                            <select value={createType} onChange={(e) => setCreateType(Number(e.target.value))} className={`w-full ${filterSelectClass}`}>
                                {types.map((t) => (
                                    <option key={t.id} value={t.id}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className={`rounded-lg p-4 ${darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-200'}`}>
                            <Label className={filterLabelClass}>Tu contraseña de administrador</Label>
                            <div className="relative">
                                <Input
                                    type={showCreateAdminPassword ? 'text' : 'password'}
                                    value={createAdminPassword}
                                    onChange={(e) => setCreateAdminPassword(e.target.value)}
                                    className={`${getFilterInputClass(createAdminPassword.trim())} pr-12`}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCreateAdminPassword((s) => !s)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                                    aria-label={showCreateAdminPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                    tabIndex={0}
                                >
                                    <NextImage src={showCreateAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                </button>
                            </div>
                            <InputError messages={errors.adminPassword} />
                        </div>
                        {createSuccess && (
                            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${darkMode ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-emerald-50 border border-emerald-200'}`}>
                                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{createSuccess}</p>
                            </div>
                        )}
                        <InputError messages={errors.general} />
                        <Button
                            type="submit"
                            disabled={createLoading}
                            className={`w-full py-3 rounded-lg font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${
                                darkMode
                                    ? '!bg-emerald-500 hover:!bg-emerald-400 text-white shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40'
                                    : '!bg-emerald-600 hover:!bg-emerald-700 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/30'
                            }`}
                        >
                            {createLoading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Creando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    CREAR USUARIO
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            {/* Toast fijo para mensajes de acción (siempre visible al hacer scroll) */}
            {actionMessage && (
                <div
                    className={`fixed top-20 right-6 z-50 max-w-md rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
                        actionMessage.type === 'success'
                            ? (darkMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                            : actionMessage.type === 'info'
                                ? (darkMode ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40' : 'bg-sky-50 text-sky-700 border border-sky-200')
                                : (darkMode ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-red-50 text-red-700 border border-red-200')
                    }`}
                    role="alert"
                >
                    {actionMessage.text}
                </div>
            )}

            {/* Tabla unificada: filtros + listado */}
            <div className={`rounded-xl overflow-hidden border shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-5 py-4 ${darkMode ? 'bg-emerald-600/25 border-b border-emerald-500/30' : 'bg-emerald-50 border-b border-emerald-200'}`}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            </span>
                            <h2 className={`text-lg font-bold ${darkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>Listado de usuarios</h2>
                        </div>
                        {!loading && <span className={`text-sm font-medium px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>{users.length} usuario{users.length !== 1 ? 's' : ''}</span>}
                    </div>
                </div>
                {/* Filtros dentro de la misma tabla */}
                <div className={`px-5 py-4 border-b ${darkMode ? 'border-gray-600 bg-gray-700/30' : 'border-gray-200 bg-gray-50/80'}`}>
                    <div className="flex flex-wrap gap-5 items-end">
                        <div className="flex-1 min-w-[200px]">
                            <Label className={filterLabelClass}>Buscar por nombre o email</Label>
                            <Input autoComplete="off" name="buscar-usuarios" value={search} onChange={(e) => setSearch(e.target.value)} className={getFilterInputClass(search.trim())} />
                        </div>
                        <div className="min-w-[160px]">
                            <Label className={filterLabelClass}>Rol</Label>
                            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className={filterSelectClass}>
                                <option value="">Todos los roles</option>
                                <option value="admin">Admin</option>
                                <option value="customer">Cliente</option>
                                <option value="seller">Vendedor</option>
                            </select>
                        </div>
                        <div className="min-w-[180px]">
                            <Label className={filterLabelClass}>Permiso</Label>
                            <select value={filterPermission} onChange={(e) => setFilterPermission(e.target.value)} className={filterSelectClass}>
                                <option value="">Todos</option>
                                {permissions.map((p) => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className={`flex flex-col items-center justify-center py-20 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <svg className="animate-spin h-10 w-10 text-emerald-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                        <p className="font-medium">Cargando usuarios...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className={`flex flex-col items-center justify-center py-16 px-6 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                        <span className={`flex h-16 w-16 items-center justify-center rounded-full mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                            <svg className="w-8 h-8 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </span>
                        <p className="font-medium">No hay usuarios que coincidan</p>
                        <p className="text-sm mt-1 opacity-80">Prueba otros filtros o crea usuarios con el formulario de arriba.</p>
                    </div>
                ) : (() => {
                    const totalPaginasListado = Math.max(1, Math.ceil(users.length / USUARIOS_POR_PAGINA))
                    const paginaListadoActual = Math.min(Math.max(1, paginaListado), totalPaginasListado)
                    const inicioListado = (paginaListadoActual - 1) * USUARIOS_POR_PAGINA
                    const usersPagina = users.slice(inicioListado, inicioListado + USUARIOS_POR_PAGINA)
                    return (
                    <div className="overflow-x-auto">
                        <table className={`w-full text-sm border-collapse table-fixed ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                            <colgroup>
                                <col className="w-[14%]" />
                                <col className="w-[18%]" />
                                <col className="w-[22%]" />
                                <col className="w-[28%]" />
                                <col className="w-[18%]" />
                            </colgroup>
                            <thead>
                                <tr className={darkMode ? `bg-gray-700/60 border-b-2 ${tableBorderClass}` : `bg-gray-100 border-b-2 ${tableBorderClass}`}>
                                    <th className={`py-4 px-4 text-left font-semibold border-r ${tableBorderClass} last:border-r-0 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Nombre</th>
                                    <th className={`py-4 px-4 text-left font-semibold border-r ${tableBorderClass} last:border-r-0 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Email</th>
                                    <th className={`py-4 px-4 text-left font-semibold border-r ${tableBorderClass} last:border-r-0 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Rol</th>
                                    <th className={`py-4 px-4 text-left font-semibold border-r ${tableBorderClass} last:border-r-0 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Permisos</th>
                                    <th className={`py-4 px-4 text-left font-semibold border-r ${tableBorderClass} last:border-r-0 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {usersPagina.map((u, i) => (
                                    <tr
                                        key={u.id}
                                        className={`border-b transition-colors ${darkMode ? `hover:bg-gray-700/25 ${tableBorderClass}` : `hover:bg-gray-50 ${tableBorderClass}`} ${i % 2 === 1 ? (darkMode ? 'bg-gray-800/40' : 'bg-gray-50/80') : ''}`}
                                    >
                                        <td className={`py-4 px-4 font-medium border-r ${tableBorderClass} last:border-r-0 align-top ${cellTextClass}`}>
                                            {editingUser === u.id ? (
                                                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className={getTableInputClass(editName.trim())} />
                                            ) : (
                                                u.name
                                            )}
                                        </td>
                                        <td className={`py-4 px-4 border-r ${tableBorderClass} last:border-r-0 align-top ${cellTextClass}`}>
                                            {editingUser === u.id ? (
                                                <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className={getTableInputClass(editEmail.trim())} />
                                            ) : (
                                                u.email
                                            )}
                                        </td>
                                        <td className={`py-4 px-4 border-r ${tableBorderClass} last:border-r-0 align-top`}>
                                            {editingUser === u.id ? (
                                                <select value={editRole} onChange={(e) => setEditRole(Number(e.target.value))} className={tableSelectClass}>
                                                    {types.map((t) => (
                                                        <option key={t.id} value={t.id}>{t.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {userRolesList(u).map((roleName) => (
                                                        <span key={roleName} className="inline-flex items-center gap-1">
                                                            <RoleBadge role={roleName} darkMode={darkMode} />
                                                            {userRolesList(u).length > 1 && (
                                                                removingRoleUserId === u.id && removingRoleName === roleName ? (
                                                                    <span className="inline-flex items-center gap-1 flex-wrap">
                                                                        <span className="relative inline-block">
                                                                            <Input autoComplete="off" type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`w-24 pr-8 ${getTableInputClass(adminPassword.trim())}`} />
                                                                            <button type="button" onClick={() => setShowAdminPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showAdminPassword ? 'Ocultar' : 'Ver'}>
                                                                                <NextImage src={showAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                                            </button>
                                                                        </span>
                                                                        <button type="button" onClick={() => handleRemoveRole(u.id, roleName)} className={btn('red')}>Quitar</button>
                                                                        <button type="button" onClick={() => { setRemovingRoleUserId(null); setRemovingRoleName(null) }} className={btn('muted')}>Cancelar</button>
                                                                    </span>
                                                                ) : (
                                                                    <button type="button" onClick={() => { setRemovingRoleUserId(u.id); setRemovingRoleName(roleName) }} className={`p-0.5 rounded ${darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`} title="Quitar rol">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                                    </button>
                                                                )
                                                            )}
                                                        </span>
                                                    ))}
                                                    {addingRoleUserId === u.id ? (
                                                        <span className="inline-flex flex-wrap items-center gap-1.5">
                                                            <select
                                                                ref={(el) => {
                                                                    addRoleSelectRef.current = el
                                                                    if (el) {
                                                                        el.focus()
                                                                        el.closest('tr')?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
                                                                    }
                                                                }}
                                                                value={addingRoleTipo}
                                                                onChange={(e) => setAddingRoleTipo(e.target.value)}
                                                                className={tableSelectClass}
                                                            >
                                                                <option value="">Rol...</option>
                                                                {types.filter((t) => !userRolesList(u).includes(tipoToRoleName(t.id))).map((t) => (
                                                                    <option key={t.id} value={t.id}>{t.label}</option>
                                                                ))}
                                                            </select>
                                                            <span className="relative inline-block">
                                                                <Input autoComplete="off" type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`w-24 pr-8 ${getTableInputClass(adminPassword.trim())}`} />
                                                                <button type="button" onClick={() => setShowAdminPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showAdminPassword ? 'Ocultar' : 'Ver'}>
                                                                    <NextImage src={showAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                                </button>
                                                            </span>
                                                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAddRole(u.id); }} className={btn('emerald')}>Asignar</button>
                                                            <button type="button" onClick={() => { setAddingRoleUserId(null); setAddingRoleTipo('') }} className={btn('muted')}>Cancelar</button>
                                                        </span>
                                                    ) : (
                                                        types.filter((t) => !userRolesList(u).includes(tipoToRoleName(t.id))).length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAddingRoleUserId(u.id); }}
                                                                className={`text-xs ${darkMode ? 'text-emerald-400 hover:underline' : 'text-emerald-600 hover:underline'}`}
                                                            >
                                                                + Añadir rol
                                                            </button>
                                                        )
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className={`py-4 px-4 border-r ${tableBorderClass} last:border-r-0 align-top`}>
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                {(u.permissions || []).map((p) => (
                                                    <span key={p} className="inline-flex items-center gap-1">
                                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs ${darkMode ? 'bg-gray-600/50 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>{permissionLabel(p)}</span>
                                                        {revokingPermissionUserId === u.id && revokingPermissionName === p ? (
                                                            <span className="inline-flex items-center gap-1">
                                                                <span className="relative inline-block">
                                                                    <Input autoComplete="off" type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`w-24 pr-8 ${getTableInputClass(adminPassword.trim())}`} />
                                                                    <button type="button" onClick={() => setShowAdminPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showAdminPassword ? 'Ocultar' : 'Ver'}>
                                                                        <NextImage src={showAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                                    </button>
                                                                </span>
                                                                <button type="button" onClick={() => handleRevokePermission(u.id, p)} className={btn('red')}>Quitar</button>
                                                                <button type="button" onClick={() => { setRevokingPermissionUserId(null); setRevokingPermissionName(null) }} className={btn('muted')}>Cancelar</button>
                                                            </span>
                                                        ) : (
                                                            <button type="button" onClick={() => { setRevokingPermissionUserId(u.id); setRevokingPermissionName(p) }} className={`p-0.5 rounded ${darkMode ? 'text-red-400 hover:bg-red-500/20' : 'text-red-500 hover:bg-red-50'}`} title="Quitar permiso">
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        )}
                                                    </span>
                                                ))}
                                                {u.permissions?.length === 0 && grantingPermissionUserId !== u.id && <span className={`text-xs ${cellMutedClass}`}>—</span>}
                                                {grantingPermissionUserId === u.id ? (
                                                    <span className="inline-flex flex-wrap items-center gap-1.5">
                                                        <select value={grantingPermissionValue} onChange={(e) => setGrantingPermissionValue(e.target.value)} className={tableSelectClass}>
                                                            <option value="">Permiso...</option>
                                                            {permissions.filter((perm) => !(u.permissions || []).includes(perm.value)).map((perm) => (
                                                                <option key={perm.value} value={perm.value}>{perm.label}</option>
                                                            ))}
                                                        </select>
                                                        <span className="relative inline-block">
                                                            <Input autoComplete="off" type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`w-24 pr-8 ${getTableInputClass(adminPassword.trim())}`} />
                                                            <button type="button" onClick={() => setShowAdminPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showAdminPassword ? 'Ocultar' : 'Ver'}>
                                                                <NextImage src={showAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                            </button>
                                                        </span>
                                                        <button type="button" onClick={() => handleGrantPermission(u.id)} className={btn('emerald')}>Conceder</button>
                                                        <button type="button" onClick={() => { setGrantingPermissionUserId(null); setGrantingPermissionValue('') }} className={btn('muted')}>Cancelar</button>
                                                    </span>
                                                ) : (
                                                    permissions.some((perm) => !(u.permissions || []).includes(perm.value)) && (
                                                        <button type="button" onClick={() => setGrantingPermissionUserId(u.id)} className={`text-xs ${darkMode ? 'text-emerald-400 hover:underline' : 'text-emerald-600 hover:underline'}`}>+ Añadir permiso</button>
                                                    )
                                                )}
                                            </div>
                                        </td>
                                        <td className={`py-4 px-4 border-r ${tableBorderClass} last:border-r-0 align-top`}>
                                            {editingUser === u.id ? (
                                                <div className="flex flex-wrap gap-2 items-center">
                                                    <span className="relative inline-block">
                                                        <Input autoComplete="off" type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`w-32 pr-8 ${getTableInputClass(adminPassword.trim())}`} />
                                                        <button type="button" onClick={() => setShowAdminPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showAdminPassword ? 'Ocultar' : 'Ver'}>
                                                            <NextImage src={showAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                        </button>
                                                    </span>
                                                    <button type="button" onClick={handleSaveEdit} className={btn('emerald')}>Guardar</button>
                                                    <button type="button" onClick={() => handleSetRole(u.id)} className={btn('emerald')}>Asignar rol</button>
                                                    <button type="button" onClick={() => setEditingUser(null)} className={btn('muted')}>Cancelar</button>
                                                </div>
                                            ) : resettingUserId === u.id ? (
                                                <form onSubmit={handleResetPassword} className="flex flex-wrap gap-2 items-end">
                                                    <div className={`relative ${showPasswordModal ? 'z-[60]' : ''}`}>
                                                        <Input
                                                            type={showNewPassword ? 'text' : 'password'}
                                                            value={newPassword}
                                                            onChange={(e) => setNewPassword(e.target.value)}
                                                            onFocus={() => setShowPasswordModal(true)}
                                                            onBlur={() => setTimeout(() => setShowPasswordModal(false), 180)}
                                                            className={`w-32 pr-8 ${getTableInputClass(newPassword.trim())}`}
                                                        />
                                                        <button type="button" onClick={() => setShowNewPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showNewPassword ? 'Ocultar' : 'Ver'}>
                                                            <NextImage src={showNewPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                        </button>
                                                        {showPasswordModal && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowPasswordModal(false)} />
                                                                <div className={`absolute left-full top-1/2 z-50 w-52 -translate-y-1/2 ml-1 rounded-xl border-2 shadow-xl text-xs ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                                                                    <div className="p-2.5">
                                                                        <p className={`font-semibold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Requisitos</p>
                                                                        <ul className="space-y-1">
                                                                            {passwordRequirements.map(({ key, label, met }) => (
                                                                                <li key={key} className={`flex items-center gap-1.5 ${met ? 'text-green-600 dark:text-green-400' : darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                                                                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${met ? 'border-green-500 bg-green-500 text-white' : 'border-red-500 bg-transparent'}`}>
                                                                                        {met ? <svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 12 12"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg> : null}
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
                                                    <div className={`relative ${showConfirmModal ? 'z-[60]' : ''}`}>
                                                        <Input
                                                            type={showNewPasswordConfirmation ? 'text' : 'password'}
                                                            value={newPasswordConfirmation}
                                                            onChange={(e) => setNewPasswordConfirmation(e.target.value)}
                                                            onFocus={() => setShowConfirmModal(true)}
                                                            onBlur={() => setTimeout(() => setShowConfirmModal(false), 180)}
                                                            className={`w-28 pr-8 ${getTableInputClass(newPasswordConfirmation.trim())}`}
                                                        />
                                                        <button type="button" onClick={() => setShowNewPasswordConfirmation((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showNewPasswordConfirmation ? 'Ocultar' : 'Ver'}>
                                                            <NextImage src={showNewPasswordConfirmation ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                        </button>
                                                        {showConfirmModal && (
                                                            <>
                                                                <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowConfirmModal(false)} />
                                                                <div className={`absolute right-full top-1/2 z-50 w-48 -translate-y-1/2 mr-1 rounded-xl border-2 shadow-xl text-xs ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`}>
                                                                    <div className="p-2.5">
                                                                        <p className={`font-semibold mb-1.5 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Confirmar</p>
                                                                        {newPasswordConfirmation.length === 0 ? (
                                                                            <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Escribe la misma contraseña.</p>
                                                                        ) : newPassword === newPasswordConfirmation ? (
                                                                            <p className="text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                                                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-500 text-white"><svg className="h-2.5 w-2.5" fill="currentColor" viewBox="0 0 12 12"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg></span>
                                                                                Coinciden
                                                                            </p>
                                                                        ) : (
                                                                            <p className="text-red-600 dark:text-red-400 flex items-center gap-1.5">
                                                                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-red-500 bg-transparent text-red-500 text-[10px] font-bold">!</span>
                                                                                No coinciden
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                    <span className="relative inline-block">
                                                        <Input autoComplete="off" type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`w-28 pr-8 ${getTableInputClass(adminPassword.trim())}`} />
                                                        <button type="button" onClick={() => setShowAdminPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showAdminPassword ? 'Ocultar' : 'Ver'}>
                                                            <NextImage src={showAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                        </button>
                                                    </span>
                                                    <button type="submit" className={btn('emerald')}>Cambiar</button>
                                                    <button type="button" onClick={() => { setResettingUserId(null); setNewPassword(''); setNewPasswordConfirmation(''); setAdminPassword('') }} className={btn('muted')}>Cancelar</button>
                                                </form>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="button" onClick={() => handleEdit(u)} className={btn('emerald')}>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        Editar
                                                    </button>
                                                    <button type="button" onClick={() => setResettingUserId(u.id)} className={btn('amber')}>
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                                                        Contraseña
                                                    </button>
                                                    {deletingId === u.id ? (
                                                        <>
                                                            <span className="relative inline-block">
                                                                <Input autoComplete="off" type={showAdminPassword ? 'text' : 'password'} value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className={`w-24 pr-8 ${getTableInputClass(adminPassword.trim())}`} />
                                                                <button type="button" onClick={() => setShowAdminPassword((s) => !s)} className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded" aria-label={showAdminPassword ? 'Ocultar' : 'Ver'}>
                                                                    <NextImage src={showAdminPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={18} height={18} className="object-contain" />
                                                                </button>
                                                            </span>
                                                            <button type="button" onClick={() => handleDelete(u.id)} className={btn('red')}>Confirmar</button>
                                                            <button type="button" onClick={() => { setDeletingId(null); setAdminPassword('') }} className={btn('muted')}>Cancelar</button>
                                                        </>
                                                    ) : (
                                                        <button type="button" onClick={() => setDeletingId(u.id)} className={btn('red')}>
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                            Eliminar
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {totalPaginasListado > 1 && (() => {
                            const totalP = totalPaginasListado
                            const { windowPages, showEllipsis, showLastPage } = getPaginationWindow(paginaListadoActual, totalP)
                            const btn = (num) => (
                                <button
                                    key={num}
                                    type="button"
                                    onClick={() => setPaginaListado(num)}
                                    className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                                        num === paginaListadoActual
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
                                    {totalP > 1 && paginaListadoActual > 1 && (
                                        <button key="first" type="button" onClick={() => setPaginaListado(1)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'}`} title="Primera página">&laquo;&laquo;</button>
                                    )}
                                    {windowPages.map((num) => btn(num))}
                                    {showEllipsis && <span className={`min-w-[2.5rem] h-10 px-2 flex items-center justify-center rounded-lg text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>...</span>}
                                    {showLastPage && totalP > 7 && btn(totalP)}
                                    {totalP > 1 && paginaListadoActual < totalP && (
                                        <button key="last" type="button" onClick={() => setPaginaListado(totalP)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300'}`} title="Última página">&raquo;&raquo;</button>
                                    )}
                                </div>
                            )
                        })()}
                    </div>
                    )
                })()}

                <div className="px-4 pb-4">
                    <InputError messages={errors.general} />
                    <InputError messages={errors.adminPassword} />
                </div>
            </div>
        </div>
    )
}
