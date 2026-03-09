'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import useSWR from 'swr'
import { downloadInformeCategorias, downloadInformeActividad } from '@/lib/adminReportPdf'
import { swrFetcher } from '@/lib/swrFetcher'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as LineTooltip, ResponsiveContainer as LineResponsive, Legend as LineLegend } from 'recharts'

const swrConfig = { revalidateOnFocus: false, dedupingInterval: 60000 }

const COLORS = ['#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#6b7280', '#9ca3af', '#d1d5db', '#4b5563', '#374151']

const TIPO_COLORS = { admin: '#059669', cliente: '#3b82f6', vendedor: '#f59e0b' }
const TIPO_NAMES = { 1: 'Admin', 2: 'Cliente', 3: 'Vendedor' }

function hora12(hora24) {
    const h = Number(hora24)
    if (h === 0) return '12:00 am'
    if (h === 12) return '12:00 pm'
    if (h < 12) return `${h}:00 am`
    return `${h - 12}:00 pm`
}

function ActividadTooltip({ active, payload, label }) {
    if (!active || !payload?.length || !label) return null
    const row = payload[0]?.payload
    if (!row) return null
    return (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-3 shadow-xl text-sm min-w-[200px]">
            <p className="font-semibold text-gray-200 mb-2">{label}</p>
            <div className="space-y-1.5">
                <p className="text-emerald-400 font-medium">Registros: {row.registros}</p>
                {(row.registros_admin > 0 || row.registros_cliente > 0 || row.registros_vendedor > 0) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-400">
                        {row.registros_admin > 0 && <span style={{ color: TIPO_COLORS.admin }}>Admin {row.registros_admin}</span>}
                        {row.registros_cliente > 0 && <span style={{ color: TIPO_COLORS.cliente }}>Cliente {row.registros_cliente}</span>}
                        {row.registros_vendedor > 0 && <span style={{ color: TIPO_COLORS.vendedor }}>Vendedor {row.registros_vendedor}</span>}
                    </div>
                )}
                <p className="text-blue-400 font-medium mt-1">Inicios de sesión: {row.logins}</p>
                {(row.logins_admin > 0 || row.logins_cliente > 0 || row.logins_vendedor > 0) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-gray-400">
                        {row.logins_admin > 0 && <span style={{ color: TIPO_COLORS.admin }}>Admin {row.logins_admin}</span>}
                        {row.logins_cliente > 0 && <span style={{ color: TIPO_COLORS.cliente }}>Cliente {row.logins_cliente}</span>}
                        {row.logins_vendedor > 0 && <span style={{ color: TIPO_COLORS.vendedor }}>Vendedor {row.logins_vendedor}</span>}
                    </div>
                )}
            </div>
            <div className="mt-2 pt-2 border-t border-gray-600 flex gap-3 text-xs">
                <span style={{ color: TIPO_COLORS.admin }}>● Admin</span>
                <span style={{ color: TIPO_COLORS.cliente }}>● Cliente</span>
                <span style={{ color: TIPO_COLORS.vendedor }}>● Vendedor</span>
            </div>
        </div>
    )
}

function EventosTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    const p = payload[0]?.payload
    if (!p) return null
    const tipoLabel = TIPO_NAMES[p.tipo] || 'Usuario'
    const colorKey = tipoLabel.toLowerCase()
    return (
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-2 shadow-xl text-sm">
            <p className="text-gray-200">Día {p.dia} · {hora12(p.hora)}</p>
            <p style={{ color: TIPO_COLORS[colorKey] || '#9ca3af' }}>{tipoLabel} · {p.evento === 'registro' ? 'Registro' : 'Inicio de sesión'}</p>
        </div>
    )
}

