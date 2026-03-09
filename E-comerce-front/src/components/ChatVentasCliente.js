'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import {
    formatMessageTime,
    getChatMensajesCliente,
    enviarMensajeCliente,
    actualizarMensajeCliente,
    eliminarMensajeCliente,
} from '@/lib/chatApi'

const COLOR_CLIENTE = '#FF8000'
const COLOR_VENTAS = '#6366f1'

export default function ChatVentasCliente({ darkMode }) {
    const [mensajes, setMensajes] = useState([])
    const [loading, setLoading] = useState(true)
    const [nuevoTexto, setNuevoTexto] = useState('')
    const [enviando, setEnviando] = useState(false)
    const [editandoId, setEditandoId] = useState(null)
    const [editandoTexto, setEditandoTexto] = useState('')
    const [guardandoId, setGuardandoId] = useState(null)
    const [eliminandoId, setEliminandoId] = useState(null)
    const [errorEnvio, setErrorEnvio] = useState(null)
    const scrollRef = useRef(null)

    const cargarMensajes = async (silent = false) => {
        if (!silent) {
            setLoading(true)
            setErrorEnvio(null)
        }
        try {
            const lista = await getChatMensajesCliente()
            const list = Array.isArray(lista) ? lista : []
            if (silent) {
                setMensajes((prev) => {
                    const pending = prev.filter((m) => m.pending || String(m.id).startsWith('temp-'))
                    const merged = [...list]
                    pending.forEach((p) => {
                        const inServer = list.some((m) => m.body === p.body && Math.abs(new Date(m.created_at) - new Date(p.created_at)) < 15000)
                        if (!inServer) merged.push(p)
                    })
                    merged.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    return merged
                })
            } else {
                setMensajes(list)
            }
        } catch {
            if (!silent) setMensajes([])
        } finally {
            if (!silent) setLoading(false)
        }
    }

    useEffect(() => {
        cargarMensajes()
    }, [])

    useEffect(() => {
        const interval = setInterval(() => {
            if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
                cargarMensajes(true)
            }
        }, 5000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        if (scrollRef.current && mensajes.length) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [mensajes])

    const handleEnviar = async (e) => {
        e?.preventDefault()
        const texto = (nuevoTexto || '').trim()
        if (!texto || enviando) return
        setErrorEnvio(null)
        const tempId = 'temp-' + Date.now()
        const tempMsg = {
            id: tempId,
            sender_type: 'customer',
            body: texto,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            pending: true,
        }
        setMensajes((prev) => [...prev, tempMsg])
        setNuevoTexto('')
        setEnviando(true)
        try {
            const m = await enviarMensajeCliente(texto)
            if (m) {
                setMensajes((prev) => prev.map((x) => (x.id === tempId ? { ...m, pending: false } : x)))
            } else {
                setMensajes((prev) => prev.filter((x) => x.id !== tempId))
                setErrorEnvio('No se pudo enviar el mensaje. Revisa tu conexión o intenta de nuevo.')
            }
        } catch (err) {
            setMensajes((prev) => prev.filter((x) => x.id !== tempId))
            const msg = err.response?.data?.message || err.response?.data?.errors?.body?.[0] || err.message
            setErrorEnvio(msg || 'Error al enviar. Intenta de nuevo.')
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
            const actualizado = await actualizarMensajeCliente(editandoId, texto)
            if (actualizado) {
                setMensajes((prev) =>
                    prev.map((x) => (x.id === editandoId ? { ...x, ...actualizado } : x))
                )
            }
            cancelarEdicion()
        } catch {
            // error
        } finally {
            setGuardandoId(null)
        }
    }

    const handleEliminar = async (id) => {
        if (eliminandoId) return
        setEliminandoId(id)
        try {
            const ok = await eliminarMensajeCliente(id)
            if (ok) setMensajes((prev) => prev.filter((x) => x.id !== id))
        } catch {
            // error
        } finally {
            setEliminandoId(null)
        }
    }

    const isCliente = (m) => m.sender_type === 'customer'

    return (
        <div className="flex flex-col min-h-[420px]" style={{ height: 'min(520px, 55vh)' }}>
            <div
                ref={scrollRef}
                className={`flex-1 overflow-y-auto rounded-2xl border-2 p-4 space-y-4 mb-4 ${
                    darkMode ? 'border-gray-600 bg-gray-800/40' : 'border-gray-200 bg-gray-50'
                }`}
            >
                {loading ? (
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Cargando…</p>
                ) : mensajes.length === 0 ? (
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                        Aún no hay mensajes. Escribe algo y ventas te responderá.
                    </p>
                ) : (
                    mensajes.map((m) => (
                        <div
                            key={m.id}
                            className={`flex flex-col ${isCliente(m) ? 'items-end' : 'items-start'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-lg ${
                                    isCliente(m)
                                        ? 'rounded-br-sm'
                                        : 'rounded-bl-sm'
                                } ${m.pending ? 'opacity-90' : ''}`}
                                style={{
                                    backgroundColor: isCliente(m)
                                        ? `${COLOR_CLIENTE}`
                                        : darkMode
                                            ? `${COLOR_VENTAS}99`
                                            : COLOR_VENTAS,
                                    color: '#fff',
                                }}
                            >
                                {!isCliente(m) && (
                                    <div className="text-xs opacity-90 mb-1">
                                        {m.seller_name || 'Ventas'}
                                    </div>
                                )}
                                {editandoId === m.id ? (
                                    <div className="flex flex-col gap-2">
                                        <textarea
                                            value={editandoTexto}
                                            onChange={(e) => setEditandoTexto(e.target.value)}
                                            rows={2}
                                            className="w-full rounded px-2 py-1 text-gray-900 text-sm"
                                        />
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={guardarEdicion}
                                                disabled={guardandoId === m.id}
                                                className="p-1.5 rounded bg-white/20 hover:bg-white/30"
                                                title="Guardar"
                                            >
                                                <Image
                                                    src="/Imagenes/icon_guardar.png"
                                                    alt="Guardar"
                                                    width={18}
                                                    height={18}
                                                    className="object-contain invert"
                                                />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelarEdicion}
                                                className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 group">
                                        <span className="text-sm whitespace-pre-wrap break-words">
                                            {m.body}
                                        </span>
                                        {isCliente(m) && (
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => iniciarEdicion(m)}
                                                    className="p-1 rounded hover:bg-white/20"
                                                    title="Editar"
                                                >
                                                    <Image
                                                        src="/Imagenes/icon_editar.webp"
                                                        alt="Editar"
                                                        width={16}
                                                        height={16}
                                                        className="object-contain invert"
                                                    />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleEliminar(m.id)}
                                                    disabled={eliminandoId === m.id}
                                                    className="p-1 rounded hover:bg-white/20"
                                                    title="Eliminar"
                                                >
                                                    <Image
                                                        src="/Imagenes/icon_basura.png"
                                                        alt="Eliminar"
                                                        width={16}
                                                        height={16}
                                                        className="object-contain invert"
                                                    />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="mt-1.5 text-[10px] opacity-80 flex items-center gap-1">
                                    {formatMessageTime(m.created_at)}
                                    {m.pending && <span className="italic">(enviando…)</span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            {errorEnvio && (
                <p className="mb-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 dark:text-red-400 px-3 py-2 rounded-lg">
                    {errorEnvio}
                </p>
            )}
            <form onSubmit={handleEnviar} className={`flex gap-2 items-center rounded-2xl border-2 overflow-hidden focus-within:ring-2 focus-within:ring-[#FF8000]/50 focus-within:border-[#FF8000] transition-all ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-white'}`}>
                <input
                    type="text"
                    value={nuevoTexto}
                    onChange={(e) => setNuevoTexto(e.target.value)}
                    placeholder="Escribe tu mensaje..."
                    maxLength={5000}
                    className={
                        'flex-1 min-w-0 py-3 px-4 text-sm border-0 focus:ring-0 focus:outline-none transition-colors rounded-2xl ' +
                        (nuevoTexto && nuevoTexto.trim()
                            ? 'bg-[#E5EBFD] text-gray-900 placeholder-gray-600'
                            : darkMode
                                ? 'bg-transparent text-white placeholder-gray-400'
                                : 'bg-transparent text-gray-900 placeholder-gray-500')
                    }
                />
                <button
                    type="submit"
                    disabled={enviando || !String(nuevoTexto || '').trim()}
                    className="flex items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-[#FF8000] hover:bg-[#e67300] text-white disabled:opacity-50 transition-all m-1"
                    title="Enviar"
                >
                    <Image
                        src="/Imagenes/icon_enviar.png"
                        alt="Enviar"
                        width={24}
                        height={24}
                        className="object-contain invert"
                    />
                </button>
            </form>
        </div>
    )
}
