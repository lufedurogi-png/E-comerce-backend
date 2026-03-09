'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import {
    getChatClientesVentas,
    getChatMensajesVentas,
    enviarMensajeVentas,
    actualizarMensajeVentas,
    eliminarMensajeVentas,
} from '@/lib/chatApi'
import VentasChatView from '@/components/VentasChatView'

export default function VentasMensajesPage() {
    const [darkMode, setDarkMode] = useState(true)
    const [clientes, setClientes] = useState([])
    const [loadingClientes, setLoadingClientes] = useState(true)
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
    const [mensajes, setMensajes] = useState([])
    const [loadingMensajes, setLoadingMensajes] = useState(false)
    const [nuevoTexto, setNuevoTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [editandoTexto, setEditandoTexto] = useState('')
    const [guardandoId, setGuardandoId] = useState(null)
    const [eliminandoId, setEliminandoId] = useState(null)

    useEffect(() => {
        setDarkMode(JSON.parse(localStorage.getItem('darkMode') ?? 'true'))
    }, [])
    useEffect(() => {
        const onDarkModeChange = (e) => setDarkMode(!!e.detail)
        window.addEventListener('darkModeChange', onDarkModeChange)
        return () => window.removeEventListener('darkModeChange', onDarkModeChange)
    }, [])

    const cargarClientes = useCallback(async () => {
        setLoadingClientes(true)
        try {
            const lista = await getChatClientesVentas()
            setClientes(Array.isArray(lista) ? lista : [])
        } catch {
            setClientes([])
        } finally {
            setLoadingClientes(false)
        }
    }, [])

    useEffect(() => {
        cargarClientes()
    }, [cargarClientes])

    const cargarMensajes = useCallback(async (userId, silent = false) => {
        if (!userId) {
            setMensajes([])
            return
        }
        if (!silent) setLoadingMensajes(true)
        try {
            const { mensajes: list } = await getChatMensajesVentas(userId)
            const arr = Array.isArray(list) ? list : []
            if (silent) {
                setMensajes((prev) => {
                    const pending = prev.filter((m) => m.pending || String(m.id).startsWith('temp-'))
                    const merged = [...arr]
                    pending.forEach((p) => {
                        const inServer = arr.some((m) => m.body === p.body && Math.abs(new Date(m.created_at) - new Date(p.created_at)) < 15000)
                        if (!inServer) merged.push(p)
                    })
                    merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    return merged
                })
            } else {
                setMensajes(arr)
            }
        } catch {
            if (!silent) setMensajes([])
        } finally {
            if (!silent) setLoadingMensajes(false)
        }
    }, [])

    useEffect(() => {
        if (clienteSeleccionado?.id) {
            cargarMensajes(clienteSeleccionado.id)
        } else {
            setMensajes([])
        }
    }, [clienteSeleccionado?.id, cargarMensajes])

    useEffect(() => {
        if (!clienteSeleccionado?.id) return
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                cargarMensajes(clienteSeleccionado.id, true)
            }
        }, 5000)
        return () => clearInterval(interval)
    }, [clienteSeleccionado?.id, cargarMensajes])

    const handleEnviar = async () => {
        const userId = clienteSeleccionado?.id
        const texto = (nuevoTexto || '').trim()
        if (!userId || !texto || enviando) return
        const tempId = 'temp-' + Date.now()
        const tempMsg = {
            id: tempId,
            user_id: userId,
            sender_type: 'seller',
            body: texto,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            seller_name: null,
            seller_email: null,
            pending: true,
        }
        setMensajes((prev) => [...prev, tempMsg])
        setNuevoTexto('')
        setEnviando(true)
        try {
            const m = await enviarMensajeVentas(userId, texto)
            if (m) {
                setMensajes((prev) => prev.map((x) => (x.id === tempId ? { ...m, pending: false } : x)))
                cargarClientes()
            } else {
                setMensajes((prev) => prev.filter((x) => x.id !== tempId))
            }
        } catch {
            setMensajes((prev) => prev.filter((x) => x.id !== tempId))
        } finally {
            setEnviando(false)
        }
    }

    const iniciarEdicion = (m) => {
        setEditandoId(m.id)
        setEditandoTexto(m.body)
    }

    const cancelarEdicion = () => {
        setEditandoId(null)
        setEditandoTexto('')
    }

    const guardarEdicion = async () => {
        if (editandoId == null) return
        const texto = (editandoTexto || '').trim()
        if (!texto) return
        setGuardandoId(editandoId)
        try {
            const actualizado = await actualizarMensajeVentas(editandoId, texto)
            if (actualizado) {
                setMensajes((prev) =>
                    prev.map((x) => (x.id === editandoId ? { ...x, ...actualizado } : x))
                )
            }
            cancelarEdicion()
        } catch {
            //
        } finally {
            setGuardandoId(null)
        }
    }

    const handleEliminar = async (id) => {
        if (eliminandoId) return
        setEliminandoId(id)
        try {
            const ok = await eliminarMensajeVentas(id)
            if (ok) {
                setMensajes((prev) => prev.filter((x) => x.id !== id))
            }
        } catch {
            //
        } finally {
            setEliminandoId(null)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${darkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
                    <Image src="/Imagenes/icon_mensaje.png" alt="" width={28} height={28} className="object-contain" />
                </span>
                <div>
                    <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>
                        Mensajería con clientes
                    </h1>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Clientes que han iniciado chat. Selecciona uno para ver y responder.
                    </p>
                </div>
            </div>

            <div className={`rounded-xl border-2 overflow-hidden flex flex-col h-[calc(100vh-11rem)] max-h-[42rem] min-h-[28rem] ${darkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
                    {/* Lista de clientes */}
                    <div className={`w-full md:w-72 shrink-0 border-b md:border-b-0 md:border-r flex flex-col ${darkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50'}`}>
                        <div className="p-3 border-b border-gray-600/50 flex items-center gap-2 shrink-0">
                            <Image src="/Imagenes/icon_mensaje.png" alt="" width={20} height={20} className="object-contain opacity-80" />
                            <span className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Clientes con chat</span>
                        </div>
                        <div className="overflow-y-auto flex-1 min-h-0 p-2">
                            {loadingClientes ? (
                                <p className={`p-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargando…</p>
                            ) : clientes.length === 0 ? (
                                <p className={`p-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Ningún cliente ha iniciado un chat aún.
                                </p>
                            ) : (
                                clientes.map((c) => {
                                    const initial = (c.name || c.email || '?').charAt(0).toUpperCase()
                                    const isSelected = clienteSeleccionado?.id === c.id
                                    return (
                                        <button
                                            key={c.id}
                                            type="button"
                                            onClick={() => setClienteSeleccionado({ id: c.id, name: c.name, email: c.email })}
                                            className={`w-full text-left rounded-xl p-3 mb-2 transition-all flex items-center gap-3 ${
                                                isSelected
                                                    ? 'bg-indigo-600 text-white shadow-md'
                                                    : darkMode
                                                        ? 'hover:bg-gray-700/80 text-gray-200'
                                                        : 'hover:bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                                                isSelected ? 'bg-white/20 text-white' : darkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-200 text-gray-600'
                                            }`}>
                                                {initial}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <div className="font-medium truncate">{c.name || 'Sin nombre'}</div>
                                                <div className={`text-xs truncate ${isSelected ? 'text-indigo-100' : darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {c.email}
                                                </div>
                                                {c.unanswered_count > 0 && (
                                                    <span className="inline-flex items-center justify-center rounded-full bg-amber-500/90 text-white text-xs font-bold min-w-[1.25rem] h-5 px-1.5 mt-1">
                                                        {c.unanswered_count}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Área del chat: altura fija, solo los mensajes hacen scroll */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-4">
                        {clienteSeleccionado && (
                            <div className={`mb-3 pb-2 border-b shrink-0 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {clienteSeleccionado.name}
                                </span>
                                <span className={`text-sm ml-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {clienteSeleccionado.email}
                                </span>
                            </div>
                        )}
                        <VentasChatView
                            darkMode={darkMode}
                            cliente={clienteSeleccionado}
                            mensajes={mensajes}
                            loading={loadingMensajes}
                            nuevoTexto={nuevoTexto}
                            setNuevoTexto={setNuevoTexto}
                            enviando={enviando}
                            onEnviar={handleEnviar}
                            editandoId={editandoId}
                            editandoTexto={editandoTexto}
                            setEditandoTexto={setEditandoTexto}
                            onIniciarEdicion={iniciarEdicion}
                            onCancelarEdicion={cancelarEdicion}
                            onGuardarEdicion={guardarEdicion}
                            guardandoId={guardandoId}
                            onEliminar={handleEliminar}
                            eliminandoId={eliminandoId}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
