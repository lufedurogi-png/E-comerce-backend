'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/hooks/auth'
import { formatPrecio, resolveStorageUrl } from '@/lib/productos'
import { registrarSeleccionBusqueda } from '@/lib/busqueda'
import { useCarrito } from '@/lib/carrito'
import { useFavoritos } from '@/lib/favoritos'
import { useCotizacion } from '@/lib/cotizaciones'

const FALLBACK_IMAGE = '/Imagenes/caja.png'

function getFirstImageUrl(producto) {
    if (producto?.imagen) return resolveStorageUrl(producto.imagen)
    const imagenes = producto?.imagenes
    if (Array.isArray(imagenes) && imagenes.length > 0) return resolveStorageUrl(imagenes[0])
    return null
}

const MAX_COMPARAR = 4

export default function ProductCard({ producto, darkMode, busquedaId = null, comparar = false, seleccionado = false, onCompararChange, compararLleno = false, returnUrl = null }) {
    const { user } = useAuth({ middleware: 'guest' })
    const [hasToken, setHasToken] = useState(false)
    useEffect(() => {
        setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('auth_token'))
    }, [])
    const [imgError, setImgError] = useState(false)
    const [addingCart, setAddingCart] = useState(false)
    const [togglingFavorito, setTogglingFavorito] = useState(false)
    const [cantidadCart, setCantidadCart] = useState(1)
    const isLogged = !!user || hasToken
    const { isFavorito, toggle: toggleFavorito } = useFavoritos(isLogged)
    const { add: addToCarrito, isInCart } = useCarrito(isLogged)
    const { modoActivo, isInQuote, cantidad: quoteCantidad, toggleItem, setCantidad } = useCotizacion(user)
    const imageUrl = getFirstImageUrl(producto)
    const titulo = producto?.descripcion || ''
    const precioFormateado = formatPrecio(producto?.precio, producto?.moneda)
    const grupo = producto?.grupo || ''
    const clave = producto?.clave
    const disponible = Number(producto?.disponible) || 0
    const disponibleCd = Number(producto?.disponible_cd) || 0
    const totalStock = disponible + disponibleCd
    const hayStock = totalStock > 0
    const src = imgError || !imageUrl ? FALLBACK_IMAGE : imageUrl

    const [stockErrorModal, setStockErrorModal] = useState(null)

    useEffect(() => {
        if (totalStock > 0) setCantidadCart((prev) => Math.min(Math.max(1, prev), totalStock))
    }, [totalStock])

    if (!clave) return null

    return (
        <div
            className={`group relative rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-xl hover:scale-105 ${
                darkMode
                    ? 'bg-gray-800 border-gray-700 hover:border-[#FF8000]'
                    : 'bg-white border-gray-200 hover:border-[#FF8000]'
            }`}
        >
            <Link
                href={returnUrl ? `/tienda/producto/${encodeURIComponent(clave)}?from=${encodeURIComponent(returnUrl)}` : `/tienda/producto/${encodeURIComponent(clave)}`}
                className="block"
                onClick={() => {
                    if (busquedaId) registrarSeleccionBusqueda(busquedaId, clave)
                }}
            >
                <div className="relative h-48 bg-gray-100 overflow-hidden cursor-pointer">
                            {user && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (togglingFavorito) return
                                toggleFavorito(clave).finally(() => setTogglingFavorito(false))
                            }}
                            className="absolute top-2 left-2 z-10 flex flex-col items-center justify-center w-9 h-9 rounded-full bg-red-600 hover:bg-red-700 text-white shadow transition-colors"
                            aria-label={isFavorito(clave) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                        >
                            <Image
                                src="/Imagenes/icon_favoritos.png"
                                alt=""
                                width={16}
                                height={16}
                                className="object-contain brightness-0 invert shrink-0"
                            />
                            {isFavorito(clave) && (
                                <svg className="w-3 h-3 shrink-0 -mt-0.5 text-white" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                                    <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                </svg>
                            )}
                        </button>
                    )}
                    {comparar && !modoActivo && (
                        <div
                            className="absolute top-2 right-2 z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={seleccionado}
                                disabled={!seleccionado && compararLleno}
                                onChange={(e) => onCompararChange?.(clave, e.target.checked)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 rounded border-2 border-gray-400 bg-white/90 text-[#FF8000] focus:ring-[#FF8000] focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label={`Comparar ${titulo.slice(0, 40)}`}
                            />
                        </div>
                    )}
                    {modoActivo && (
                        <div
                            className="absolute top-2 right-2 z-10"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <input
                                type="checkbox"
                                checked={isInQuote(clave)}
                                onChange={(e) => toggleItem(clave, e.target.checked, quoteCantidad(clave) || 1)}
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 rounded border-2 border-gray-400 bg-white/90 text-[#FF8000] focus:ring-[#FF8000] focus:ring-offset-0"
                                aria-label={`Cotizar ${titulo.slice(0, 40)}`}
                            />
                        </div>
                    )}
                    <Image
                        src={src}
                        alt={titulo.slice(0, 60) || 'Producto'}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300 p-2"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        onError={() => setImgError(true)}
                        unoptimized={src.startsWith('http')}
                    />
                    {grupo && (
                        <span className={`absolute bottom-2 right-2 text-xs px-2 py-1 rounded ${
                            darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}>
                            {grupo}
                        </span>
                    )}
                </div>
                <div className="p-4">
                    <h3 className={`font-semibold mb-2 line-clamp-2 cursor-pointer ${
                        darkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                        {titulo}
                    </h3>
                    <div className="flex flex-col gap-0.5">
                        {producto.tiene_descuento && producto.precio_anterior != null && (
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                <span className="line-through">{formatPrecio(producto.precio_anterior, producto.moneda)}</span>
                                {' → '}
                                <span className="font-semibold text-[#FF8000]">{formatPrecio(producto.precio_actual ?? producto.precio, producto.moneda)}</span>
                                {producto.porcentaje_descuento > 0 && (
                                    <span className={`ml-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>({Math.round(producto.porcentaje_descuento)}%)</span>
                                )}
                            </p>
                        )}
                        <div className="flex items-center justify-between">
                            <span className={`text-lg font-bold ${darkMode ? 'text-[#FF8000]' : 'text-[#FF8000]'}`}>
                                {precioFormateado}
                            </span>
                        </div>
                    </div>
                    <p className={`mt-1 text-sm ${
                        hayStock
                            ? darkMode ? 'text-emerald-400' : 'text-emerald-600'
                            : darkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                        {hayStock ? `En stock: ${totalStock}` : 'Sin stock'}
                    </p>
                </div>
            </Link>
            {modoActivo && isInQuote(clave) && (
                <div className="px-4 py-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <label className="text-sm font-semibold shrink-0 text-[#FF8000]" htmlFor={`qty-quote-${clave}`}>
                        Cantidad a cotizar:
                    </label>
                    <div className={`relative flex items-center gap-0 rounded-xl overflow-hidden border-2 border-l-4 ${
                        darkMode ? 'bg-gray-700 border-gray-600 border-l-[#FF8000]' : 'bg-gray-200 border-gray-300 border-l-[#FF8000]'
                    }`}>
                        <span className="pl-2.5 shrink-0 text-[#FF8000] font-bold text-sm" aria-hidden>#</span>
                        <input
                            id={`qty-quote-${clave}`}
                            type="number"
                            min={1}
                            max={Math.max(1, totalStock)}
                            value={Math.min(Math.max(1, quoteCantidad(clave) || 1), Math.max(1, totalStock))}
                            onChange={(e) => {
                                const raw = e.target.value
                                if (raw === '' || raw === null || raw === undefined) {
                                    setCantidad(clave, 1)
                                    return
                                }
                                const v = Math.max(1, Math.min(totalStock, Number(raw) || 1))
                                setCantidad(clave, v)
                            }}
                            onBlur={(e) => {
                                const raw = e.target.value
                                if (raw === '' || Number(raw) < 1 || Number.isNaN(Number(raw))) {
                                    setCantidad(clave, 1)
                                    return
                                }
                                const v = Math.max(1, Math.min(totalStock, Number(raw)))
                                setCantidad(clave, v)
                            }}
                            className={`w-14 py-2 pr-0 text-sm font-semibold text-center bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}
                        />
                        <div className={`flex flex-col shrink-0 border-l ${darkMode ? 'border-gray-600' : 'border-gray-400'}`}>
                            <button
                                type="button"
                                aria-label="Aumentar cantidad a cotizar"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    const q = quoteCantidad(clave) || 1
                                    const maxQ = Math.max(1, totalStock)
                                    setCantidad(clave, Math.min(maxQ, q + 1))
                                }}
                                className={`p-1 flex items-center justify-center ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <button
                                type="button"
                                aria-label="Disminuir cantidad a cotizar"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    const q = quoteCantidad(clave) || 1
                                    setCantidad(clave, Math.max(1, q - 1))
                                }}
                                className={`p-1 flex items-center justify-center border-t ${darkMode ? 'border-gray-600 hover:bg-gray-600 text-gray-300' : 'border-gray-400 hover:bg-gray-300 text-gray-600'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="px-4 pb-4 space-y-2">
                {!isInCart(clave) && hayStock && (
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <label className={`text-sm font-semibold shrink-0 ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} htmlFor={`qty-card-${clave}`}>
                            Cantidad:
                        </label>
                        <div className={`relative flex items-center gap-0 rounded-xl overflow-hidden border-2 border-l-4 ${
                            darkMode ? 'bg-gray-700 border-gray-600 border-l-teal-500' : 'bg-gray-200 border-gray-300 border-l-teal-500'
                        }`}>
                            <span className={`pl-2.5 shrink-0 font-bold text-sm ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} aria-hidden>#</span>
                            <input
                                id={`qty-card-${clave}`}
                                type="number"
                                min={1}
                                max={totalStock}
                                value={Math.min(cantidadCart, totalStock) || 1}
                                onChange={(e) => setCantidadCart(Math.max(1, Math.min(totalStock, Number(e.target.value) || 1)))}
                                className={`w-14 py-2 pr-0 text-sm font-semibold text-center bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${darkMode ? 'text-white' : 'text-gray-900'}`}
                            />
                            <div className={`flex flex-col shrink-0 border-l ${darkMode ? 'border-gray-600' : 'border-gray-400'}`}>
                                <button
                                    type="button"
                                    aria-label="Aumentar cantidad"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCantidadCart((p) => Math.min(totalStock, p + 1)); }}
                                    className={`p-1 flex items-center justify-center ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                </button>
                                <button
                                    type="button"
                                    aria-label="Disminuir cantidad"
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCantidadCart((p) => Math.max(1, p - 1)); }}
                                    className={`p-1 flex items-center justify-center border-t ${darkMode ? 'border-gray-600 hover:bg-gray-600 text-gray-300' : 'border-gray-400 hover:bg-gray-300 text-gray-600'}`}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
                {isInCart(clave) ? (
                    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                            href="/tienda/carrito"
                            className={`block w-full py-2 rounded-lg font-medium text-center transition-colors ${
                                darkMode ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                        >
                            En el carrito
                        </Link>
                        {hayStock && (
                        <div className="flex items-center gap-2">
                            <div className={`relative flex items-center gap-0 rounded-xl overflow-hidden border-2 border-l-4 ${
                                darkMode ? 'bg-gray-700 border-gray-600 border-l-teal-500' : 'bg-gray-200 border-gray-300 border-l-teal-500'
                            }`}>
                                <span className={`pl-2.5 shrink-0 font-bold text-sm ${darkMode ? 'text-teal-400' : 'text-teal-600'}`} aria-hidden>#</span>
                                <input
                                    type="number"
                                    min={1}
                                    max={totalStock}
                                    value={Math.min(cantidadCart, totalStock) || 1}
                                    onChange={(e) => setCantidadCart(Math.max(1, Math.min(totalStock, Number(e.target.value) || 1)))}
                                    className={`w-14 py-2 pr-0 text-sm font-semibold text-center bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                />
                                <div className={`flex flex-col shrink-0 border-l ${darkMode ? 'border-gray-600' : 'border-gray-400'}`}>
                                    <button
                                        type="button"
                                        aria-label="Aumentar cantidad"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCantidadCart((p) => Math.min(totalStock, p + 1)); }}
                                        className={`p-1 flex items-center justify-center ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                    </button>
                                    <button
                                        type="button"
                                        aria-label="Disminuir cantidad"
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCantidadCart((p) => Math.max(1, p - 1)); }}
                                        className={`p-1 flex items-center justify-center border-t ${darkMode ? 'border-gray-600 hover:bg-gray-600 text-gray-300' : 'border-gray-400 hover:bg-gray-300 text-gray-600'}`}
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                    </button>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={async (e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (addingCart) return
                                    if (!hayStock) {
                                        setStockErrorModal('No hay stock disponible para este producto.')
                                        return
                                    }
                                    if (cantidadCart > totalStock) {
                                        setStockErrorModal(`La cantidad solicitada (${cantidadCart}) supera el stock disponible (${totalStock} unidades).`)
                                        return
                                    }
                                    setAddingCart(true)
                                    try {
                                        await addToCarrito(clave, cantidadCart)
                                    } finally {
                                        setAddingCart(false)
                                    }
                                }}
                                disabled={addingCart || !hayStock}
                                className={`flex-1 py-2 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 ${
                                    darkMode ? 'bg-teal-600 hover:bg-teal-500 shadow-md hover:shadow-teal-500/25' : 'bg-teal-500 hover:bg-teal-600 shadow-md hover:shadow-lg'
                                }`}
                            >
                                {addingCart ? '…' : 'Agregar más'}
                            </button>
                        </div>
                        )}
                    </div>
                ) : (
                    <>
                        <button
                            onClick={async (e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                if (addingCart) return
                                if (!hayStock) {
                                    setStockErrorModal('No hay stock disponible para este producto. No se puede agregar al carrito.')
                                    return
                                }
                                if (cantidadCart > totalStock) {
                                    setStockErrorModal(`La cantidad solicitada (${cantidadCart}) supera el stock disponible (${totalStock} unidades). No se puede agregar al carrito.`)
                                    return
                                }
                                setAddingCart(true)
                                try {
                                    await addToCarrito(clave, cantidadCart)
                                } finally {
                                    setAddingCart(false)
                                }
                            }}
                            disabled={addingCart}
                            className={`w-full py-2 rounded-lg font-medium transition-colors disabled:opacity-70 ${
                                darkMode
                                    ? 'bg-[#FF8000] hover:bg-[#FF9500] text-white'
                                    : 'bg-[#FF8000] hover:bg-[#FF9500] text-white'
                            }`}
                        >
                            {addingCart ? 'Agregando…' : hayStock ? 'Agregar al carrito' : 'Sin stock'}
                        </button>
                        {stockErrorModal && (
                            <>
                                <div className="fixed inset-0 bg-black/50 z-[100]" onClick={() => setStockErrorModal(null)} aria-hidden />
                                <div className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-sm rounded-xl border-2 shadow-xl p-4 ${darkMode ? 'bg-gray-800 border-red-900/50' : 'bg-white border-red-200'}`} onClick={(e) => e.stopPropagation()}>
                                    <p className={`text-sm font-medium ${darkMode ? 'text-red-300' : 'text-red-700'}`}>{stockErrorModal}</p>
                                    <button type="button" onClick={() => setStockErrorModal(null)} className={`mt-3 w-full py-2 rounded-lg text-sm font-medium ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                                        Cerrar
                                    </button>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
