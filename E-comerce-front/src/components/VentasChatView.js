'use client'

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { formatMessageTime } from '@/lib/chatApi'

const COLOR_CLIENTE = '#FF8000'
const COLOR_VENTAS = '#6366f1'

export default function VentasChatView({
    darkMode,
    cliente,
    mensajes,
    loading,
    nuevoTexto,
    setNuevoTexto,
    enviando,
    onEnviar,
    editandoId,
    editandoTexto,
    setEditandoTexto,
    onIniciarEdicion,
    onCancelarEdicion,
    onGuardarEdicion,
    guardandoId,
    onEliminar,
    eliminandoId,
}) {
    const scrollRef = useRef(null)

    useEffect(() => {
        if (scrollRef.current && mensajes?.length) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [mensajes])

    const isCliente = (m) => m.sender_type === 'customer'
    const isSeller = (m) => m.sender_type === 'seller'

    if (!cliente) {
        return (
            <div className={`flex-1 flex items-center justify-center rounded-xl border-2 ${darkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'}`}>
                <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Selecciona un cliente para ver el chat.
                </p>
            </div>
        )
    }

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            <div
                ref={scrollRef}
                className={`flex-1 min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border-2 p-4 space-y-4 mb-4 ${
                    darkMode ? 'border-gray-600 bg-gray-800/40' : 'border-gray-200 bg-gray-50'
                }`}
            >
                {loading ? (
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Cargando mensajes…</p>
                ) : !mensajes?.length ? (
                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Aún no hay mensajes con este cliente.</p>
                ) : (
                    mensajes.map((m) => (
                        <div
                            key={m.id}
                            className={`flex flex-col ${isCliente(m) ? 'items-start' : 'items-end'}`}
                        >
                            <div
                                className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-lg ${
                                    isCliente(m) ? 'rounded-bl-sm' : 'rounded-br-sm'
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
                                {isCliente(m) && (m.user_name || m.user_email) && (
                                    <div className="text-xs opacity-90 mb-1">
                                        {m.user_name}
                                        {m.user_email ? ` (${m.user_email})` : ''}
                                    </div>
                                )}
                                {isSeller(m) && (m.seller_name || m.seller_email) && (
                                    <div className="text-xs opacity-90 mb-1">
                                        {m.seller_name}
                                        {m.seller_email ? ` (${m.seller_email})` : ''}
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
                                                onClick={onGuardarEdicion}
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
                                                onClick={onCancelarEdicion}
                                                className="p-1.5 rounded bg-white/20 hover:bg-white/30 text-white text-xs"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start gap-2 group">
                                        <span className="text-sm whitespace-pre-wrap break-words">{m.body}</span>
                                        {isSeller(m) && (
                                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    type="button"
                                                    onClick={() => onIniciarEdicion(m)}
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
                                                    onClick={() => onEliminar(m.id)}
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
                                <div className="mt-1.5 text-[10px] opacity-80">
                                    {formatMessageTime(m.created_at)}
                                    {m.pending && <span className="italic ml-1">(enviando…)</span>}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
            <form
                onSubmit={(e) => {
                    e.preventDefault()
                    onEnviar()
                }}
                className={`flex gap-2 items-center rounded-2xl border-2 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/50 focus-within:border-indigo-500 transition-shadow ${darkMode ? 'border-gray-600 bg-gray-800/50' : 'border-gray-200 bg-white'}`}
            >
                <input
                    type="text"
                    value={nuevoTexto}
                    onChange={(e) => setNuevoTexto(e.target.value)}
                    placeholder="Escribe tu respuesta…"
                    maxLength={5000}
                    className={`flex-1 min-w-0 py-3 px-4 text-sm border-0 focus:ring-0 focus:outline-none transition-colors rounded-2xl ${
                        nuevoTexto && nuevoTexto.trim()
                            ? 'bg-[#E5EBFD] text-gray-900 placeholder-gray-600'
                            : darkMode
                                ? 'bg-transparent text-white placeholder-gray-400'
                                : 'bg-transparent text-gray-900 placeholder-gray-500'
                    }`}
                />
                <button
                    type="submit"
                    disabled={enviando || !(nuevoTexto || '').trim()}
                    className="flex items-center justify-center w-12 h-12 shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 transition-all m-1"
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