export default function AdminHome() {
    const [darkMode, setDarkMode] = useState(true)

    const { data: categorias = [], isLoading: loadingCat } = useSWR(
        '/admin/stats/categorias-mas-vistas',
        swrFetcher,
        swrConfig
    )
    const { data: actividad = [], isLoading: loadingAct } = useSWR(
        '/admin/stats/actividad-usuarios',
        swrFetcher,
        swrConfig
    )
    const { data: eventos = [], isLoading: loadingEv } = useSWR(
        '/admin/stats/actividad-eventos',
        swrFetcher,
        swrConfig
    )

    useEffect(() => {
        setDarkMode(JSON.parse(localStorage.getItem('darkMode') ?? 'true'))
    }, [])
    useEffect(() => {
        const onDarkModeChange = (e) => setDarkMode(!!e.detail)
        window.addEventListener('darkModeChange', onDarkModeChange)
        return () => window.removeEventListener('darkModeChange', onDarkModeChange)
    }, [])

    const loading = loadingCat || loadingAct || loadingEv
    const pieData = categorias.map((c) => ({ name: c.nombre || 'Sin categoría', value: parseInt(c.total, 10) }))
    const actividadData = actividad.map((r) => ({
        ...r,
        mes: r.mes,
        registros: Number(r.registros) || 0,
        logins: Number(r.logins) || 0,
    }))

    // Ordenar eventos por (dia, hora) y armar una fila por evento con columnas por tipo, para que cada línea una solo sus puntos
    const eventosOrdenados = [...eventos].sort((a, b) => a.dia - b.dia || a.hora - b.hora)
    const datosLineas = eventosOrdenados.map((e) => ({
        dia: e.dia,
        hora: e.hora,
        tipo: e.tipo,
        evento: e.evento,
        admin: e.tipo === 1 ? e.hora : null,
        cliente: e.tipo === 2 ? e.hora : null,
        vendedor: e.tipo === 3 ? e.hora : null,
    }))

    const SkeletonChart = () => (
        <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-pulse rounded-lg bg-gray-600/30 h-64 w-full" />
        </div>
    )

    return (
        <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`rounded-xl overflow-hidden shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`px-5 py-3.5 rounded-t-xl ${darkMode ? 'bg-emerald-600/30 border-b border-emerald-500/40' : 'bg-emerald-50 border-b border-emerald-200'}`}>
                        <h2 className={`text-lg font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Categorías más vistas en búsquedas</h2>
                    </div>
                    <div className="p-6">
                    {loadingCat ? (
                        <SkeletonChart />
                    ) : pieData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={100}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {pieData.map((_, i) => (
                                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 py-12 text-center">No hay datos de búsquedas aún.</p>
                    )}
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => downloadInformeCategorias(categorias)}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all border ${darkMode ? 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/20' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Descargar informe PDF
                        </button>
                    </div>
                    </div>
                </div>
                <div className={`rounded-xl overflow-hidden shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className={`px-5 py-3.5 rounded-t-xl ${darkMode ? 'bg-emerald-600/30 border-b border-emerald-500/40' : 'bg-emerald-50 border-b border-emerald-200'}`}>
                        <h2 className={`text-lg font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Actividad de usuarios</h2>
                    </div>
                    <div className="p-6">
                    {loadingAct || loadingEv ? (
                        <SkeletonChart />
                    ) : eventos.length > 0 ? (
                        <LineResponsive width="100%" height={320}>
                            <LineChart data={datosLineas} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="dia" name="Día" type="number" domain={[1, 31]} stroke="#9ca3af" tick={{ fontSize: 11 }} />
                                <YAxis name="Hora" type="number" domain={[0, 24]} stroke="#9ca3af" tick={{ fontSize: 10 }} allowDecimals={false} tickFormatter={hora12} />
                                <LineTooltip content={<EventosTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                                <LineLegend />
                                <Line type="monotone" dataKey="admin" name="Admin" stroke={TIPO_COLORS.admin} strokeWidth={2} connectNulls={false} dot={{ fill: TIPO_COLORS.admin, r: 4 }} />
                                <Line type="monotone" dataKey="cliente" name="Cliente" stroke={TIPO_COLORS.cliente} strokeWidth={2} connectNulls={false} dot={{ fill: TIPO_COLORS.cliente, r: 4 }} />
                                <Line type="monotone" dataKey="vendedor" name="Vendedor" stroke={TIPO_COLORS.vendedor} strokeWidth={2} connectNulls={false} dot={{ fill: TIPO_COLORS.vendedor, r: 4 }} />
                            </LineChart>
                        </LineResponsive>
                    ) : actividadData.length > 0 ? (
                        <>
                            <LineResponsive width="100%" height={220}>
                                <LineChart data={actividadData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                    <XAxis dataKey="mes" stroke="#9ca3af" tick={{ fontSize: 12 }} />
                                    <YAxis stroke="#9ca3af" tick={{ fontSize: 12 }} allowDecimals={false} />
                                    <LineTooltip content={<ActividadTooltip />} />
                                    <LineLegend />
                                    <Line type="monotone" dataKey="registros" name="Registros" stroke="#10b981" strokeWidth={2} dot={{ fill: '#059669', r: 4 }} />
                                    <Line type="monotone" dataKey="logins" name="Inicios de sesión" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#2563eb', r: 4 }} />
                                </LineChart>
                            </LineResponsive>
                            <p className="text-gray-500 text-center text-sm mt-2">Resumen por mes (no hay eventos por día/hora en los últimos 31 días).</p>
                        </>
                    ) : (
                        <p className="text-gray-500 py-12 text-center">No hay datos de actividad aún.</p>
                    )}
                    <div className="mt-4 flex justify-end">
                        <button
                            type="button"
                            onClick={() => downloadInformeActividad(actividadData, eventos)}
                            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all border ${darkMode ? 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/20' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Descargar informe PDF
                        </button>
                    </div>
                    </div>
                </div>
            </div>

            <div className={`mt-8 rounded-xl overflow-hidden shadow-lg border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-5 py-3.5 ${darkMode ? 'bg-emerald-600/30 border-b border-emerald-500/40' : 'bg-emerald-50 border-b border-emerald-200'}`}>
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-emerald-300' : 'text-emerald-800'}`}>Resumen y accesos</h2>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-emerald-700/80'}`}>Métricas recientes e inicio rápido</p>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className={`rounded-xl p-5 border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            </span>
                            <p className="text-xs uppercase tracking-wider font-medium text-gray-500">Últimos 31 días</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <div className={`rounded-lg border-2 ${darkMode ? 'border-emerald-500/50 bg-gray-700/50' : 'border-emerald-200 bg-emerald-50/50'} px-4 py-3 min-w-[100px]`}>
                                <p className="text-2xl font-bold text-emerald-400">{eventos.filter((e) => e.evento === 'registro').length}</p>
                                <p className="text-sm text-gray-400 mt-0.5">Registros</p>
                            </div>
                            {eventos.some((e) => e.evento === 'login') && (
                                <div className={`rounded-lg border-2 ${darkMode ? 'border-blue-500/50 bg-gray-700/50' : 'border-blue-200 bg-blue-50/50'} px-4 py-3 min-w-[100px]`}>
                                    <p className="text-2xl font-bold text-blue-400">{eventos.filter((e) => e.evento === 'login').length}</p>
                                    <p className="text-sm text-gray-400 mt-0.5">Inicios de sesión</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={`rounded-xl p-5 border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            </span>
                            <p className="text-xs uppercase tracking-wider font-medium text-gray-500">Acciones rápidas</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link
                                href="/admin-publicidad"
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 border-2 ${darkMode ? 'border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                                Publicidad
                            </Link>
                            <Link
                                href="/admin-pedidos"
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10' : 'border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                Pedidos
                            </Link>
                            <Link
                                href="/admin-productos-manuales"
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10' : 'border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                Productos manuales
                            </Link>
                            <Link
                                href="/admin-gestion-usuarios"
                                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 border-2 ${darkMode ? 'border-gray-600 text-gray-300 hover:border-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10' : 'border-gray-300 text-gray-700 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                Gestionar usuarios
                            </Link>
                        </div>
                    </div>
                    <div className={`rounded-xl p-5 border ${darkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </span>
                            <p className="text-xs uppercase tracking-wider font-medium text-gray-500">Informes PDF</p>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                type="button"
                                onClick={() => downloadInformeCategorias(categorias)}
                                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border ${darkMode ? 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/20' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Categorías más vistas
                            </button>
                            <button
                                type="button"
                                onClick={() => downloadInformeActividad(actividadData, eventos)}
                                className={`w-full inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all border ${darkMode ? 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/20' : 'border-emerald-500 text-emerald-600 hover:bg-emerald-50'}`}
                            >
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Actividad de usuarios
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
