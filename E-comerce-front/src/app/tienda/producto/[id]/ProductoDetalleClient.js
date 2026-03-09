'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/auth'
import TiendaNavHeader from '@/components/TiendaNavHeader'
import { addVistoReciente, formatPrecio, getRecomendados, resolveStorageUrl } from '@/lib/productos'
import { useCarrito } from '@/lib/carrito'
import { useFavoritos } from '@/lib/favoritos'
import { getOrCreateGuestId } from '@/lib/guestId'

const FALLBACK_IMAGE = '/Imagenes/caja.png'

function getImagenes(producto) {
    const list = []
    if (producto?.imagen) list.push(resolveStorageUrl(producto.imagen))
    const arr = producto?.imagenes
    if (Array.isArray(arr)) arr.forEach((u) => { if (u) list.push(resolveStorageUrl(u)) })
    return list.length ? list : [FALLBACK_IMAGE]
}

export default function ProductoDetalleClient({ clave, initialProducto = null, errorCatalog = false, returnUrl = null }) {
    const router = useRouter()
    const { user } = useAuth({ middleware: 'guest' })
    const [hasToken, setHasToken] = useState(false)
    useEffect(() => {
        setHasToken(typeof window !== 'undefined' && !!localStorage.getItem('auth_token'))
    }, [])
    const [addingCart, setAddingCart] = useState(false)
    const [cantidad, setCantidad] = useState(1)
    const [stockErrorModal, setStockErrorModal] = useState(null)
    const [togglingFavorito, setTogglingFavorito] = useState(false)
    const isLogged = !!user || hasToken
    const { isFavorito, toggle: toggleFavorito } = useFavoritos(isLogged)
    const { add: addToCarrito, isInCart } = useCarrito(isLogged)
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [imgErrors, setImgErrors] = useState({})
    const [infoGeneralOpen, setInfoGeneralOpen] = useState(false)
    const [especificacionesOpen, setEspecificacionesOpen] = useState(false)
    const [sugeridos, setSugeridos] = useState([])

    const producto = initialProducto

    useEffect(() => {
        if (!clave) return
        const effectiveUserId = user?.id ?? (typeof window !== 'undefined' ? getOrCreateGuestId() : null)
        addVistoReciente(clave, effectiveUserId)
    }, [clave, user?.id])

    useEffect(() => {
        if (!clave) return
        getRecomendados([clave], 24)
            .then((list) => {
                const withStock = (p) => ((p?.disponible ?? 0) + (p?.disponible_cd ?? 0)) > 0
                const filtered = (list || []).filter((p) => p?.clave && p.clave !== clave && withStock(p))
                setSugeridos(filtered.slice(0, 10))
            })
            .catch(() => setSugeridos([]))
    }, [clave])

    const totalUnidades = (producto?.disponible ?? 0) + (producto?.disponible_cd ?? 0)
    useEffect(() => {
        if (totalUnidades > 0) setCantidad((prev) => Math.min(Math.max(1, prev), totalUnidades))
    }, [totalUnidades])

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'darkMode' && e.newValue) {
                setDarkMode(JSON.parse(e.newValue))
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    const handleImageError = (index) => {
        setImgErrors((prev) => ({ ...prev, [index]: true }))
    }

    if (errorCatalog) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${
                darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
            }`}>
                <div className={`max-w-md mx-auto p-6 rounded-lg border ${
                    darkMode ? 'bg-gray-800 border-amber-900/50' : 'bg-amber-50 border-amber-200'
                }`}>
                    <h1 className={`text-xl font-bold mb-2 ${
                        darkMode ? 'text-amber-400' : 'text-amber-800'
                    }`}>
                        Catálogo no disponible
                    </h1>
                    <p className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                        El catálogo de productos no está disponible en este momento. Por favor, intente más tarde.
                    </p>
                    <Link href={returnUrl || '/tienda'} className="text-[#FF8000] hover:underline mt-4 inline-block">
                        Volver a la tienda
                    </Link>
                </div>
            </div>
        )
    }

    if (!producto) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${
                darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
            }`}>
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
                    <Link href={returnUrl || '/tienda'} className="text-[#FF8000] hover:underline">
                        Volver a la tienda
                    </Link>
                </div>
            </div>
        )
    }

    const imagenes = getImagenes(producto)
    const mainImage = imgErrors[selectedImageIndex]
        ? FALLBACK_IMAGE
        : (imagenes[selectedImageIndex] || FALLBACK_IMAGE)
    const titulo = producto.descripcion || ''
    const precioFormateado = formatPrecio(producto.precio, producto.moneda)
    const enStock = totalUnidades > 0
    const breadcrumbTitulo = titulo.length > 45 ? titulo.slice(0, 45) + '…' : titulo

    const bg = darkMode ? 'bg-gray-900' : 'bg-gray-50'
    const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    const text = darkMode ? 'text-gray-100' : 'text-gray-900'
    const textMuted = darkMode ? 'text-gray-400' : 'text-gray-600'
    const linkHover = 'hover:text-[#FF8000] transition-colors'

    return (
        <div className={`min-h-screen transition-colors duration-300 ${bg} ${text}`}>
            <TiendaNavHeader darkMode={darkMode} setDarkMode={setDarkMode} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
                {/* Breadcrumbs */}
                <nav className={`text-xs sm:text-sm ${textMuted} mb-4 sm:mb-6`} aria-label="Navegación">
                    <ol className="flex flex-wrap items-center gap-1 sm:gap-2">
                        <li><Link href="/" className={linkHover}>Inicio</Link></li>
                        <li aria-hidden="true">›</li>
                        <li><Link href={returnUrl || '/tienda'} className={linkHover}>Tienda</Link></li>
                        {producto.grupo && (
                            <>
                                <li aria-hidden="true">›</li>
                                <li>
                                    <Link href={returnUrl || '/tienda'} className={linkHover}>
                                        {producto.grupo}
                                    </Link>
                                </li>
                            </>
                        )}
                        <li aria-hidden="true">›</li>
                        <li className={`truncate max-w-[180px] sm:max-w-xs ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>{breadcrumbTitulo}</li>
                    </ol>
                </nav>

                {/* Contenido principal: galería | info + caja compra — responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-10">
                    {/* Columna izquierda: galería tipo Amazon */}
                    <div className="lg:col-span-5 xl:col-span-5">
                        <div className={`rounded-xl border overflow-hidden ${cardBg} sticky top-20`}>
                            <div className="flex flex-row-reverse sm:flex-row gap-3 p-3 sm:p-4">
                                {/* Miniaturas: horizontal en móvil, vertical en sm+ */}
                                {imagenes.length > 1 && (
                                    <div className="flex sm:flex-col gap-2 shrink-0 overflow-x-auto sm:overflow-y-auto sm:max-h-[360px] py-1 sm:py-0 scrollbar-thin">
                                        {imagenes.map((url, i) => (
                                            <button
                                                key={i}
                                                type="button"
                                                onClick={() => setSelectedImageIndex(i)}
                                                className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 overflow-hidden transition-all ${
                                                    selectedImageIndex === i
                                                        ? 'border-[#FF8000] ring-2 ring-[#FF8000] ring-offset-2 ring-offset-transparent'
                                                        : darkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                {imgErrors[i] ? (
                                                    <Image src={FALLBACK_IMAGE} alt="" width={64} height={64} className="w-full h-full object-contain" />
                                                ) : (
                                                    <Image src={url} alt="" width={64} height={64} className="w-full h-full object-contain" onError={() => handleImageError(i)} unoptimized={url.startsWith('http')} />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                <div className="relative flex-1 min-h-[240px] sm:min-h-[320px] lg:min-h-[380px] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700/50 group">
                                    <Image
                                        src={mainImage}
                                        alt={titulo.slice(0, 80)}
                                        fill
                                        className="object-contain p-4 transition-transform duration-300 ease-out group-hover:scale-[1.25]"
                                        sizes="(max-width: 1024px) 100vw, 45vw"
                                        onError={() => handleImageError(selectedImageIndex)}
                                        unoptimized={mainImage.startsWith('http')}
                                        priority
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Columna derecha: título arriba; en xl la caja de compra es barra horizontal */}
                    <div className="lg:col-span-7 xl:col-span-7 flex flex-col gap-6">
                        {/* Título arriba (en pantalla completa queda claro arriba) */}
                        <div className="xl:min-w-0">
                            {producto.grupo && (
                                <Link href={returnUrl || '/tienda'} className={`inline-block text-sm font-medium ${textMuted} ${linkHover} mb-1`}>
                                    {producto.grupo}
                                </Link>
                            )}
                            <h1 className={`text-xl sm:text-2xl lg:text-3xl font-bold leading-tight mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                {titulo}
                            </h1>
                            {producto.marca && (
                                <p className={`text-sm ${textMuted}`}>
                                    Marca: <span className="font-medium">{producto.marca}</span>
                                </p>
                            )}
                            {producto.ficha_comercial && (
                                <p className={`mt-3 text-sm sm:text-base leading-relaxed ${textMuted} line-clamp-4`}>
                                    {producto.ficha_comercial}
                                </p>
                            )}
                        </div>

                        {/* Caja de compra: izquierda datos, centro contador, derecha botones apilados */}
                        <div className={`rounded-xl border shadow-sm p-4 sm:p-6 ${cardBg} lg:sticky lg:top-24 lg:self-start w-full min-w-0`}>
                            <div className="flex flex-col sm:flex-row sm:items-stretch gap-6 min-w-0">
                                {/* Izquierda: precio, disponibilidad, stock */}
                                <div className="flex flex-col gap-1 shrink-0">
                                    {producto.tiene_descuento && producto.precio_anterior != null && (
                                        <p className={`text-sm ${textMuted}`}>
                                            Antes estaba en <span className="line-through font-medium">{formatPrecio(producto.precio_anterior, producto.moneda)}</span>
                                            {' '}y ahora está en <span className="font-semibold text-[#FF8000]">{formatPrecio(producto.precio_actual ?? producto.precio, producto.moneda)}</span>
                                            {producto.porcentaje_descuento > 0 && (
                                                <span className={`ml-1.5 text-xs font-medium ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                                    ({Math.round(producto.porcentaje_descuento)}% de descuento)
                                                </span>
                                            )}
                                        </p>
                                    )}
                                    <span className={`text-2xl sm:text-3xl font-bold text-[#FF8000]`}>{precioFormateado}</span>
                                    <span className={`text-sm font-medium ${enStock ? (darkMode ? 'text-green-400' : 'text-green-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                                        {enStock ? '✓ Disponible' : 'Sin stock'}
                                    </span>
                                    {totalUnidades > 0 && (
                                        <span className="text-sm font-bold text-red-500" aria-label="Stock disponible">
                                            Stock disponible: {String(totalUnidades).padStart(3, '0')}
                                        </span>
                                    )}
                                    {producto.disponible != null && producto.disponible_cd != null && totalUnidades > 0 && (
                                        <span className="text-xs font-medium text-red-500/90">
                                            (Sucursal: {producto.disponible} · CD: {producto.disponible_cd ?? 0})
                                        </span>
                                    )}
                                </div>
                                {/* Derecha: contador + favoritos (debajo) a la izquierda; Agregar al carrito y Comprar ahora a la derecha */}
                                <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-3 sm:ml-auto">
                                    {/* Columna: contador arriba, Agregar a favoritos debajo (si usuario logueado) */}
                                    <div className="flex flex-col gap-3 shrink-0">
                                        {!isInCart(clave) && enStock && (
                                            <div className="flex items-center gap-2">
                                                <label className={`text-sm font-medium ${textMuted}`} htmlFor="qty-producto">Cantidad:</label>
                                                <div className={`relative flex items-center gap-0 rounded-xl overflow-hidden border-2 border-l-4 ${
                                                    darkMode ? 'bg-gray-700 border-gray-600 border-l-[#FF8000]' : 'bg-gray-200 border-gray-300 border-l-[#FF8000]'
                                                }`}>
                                                    <span className="pl-2.5 shrink-0 text-[#FF8000] font-bold text-sm" aria-hidden>#</span>
                                                    <input
                                                        id="qty-producto"
                                                        type="number"
                                                        min={1}
                                                        max={totalUnidades}
                                                        value={Math.min(Math.max(1, cantidad), totalUnidades)}
                                                        onChange={(e) => {
                                                            const raw = e.target.value
                                                            if (raw === '' || raw === null || raw === undefined) {
                                                                setCantidad(1)
                                                                return
                                                            }
                                                            const v = Math.max(1, Math.min(totalUnidades, Number(raw) || 1))
                                                            setCantidad(v)
                                                        }}
                                                        onBlur={(e) => {
                                                            const raw = e.target.value
                                                            if (raw === '' || Number(raw) < 1 || Number.isNaN(Number(raw))) {
                                                                setCantidad(1)
                                                                return
                                                            }
                                                            const v = Math.max(1, Math.min(totalUnidades, Number(raw)))
                                                            setCantidad(v)
                                                        }}
                                                        className={`w-16 py-2 pr-0 text-sm font-semibold text-center bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                                    />
                                                    <div className={`flex flex-col shrink-0 border-l ${darkMode ? 'border-gray-600' : 'border-gray-400'}`}>
                                                        <button
                                                            type="button"
                                                            aria-label="Aumentar cantidad"
                                                            onClick={() => setCantidad((p) => Math.min(totalUnidades, p + 1))}
                                                            className={`p-1 flex items-center justify-center ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-300 text-gray-600'}`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            aria-label="Disminuir cantidad"
                                                            onClick={() => setCantidad((p) => Math.max(1, p - 1))}
                                                            className={`p-1 flex items-center justify-center border-t ${darkMode ? 'border-gray-600 hover:bg-gray-600 text-gray-300' : 'border-gray-400 hover:bg-gray-300 text-gray-600'}`}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {user && (
                                            <button
                                                type="button"
                                                disabled={togglingFavorito}
                                                onClick={() => {
                                                    if (!clave || togglingFavorito) return
                                                    setTogglingFavorito(true)
                                                    toggleFavorito(clave).finally(() => setTogglingFavorito(false))
                                                }}
                                                className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium border-2 transition-colors disabled:opacity-70 bg-red-600 hover:bg-red-700 border-red-600 hover:border-red-700 text-white whitespace-nowrap w-full sm:w-auto"
                                            >
                                                <span className={`flex items-center justify-center ${isFavorito(clave) ? 'flex-col gap-0.5' : ''}`}>
                                                    <Image
                                                        src="/Imagenes/icon_favoritos.png"
                                                        alt=""
                                                        width={20}
                                                        height={20}
                                                        className="object-contain brightness-0 invert shrink-0"
                                                    />
                                                    {isFavorito(clave) && (
                                                        <svg className="w-4 h-4 shrink-0 text-white" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                                                            <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                                        </svg>
                                                    )}
                                                </span>
                                                {togglingFavorito ? '…' : isFavorito(clave) ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                                            </button>
                                        )}
                                    </div>
                                    {/* Botones: Agregar al carrito arriba, Comprar ahora abajo */}
                                    <div className="flex flex-col gap-3 shrink-0">
                                    {isInCart(clave) ? (
                                        <Link
                                            href="/tienda/carrito"
                                            className={`py-3 px-4 rounded-lg font-semibold text-base text-center transition-colors whitespace-nowrap w-full sm:w-auto ${
                                                darkMode ? 'bg-emerald-700 hover:bg-emerald-600 text-white' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                            }`}
                                        >
                                            En el carrito
                                        </Link>
                                    ) : (
                                        <>
                                            <button
                                                disabled={addingCart}
                                                onClick={async () => {
                                                    if (!clave || addingCart) return
                                                    if (!enStock) {
                                                        setStockErrorModal('No hay stock disponible para este producto. No se puede agregar al carrito.')
                                                        return
                                                    }
                                                    if (cantidad > totalUnidades) {
                                                        setStockErrorModal(`La cantidad solicitada (${cantidad}) supera el stock disponible (${totalUnidades} unidades). No se puede agregar al carrito.`)
                                                        return
                                                    }
                                                    setAddingCart(true)
                                                    try {
                                                        await addToCarrito(clave, cantidad)
                                                    } finally {
                                                        setAddingCart(false)
                                                    }
                                                }}
                                                className={`py-3 px-4 rounded-lg font-semibold text-base transition-colors disabled:opacity-70 whitespace-nowrap w-full sm:w-auto ${
                                                    enStock ? 'bg-[#FF8000] hover:bg-[#e67300] text-white' : (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                                                }`}
                                            >
                                                {addingCart ? 'Agregando…' : enStock ? 'Agregar al carrito' : 'Sin stock'}
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
                                    <button
                                        type="button"
                                        disabled={!enStock}
                                        onClick={async () => {
                                            if (!clave || !enStock) return
                                            if (cantidad > totalUnidades) {
                                                setStockErrorModal(`La cantidad (${cantidad}) supera el stock (${totalUnidades}).`)
                                                return
                                            }
                                            setAddingCart(true)
                                            try {
                                                await addToCarrito(clave, cantidad)
                                                router.push('/tienda/carrito?pagar=1')
                                            } finally {
                                                setAddingCart(false)
                                            }
                                        }}
                                        className={`py-3 px-4 rounded-lg font-semibold text-base transition-colors whitespace-nowrap w-full sm:w-auto disabled:opacity-70 disabled:cursor-not-allowed ${
                                            enStock ? 'bg-[#FF8000] hover:bg-[#e67300] text-white' : (darkMode ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-500 cursor-not-allowed')
                                        }`}
                                    >
                                        Comprar ahora
                                    </button>
                                    </div>
                                </div>
                            </div>
                            {(producto.garantia || producto.clave || producto.codigo_fabricante) && (
                                <div className={`flex flex-col gap-1 pt-3 mt-3 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} xl:flex-row xl:items-center xl:gap-4`}>
                                    {producto.garantia && (
                                        <p className={`text-xs ${textMuted}`}><span className="font-medium">Garantía:</span> {producto.garantia}</p>
                                    )}
                                    {(producto.clave || producto.codigo_fabricante) && (
                                        <p className={`text-xs ${textMuted}`}>
                                            {producto.clave && <><span className="font-medium">Clave:</span> {producto.clave}</>}
                                            {producto.codigo_fabricante && <><span className="font-medium xl:ml-2">Cód. fabricante:</span> {producto.codigo_fabricante}</>}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Secciones inferiores: descripción, ficha técnica, info adicional */}
                <div className="space-y-6 mb-10">
                    {producto.ficha_comercial && (
                        <section className={`rounded-xl border p-4 sm:p-6 ${cardBg}`}>
                            <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Descripción</h2>
                            <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${textMuted}`}>{producto.ficha_comercial}</p>
                        </section>
                    )}
                    {producto.ficha_tecnica && (
                        <section className={`rounded-xl border p-4 sm:p-6 ${cardBg}`}>
                            <h2 className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Características / Ficha técnica</h2>
                            <p className={`text-sm sm:text-base leading-relaxed whitespace-pre-line ${textMuted}`}>{producto.ficha_tecnica}</p>
                        </section>
                    )}
                    {((producto.raw_data && Object.keys(producto.raw_data).length > 0) || (producto.especificaciones_tecnicas && Array.isArray(producto.especificaciones_tecnicas) && producto.especificaciones_tecnicas.length > 0) || (producto.dimensiones && Array.isArray(producto.dimensiones) && producto.dimensiones.length > 0)) && (() => {
                        // Campos propios del sistema/API que no se muestran en Información general
                        const CAMPOS_OCULTOS_GENERAL = ['id', 'requiere_serie', 'grupo', 'disponible', 'principal', 'brand_image', 'imagen', 'moneda', 'precio']
                        const esCampoOculto = (k) => CAMPOS_OCULTOS_GENERAL.includes(String(k).toLowerCase())
                        // Información general: raw_data sin objetos ni null y sin campos internos
                        const entradasGenerales = producto.raw_data
                            ? Object.entries(producto.raw_data).filter(([k, v]) => v != null && typeof v !== 'object' && !esCampoOculto(k))
                            : []
                        // Especificaciones técnicas: del endpoint informacion_tecnica de CVA
                        const especificaciones = Array.isArray(producto.especificaciones_tecnicas) ? producto.especificaciones_tecnicas : []
                        // Dimensiones: del endpoint dimensiones de CVA
                        const dimensiones = Array.isArray(producto.dimensiones) ? producto.dimensiones : []
                        if (entradasGenerales.length === 0 && especificaciones.length === 0 && dimensiones.length === 0) return null
                        // Formato de etiqueta: "marca" → "Marca", "CAPACIDAD DE POTENCIA" → "Capacidad de potencia"
                        const palabrasMinusculas = new Set(['de', 'del', 'la', 'el', 'y', 'a', 'e', 'o', 'u', 'en', 'con', 'al', 'los', 'las', 'un', 'una', 'por', 'para', 'al', 'da', 'do'])
                        const formatLabel = (str) => {
                            if (str == null || typeof str !== 'string') return ''
                            const limpio = String(str).replace(/_/g, ' ').trim()
                            return limpio.toLowerCase().split(/\s+/).map((palabra, i) => {
                                if (!palabra) return palabra
                                if (i > 0 && palabrasMinusculas.has(palabra.toLowerCase())) return palabra.toLowerCase()
                                return palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()
                            }).join(' ')
                        }
                        const resaltadoTitulo = `text-lg sm:text-xl border-l-4 border-[#FF8000] pl-3 sm:pl-5 font-bold ${darkMode ? 'text-[#FFB366] bg-gray-800/60' : 'text-[#CC6600] bg-amber-50'}`
                        const tablaInfoGeneral = (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className={darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'}>
                                            <th className="text-left font-semibold px-4 sm:px-6 py-3 border-b whitespace-nowrap" scope="col">Campo</th>
                                            <th className="text-left font-semibold px-4 sm:px-6 py-3 border-b" scope="col">Valor</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entradasGenerales.map(([k, v], i) => (
                                            <tr
                                                key={k}
                                                className={`border-b last:border-b-0 ${
                                                    darkMode ? `text-gray-300 border-gray-700 ${i % 2 === 1 ? 'bg-gray-800/30' : ''}` : `text-gray-800 border-gray-200 ${i % 2 === 1 ? 'bg-gray-50/80' : ''}`
                                                }`}
                                            >
                                                <td className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap align-top" style={{ width: '40%' }}>{formatLabel(k)}</td>
                                                <td className="px-4 sm:px-6 py-3 break-words">{String(v)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                        const renderTablaEspecificaciones = (especs, title, opts = {}) => (
                            especs.length > 0 && (
                                <>
                                    {!opts.hideTitle && (
                                        <h3 className={`px-4 sm:px-6 pt-4 pb-2 font-bold ${title === 'Dimensiones' ? resaltadoTitulo : `text-base ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}`}>{title}</h3>
                                    )}
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className={darkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'}>
                                                    <th className="text-left font-semibold px-4 sm:px-6 py-3 border-b whitespace-nowrap" scope="col">Campo</th>
                                                    <th className="text-left font-semibold px-4 sm:px-6 py-3 border-b" scope="col">Valor</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {especs.map((spec, i) => (
                                                    <tr
                                                        key={`${spec.nombre}-${i}`}
                                                        className={`border-b last:border-b-0 ${darkMode ? `text-gray-300 border-gray-700 ${i % 2 === 1 ? 'bg-gray-800/30' : ''}` : `text-gray-800 border-gray-200 ${i % 2 === 1 ? 'bg-gray-50/80' : ''}`}`}
                                                    >
                                                        <td className="px-4 sm:px-6 py-3 font-medium whitespace-nowrap align-top" style={{ width: '40%' }}>{formatLabel(spec.nombre)}</td>
                                                        <td className="px-4 sm:px-6 py-3 break-words">{String(spec.valor || '')}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )
                        )
                        const tieneGeneral = entradasGenerales.length > 0
                        const tieneEspecificaciones = especificaciones.length > 0 || dimensiones.length > 0
                        const btnBase = 'w-full flex items-center justify-between gap-2 text-left px-4 sm:px-6 py-3 border-b transition-colors'
                        const btnClassNeutral = darkMode ? 'text-white border-gray-700 hover:bg-gray-800/50' : 'text-gray-900 border-gray-200 hover:bg-gray-50'
                        const btnClassDesplegado = `border-l-4 border-[#FF8000] pl-3 sm:pl-5 font-bold ${darkMode ? 'text-[#FFB366] bg-gray-800/60 border-gray-700' : 'text-[#CC6600] bg-amber-50 border-amber-200'}`
                        const btnClass = (open) => `${btnBase} ${open ? btnClassDesplegado : btnClassNeutral}`
                        const chevron = (open) => (
                            <span className="shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </span>
                        )
                        return (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                                {tieneGeneral && (
                                    <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
                                        <button type="button" onClick={() => setInfoGeneralOpen((o) => !o)} className={btnClass(infoGeneralOpen)} aria-expanded={infoGeneralOpen}>
                                            <h2 className="text-lg font-bold">Información general</h2>
                                            {chevron(infoGeneralOpen)}
                                        </button>
                                        {infoGeneralOpen && <div className="pb-4">{tablaInfoGeneral}</div>}
                                    </section>
                                )}
                                {tieneEspecificaciones && (
                                    <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
                                        <button type="button" onClick={() => setEspecificacionesOpen((o) => !o)} className={btnClass(especificacionesOpen)} aria-expanded={especificacionesOpen}>
                                            <h2 className="text-lg font-bold">Especificaciones</h2>
                                            {chevron(especificacionesOpen)}
                                        </button>
                                        {especificacionesOpen && (
                                            <div className="pb-4">
                                                {renderTablaEspecificaciones(especificaciones, 'Especificaciones', { hideTitle: true })}
                                                {renderTablaEspecificaciones(dimensiones, 'Dimensiones')}
                                            </div>
                                        )}
                                    </section>
                                )}
                            </div>
                        )
                    })()}

                    {/* Carrusel horizontal: productos que te pueden interesar — se mueve lentamente a la derecha */}
                    {sugeridos.length > 0 && (
                        <section className={`rounded-xl border overflow-hidden ${cardBg}`}>
                            <h2 className={`text-lg font-bold px-4 sm:px-6 py-3 border-b ${darkMode ? 'text-white border-gray-700' : 'text-gray-900 border-gray-200'}`}>
                                Te puede interesar
                            </h2>
                            <div className="p-3 sm:p-4 overflow-hidden" aria-hidden="true">
                                <div className="flex gap-4 animate-carrusel-right pb-2" style={{ minHeight: '180px', width: 'max-content' }}>
                                    {[...sugeridos, ...sugeridos].map((p, i) => {
                                        const rawImg = p?.imagen || (Array.isArray(p?.imagenes) && p.imagenes[0])
                                        const img = rawImg ? resolveStorageUrl(rawImg) : FALLBACK_IMAGE
                                        const desc = (p?.descripcion || p?.clave || '').slice(0, 50)
                                        return (
                                            <Link
                                                key={`${p.clave}-${i}`}
                                                href={`/tienda/producto/${encodeURIComponent(p.clave)}`}
                                                className={`flex-shrink-0 w-[140px] sm:w-[160px] rounded-lg border overflow-hidden transition-all hover:shadow-lg hover:scale-[1.02] ${
                                                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                                                }`}
                                            >
                                                <div className="relative w-full aspect-square bg-gray-100 dark:bg-gray-700">
                                                    <Image
                                                        src={img}
                                                        alt={desc}
                                                        fill
                                                        className="object-contain p-2"
                                                        sizes="160px"
                                                        unoptimized={img.startsWith('http')}
                                                    />
                                                </div>
                                                <div className="p-2">
                                                    <p className={`text-xs font-medium line-clamp-2 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`} title={p?.descripcion}>
                                                        {desc}{desc.length >= 50 ? '…' : ''}
                                                    </p>
                                                    <p className="text-sm font-bold text-[#FF8000] mt-1">{formatPrecio(p?.precio, p?.moneda)}</p>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </div>
                        </section>
                    )}
                </div>

                <div className="flex justify-center">
                    <Link
                        href={returnUrl || '/tienda'}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium border transition-colors ${cardBg} ${linkHover}`}
                    >
                        ← Volver a la tienda
                    </Link>
                </div>
            </main>
        </div>
    )
}
