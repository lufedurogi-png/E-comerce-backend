'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/hooks/auth'
import Link from 'next/link'
import Image from 'next/image'
import Input from '@/components/Input'
import Label from '@/components/Label'
import Button from '@/components/Button'
import InputError from '@/components/InputError'
import axios from '@/lib/axios'
import { getCotizacionesGuardadas, getCotizacionesPapelera, moveCotizacionToPapelera, restoreCotizacionFromPapelera, updateCotizacionGuardada } from '@/lib/cotizaciones'
import { fetchCotizacionesGuardadas, fetchCotizacionesPapelera, moveCotizacionToPapeleraApi, restoreCotizacionFromPapeleraApi, updateCotizacionApi, isLoggedInUserId } from '@/lib/cotizacionesApi'
import { formatPrecio } from '@/lib/productos'
import CheckoutModal from '@/components/CheckoutModal'
import ChatVentasCliente from '@/components/ChatVentasCliente'

/** Ventana deslizante de 7 páginas + "..." + última página + ">>". currentPage y totalPages base 1. */
function getPaginationWindow(currentPage, totalPages) {
    const total = Math.max(1, totalPages)
    const current = Math.max(1, Math.min(currentPage, total))
    if (total <= 7) {
        return { windowPages: Array.from({ length: total }, (_, i) => i + 1), showEllipsis: false, showLastPage: false }
    }
    const startPage = Math.max(1, Math.min(current, total - 6))
    const endPage = Math.min(startPage + 6, total)
    const windowPages = []
    for (let p = startPage; p <= endPage; p++) windowPages.push(p)
    const showEllipsis = endPage < total - 1
    return { windowPages, showEllipsis, showLastPage: true }
}

const Dashboard = () => {
    const { user, logout } = useAuth({ middleware: 'auth' })
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('darkMode')
            return saved !== null ? JSON.parse(saved) : true
        }
        return true
    })
    const [userDropdownOpen, setUserDropdownOpen] = useState(false)
    const [activeTab, setActiveTab] = useState('pedidos')

    // Verificar si hay un query param para activar una pestaña específica
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            const tab = params.get('tab')
            if (tab && ['pedidos', 'contacto', 'facturacion', 'password', 'cotizaciones', 'chat'].includes(tab)) {
                setActiveTab(tab)
            }
        }
    }, [])
    const [hoveredTab, setHoveredTab] = useState(null)
    
    // Estados para MIS PEDIDOS
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')
    const [pagoFiltro, setPagoFiltro] = useState('todos')
    const [estatusFiltro, setEstatusFiltro] = useState('todos')
    const [folioBusqueda, setFolioBusqueda] = useState('')
    const [registrosPorPagina, setRegistrosPorPagina] = useState(3)
    const [paginaActual, setPaginaActual] = useState(1)
    
    // Estados para CAMBIAR CONTRASEÑA
    const [passwordActual, setPasswordActual] = useState('')
    const [nuevaPassword, setNuevaPassword] = useState('')
    const [repetirPassword, setRepetirPassword] = useState('')
    const [passwordErrors, setPasswordErrors] = useState({})
    const [showPasswordActual, setShowPasswordActual] = useState(false)
    const [showNuevaPassword, setShowNuevaPassword] = useState(false)
    const [showRepetirPassword, setShowRepetirPassword] = useState(false)
    const [showNuevaPasswordModal, setShowNuevaPasswordModal] = useState(false)
    const [showRepetirPasswordModal, setShowRepetirPasswordModal] = useState(false)

    // Pedidos desde API
    const [pedidosData, setPedidosData] = useState({ pedidos: [], total: 0, per_page: 3, current_page: 1, last_page: 1 })
    const [loadingPedidos, setLoadingPedidos] = useState(true)
    const [downloadingPdfId, setDownloadingPdfId] = useState(null)
    const [detallePedidoId, setDetallePedidoId] = useState(null)
    const [detallePedido, setDetallePedido] = useState(null)
    const [papeleraOpen, setPapeleraOpen] = useState(false)
    const [papeleraPedidos, setPapeleraPedidos] = useState([])
    const [loadingPapelera, setLoadingPapelera] = useState(false)
    const [confirmPapeleraPedidoId, setConfirmPapeleraPedidoId] = useState(null)
    const [showPapeleraVaciaModal, setShowPapeleraVaciaModal] = useState(false)

    // Contacto / Envío (direcciones)
    const [direcciones, setDirecciones] = useState([])
    const [loadingDirecciones, setLoadingDirecciones] = useState(false)
    const [direccionesLoadedOnce, setDireccionesLoadedOnce] = useState(false)
    const [contactoModal, setContactoModal] = useState(null)
    const [contactoEditId, setContactoEditId] = useState(null)
    const [contactoForm, setContactoForm] = useState({ nombre: '', calle: '', numero_exterior: '', numero_interior: '', colonia: '', ciudad: '', estado: '', codigo_postal: '', referencias: '', telefono: '', es_principal: false })
    const [contactoErrors, setContactoErrors] = useState({})
    const [contactoRequiredInvalid, setContactoRequiredInvalid] = useState({})
    const [contactoSubmitting, setContactoSubmitting] = useState(false)
    const [contactoDeleteId, setContactoDeleteId] = useState(null)
    const [principalTooltipId, setPrincipalTooltipId] = useState(null)
    const [contactoPaginaActual, setContactoPaginaActual] = useState(1)
    const CONTACTO_POR_PAGINA = 3

    // Datos facturación
    const [datosFacturacion, setDatosFacturacion] = useState([])
    const [loadingFacturacion, setLoadingFacturacion] = useState(false)
    const [facturacionLoadedOnce, setFacturacionLoadedOnce] = useState(false)
    const [facturacionModal, setFacturacionModal] = useState(null)
    const [facturacionEditId, setFacturacionEditId] = useState(null)
    const [facturacionForm, setFacturacionForm] = useState({ razon_social: '', rfc: '', calle: '', numero_exterior: '', numero_interior: '', colonia: '', ciudad: '', estado: '', codigo_postal: '', email_facturacion: '', telefono: '', es_principal: false })
    const [facturacionErrors, setFacturacionErrors] = useState({})
    const [facturacionSubmitting, setFacturacionSubmitting] = useState(false)
    const [facturacionDeleteId, setFacturacionDeleteId] = useState(null)
    const [facturacionRequiredInvalid, setFacturacionRequiredInvalid] = useState({})
    const [facturacionPaginaActual, setFacturacionPaginaActual] = useState(1)
    const FACTURACION_POR_PAGINA = 3
    const [facturacionPrincipalTooltipId, setFacturacionPrincipalTooltipId] = useState(null)

    const fetchPedidos = useCallback(async (silent = false) => {
        if (!silent) setLoadingPedidos(true)
        try {
            const params = new URLSearchParams()
            if (fechaDesde) params.set('fecha_desde', fechaDesde)
            if (fechaHasta) params.set('fecha_hasta', fechaHasta)
            if (pagoFiltro !== 'todos') params.set('pago', pagoFiltro)
            if (estatusFiltro !== 'todos') params.set('estatus', estatusFiltro)
            if (folioBusqueda.trim()) params.set('folio', folioBusqueda.trim())
            params.set('per_page', registrosPorPagina)
            params.set('page', paginaActual)
            const { data } = await axios.get(`/pedidos?${params}`)
            if (data.success && data.data) {
                setPedidosData({
                    pedidos: data.data.pedidos || [],
                    total: data.data.total ?? 0,
                    per_page: data.data.per_page ?? 3,
                    current_page: data.data.current_page ?? 1,
                    last_page: data.data.last_page ?? 1,
                })
            }
        } catch (e) {
            setPedidosData({ pedidos: [], total: 0, per_page: 3, current_page: 1, last_page: 1 })
        } finally {
            if (!silent) setLoadingPedidos(false)
        }
    }, [fechaDesde, fechaHasta, pagoFiltro, estatusFiltro, folioBusqueda, registrosPorPagina, paginaActual])

    const fetchDirecciones = useCallback(async (silent = false) => {
        if (!silent) setLoadingDirecciones(true)
        try {
            const { data } = await axios.get('/direcciones-envio')
            setDirecciones(data.success && data.data ? data.data : [])
            setDireccionesLoadedOnce(true)
        } catch {
            setDirecciones([])
        } finally {
            if (!silent) setLoadingDirecciones(false)
        }
    }, [])

    const fetchDatosFacturacion = useCallback(async (silent = false) => {
        if (!silent) setLoadingFacturacion(true)
        try {
            const { data } = await axios.get('/datos-facturacion')
            setDatosFacturacion(data.success && data.data ? data.data : [])
            setFacturacionLoadedOnce(true)
        } catch {
            setDatosFacturacion([])
        } finally {
            if (!silent) setLoadingFacturacion(false)
        }
    }, [])

    const contactoFormDefault = { nombre: '', calle: '', numero_exterior: '', numero_interior: '', colonia: '', ciudad: '', estado: '', codigo_postal: '', referencias: '', telefono: '', es_principal: false }
    const facturacionFormDefault = { razon_social: '', rfc: '', calle: '', numero_exterior: '', numero_interior: '', colonia: '', ciudad: '', estado: '', codigo_postal: '', email_facturacion: '', telefono: '', es_principal: false }

    const openContactoCreate = () => {
        setContactoEditId(null)
        setContactoForm(contactoFormDefault)
        setContactoErrors({})
        setContactoRequiredInvalid({})
        setContactoModal(true)
    }
    const openContactoEdit = (c) => {
        setContactoEditId(c.id)
        setContactoForm({ nombre: c.nombre || '', calle: c.calle || '', numero_exterior: c.numero_exterior || '', numero_interior: c.numero_interior || '', colonia: c.colonia || '', ciudad: c.ciudad_nombre || c.ciudad || '', estado: c.estado || '', codigo_postal: c.codigo_postal || '', referencias: c.referencias || '', telefono: c.telefono || '', es_principal: !!c.es_principal })
        setContactoErrors({})
        setContactoRequiredInvalid({})
        setContactoModal(true)
    }
    const closeContactoModal = () => { setContactoModal(null); setContactoEditId(null); setContactoErrors({}); setContactoRequiredInvalid({}) }

    const CONTACTO_REQUIRED_KEYS = ['nombre', 'telefono', 'calle', 'numero_exterior', 'colonia', 'ciudad', 'estado', 'codigo_postal']
    const handleContactoSubmit = async (e) => {
        e.preventDefault()
        setContactoErrors({})
        const invalid = {}
        for (const key of CONTACTO_REQUIRED_KEYS) {
            if (!String(contactoForm[key] ?? '').trim()) invalid[key] = true
        }
        if (Object.keys(invalid).length > 0) {
            setContactoRequiredInvalid(invalid)
            const errs = {}
            for (const k of Object.keys(invalid)) errs[k] = ['Este campo es obligatorio.']
            setContactoErrors(errs)
            return
        }
        setContactoRequiredInvalid({})
        setContactoSubmitting(true)
        try {
            const payload = { ...contactoForm, es_principal: !!contactoForm.es_principal }
            if (contactoEditId) {
                await axios.put(`/direcciones-envio/${contactoEditId}`, payload)
            } else {
                await axios.post('/direcciones-envio', payload)
            }
            closeContactoModal()
            fetchDirecciones(true)
        } catch (err) {
            setContactoErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Error al guardar'] })
        } finally {
            setContactoSubmitting(false)
        }
    }
    const clearContactoRequiredInvalid = (key) => {
        setContactoRequiredInvalid(prev => { const next = { ...prev }; delete next[key]; return next })
    }

    const handleContactoDelete = async (id) => {
        try {
            await axios.delete(`/direcciones-envio/${id}`)
            setContactoDeleteId(null)
            fetchDirecciones(true)
        } catch {
            /* ignore */
        }
    }

    const handleSetPrincipal = async (id, esPrincipal) => {
        try {
            await axios.put(`/direcciones-envio/${id}`, { es_principal: esPrincipal })
            fetchDirecciones(true)
        } catch {
            /* ignore */
        }
    }

    const openFacturacionCreate = () => {
        setFacturacionEditId(null)
        setFacturacionForm(facturacionFormDefault)
        setFacturacionErrors({})
        setFacturacionRequiredInvalid({})
        setFacturacionModal(true)
    }
    const openFacturacionEdit = (d) => {
        setFacturacionEditId(d.id)
        setFacturacionForm({ razon_social: d.razon_social || '', rfc: d.rfc || '', calle: d.calle || '', numero_exterior: d.numero_exterior || '', numero_interior: d.numero_interior || '', colonia: d.colonia || '', ciudad: d.ciudad || '', estado: d.estado || '', codigo_postal: d.codigo_postal || '', email_facturacion: d.email_facturacion || '', telefono: d.telefono || '', es_principal: !!d.es_principal })
        setFacturacionErrors({})
        setFacturacionRequiredInvalid({})
        setFacturacionModal(true)
    }
    const closeFacturacionModal = () => { setFacturacionModal(null); setFacturacionEditId(null); setFacturacionErrors({}); setFacturacionRequiredInvalid({}) }

    const FACTURACION_REQUIRED_KEYS = ['razon_social', 'rfc', 'calle', 'numero_exterior', 'colonia', 'ciudad', 'estado', 'codigo_postal']
    const handleFacturacionSubmit = async (e) => {
        e.preventDefault()
        setFacturacionErrors({})
        const invalid = {}
        for (const key of FACTURACION_REQUIRED_KEYS) {
            if (!String(facturacionForm[key] ?? '').trim()) invalid[key] = true
        }
        if (Object.keys(invalid).length > 0) {
            setFacturacionRequiredInvalid(invalid)
            const errs = {}
            for (const k of Object.keys(invalid)) errs[k] = ['Este campo es obligatorio.']
            setFacturacionErrors(errs)
            return
        }
        setFacturacionRequiredInvalid({})
        setFacturacionSubmitting(true)
        try {
            const payload = { ...facturacionForm, es_principal: !!facturacionForm.es_principal }
            if (facturacionEditId) {
                await axios.put(`/datos-facturacion/${facturacionEditId}`, payload)
            } else {
                await axios.post('/datos-facturacion', payload)
            }
            closeFacturacionModal()
            fetchDatosFacturacion(true)
        } catch (err) {
            setFacturacionErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Error al guardar'] })
        } finally {
            setFacturacionSubmitting(false)
        }
    }
    const clearFacturacionRequiredInvalid = (key) => {
        setFacturacionRequiredInvalid(prev => { const next = { ...prev }; delete next[key]; return next })
    }

    const handleSetFacturacionPrincipal = async (id, esPrincipal) => {
        try {
            await axios.put(`/datos-facturacion/${id}`, { es_principal: esPrincipal })
            fetchDatosFacturacion(true)
        } catch {
            /* ignore */
        }
    }

    const handleFacturacionDelete = async (id) => {
        try {
            await axios.delete(`/datos-facturacion/${id}`)
            setFacturacionDeleteId(null)
            fetchDatosFacturacion(true)
        } catch {
            /* ignore */
        }
    }

    useEffect(() => {
        setPaginaActual(1)
    }, [fechaDesde, fechaHasta, pagoFiltro, estatusFiltro, folioBusqueda])

    useEffect(() => {
        fetchPedidos()
    }, [fetchPedidos])

    // Prefetch de otras pestañas para que el cambio de tab sea instantáneo
    useEffect(() => {
        fetchDirecciones(true)
        fetchDatosFacturacion(true)
    }, [fetchDirecciones, fetchDatosFacturacion])

    useEffect(() => {
        if (activeTab !== 'contacto') return
        setContactoPaginaActual(1)
        fetchDirecciones(direccionesLoadedOnce)
    }, [activeTab, direccionesLoadedOnce, fetchDirecciones])

    useEffect(() => {
        if (activeTab !== 'facturacion') return
        setFacturacionPaginaActual(1)
        fetchDatosFacturacion(facturacionLoadedOnce)
    }, [activeTab, facturacionLoadedOnce, fetchDatosFacturacion])

    const POLL_MS = 5_000

    useEffect(() => {
        if (activeTab !== 'pedidos') return
        const id = setInterval(() => fetchPedidos(true), POLL_MS)
        return () => clearInterval(id)
    }, [activeTab, fetchPedidos])

    useEffect(() => {
        if (activeTab !== 'contacto') return
        const id = setInterval(() => fetchDirecciones(true), POLL_MS)
        return () => clearInterval(id)
    }, [activeTab, fetchDirecciones])

    useEffect(() => {
        if (activeTab !== 'facturacion') return
        const id = setInterval(() => fetchDatosFacturacion(true), POLL_MS)
        return () => clearInterval(id)
    }, [activeTab, fetchDatosFacturacion])

    useEffect(() => {
        if (!detallePedidoId) {
            setDetallePedido(null)
            return
        }
        axios.get(`/pedidos/${detallePedidoId}`).then(({ data }) => {
            if (data?.success && data?.data) setDetallePedido(data.data)
            else setDetallePedido(null)
        }).catch(() => setDetallePedido(null))
    }, [detallePedidoId])

    const handleDescargarPdf = async (id, folio) => {
        setDownloadingPdfId(id)
        try {
            const { data } = await axios.get(`/pedidos/${id}/pdf`, { responseType: 'blob' })
            const url = URL.createObjectURL(data)
            const a = document.createElement('a')
            a.href = url
            a.download = `pedido-${folio}.pdf`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            /* ignore */
        } finally {
            setDownloadingPdfId(null)
        }
    }

    const loadPapelera = useCallback(async () => {
        setLoadingPapelera(true)
        try {
            const { data } = await axios.get('/pedidos/papelera')
            const lista = data?.success && data?.data?.pedidos ? data.data.pedidos : []
            setPapeleraPedidos(lista)
            return lista
        } catch {
            setPapeleraPedidos([])
            return []
        } finally {
            setLoadingPapelera(false)
        }
    }, [])

    const handleMoverAPapelera = async (pedidoId) => {
        // Optimista: quitar de la lista al instante
        setPedidosData((prev) => ({
            ...prev,
            pedidos: prev.pedidos.filter((p) => p.id !== pedidoId),
            total: Math.max(0, (prev.total || 0) - 1),
        }))
        try {
            await axios.delete(`/pedidos/${pedidoId}`)
        } catch (e) {
            const msg = e?.response?.data?.message || 'No se pudo mover a papelera.'
            fetchPedidos(true)
            alert(msg)
        }
    }

    const handleRestaurar = async (pedidoId) => {
        // Optimista: quitar de papelera al instante
        setPapeleraPedidos((prev) => prev.filter((p) => p.id !== pedidoId))
        try {
            await axios.post(`/pedidos/${pedidoId}/restore`)
            fetchPedidos(true)
        } catch (e) {
            const msg = e?.response?.data?.message || 'No se pudo restaurar.'
            loadPapelera()
            alert(msg)
        }
    }

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        if (!papeleraOpen) return
        const onEscape = (e) => { if (e.key === 'Escape') setPapeleraOpen(false) }
        window.addEventListener('keydown', onEscape)
        return () => window.removeEventListener('keydown', onEscape)
    }, [papeleraOpen])

    useEffect(() => {
        if (confirmPapeleraPedidoId == null) return
        const onEscape = (e) => { if (e.key === 'Escape') setConfirmPapeleraPedidoId(null) }
        window.addEventListener('keydown', onEscape)
        return () => window.removeEventListener('keydown', onEscape)
    }, [confirmPapeleraPedidoId])

    useEffect(() => {
        if (!showPapeleraVaciaModal) return
        const onEscape = (e) => { if (e.key === 'Escape') setShowPapeleraVaciaModal(false) }
        window.addEventListener('keydown', onEscape)
        return () => window.removeEventListener('keydown', onEscape)
    }, [showPapeleraVaciaModal])

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'darkMode') {
                const newMode = JSON.parse(e.newValue)
                setDarkMode(newMode)
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userDropdownOpen && !event.target.closest('.relative')) {
                setUserDropdownOpen(false)
            }
        }
        if (userDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [userDropdownOpen])

    if (!user) {
        return null
    }

    const { pedidos, total, per_page, current_page, last_page } = pedidosData
    const tabs = [
        { id: 'pedidos', label: 'Mis pedidos', icon: 'icon_pedidos.png' },
        { id: 'cotizaciones', label: 'Mis cotizaciones', icon: 'icon_pedidos.png' },
        { id: 'contacto', label: 'Contacto / Envío', icon: 'icon_contacto.png' },
        { id: 'facturacion', label: 'Datos de facturación', icon: 'icon_facturacion.webp' },
        { id: 'chat', label: 'Chat con ventas', icon: 'icon_mensaje.png' },
        { id: 'password', label: 'Cambiar contraseña', icon: 'icon_contraseña.webp' }
    ]

    const [cotizacionesGuardadas, setCotizacionesGuardadas] = useState([])
    const [loadingCotizaciones, setLoadingCotizaciones] = useState(false)
    const [cotizacionVerProductosId, setCotizacionVerProductosId] = useState(null)
    const [originalCotizaciones, setOriginalCotizaciones] = useState({})
    const [papeleraCotizacionesOpen, setPapeleraCotizacionesOpen] = useState(false)
    const [papeleraCotizaciones, setPapeleraCotizaciones] = useState([])
    const [loadingPapeleraCotizaciones, setLoadingPapeleraCotizaciones] = useState(false)
    const [confirmEliminarCotizacionId, setConfirmEliminarCotizacionId] = useState(null)
    const [showPapeleraCotizacionesVaciaModal, setShowPapeleraCotizacionesVaciaModal] = useState(false)
    const [pagarCotizacionModalOpen, setPagarCotizacionModalOpen] = useState(false)
    const [checkoutCotizacionLoading, setCheckoutCotizacionLoading] = useState(false)
    const [checkoutCotizacionError, setCheckoutCotizacionError] = useState(null)
    const [metodoPagoCotizacion, setMetodoPagoCotizacion] = useState('Efectivo')
    const [cotizacionPaginaActual, setCotizacionPaginaActual] = useState(1)
    const COTIZACION_POR_PAGINA = 3

    const METODOS_PAGO_COTIZACION = [
        { value: 'Efectivo', label: 'Efectivo' },
        { value: 'Transferencia', label: 'Transferencia' },
        { value: 'Tarjeta', label: 'Tarjeta' },
        { value: 'Otro', label: 'Otro' },
    ]

    const hasUnsavedChangesCotizacion = useCallback((cot) => {
        const orig = originalCotizaciones[cot.id]
        if (!orig) return false
        const items = cot.items || []
        const origItems = orig.items || []
        if (items.length !== origItems.length) return true
        if (Math.abs((cot.total ?? 0) - (orig.total ?? 0)) > 0.01) return true
        for (let i = 0; i < items.length; i++) {
            if (items[i].clave !== origItems[i].clave || Number(items[i].cantidad) !== Number(origItems[i].cantidad)) return true
        }
        return false
    }, [originalCotizaciones])

    useEffect(() => {
        if (activeTab === 'cotizaciones') {
            setCotizacionPaginaActual(1)
            if (typeof window === 'undefined') return
            if (isLoggedInUserId(user?.id)) {
                setLoadingCotizaciones(true)
                fetchCotizacionesGuardadas()
                    .then(setCotizacionesGuardadas)
                    .catch(() => setCotizacionesGuardadas([]))
                    .finally(() => setLoadingCotizaciones(false))
            } else {
                setCotizacionesGuardadas(getCotizacionesGuardadas(user?.id))
            }
        }
    }, [activeTab, user?.id])

    useEffect(() => {
        setOriginalCotizaciones((prev) => {
            const next = { ...prev }
            cotizacionesGuardadas.forEach((c) => {
                if (!(c.id in next)) {
                    next[c.id] = { items: JSON.parse(JSON.stringify(c.items || [])), total: c.total ?? 0 }
                }
            })
            return next
        })
    }, [cotizacionesGuardadas])

    const loadPapeleraCotizaciones = useCallback(async () => {
        if (isLoggedInUserId(user?.id)) {
            setLoadingPapeleraCotizaciones(true)
            try {
                const lista = await fetchCotizacionesPapelera()
                setPapeleraCotizaciones(lista)
                return lista
            } catch {
                setPapeleraCotizaciones([])
                return []
            } finally {
                setLoadingPapeleraCotizaciones(false)
            }
        } else {
            const lista = getCotizacionesPapelera(user?.id)
            setPapeleraCotizaciones(lista)
            return lista
        }
    }, [user?.id])

    const handleMoverCotizacionAPapelera = useCallback(async (id) => {
        setCotizacionesGuardadas((prev) => prev.filter((c) => c.id !== id))
        setOriginalCotizaciones((prev) => {
            const next = { ...prev }
            delete next[id]
            return next
        })
        if (isLoggedInUserId(user?.id)) {
            try {
                await moveCotizacionToPapeleraApi(id)
            } catch {
                const lista = await fetchCotizacionesGuardadas()
                setCotizacionesGuardadas(lista)
            }
        } else if (!moveCotizacionToPapelera(id, user?.id)) {
            setCotizacionesGuardadas(getCotizacionesGuardadas(user?.id))
        }
    }, [user?.id])

    const handleRestaurarCotizacion = useCallback(async (id) => {
        setPapeleraCotizaciones((prev) => prev.filter((c) => c.id !== id))
        if (isLoggedInUserId(user?.id)) {
            try {
                await restoreCotizacionFromPapeleraApi(id)
                const [guardadas, papelera] = await Promise.all([fetchCotizacionesGuardadas(), fetchCotizacionesPapelera()])
                setCotizacionesGuardadas(guardadas)
                setPapeleraCotizaciones(papelera)
            } catch {
                const papelera = await fetchCotizacionesPapelera()
                setPapeleraCotizaciones(papelera)
            }
        } else if (restoreCotizacionFromPapelera(id, user?.id)) {
            setCotizacionesGuardadas(getCotizacionesGuardadas(user?.id))
        } else {
            setPapeleraCotizaciones(getCotizacionesPapelera(user?.id))
        }
    }, [user?.id])

    useEffect(() => {
        if (confirmEliminarCotizacionId == null) return
        const onEscape = (e) => { if (e.key === 'Escape') setConfirmEliminarCotizacionId(null) }
        window.addEventListener('keydown', onEscape)
        return () => window.removeEventListener('keydown', onEscape)
    }, [confirmEliminarCotizacionId])

    useEffect(() => {
        if (!papeleraCotizacionesOpen) return
        const onEscape = (e) => { if (e.key === 'Escape') setPapeleraCotizacionesOpen(false) }
        window.addEventListener('keydown', onEscape)
        return () => window.removeEventListener('keydown', onEscape)
    }, [papeleraCotizacionesOpen])

    useEffect(() => {
        if (!showPapeleraCotizacionesVaciaModal) return
        const onEscape = (e) => { if (e.key === 'Escape') setShowPapeleraCotizacionesVaciaModal(false) }
        window.addEventListener('keydown', onEscape)
        return () => window.removeEventListener('keydown', onEscape)
    }, [showPapeleraCotizacionesVaciaModal])

    const [passwordSuccess, setPasswordSuccess] = useState(false)

    const handleCambiarPassword = async (e) => {
        e.preventDefault()
        setPasswordErrors({})
        setPasswordSuccess(false)
        if (nuevaPassword !== repetirPassword) {
            setPasswordErrors({ repetirPassword: ['Las contraseñas no coinciden'] })
            return
        }
        try {
            await axios.put('/auth/password', {
                current_password: passwordActual,
                password: nuevaPassword,
                password_confirmation: repetirPassword,
            })
            setPasswordActual('')
            setNuevaPassword('')
            setRepetirPassword('')
            setPasswordSuccess(true)
            setTimeout(() => setPasswordSuccess(false), 4000)
        } catch (err) {
            const E = err.response?.data?.errors || {}
            setPasswordErrors(E)
        }
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            {/* Header */}
            <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
                darkMode ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' : 'bg-white/95 backdrop-blur-sm border-gray-200'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center">
                            <Image
                                src="/Imagenes/logo_en.png"
                                alt="NXT.IT"
                                width={120}
                                height={40}
                                className="h-8 w-auto"
                            />
                        </Link>
                        <div className="flex items-center space-x-4">
                            {/* Toggle Modo Oscuro/Claro */}
                            <div className="flex items-center space-x-2">
                                <div className="relative w-5 h-5">
                                    <Image
                                        src="/Imagenes/icon_modo.webp"
                                        alt="Modo"
                                        width={20}
                                        height={20}
                                        className={`object-contain transition-all duration-300 ${
                                            darkMode 
                                                ? 'brightness-0 invert' 
                                                : ''
                                        }`}
                                    />
                                </div>
                                <button
                                    onClick={() => {
                                        const newMode = !darkMode
                                        setDarkMode(newMode)
                                        localStorage.setItem('darkMode', JSON.stringify(newMode))
                                        window.dispatchEvent(new CustomEvent('darkModeChange', { detail: newMode }))
                                    }}
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${
                                        darkMode 
                                            ? 'bg-[#2b4e94]' 
                                            : 'bg-gray-300'
                                    }`}
                                    aria-label="Toggle dark mode"
                                >
                                    <span
                                        className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ${
                                            darkMode ? 'translate-x-8' : 'translate-x-1'
                                        }`}
                                    />
                                </button>
                                <span className={`text-xs font-medium ${
                                    darkMode ? 'text-[#FF8000]' : 'text-gray-500'
                                }`}>
                                    {darkMode ? 'Oscuro' : 'Claro'}
                                </span>
                            </div>
                            <Link
                                href="/tienda"
                                className={`transition-colors font-medium ${
                                    darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'
                                }`}
                            >
                                Tienda
                            </Link>
                            
                            {/* Dropdown del Usuario */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                                    className={`flex items-center space-x-2 transition-colors font-medium ${
                                        darkMode ? 'text-gray-300 hover:text-[#FF8000]' : 'text-gray-700 hover:text-[#FF8000]'
                                    }`}
                                >
                                    <span>{user?.name || user?.email}</span>
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-200 ${
                                            userDropdownOpen ? 'rotate-180' : ''
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {userDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setUserDropdownOpen(false)}
                                        />
                                        <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg border z-20 ${
                                            darkMode 
                                                ? 'bg-gray-800 border-gray-700' 
                                                : 'bg-white border-gray-200'
                                        }`}>
                                            <div className="py-1">
                                                <Link
                                                    href="/dashboard"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                                                        darkMode
                                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-[#FF8000]'
                                                            : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]'
                                                    }`}
                                                >
                                                    <div className="relative w-5 h-5 mr-3">
                                                        <Image
                                                            src="/Imagenes/icon_home.webp"
                                                            alt="Home"
                                                            fill
                                                            className={`object-contain transition-all duration-300 ${
                                                                darkMode ? 'brightness-0 invert' : ''
                                                            }`}
                                                        />
                                                    </div>
                                                    Home
                                                </Link>
                                                <Link
                                                    href="/dashboard?tab=pedidos"
                                                    onClick={() => {
                                                        setUserDropdownOpen(false)
                                                        setActiveTab('pedidos')
                                                    }}
                                                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                                                        darkMode
                                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-[#FF8000]'
                                                            : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]'
                                                    }`}
                                                >
                                                    <div className="relative w-5 h-5 mr-3">
                                                        <Image
                                                            src="/Imagenes/icon_pedidos.png"
                                                            alt="Mis pedidos"
                                                            fill
                                                            className={`object-contain transition-all duration-300 ${
                                                                darkMode ? 'brightness-0 invert' : ''
                                                            }`}
                                                        />
                                                    </div>
                                                    Mis pedidos
                                                </Link>
                                                <Link
                                                    href="/favoritos"
                                                    onClick={() => setUserDropdownOpen(false)}
                                                    className={`flex items-center px-4 py-2 text-sm transition-colors ${
                                                        darkMode
                                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-[#FF8000]'
                                                            : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]'
                                                    }`}
                                                >
                                                    <div className="relative w-5 h-5 mr-3">
                                                        <Image
                                                            src="/Imagenes/icon_favoritos.png"
                                                            alt="Favoritos"
                                                            fill
                                                            className={`object-contain transition-all duration-300 ${
                                                                darkMode ? 'brightness-0 invert' : ''
                                                            }`}
                                                        />
                                                    </div>
                                                    Favoritos
                                                </Link>
                                                <button
                                                    onClick={() => {
                                                        setUserDropdownOpen(false)
                                                        logout()
                                                    }}
                                                    className={`w-full flex items-center px-4 py-2 text-sm transition-colors ${
                                                        darkMode
                                                            ? 'text-gray-300 hover:bg-gray-700 hover:text-[#FF8000]'
                                                            : 'text-gray-700 hover:bg-gray-100 hover:text-[#FF8000]'
                                                    }`}
                                                >
                                                    <div className="relative w-5 h-5 mr-3">
                                                        <Image
                                                            src="/Imagenes/icon_cerrar_sesion.webp"
                                                            alt="Cerrar sesión"
                                                            fill
                                                            className={`object-contain transition-all duration-300 ${
                                                                darkMode ? 'brightness-0 invert' : ''
                                                            }`}
                                                        />
                                                    </div>
                                                    Cerrar
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="flex-1 p-8">
                <div className="max-w-7xl mx-auto">
                    {/* Tabs Navigation */}
                    <div className={`mb-8 border-b-2 transition-colors duration-300 ${
                        darkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                        <div className="flex space-x-2 md:space-x-6 lg:space-x-8">
                            {tabs.map((tab) => {
                                const isActive = activeTab === tab.id
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        onMouseEnter={() => setHoveredTab(tab.id)}
                                        onMouseLeave={() => setHoveredTab(null)}
                                        className={`group flex flex-col items-center pb-4 px-3 md:px-4 transition-all duration-300 relative ${
                                            isActive
                                                ? darkMode
                                                    ? 'text-white'
                                                    : 'text-gray-900'
                                                : darkMode
                                                    ? 'text-gray-400 hover:text-gray-200'
                                                    : 'text-gray-500 hover:text-gray-800'
                                        }`}
                                    >
                                        {/* Icono con cambio de color y efecto de grosor */}
                                        <div className={`relative w-8 h-8 md:w-10 md:h-10 mb-2 transition-all duration-300 ${
                                            isActive 
                                                ? 'scale-110' 
                                                : 'group-hover:scale-105'
                                        }`}>
                                            <div className="relative w-full h-full flex items-center justify-center">
                                                <Image
                                                    src={`/Imagenes/${tab.icon}`}
                                                    alt={tab.label}
                                                    fill
                                                    className="object-contain transition-all duration-300"
                                                    style={{
                                                        filter: isActive || hoveredTab === tab.id
                                                            ? 'brightness(0) saturate(100%) invert(58%) sepia(93%) saturate(1352%) hue-rotate(0deg) brightness(104%) contrast(101%) drop-shadow(0.5px 0 0.8px currentColor) drop-shadow(-0.5px 0 0.8px currentColor) drop-shadow(0 0.5px 0.8px currentColor) drop-shadow(0 -0.5px 0.8px currentColor) drop-shadow(0.5px 0.5px 0.8px currentColor) drop-shadow(-0.5px -0.5px 0.8px currentColor) drop-shadow(0.5px -0.5px 0.8px currentColor) drop-shadow(-0.5px 0.5px 0.8px currentColor)'
                                                            : darkMode
                                                                ? 'brightness(0) invert(1) opacity(0.5) drop-shadow(0.3px 0 0.5px rgba(255,255,255,0.6)) drop-shadow(-0.3px 0 0.5px rgba(255,255,255,0.6)) drop-shadow(0 0.3px 0.5px rgba(255,255,255,0.6)) drop-shadow(0 -0.3px 0.5px rgba(255,255,255,0.6))'
                                                                : 'opacity(0.5) drop-shadow(0.3px 0 0.5px rgba(0,0,0,0.4)) drop-shadow(-0.3px 0 0.5px rgba(0,0,0,0.4)) drop-shadow(0 0.3px 0.5px rgba(0,0,0,0.4)) drop-shadow(0 -0.3px 0.5px rgba(0,0,0,0.4))'
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <span className={`text-xs md:text-sm font-medium transition-all duration-300 ${
                                            isActive 
                                                ? 'font-bold scale-105' 
                                                : 'group-hover:font-semibold'
                                        }`}>
                                            {tab.label}
                                        </span>
                                        {/* Línea activa con efecto */}
                                        {isActive && (
                                            <>
                                                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF8000] via-[#FF9500] to-[#FF8000] rounded-t-full shadow-lg shadow-[#FF8000]/50"></div>
                                                <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-[#FF8000] blur-sm"></div>
                                            </>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Contenido de Tabs */}
                    <div className="mt-8">
                        {/* Tab: MIS PEDIDOS */}
                        {activeTab === 'pedidos' && (
                            <div className={`rounded-xl shadow-2xl p-6 md:p-8 border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                                darkMode 
                                    ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700 shadow-[#FF8000]/10' 
                                    : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 shadow-[#FF8000]/5'
                            }`}>
                                {/* Filtros */}
                                <div className="mb-6 space-y-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                        <div className="transform transition-all duration-300 hover:scale-105">
                                            <Label className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                                Desde
                                            </Label>
                                            <Input
                                                type="date"
                                                value={fechaDesde}
                                                onChange={(e) => setFechaDesde(e.target.value)}
                                                className={`mt-1 w-full transition-all duration-300 focus:ring-2 focus:ring-[#FF8000] focus:border-[#FF8000] ${
                                                    darkMode 
                                                        ? 'bg-gray-700/80 border-gray-600 text-white hover:bg-gray-700' 
                                                        : 'bg-white border-gray-300 hover:border-gray-400'
                                                }`}
                                            />
                                        </div>
                                        <div className="transform transition-all duration-300 hover:scale-105">
                                            <Label className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                                Hasta
                                            </Label>
                                            <Input
                                                type="date"
                                                value={fechaHasta}
                                                onChange={(e) => setFechaHasta(e.target.value)}
                                                className={`mt-1 w-full transition-all duration-300 focus:ring-2 focus:ring-[#FF8000] focus:border-[#FF8000] ${
                                                    darkMode 
                                                        ? 'bg-gray-700/80 border-gray-600 text-white hover:bg-gray-700' 
                                                        : 'bg-white border-gray-300 hover:border-gray-400'
                                                }`}
                                            />
                                        </div>
                                        <div className="transform transition-all duration-300 hover:scale-105">
                                            <Label className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                                Pago
                                            </Label>
                                            <select
                                                value={pagoFiltro}
                                                onChange={(e) => setPagoFiltro(e.target.value)}
                                                className={`mt-1 w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-[#FF8000] focus:border-[#FF8000] ${
                                                    darkMode 
                                                        ? 'bg-gray-700/80 border-gray-600 text-white hover:bg-gray-700' 
                                                        : 'bg-white border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                <option value="todos">Todos</option>
                                                <option value="pagado">Pagado</option>
                                                <option value="pendiente">Pendiente</option>
                                            </select>
                                        </div>
                                        <div className="transform transition-all duration-300 hover:scale-105">
                                            <Label className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                                Estatus
                                            </Label>
                                            <select
                                                value={estatusFiltro}
                                                onChange={(e) => setEstatusFiltro(e.target.value)}
                                                className={`mt-1 w-full px-3 py-2 rounded-lg border transition-all duration-300 focus:ring-2 focus:ring-[#FF8000] focus:border-[#FF8000] ${
                                                    darkMode 
                                                        ? 'bg-gray-700/80 border-gray-600 text-white hover:bg-gray-700' 
                                                        : 'bg-white border-gray-300 hover:border-gray-400'
                                                }`}
                                            >
                                                <option value="todos">Todos</option>
                                                <option value="completado">Completado</option>
                                                <option value="en_proceso">En proceso</option>
                                                <option value="cancelado">Cancelado</option>
                                            </select>
                                        </div>
                                        {/* En md: Folio y Papelera son celdas separadas (Folio debajo de Pago, Papelera debajo de Estatus). En lg: una sola celda con ambos. */}
                                        <div className="contents lg:block lg:col-span-1 lg:flex lg:flex-col lg:gap-3">
                                            <div className="transform transition-all duration-300 hover:scale-105 lg:flex-1 lg:min-w-0">
                                                <Label className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                                    Folio
                                                </Label>
                                                <Input
                                                    type="text"
                                                    placeholder="Número de folio"
                                                    value={folioBusqueda}
                                                    onChange={(e) => setFolioBusqueda(e.target.value)}
                                                    className={`mt-1 w-full transition-all duration-300 focus:ring-2 focus:ring-[#FF8000] focus:border-[#FF8000] ${
                                                        darkMode 
                                                            ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400 hover:bg-gray-700' 
                                                            : 'bg-white border-gray-300 placeholder-gray-500 hover:border-gray-400'
                                                    }`}
                                                />
                                            </div>
                                            <div className="transform transition-all duration-300 hover:scale-105 flex items-end">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const lista = await loadPapelera()
                                                        if (lista.length > 0) setPapeleraOpen(true)
                                                        else { setPapeleraOpen(false); setShowPapeleraVaciaModal(true) }
                                                    }}
                                                    className="mt-2 md:mt-0 w-full shrink-0 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors border-2 border-[#FF8000]"
                                                    title="Ver papelera"
                                                >
                                                    <div className="relative w-5 h-5">
                                                        <Image src="/Imagenes/icon_basura.png" alt="Papelera" fill className="object-contain brightness-0 invert" />
                                                    </div>
                                                    Papelera
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla de Pedidos */}
                                <div className="overflow-x-auto rounded-lg border-2 border-gray-300/50 dark:border-gray-600/50">
                                    <table className="w-full">
                                        <thead>
                                            <tr className={`border-b-2 bg-gradient-to-r ${
                                                darkMode 
                                                    ? 'border-gray-700 from-gray-800 to-gray-700' 
                                                    : 'border-gray-300 from-gray-100 to-gray-50'
                                            }`}>
                                                <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Fecha</th>
                                                <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Folio</th>
                                                <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Monto</th>
                                                <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Método de pago</th>
                                                <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Pago</th>
                                                <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Estatus del pedido</th>
                                                <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingPedidos ? (
                                                <tr>
                                                    <td colSpan={7} className={`px-4 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        Cargando pedidos…
                                                    </td>
                                                </tr>
                                            ) : pedidos.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className={`px-4 py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        No hay pedidos.
                                                    </td>
                                                </tr>
                                            ) : (
                                                pedidos.map((pedido) => (
                                                    <tr key={pedido.id} className={`border-b transition-all duration-300 hover:bg-opacity-50 ${darkMode ? 'border-gray-700 hover:bg-[#FF8000]/10' : 'border-gray-200 hover:bg-[#FF8000]/5'}`}>
                                                        <td className={`px-4 py-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pedido.fecha}</td>
                                                        <td className={`px-4 py-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pedido.folio}</td>
                                                        <td className="px-4 py-4 font-bold text-lg text-[#FF8000] drop-shadow-sm">
                                                            $ {Number(pedido.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className={`px-4 py-4 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pedido.metodo_pago}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex items-center space-x-2">
                                                                {(() => {
                                                                    const estatus = (pedido.estatus_pedido || '').toLowerCase().replace(/\s/g, '_')
                                                                    if (estatus === 'completado') return <div className="w-5 h-5 rounded-full border-2 border-emerald-500 bg-emerald-500/20" title="Completado" />
                                                                    if (estatus === 'en_proceso') return <div className="w-5 h-5 rounded-full border-2 border-[#FF8000] bg-[#FF8000]/20" title="En proceso" />
                                                                    if (estatus === 'cancelado') return <div className="w-5 h-5 rounded-full border-2 border-red-500 bg-red-500/20" title="Cancelado" />
                                                                    return <div className="w-5 h-5 rounded-full border-2 border-gray-400 bg-gray-400/20" title={pedido.estatus_pedido || '—'} />
                                                                })()}
                                                            </div>
                                                        </td>
                                                        <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{pedido.estatus_pedido}</td>
                                                        <td className="px-4 py-3">
                                                            <div className="flex flex-col space-y-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDescargarPdf(pedido.id, pedido.folio)}
                                                                    disabled={!!downloadingPdfId}
                                                                    className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-60"
                                                                    title="Descargar PDF"
                                                                >
                                                                    <div className="relative w-5 h-5">
                                                                        <Image src="/Imagenes/icon_descarga.webp" alt="Descargar" fill className="object-contain brightness-0 invert drop-shadow-sm" />
                                                                    </div>
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setDetallePedidoId(pedido.id)}
                                                                    className="w-9 h-9 flex items-center justify-center bg-gradient-to-br from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-110 active:scale-95"
                                                                    title="Ver detalles"
                                                                >
                                                                    <div className="relative w-5 h-5">
                                                                        <Image src="/Imagenes/icon_siguiente.webp" alt="Ver" fill className="object-contain brightness-0 invert drop-shadow-sm" />
                                                                    </div>
                                                                </button>
                                                                {['completado', 'cancelado'].includes((pedido.estatus_pedido || '').toLowerCase()) && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setConfirmPapeleraPedidoId(pedido.id)}
                                                                        className="w-9 h-9 flex items-center justify-center bg-red-500 hover:bg-red-600 rounded-lg shadow-md hover:shadow-lg transform transition-all duration-300 hover:scale-110 active:scale-95"
                                                                        title="Mover a papelera"
                                                                    >
                                                                        <div className="relative w-5 h-5">
                                                                            <Image src="/Imagenes/icon_basura.png" alt="Papelera" fill className="object-contain brightness-0 invert" />
                                                                        </div>
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {(last_page || 1) >= 1 && (() => {
                                    const totalP = Math.max(1, last_page || 1)
                                    const { windowPages, showEllipsis, showLastPage } = getPaginationWindow(current_page, totalP)
                                    const btn = (num, label) => (
                                        <button
                                            key={label ?? num}
                                            type="button"
                                            onClick={() => typeof num === 'number' && setPaginaActual(num)}
                                            className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                                                num === current_page
                                                    ? 'bg-gradient-to-r from-[#FF8000] to-[#FF9500] text-white shadow-md focus:ring-[#FF8000]'
                                                    : darkMode
                                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'
                                            }`}
                                        >
                                            {label ?? num}
                                        </button>
                                    )
                                    return (
                                        <div className="mt-4 flex justify-end">
                                            <div className={`flex flex-wrap items-center gap-2 px-3 py-2 rounded-xl border-2 ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
                                                {totalP > 1 && current_page > 1 && (
                                                    <button
                                                        key="first"
                                                        type="button"
                                                        onClick={() => setPaginaActual(1)}
                                                        className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                                                            darkMode
                                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'
                                                        }`}
                                                        title="Ir a la primera página"
                                                    >
                                                        &laquo;&laquo;
                                                    </button>
                                                )}
                                                {windowPages.map((num) => btn(num))}
                                                {showEllipsis && <span className={`min-w-[2.5rem] h-10 px-2 flex items-center justify-center rounded-lg text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>...</span>}
                                                {showLastPage && totalP > 7 && btn(totalP)}
                                                {totalP > 1 && current_page < totalP && (
                                                    <button
                                                        key="last"
                                                        type="button"
                                                        onClick={() => setPaginaActual(totalP)}
                                                        className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                                                            darkMode
                                                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'
                                                        }`}
                                                        title="Ir a la última página"
                                                    >
                                                        &raquo;&raquo;
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })()}

                                {/* Modal Papelera: mismo ancho que la tabla Mis pedidos */}
                                {papeleraOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                                            onClick={() => setPapeleraOpen(false)}
                                            onKeyDown={(e) => e.key === 'Escape' && setPapeleraOpen(false)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Cerrar papelera"
                                        />
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                            <div
                                                className={`pointer-events-auto w-full max-w-6xl rounded-xl border-2 shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                                                style={{ width: 'min(100%, 72rem)' }}
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.key === 'Escape' && setPapeleraOpen(false)}
                                                role="dialog"
                                                aria-modal="true"
                                                aria-labelledby="papelera-title"
                                            >
                                                <div className={`flex items-center justify-between px-6 py-4 border-b-2 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                                    <h3 id="papelera-title" className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        <div className="relative w-6 h-6">
                                                            <Image src="/Imagenes/icon_basura.png" alt="" fill className={`object-contain ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                        </div>
                                                        Papelera (hasta 30 días para restaurar)
                                                    </h3>
                                                    <button
                                                        type="button"
                                                        onClick={() => setPapeleraOpen(false)}
                                                        className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`}
                                                        title="Cerrar"
                                                    >
                                                        <span className="text-xl leading-none">×</span>
                                                    </button>
                                                </div>
                                                <div className="p-6">
                                                    {loadingPapelera ? (
                                                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Cargando…</p>
                                                    ) : papeleraPedidos.length === 0 ? (
                                                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No hay pedidos en la papelera.</p>
                                                    ) : (
                                                        <div className="overflow-x-auto rounded-lg border-2 border-gray-300/50 dark:border-gray-600/50">
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className={`border-b-2 bg-gradient-to-r ${darkMode ? 'border-gray-700 from-gray-800 to-gray-700' : 'border-gray-300 from-gray-100 to-gray-50'}`}>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Folio</th>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Fecha</th>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Monto</th>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Días para restaurar</th>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Acción</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {papeleraPedidos.map((p) => {
                                                                        const dias = p.dias_para_restaurar ?? 0
                                                                        const puedeRestaurar = dias > 0
                                                                        return (
                                                                            <tr key={p.id} className={`border-b transition-all duration-300 ${darkMode ? 'border-gray-700 hover:bg-[#FF8000]/10' : 'border-gray-200 hover:bg-[#FF8000]/5'}`}>
                                                                                <td className={`px-4 py-3 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.folio}</td>
                                                                                <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.fecha}</td>
                                                                                <td className="px-4 py-3 font-bold text-[#FF8000]">$ {Number(p.monto).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                                                <td className={`px-4 py-3 ${puedeRestaurar ? (darkMode ? 'text-amber-400' : 'text-amber-700') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                                                                                    {puedeRestaurar ? `${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}` : 'Expirado'}
                                                                                </td>
                                                                                <td className="px-4 py-3">
                                                                                    {puedeRestaurar ? (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleRestaurar(p.id)}
                                                                                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                                                                                        >
                                                                                            <div className="relative w-3.5 h-3.5 shrink-0">
                                                                                                <Image src="/Imagenes/icon_historia.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                                                            </div>
                                                                                            Restaurar
                                                                                        </button>
                                                                                    ) : (
                                                                                        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>—</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        )
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Modal confirmar mover a papelera */}
                                {confirmPapeleraPedidoId != null && (
                                    <>
                                        <div
                                            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                                            onClick={() => setConfirmPapeleraPedidoId(null)}
                                            onKeyDown={(e) => e.key === 'Escape' && setConfirmPapeleraPedidoId(null)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Cerrar"
                                        />
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                            <div
                                                className={`pointer-events-auto w-full max-w-md rounded-xl border-2 shadow-2xl p-6 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                                                onClick={(e) => e.stopPropagation()}
                                                role="dialog"
                                                aria-modal="true"
                                                aria-labelledby="confirm-papelera-title"
                                            >
                                                <h3 id="confirm-papelera-title" className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    ¿Mover este pedido a la papelera?
                                                </h3>
                                                <p className={`text-sm mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    El pedido podrá restaurarse desde la Papelera hasta 30 días.
                                                </p>
                                                <div className="flex justify-end gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => setConfirmPapeleraPedidoId(null)}
                                                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                                    >
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <Image src="/Imagenes/icon_cerrar.png" alt="" fill className={`object-contain ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                        </div>
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            handleMoverAPapelera(confirmPapeleraPedidoId)
                                                            setConfirmPapeleraPedidoId(null)
                                                        }}
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors"
                                                    >
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <Image src="/Imagenes/icon_siguiente.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                        </div>
                                                        Aceptar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Modal papelera vacía */}
                                {showPapeleraVaciaModal && (
                                    <>
                                        <div
                                            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
                                            onClick={() => setShowPapeleraVaciaModal(false)}
                                            onKeyDown={(e) => e.key === 'Escape' && setShowPapeleraVaciaModal(false)}
                                            role="button"
                                            tabIndex={0}
                                            aria-label="Cerrar"
                                        />
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                            <div
                                                className={`pointer-events-auto w-full max-w-md rounded-xl border-2 shadow-2xl p-6 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}
                                                onClick={(e) => e.stopPropagation()}
                                                role="dialog"
                                                aria-modal="true"
                                                aria-labelledby="papelera-vacia-title"
                                            >
                                                <h3 id="papelera-vacia-title" className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    No hay pedidos en la papelera.
                                                </h3>
                                                <p className={`text-sm mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Los pedidos que muevas a la papelera (Completado o Cancelado) aparecerán aquí hasta 30 días para poder restaurarlos.
                                                </p>
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPapeleraVaciaModal(false)}
                                                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors"
                                                    >
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <Image src="/Imagenes/icon_siguiente.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                        </div>
                                                        Aceptar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Tab: MIS COTIZACIONES */}
                        {activeTab === 'cotizaciones' && (
                            <div className={`rounded-xl shadow-2xl p-6 md:p-8 border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                                darkMode
                                    ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700 shadow-[#FF8000]/10'
                                    : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 shadow-[#FF8000]/5'
                            }`}>
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Mis cotizaciones guardadas
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const lista = await loadPapeleraCotizaciones()
                                            if (lista.length > 0) setPapeleraCotizacionesOpen(true)
                                            else setShowPapeleraCotizacionesVaciaModal(true)
                                        }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors border-2 border-[#FF8000]"
                                        title="Ver papelera"
                                    >
                                        <div className="relative w-5 h-5">
                                            <Image src="/Imagenes/icon_basura.png" alt="Papelera" fill className="object-contain brightness-0 invert" />
                                        </div>
                                        Papelera
                                    </button>
                                </div>
                                {cotizacionesGuardadas.length === 0 && (
                                    <p className={`py-8 text-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        No tienes cotizaciones guardadas. Guarda una desde la tienda (menú Cotizaciones → Mis cotizaciones).
                                    </p>
                                )}
                                {cotizacionesGuardadas.length > 0 && (() => {
                                    const totalPaginasCotizacion = Math.max(1, Math.ceil(cotizacionesGuardadas.length / COTIZACION_POR_PAGINA))
                                    const paginaCotizacion = Math.min(Math.max(1, cotizacionPaginaActual), totalPaginasCotizacion)
                                    const inicioCotizacion = (paginaCotizacion - 1) * COTIZACION_POR_PAGINA
                                    const cotizacionesPagina = cotizacionesGuardadas.slice(inicioCotizacion, inicioCotizacion + COTIZACION_POR_PAGINA)
                                    return (
                                    <>
                                    <div className="space-y-4">
                                        {cotizacionesPagina.map((cot) => {
                                            const items = cot.items || []
                                            const getEffective = (i) => {
                                                const stockRaw = i.totalStock
                                                const stock = stockRaw != null ? Number(stockRaw) : -1
                                                const sinStock = stock === 0
                                                const qty = sinStock ? 0 : (stock < 0 ? (Number(i.cantidad) || 1) : Math.min(Number(i.cantidad) || 1, stock))
                                                return { stock: stock < 0 ? 999 : stock, sinStock, qty, subtotal: qty * (Number(i.precio_unitario) ?? 0) }
                                            }
                                            const totalConStock = items.reduce((s, i) => s + getEffective(i).subtotal, 0)
                                            const fechaStr = cot.fecha ? new Date(cot.fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : ''
                                            const nombreArchivo = `Cotizacion_${cot.fecha ? new Date(cot.fecha).toISOString().slice(0, 16).replace('T', '_') : cot.id}.pdf`
                                            const descargarCotizacion = async () => {
                                                const totalStr = typeof totalConStock === 'number' ? totalConStock.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(totalConStock)
                                                const { jsPDF } = await import('jspdf')
                                                const autoTable = (await import('jspdf-autotable')).default
                                                const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
                                                const pageW = doc.internal.pageSize.getWidth()
                                                const pageH = doc.internal.pageSize.getHeight()
                                                const margin = 14
                                                // --- PDF COTIZACIÓN: diseño verde (diferente al pedido naranja) ---
                                                const green = [5, 150, 105]      // #059669 emerald
                                                const greenLight = [236, 253, 245] // #ecfdf5
                                                const greenDark = [4, 120, 87]   // #047857
                                                // Franja superior verde: identifica al instante que es COTIZACIÓN
                                                doc.setFillColor(...green)
                                                doc.rect(0, 0, pageW, 22, 'F')
                                                doc.setTextColor(255, 255, 255)
                                                doc.setFontSize(11)
                                                doc.setFont(undefined, 'bold')
                                                doc.text('COTIZACIÓN', margin, 10)
                                                doc.setFontSize(16)
                                                doc.text(`Fecha: ${fechaStr}`, pageW - margin, 14, { align: 'right' })
                                                // Cuerpo: marca y datos en verde oscuro
                                                doc.setTextColor(...greenDark)
                                                doc.setFontSize(20)
                                                doc.setFont(undefined, 'bold')
                                                doc.text('Todo para la oficina', margin, 34)
                                                doc.setFontSize(9)
                                                doc.setFont(undefined, 'normal')
                                                doc.setTextColor(107, 114, 128)
                                                doc.text('Soluciones para tu espacio de trabajo', margin, 39)
                                                doc.setFontSize(10)
                                                doc.text('Av. López Mateos #1038-11, Col. Italia Providencia', margin, 46)
                                                doc.text('CP 44630, Guadalajara, Jalisco', margin, 51)
                                                doc.text('desarrollo@nxt.it.com · 333 616-7279', margin, 56)
                                                // Línea verde bajo el bloque de datos
                                                doc.setDrawColor(...green)
                                                doc.setLineWidth(0.8)
                                                doc.line(margin, 62, pageW - margin, 62)
                                                // Sección "Detalle" con recuadro verde
                                                doc.setFillColor(...greenLight)
                                                doc.rect(margin, 66, pageW - margin * 2, 8, 'F')
                                                doc.setTextColor(...greenDark)
                                                doc.setFontSize(10)
                                                doc.setFont(undefined, 'bold')
                                                doc.text('DETALLE DE LA COTIZACIÓN', margin + 4, 71.5)
                                                doc.setTextColor(0, 0, 0)
                                                const tableData = items.map((i) => {
                                                    const eff = getEffective(i)
                                                    const nombre = (i.nombre_producto || i.clave || '').toString().slice(0, 55) + (i.clave ? ` (${i.clave})` : '') + (eff.sinStock ? ' — Sin stock' : '')
                                                    const pUnit = typeof i.precio_unitario === 'number' ? '$ ' + i.precio_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : (i.precio_unitario ?? '-')
                                                    const sub = '$ ' + eff.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })
                                                    return [nombre, String(eff.qty), pUnit, sub]
                                                })
                                                autoTable(doc, {
                                                    startY: 76,
                                                    head: [['Producto', 'Cant.', 'P. unit.', 'Subtotal']],
                                                    body: tableData,
                                                    theme: 'plain',
                                                    headStyles: {
                                                        fillColor: greenLight,
                                                        textColor: greenDark,
                                                        fontStyle: 'bold',
                                                        fontSize: 9
                                                    },
                                                    columnStyles: {
                                                        0: { cellWidth: 'auto' },
                                                        1: { halign: 'right', cellWidth: 18 },
                                                        2: { halign: 'right', cellWidth: 28 },
                                                        3: { halign: 'right', cellWidth: 28 }
                                                    },
                                                    margin: { left: margin, right: margin },
                                                    tableLineColor: [167, 243, 208],
                                                    tableLineWidth: 0.3
                                                })
                                                const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : 90
                                                doc.setDrawColor(...green)
                                                doc.setLineWidth(0.6)
                                                doc.line(margin, finalY, pageW - margin, finalY)
                                                doc.setFontSize(11)
                                                doc.setFont(undefined, 'bold')
                                                doc.setTextColor(...greenDark)
                                                doc.text('Total', margin, finalY + 8)
                                                doc.setFontSize(14)
                                                doc.text(`$ ${totalStr}`, pageW - margin, finalY + 8, { align: 'right' })
                                                const footerY = pageH - 12
                                                doc.setDrawColor(...green)
                                                doc.setLineWidth(0.4)
                                                doc.line(margin, footerY - 6, pageW - margin, footerY - 6)
                                                doc.setFontSize(9)
                                                doc.setFont(undefined, 'normal')
                                                doc.setTextColor(...greenDark)
                                                doc.text(`Cotización · Todo para la oficina · ${fechaStr}`, pageW / 2, footerY, { align: 'center' })
                                                doc.save(nombreArchivo)
                                            }
                                            const fechaEditadaStr = cot.fecha_editada ? new Date(cot.fecha_editada).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : ''
                                            const actualizarCotizacion = (nuevosItems, nuevoTotal) => {
                                                if (!nuevosItems?.length) {
                                                    handleMoverCotizacionAPapelera(cot.id)
                                                    return
                                                }
                                                if (isLoggedInUserId(user?.id)) {
                                                    setCotizacionesGuardadas((prev) => prev.map((c) => (c.id === cot.id ? { ...c, items: nuevosItems, total: nuevoTotal ?? 0 } : c)))
                                                } else {
                                                    updateCotizacionGuardada(cot.id, { items: nuevosItems, total: nuevoTotal }, { setFechaEditada: false }, user?.id)
                                                    setCotizacionesGuardadas(getCotizacionesGuardadas(user?.id))
                                                }
                                            }
                                            return (
                                                <div
                                                    key={cot.id}
                                                    className={`p-5 rounded-xl border-2 transition-all duration-300 ${
                                                        darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200'
                                                    }`}
                                                >
                                                    {cot.fecha_editada && (
                                                        <p className={`mb-2 text-sm font-medium rounded-lg px-3 py-1.5 inline-block ${darkMode ? 'bg-amber-900/40 text-amber-300 border border-amber-700/50' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                                                            Cotización editada el {fechaEditadaStr}
                                                        </p>
                                                    )}
                                                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        Cotización del {fechaStr}
                                                    </p>
                                                    <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                        {items.length} producto(s) · Total: {formatPrecio(totalConStock)}
                                                    </p>
                                                    <div className="mt-4 flex flex-wrap gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setCotizacionVerProductosId(cotizacionVerProductosId === cot.id ? null : cot.id)}
                                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#2b4e94] hover:bg-[#1e3a6f] text-white transition-colors border-2 border-[#2b4e94] hover:border-[#1e3a6f]"
                                                        >
                                                            <div className="relative w-4 h-4 shrink-0">
                                                                <Image src="/Imagenes/icon_producto.png" alt="" fill className="object-contain brightness-0 invert" />
                                                            </div>
                                                            {cotizacionVerProductosId === cot.id ? 'Ocultar productos' : 'Ver productos'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setPagarCotizacionModalOpen(true)}
                                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors"
                                                        >
                                                            <div className="relative w-4 h-4 shrink-0">
                                                                <Image src="/Imagenes/icon_carrito.png" alt="" fill className="object-contain brightness-0 invert" />
                                                            </div>
                                                            Pagar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={descargarCotizacion}
                                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#0d9488] hover:bg-[#0f766e] text-white transition-colors border-2 border-[#0d9488] hover:border-[#0f766e]"
                                                        >
                                                            <div className="relative w-4 h-4 shrink-0">
                                                                <Image src="/Imagenes/icon_descarga.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                            </div>
                                                            Descargar cotización
                                                        </button>
                                                        {hasUnsavedChangesCotizacion(cot) && (
                                                            <button
                                                                type="button"
                                                                onClick={async () => {
                                                                    if (isLoggedInUserId(user?.id)) {
                                                                        try {
                                                                            await updateCotizacionApi(cot.id, cot.items || [], cot.total ?? 0)
                                                                            const lista = await fetchCotizacionesGuardadas()
                                                                            setCotizacionesGuardadas(lista)
                                                                            setOriginalCotizaciones((prev) => ({
                                                                                ...prev,
                                                                                [cot.id]: { items: JSON.parse(JSON.stringify(cot.items || [])), total: cot.total ?? 0 },
                                                                            }))
                                                                        } catch {
                                                                            // Error al guardar - podría mostrar toast
                                                                        }
                                                                    } else {
                                                                        updateCotizacionGuardada(cot.id, { items: cot.items || [], total: cot.total ?? 0 }, {}, user?.id)
                                                                        setCotizacionesGuardadas(getCotizacionesGuardadas(user?.id))
                                                                        setOriginalCotizaciones((prev) => ({
                                                                            ...prev,
                                                                            [cot.id]: { items: JSON.parse(JSON.stringify(cot.items || [])), total: cot.total ?? 0 },
                                                                        }))
                                                                    }
                                                                }}
                                                                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors border-2 border-emerald-600 hover:border-emerald-700"
                                                                title="Guardar ajustes de la cotización"
                                                            >
                                                                <div className="relative w-4 h-4 shrink-0">
                                                                    <Image src="/Imagenes/icon_guardar.png" alt="" fill className="object-contain brightness-0 invert" />
                                                                </div>
                                                                Guardar
                                                            </button>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setConfirmEliminarCotizacionId(cot.id)}
                                                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors border-2 border-red-500 hover:border-red-600"
                                                            title="Mover a papelera"
                                                        >
                                                            <div className="relative w-4 h-4 shrink-0">
                                                                <Image src="/Imagenes/icon_basura.png" alt="" fill className="object-contain brightness-0 invert" />
                                                            </div>
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                    {cotizacionVerProductosId === cot.id && (cot.items || []).length > 0 && (
                                                        <div className={`mt-4 pt-4 border-t ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                                            <p className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                                Productos de esta cotización
                                                            </p>
                                                            <div className="space-y-3">
                                                                {items.map((item, idx) => {
                                                                    const precioUnit = Number(item.precio_unitario) ?? 0
                                                                    const eff = getEffective(item)
                                                                    const qty = eff.qty
                                                                    const subtotal = eff.subtotal
                                                                    const sinStock = eff.sinStock
                                                                    const calcTotalConStock = (list) => list.reduce((s, i) => s + getEffective(i).subtotal, 0)
                                                                    return (
                                                                        <div
                                                                            key={item.clave + String(idx)}
                                                                            className={`flex flex-col sm:flex-row gap-3 p-3 rounded-lg ${darkMode ? 'bg-gray-800/50' : 'bg-gray-50'}`}
                                                                        >
                                                                            {item.imagen && (
                                                                                <div className="relative w-full sm:w-20 h-20 shrink-0 rounded overflow-hidden bg-gray-200 dark:bg-gray-700">
                                                                                    <Image
                                                                                        src={item.imagen}
                                                                                        alt={item.nombre_producto?.slice(0, 40) || item.clave || 'Producto'}
                                                                                        fill
                                                                                        className="object-contain"
                                                                                        unoptimized={item.imagen?.startsWith?.('http')}
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                            <div className="flex-1 min-w-0">
                                                                                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                                    {item.nombre_producto || item.clave || 'Producto'}
                                                                                </p>
                                                                                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                                    Clave: {item.clave}
                                                                                </p>
                                                                                <p className={`mt-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                                                    {sinStock ? (
                                                                                        <span className={darkMode ? 'text-red-400' : 'text-red-600'}>Sin stock</span>
                                                                                    ) : (
                                                                                        <span>En stock: {eff.stock} disponible(s)</span>
                                                                                    )}
                                                                                </p>
                                                                                <p className={`mt-1 text-sm ${darkMode ? 'text-[#FF8000]' : 'text-[#FF8000]'}`}>
                                                                                    {formatPrecio(precioUnit)} × {sinStock ? (Number(item.cantidad) || 1) : qty} = {sinStock ? (
                                                                                        <span className={`font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>Sin stock</span>
                                                                                    ) : (
                                                                                        formatPrecio(subtotal)
                                                                                    )}
                                                                                </p>
                                                                            </div>
                                                                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                                                                                {sinStock ? (
                                                                                    <div className={`flex items-center gap-2 rounded-xl border-2 border-l-4 px-3 py-2 ${darkMode ? 'bg-gray-700/80 border-gray-600 border-l-red-500' : 'bg-red-50/80 border-red-200 border-l-red-500'}`}>
                                                                                        <span className={`text-sm font-semibold ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>0</span>
                                                                                        <span className={`text-xs font-medium ${darkMode ? 'text-red-400' : 'text-red-600'}`}>No hay stock</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className={`flex items-center gap-0 rounded-xl border-2 border-l-4 overflow-hidden ${darkMode ? 'bg-gray-700/80 border-gray-600 border-l-[#FF8000]' : 'bg-amber-50/80 border-amber-200 border-l-[#FF8000]'}`}>
                                                                                        <span className="pl-2 shrink-0 text-[#FF8000]" aria-hidden>
                                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" /></svg>
                                                                                        </span>
                                                                                        <input
                                                                                            type="number"
                                                                                            min={1}
                                                                                            max={Math.max(1, eff.stock)}
                                                                                            value={qty}
                                                                                            onChange={(e) => {
                                                                                                const v = Math.max(1, Math.min(eff.stock, Number(e.target.value) || 1))
                                                                                                const nuevosItems = items.map((i) => i.clave === item.clave ? { ...i, cantidad: v, subtotal: (Number(i.precio_unitario) ?? 0) * v } : i)
                                                                                                actualizarCotizacion(nuevosItems, calcTotalConStock(nuevosItems))
                                                                                            }}
                                                                                            className={`w-12 py-1.5 pr-0 text-sm font-semibold text-center bg-transparent border-0 focus:ring-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${darkMode ? 'text-white' : 'text-gray-900'}`}
                                                                                        />
                                                                                        <div className={`flex flex-col shrink-0 border-l ${darkMode ? 'border-gray-600' : 'border-amber-200'}`}>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    const v = Math.min(eff.stock, qty + 1)
                                                                                                    const nuevosItems = items.map((i) => i.clave === item.clave ? { ...i, cantidad: v, subtotal: precioUnit * v } : i)
                                                                                                    actualizarCotizacion(nuevosItems, calcTotalConStock(nuevosItems))
                                                                                                }}
                                                                                                aria-label="Aumentar cantidad"
                                                                                                className={`p-0.5 ${darkMode ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-amber-100 text-gray-600'}`}
                                                                                            >
                                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => {
                                                                                                    const v = Math.max(1, qty - 1)
                                                                                                    const nuevosItems = items.map((i) => i.clave === item.clave ? { ...i, cantidad: v, subtotal: precioUnit * v } : i)
                                                                                                    actualizarCotizacion(nuevosItems, calcTotalConStock(nuevosItems))
                                                                                                }}
                                                                                                aria-label="Disminuir cantidad"
                                                                                                className={`p-0.5 border-t ${darkMode ? 'border-gray-600 hover:bg-gray-600 text-gray-300' : 'border-amber-200 hover:bg-amber-100 text-gray-600'}`}
                                                                                            >
                                                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                )}
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        const nuevosItems = items.filter((i) => i.clave !== item.clave)
                                                                                        actualizarCotizacion(nuevosItems, calcTotalConStock(nuevosItems))
                                                                                    }}
                                                                                    className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${darkMode ? 'bg-red-900/50 hover:bg-red-800 text-red-300 border border-red-700' : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'}`}
                                                                                    aria-label="Eliminar de la cotización"
                                                                                >
                                                                                    <Image src="/Imagenes/icon_basura.png" alt="" width={14} height={14} className={`object-contain shrink-0 ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                                                    Eliminar
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    )
                                                                })}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                    {totalPaginasCotizacion > 1 && (() => {
                                        const totalP = totalPaginasCotizacion
                                        const { windowPages, showEllipsis, showLastPage } = getPaginationWindow(paginaCotizacion, totalP)
                                        const btn = (num) => (
                                            <button
                                                key={num}
                                                type="button"
                                                onClick={() => setCotizacionPaginaActual(num)}
                                                className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                                                    num === paginaCotizacion
                                                        ? 'bg-gradient-to-r from-[#FF8000] to-[#FF9500] text-white shadow-md focus:ring-[#FF8000]'
                                                        : darkMode
                                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'
                                                }`}
                                            >
                                                {num}
                                            </button>
                                        )
                                        return (
                                            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                                {totalP > 1 && paginaCotizacion > 1 && (
                                                    <button key="first" type="button" onClick={() => setCotizacionPaginaActual(1)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'}`} title="Ir a la primera página">&laquo;&laquo;</button>
                                                )}
                                                {windowPages.map((num) => btn(num))}
                                                {showEllipsis && <span className={`min-w-[2.5rem] h-10 px-2 flex items-center justify-center rounded-lg text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>...</span>}
                                                {showLastPage && totalP > 7 && btn(totalP)}
                                                {totalP > 1 && paginaCotizacion < totalP && (
                                                    <button key="last" type="button" onClick={() => setCotizacionPaginaActual(totalP)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'}`} title="Ir a la última página">&raquo;&raquo;</button>
                                                )}
                                            </div>
                                        )
                                    })()}
                                    </>
                                    )
                                })()}

                                {/* Modal confirmar mover cotización a papelera */}
                                {confirmEliminarCotizacionId != null && (
                                    <>
                                        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setConfirmEliminarCotizacionId(null)} role="button" tabIndex={0} aria-label="Cerrar" />
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                            <div className={`pointer-events-auto w-full max-w-md rounded-xl border-2 shadow-2xl p-6 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="confirm-cotizacion-papelera-title">
                                                <h3 id="confirm-cotizacion-papelera-title" className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>¿Mover esta cotización a la papelera?</h3>
                                                <p className={`text-sm mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Podrás restaurarla desde la Papelera hasta 30 días.</p>
                                                <div className="flex justify-end gap-3">
                                                    <button type="button" onClick={() => setConfirmEliminarCotizacionId(null)} className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${darkMode ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}>
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <Image src="/Imagenes/icon_cerrar.png" alt="" fill className={`object-contain ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                        </div>
                                                        Cancelar
                                                    </button>
                                                    <button type="button" onClick={() => { handleMoverCotizacionAPapelera(confirmEliminarCotizacionId); setConfirmEliminarCotizacionId(null); }} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-red-500 hover:bg-red-600 text-white transition-colors">
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <Image src="/Imagenes/icon_siguiente.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                        </div>
                                                        Aceptar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Modal Papelera cotizaciones */}
                                {papeleraCotizacionesOpen && (
                                    <>
                                        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setPapeleraCotizacionesOpen(false)} role="button" tabIndex={0} aria-label="Cerrar" />
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                            <div className={`pointer-events-auto w-full max-w-6xl rounded-xl border-2 shadow-2xl overflow-hidden ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} style={{ width: 'min(100%, 72rem)' }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="papelera-cotizaciones-title">
                                                <div className={`flex items-center justify-between px-6 py-4 border-b-2 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                                                    <h3 id="papelera-cotizaciones-title" className={`text-lg font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                                        <div className="relative w-6 h-6">
                                                            <Image src="/Imagenes/icon_basura.png" alt="" fill className={`object-contain ${darkMode ? 'brightness-0 invert' : ''}`} />
                                                        </div>
                                                        Papelera cotizaciones (hasta 30 días para restaurar)
                                                    </h3>
                                                    <button type="button" onClick={() => setPapeleraCotizacionesOpen(false)} className={`p-2 rounded-lg transition-colors ${darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-200 text-gray-600'}`} title="Cerrar"><span className="text-xl leading-none">×</span></button>
                                                </div>
                                                <div className="p-6">
                                                    {papeleraCotizaciones.length === 0 ? (
                                                        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>No hay cotizaciones en la papelera.</p>
                                                    ) : (
                                                        <div className="overflow-x-auto rounded-lg border-2 border-gray-300/50 dark:border-gray-600/50">
                                                            <table className="w-full">
                                                                <thead>
                                                                    <tr className={`border-b-2 bg-gradient-to-r ${darkMode ? 'border-gray-700 from-gray-800 to-gray-700' : 'border-gray-300 from-gray-100 to-gray-50'}`}>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Fecha</th>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Productos</th>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Total</th>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Días para restaurar</th>
                                                                        <th className={`px-4 py-4 text-left text-sm font-bold tracking-wider ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Acción</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {papeleraCotizaciones.map((c) => {
                                                                        const dias = c.dias_para_restaurar ?? 0
                                                                        const puedeRestaurar = dias > 0
                                                                        const fechaStr = c.fecha ? new Date(c.fecha).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' }) : '—'
                                                                        return (
                                                                            <tr key={c.id} className={`border-b transition-all duration-300 ${darkMode ? 'border-gray-700 hover:bg-[#FF8000]/10' : 'border-gray-200 hover:bg-[#FF8000]/5'}`}>
                                                                                <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{fechaStr}</td>
                                                                                <td className={`px-4 py-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{(c.items || []).length} producto(s)</td>
                                                                                <td className="px-4 py-3 font-bold text-[#FF8000]">{formatPrecio(c.total ?? 0)}</td>
                                                                                <td className={`px-4 py-3 ${puedeRestaurar ? (darkMode ? 'text-amber-400' : 'text-amber-700') : (darkMode ? 'text-gray-500' : 'text-gray-500')}`}>
                                                                                    {puedeRestaurar ? `${dias} día${dias !== 1 ? 's' : ''} restante${dias !== 1 ? 's' : ''}` : 'Expirado'}
                                                                                </td>
                                                                                <td className="px-4 py-3">
                                                                                    {puedeRestaurar ? (
                                                                                        <button type="button" onClick={() => handleRestaurarCotizacion(c.id)} className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors">
                                                                                            <div className="relative w-3.5 h-3.5 shrink-0">
                                                                                                <Image src="/Imagenes/icon_historia.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                                                            </div>
                                                                                            Restaurar
                                                                                        </button>
                                                                                    ) : (
                                                                                        <span className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>—</span>
                                                                                    )}
                                                                                </td>
                                                                            </tr>
                                                                        )
                                                                    })}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Modal papelera cotizaciones vacía */}
                                {showPapeleraCotizacionesVaciaModal && (
                                    <>
                                        <div className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm" onClick={() => setShowPapeleraCotizacionesVaciaModal(false)} role="button" tabIndex={0} aria-label="Cerrar" />
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
                                            <div className={`pointer-events-auto w-full max-w-md rounded-xl border-2 shadow-2xl p-6 ${darkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="papelera-cotizaciones-vacia-title">
                                                <h3 id="papelera-cotizaciones-vacia-title" className={`text-lg font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-900'}`}>No hay cotizaciones en la papelera.</h3>
                                                <p className={`text-sm mb-5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Las cotizaciones que muevas a la papelera aparecerán aquí hasta 30 días para poder restaurarlas.</p>
                                                <div className="flex justify-end">
                                                    <button type="button" onClick={() => setShowPapeleraCotizacionesVaciaModal(false)} className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors">
                                                        <div className="relative w-4 h-4 shrink-0">
                                                            <Image src="/Imagenes/icon_siguiente.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                        </div>
                                                        Aceptar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Tab: CONTACTO / ENVÍO */}
                        {activeTab === 'contacto' && (() => {
                            const direccionesOrdenadas = [...direcciones].sort((a, b) => (b.es_principal ? 1 : 0) - (a.es_principal ? 1 : 0))
                            const totalPaginasContacto = Math.max(1, Math.ceil(direccionesOrdenadas.length / CONTACTO_POR_PAGINA))
                            const paginaContacto = Math.min(Math.max(1, contactoPaginaActual), totalPaginasContacto)
                            const inicioContacto = (paginaContacto - 1) * CONTACTO_POR_PAGINA
                            const direccionesPagina = direccionesOrdenadas.slice(inicioContacto, inicioContacto + CONTACTO_POR_PAGINA)
                            return (
                            <div className={`rounded-xl shadow-2xl p-6 md:p-8 border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                                darkMode 
                                    ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700 shadow-[#FF8000]/10' 
                                    : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 shadow-[#FF8000]/5'
                            }`}>
                                <div className="space-y-4">
                                        {direccionesPagina.map((contacto) => (
                                            <div key={contacto.id} className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:shadow-[#FF8000]/10 hover:-translate-y-0.5 ${
                                                darkMode 
                                                    ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600/80 hover:border-[#FF8000]/40' 
                                                    : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-[#FF8000]/30'
                                            }`}>
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF8000] to-[#FF9500] rounded-l-xl" />
                                                <div className="pl-4 pr-4 py-3 md:pl-4 md:pr-4 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                    <div className="flex-1 min-w-0 space-y-3">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contacto.nombre}</h3>
                                                            {contacto.es_principal && (
                                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF8000] text-white">Principal</span>
                                                            )}
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                            <div className={`flex items-center gap-2 rounded-lg p-2.5 ${darkMode ? 'bg-gray-700/50' : 'bg-[#FF8000]/5'}`}>
                                                                <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${darkMode ? 'bg-[#FF8000]/20' : 'bg-[#FF8000]/15'}`}>
                                                                    <svg className="w-3.5 h-3.5 text-[#FF8000]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                                                </span>
                                                                <div className="min-w-0">
                                                                    <p className={`text-[10px] font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Teléfono</p>
                                                                    <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contacto.telefono || '—'}</p>
                                                                </div>
                                                            </div>
                                                            <div className={`rounded-lg p-2.5 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/80'}`}>
                                                                <p className={`text-[10px] font-semibold uppercase mb-1 ${darkMode ? 'text-[#FF9500]' : 'text-[#FF8000]'}`}>Dirección</p>
                                                                <p className={`text-xs font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{contacto.calle || '—'}{contacto.numero_exterior ? ` ${contacto.numero_exterior}` : ''}{contacto.numero_interior ? ` int. ${contacto.numero_interior}` : ''}</p>
                                                                <p className={`text-xs font-medium mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{[contacto.colonia, contacto.ciudad_nombre || contacto.ciudad, contacto.estado].filter(Boolean).join(' · ') || '—'} {contacto.codigo_postal ? `CP ${contacto.codigo_postal}` : ''}</p>
                                                            </div>
                                                        </div>
                                                        {contacto.referencias && (
                                                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><span className="font-semibold">Ref:</span> {contacto.referencias}</p>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-row md:flex-col gap-1.5 shrink-0 items-center">
                                                        {/* Botón principal: solo el principal lo muestra (estrella); el resto muestra estrella+? para agregar como principal */}
                                                        {contacto.es_principal ? (
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetPrincipal(contacto.id, false)}
                                                                    onMouseEnter={() => setPrincipalTooltipId(contacto.id)}
                                                                    onMouseLeave={() => setPrincipalTooltipId(null)}
                                                                    className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${darkMode ? 'border-[#FF8000]/50 bg-[#FF8000]/20 text-[#FF9500]' : 'border-[#FF8000]/50 bg-[#FF8000]/10 text-[#FF8000]'}`}
                                                                    aria-label="Quitar de principal"
                                                                >
                                                                    <Image src="/Imagenes/icon_estrella.png" alt="" width={18} height={18} className="object-contain" />
                                                                </button>
                                                                {principalTooltipId === contacto.id && (
                                                                    <div className={`absolute z-10 right-full top-1/2 -translate-y-1/2 mr-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-800 text-white border border-gray-600'}`}>
                                                                        Quitar de principal
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="relative">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleSetPrincipal(contacto.id, true)}
                                                                    onMouseEnter={() => setPrincipalTooltipId(contacto.id)}
                                                                    onMouseLeave={() => setPrincipalTooltipId(null)}
                                                                    className={`w-9 h-9 flex items-center justify-center gap-0.5 rounded-lg border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${darkMode ? 'border-gray-600 bg-gray-700/80 hover:bg-[#FF8000]/15 hover:border-[#FF8000]/50 text-gray-400' : 'border-gray-200 bg-white hover:bg-[#FF8000]/10 hover:border-[#FF8000]/50 text-gray-500'}`}
                                                                    aria-label="Agregar como principal"
                                                                >
                                                                    <Image src="/Imagenes/icon_estrella.png" alt="" width={14} height={14} className="object-contain opacity-70" />
                                                                    <span className="text-[10px] font-bold leading-none">?</span>
                                                                </button>
                                                                {principalTooltipId === contacto.id && (
                                                                    <div className={`absolute z-10 right-full top-1/2 -translate-y-1/2 mr-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-800 text-white border border-gray-600'}`}>
                                                                        Agregar como principal
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                        <button type="button" onClick={() => openContactoEdit(contacto)} className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${darkMode ? 'border-gray-600 bg-gray-700/80 hover:bg-[#FF8000]/20 hover:border-[#FF8000] text-gray-200' : 'border-gray-200 bg-white hover:bg-[#FF8000]/10 hover:border-[#FF8000] text-gray-700'}`} title="Editar" aria-label="Editar dirección">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                        </button>
                                                        <button type="button" onClick={() => setContactoDeleteId(contacto.id)} className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${darkMode ? 'border-red-500/40 bg-gray-700/80 hover:bg-red-500/20 hover:border-red-500 text-red-400' : 'border-red-200 bg-white hover:bg-red-50 hover:border-red-400 text-red-600'}`} title="Eliminar" aria-label="Eliminar dirección">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                                {totalPaginasContacto > 1 && (() => {
                                    const totalP = totalPaginasContacto
                                    const { windowPages, showEllipsis, showLastPage } = getPaginationWindow(paginaContacto, totalP)
                                    const btn = (num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setContactoPaginaActual(num)}
                                            className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                                                num === paginaContacto
                                                    ? 'bg-gradient-to-r from-[#FF8000] to-[#FF9500] text-white shadow-md focus:ring-[#FF8000]'
                                                    : darkMode
                                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    )
                                    return (
                                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                            {totalP > 1 && paginaContacto > 1 && (
                                                <button key="first" type="button" onClick={() => setContactoPaginaActual(1)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'}`} title="Ir a la primera página">&laquo;&laquo;</button>
                                            )}
                                            {windowPages.map((num) => btn(num))}
                                            {showEllipsis && <span className={`min-w-[2.5rem] h-10 px-2 flex items-center justify-center rounded-lg text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>...</span>}
                                            {showLastPage && totalP > 7 && btn(totalP)}
                                            {totalP > 1 && paginaContacto < totalP && (
                                                <button key="last" type="button" onClick={() => setContactoPaginaActual(totalP)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'}`} title="Ir a la última página">&raquo;&raquo;</button>
                                            )}
                                        </div>
                                    )
                                })()}
                                <div className="mt-6 text-center">
                                    <Button type="button" onClick={openContactoCreate} className="bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95">
                                        <span className="mr-2 text-xl">+</span>
                                        Ingresar nuevos datos
                                    </Button>
                                </div>
                            </div>
                            )
                        })()}

                        {/* Modal confirmar eliminar dirección */}
                        {contactoDeleteId != null && (
                            <>
                                <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setContactoDeleteId(null)} aria-hidden />
                                <div className={`fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:max-w-sm w-full rounded-xl shadow-2xl border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <p className={`text-center font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>¿Eliminar esta dirección?</p>
                                    <div className="flex gap-3 justify-center">
                                        <Button type="button" onClick={() => setContactoDeleteId(null)} className="px-5 py-2.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium">
                                            Cancelar
                                        </Button>
                                        <Button type="button" onClick={() => handleContactoDelete(contactoDeleteId)} className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Modal Contacto / Envío */}
                        {contactoModal && (
                            <>
                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={closeContactoModal} />
                                <div className={`fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl sm:border-2 ${darkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-b from-white to-gray-50 border-gray-200'} ring-4 ${darkMode ? 'ring-[#FF8000]/20' : 'ring-[#FF8000]/10'}`}>
                                    {/* Header con barra naranja y botón cerrar rojo */}
                                    <div className={`flex-none flex items-center justify-between px-5 py-4 border-b-2 ${darkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'} rounded-t-2xl`}>
                                        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#FF8000] to-[#FF9500] shrink-0" aria-hidden />
                                        <h3 className={`text-lg font-bold flex-1 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {contactoEditId ? 'Editar dirección' : 'Nueva dirección de envío'}
                                        </h3>
                                        <button type="button" onClick={closeContactoModal} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/15 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-transparent" aria-label="Cerrar">
                                            <span className="relative block w-5 h-5">
                                                <Image src="/Imagenes/icon_cerrar.png" alt="" fill className="object-contain" style={{ filter: 'invert(18%) sepia(98%) saturate(5000%) hue-rotate(350deg) brightness(0.95) contrast(1.1)' }} />
                                            </span>
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <form onSubmit={handleContactoSubmit} className="space-y-4">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Nombre *</Label>
                                                    <Input value={contactoForm.nombre} onChange={e => { setContactoForm(f => ({ ...f, nombre: e.target.value })); clearContactoRequiredInvalid('nombre') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(contactoForm.nombre ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${contactoRequiredInvalid.nombre ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={contactoErrors.nombre} className="mt-1" />
                                                </div>
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Teléfono *</Label>
                                                    <Input value={contactoForm.telefono} onChange={e => { setContactoForm(f => ({ ...f, telefono: e.target.value })); clearContactoRequiredInvalid('telefono') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(contactoForm.telefono ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${contactoRequiredInvalid.telefono ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={contactoErrors.telefono} className="mt-1" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Calle *</Label>
                                                <Input value={contactoForm.calle} onChange={e => { setContactoForm(f => ({ ...f, calle: e.target.value })); clearContactoRequiredInvalid('calle') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(contactoForm.calle ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${contactoRequiredInvalid.calle ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                <InputError messages={contactoErrors.calle} className="mt-1" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Núm. exterior *</Label>
                                                    <Input value={contactoForm.numero_exterior} onChange={e => { setContactoForm(f => ({ ...f, numero_exterior: e.target.value })); clearContactoRequiredInvalid('numero_exterior') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(contactoForm.numero_exterior ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${contactoRequiredInvalid.numero_exterior ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={contactoErrors.numero_exterior} className="mt-1" />
                                                </div>
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Núm. interior (Opcional)</Label>
                                                    <Input value={contactoForm.numero_interior} onChange={e => setContactoForm(f => ({ ...f, numero_interior: e.target.value }))} className={`mt-1.5 w-full rounded-lg ${String(contactoForm.numero_interior ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Colonia *</Label>
                                                <Input value={contactoForm.colonia} onChange={e => { setContactoForm(f => ({ ...f, colonia: e.target.value })); clearContactoRequiredInvalid('colonia') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(contactoForm.colonia ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${contactoRequiredInvalid.colonia ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                <InputError messages={contactoErrors.colonia} className="mt-1" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ciudad *</Label>
                                                    <Input value={contactoForm.ciudad} onChange={e => { setContactoForm(f => ({ ...f, ciudad: e.target.value })); clearContactoRequiredInvalid('ciudad') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(contactoForm.ciudad ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${contactoRequiredInvalid.ciudad ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={contactoErrors.ciudad} className="mt-1" />
                                                </div>
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Estado *</Label>
                                                    <Input value={contactoForm.estado} onChange={e => { setContactoForm(f => ({ ...f, estado: e.target.value })); clearContactoRequiredInvalid('estado') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(contactoForm.estado ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${contactoRequiredInvalid.estado ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={contactoErrors.estado} className="mt-1" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Código postal * (5 dígitos)</Label>
                                                <Input value={contactoForm.codigo_postal} onChange={e => { setContactoForm(f => ({ ...f, codigo_postal: e.target.value })); clearContactoRequiredInvalid('codigo_postal') }} maxLength={5} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(contactoForm.codigo_postal ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${contactoRequiredInvalid.codigo_postal ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                <InputError messages={contactoErrors.codigo_postal} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Referencias (Opcional)</Label>
                                                <Input value={contactoForm.referencias} onChange={e => setContactoForm(f => ({ ...f, referencias: e.target.value }))} className={`mt-1.5 w-full rounded-lg ${String(contactoForm.referencias ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="Entre calles, etc." />
                                            </div>
                                            <InputError messages={contactoErrors.general} />
                                            <div className="flex justify-end gap-3 pt-4">
                                                <Button type="button" onClick={closeContactoModal} className="inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors border border-gray-500 hover:border-gray-600">
                                                    <span className="relative block w-5 h-5 shrink-0">
                                                        <Image src="/Imagenes/icon_cerrar_sesion.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                    </span>
                                                    Cancelar
                                                </Button>
                                                <Button type="submit" disabled={contactoSubmitting} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 border border-[#FF9500]/50 shadow-lg shadow-[#FF8000]/20">
                                                    <span className="relative block w-5 h-5 shrink-0">
                                                        <Image src="/Imagenes/icon_guardar.png" alt="" fill className="object-contain brightness-0 invert" />
                                                    </span>
                                                    {contactoSubmitting ? 'Guardando…' : 'Guardar'}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Tab: DATOS DE FACTURACIÓN */}
                        {activeTab === 'facturacion' && (() => {
                            const datosOrdenados = [...datosFacturacion].sort((a, b) => (b.es_principal ? 1 : 0) - (a.es_principal ? 1 : 0))
                            const totalPaginasFacturacion = Math.max(1, Math.ceil(datosOrdenados.length / FACTURACION_POR_PAGINA))
                            const paginaFacturacion = Math.min(Math.max(1, facturacionPaginaActual), totalPaginasFacturacion)
                            const inicioFacturacion = (paginaFacturacion - 1) * FACTURACION_POR_PAGINA
                            const datosFacturacionPagina = datosOrdenados.slice(inicioFacturacion, inicioFacturacion + FACTURACION_POR_PAGINA)
                            return (
                            <div className={`rounded-xl shadow-2xl p-6 md:p-8 border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                                darkMode 
                                    ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700 shadow-[#FF8000]/10' 
                                    : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 shadow-[#FF8000]/5'
                            }`}>
                                <div className="space-y-4">
                                    {datosFacturacionPagina.map((d) => (
                                        <div key={d.id} className={`relative overflow-hidden rounded-xl border-2 transition-all duration-300 hover:shadow-lg hover:shadow-[#FF8000]/10 hover:-translate-y-0.5 ${
                                            darkMode 
                                                ? 'bg-gradient-to-br from-gray-800 to-gray-900 border-gray-600/80 hover:border-[#FF8000]/40' 
                                                : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:border-[#FF8000]/30'
                                        }`}>
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#FF8000] to-[#FF9500] rounded-l-xl" />
                                            <div className="pl-4 pr-4 py-3 md:pl-4 md:pr-4 md:py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                                <div className="flex-1 min-w-0 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h3 className={`text-base font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{d.razon_social}</h3>
                                                        {d.es_principal && (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FF8000] text-white">Principal</span>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        <div className={`flex items-center gap-2 rounded-lg p-2.5 ${darkMode ? 'bg-gray-700/50' : 'bg-[#FF8000]/5'}`}>
                                                            <span className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${darkMode ? 'bg-[#FF8000]/20' : 'bg-[#FF8000]/15'}`}>
                                                                <svg className="w-3.5 h-3.5 text-[#FF8000]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className={`text-[10px] font-semibold uppercase ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>RFC</p>
                                                                <p className={`text-sm font-bold truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{d.rfc || '—'}</p>
                                                            </div>
                                                        </div>
                                                        <div className={`rounded-lg p-2.5 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/80'}`}>
                                                            <p className={`text-[10px] font-semibold uppercase mb-1 ${darkMode ? 'text-[#FF9500]' : 'text-[#FF8000]'}`}>Dirección fiscal</p>
                                                            <p className={`text-xs font-bold leading-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>{d.calle || '—'}{d.numero_exterior ? ` ${d.numero_exterior}` : ''}{d.numero_interior ? ` int. ${d.numero_interior}` : ''}</p>
                                                            <p className={`text-xs font-medium mt-0.5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{[d.colonia, d.ciudad, d.estado].filter(Boolean).join(' · ') || '—'} {d.codigo_postal ? `CP ${d.codigo_postal}` : ''}</p>
                                                        </div>
                                                    </div>
                                                    {d.email_facturacion && (
                                                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}><span className="font-semibold">Email:</span> {d.email_facturacion}</p>
                                                    )}
                                                </div>
                                                <div className="flex flex-row md:flex-col gap-1.5 shrink-0 items-center">
                                                    {/* Botón principal: si es principal muestra estrella (Quitar de principal); si no, estrella+? (Agregar como principal) */}
                                                    {d.es_principal ? (
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetFacturacionPrincipal(d.id, false)}
                                                                onMouseEnter={() => setFacturacionPrincipalTooltipId(d.id)}
                                                                onMouseLeave={() => setFacturacionPrincipalTooltipId(null)}
                                                                className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${darkMode ? 'border-[#FF8000]/50 bg-[#FF8000]/20 text-[#FF9500]' : 'border-[#FF8000]/50 bg-[#FF8000]/10 text-[#FF8000]'}`}
                                                                aria-label="Quitar de principal"
                                                            >
                                                                <Image src="/Imagenes/icon_estrella.png" alt="" width={18} height={18} className="object-contain" />
                                                            </button>
                                                            {facturacionPrincipalTooltipId === d.id && (
                                                                <div className={`absolute z-10 right-full top-1/2 -translate-y-1/2 mr-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-800 text-white border border-gray-600'}`}>
                                                                    Quitar de principal
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSetFacturacionPrincipal(d.id, true)}
                                                                onMouseEnter={() => setFacturacionPrincipalTooltipId(d.id)}
                                                                onMouseLeave={() => setFacturacionPrincipalTooltipId(null)}
                                                                className={`w-9 h-9 flex items-center justify-center gap-0.5 rounded-lg border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${darkMode ? 'border-gray-600 bg-gray-700/80 hover:bg-[#FF8000]/15 hover:border-[#FF8000]/50 text-gray-400' : 'border-gray-200 bg-white hover:bg-[#FF8000]/10 hover:border-[#FF8000]/50 text-gray-500'}`}
                                                                aria-label="Agregar como principal"
                                                            >
                                                                <Image src="/Imagenes/icon_estrella.png" alt="" width={14} height={14} className="object-contain opacity-70" />
                                                                <span className="text-[10px] font-bold leading-none">?</span>
                                                            </button>
                                                            {facturacionPrincipalTooltipId === d.id && (
                                                                <div className={`absolute z-10 right-full top-1/2 -translate-y-1/2 mr-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shadow-lg ${darkMode ? 'bg-gray-700 text-white border border-gray-600' : 'bg-gray-800 text-white border border-gray-600'}`}>
                                                                    Agregar como principal
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                    <button type="button" onClick={() => openFacturacionEdit(d)} className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#FF8000] focus:ring-offset-2 ${darkMode ? 'border-gray-600 bg-gray-700/80 hover:bg-[#FF8000]/20 hover:border-[#FF8000] text-gray-200' : 'border-gray-200 bg-white hover:bg-[#FF8000]/10 hover:border-[#FF8000] text-gray-700'}`} title="Editar" aria-label="Editar datos de facturación">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                    </button>
                                                    <button type="button" onClick={() => setFacturacionDeleteId(d.id)} className={`w-9 h-9 flex items-center justify-center rounded-lg border transition-all hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 ${darkMode ? 'border-red-500/40 bg-gray-700/80 hover:bg-red-500/20 hover:border-red-500 text-red-400' : 'border-red-200 bg-white hover:bg-red-50 hover:border-red-400 text-red-600'}`} title="Eliminar" aria-label="Eliminar datos de facturación">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {totalPaginasFacturacion > 1 && (() => {
                                    const totalP = totalPaginasFacturacion
                                    const { windowPages, showEllipsis, showLastPage } = getPaginationWindow(paginaFacturacion, totalP)
                                    const btn = (num) => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setFacturacionPaginaActual(num)}
                                            className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${
                                                num === paginaFacturacion
                                                    ? 'bg-gradient-to-r from-[#FF8000] to-[#FF9500] text-white shadow-md focus:ring-[#FF8000]'
                                                    : darkMode
                                                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500'
                                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    )
                                    return (
                                        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                                            {totalP > 1 && paginaFacturacion > 1 && (
                                                <button key="first" type="button" onClick={() => setFacturacionPaginaActual(1)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'}`} title="Ir a la primera página">&laquo;&laquo;</button>
                                            )}
                                            {windowPages.map((num) => btn(num))}
                                            {showEllipsis && <span className={`min-w-[2.5rem] h-10 px-2 flex items-center justify-center rounded-lg text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>...</span>}
                                            {showLastPage && totalP > 7 && btn(totalP)}
                                            {totalP > 1 && paginaFacturacion < totalP && (
                                                <button key="last" type="button" onClick={() => setFacturacionPaginaActual(totalP)} className={`min-w-[2.5rem] h-10 px-3 rounded-lg font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 border border-gray-600 focus:ring-gray-500' : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-300 focus:ring-gray-400'}`} title="Ir a la última página">&raquo;&raquo;</button>
                                            )}
                                        </div>
                                    )
                                })()}
                                <div className="mt-6 text-center">
                                    <Button type="button" onClick={openFacturacionCreate} className="bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transform transition-all duration-300 hover:scale-105 active:scale-95">
                                        <span className="mr-2 text-xl">+</span>
                                        Ingresar nuevos datos
                                    </Button>
                                </div>
                            </div>
                            )
                        })()}

                        {/* Modal confirmar eliminar datos de facturación */}
                        {facturacionDeleteId != null && (
                            <>
                                <div className="fixed inset-0 z-50 bg-black/50" onClick={() => setFacturacionDeleteId(null)} aria-hidden />
                                <div className={`fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:max-w-sm w-full rounded-xl shadow-2xl border-2 p-6 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                    <p className={`text-center font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>¿Eliminar estos datos de facturación?</p>
                                    <div className="flex gap-3 justify-center">
                                        <Button type="button" onClick={() => setFacturacionDeleteId(null)} className="px-5 py-2.5 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-medium">
                                            Cancelar
                                        </Button>
                                        <Button type="button" onClick={() => handleFacturacionDelete(facturacionDeleteId)} className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium">
                                            Eliminar
                                        </Button>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Modal Datos de facturación */}
                        {facturacionModal && (
                            <>
                                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={closeFacturacionModal} />
                                <div className={`fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:max-w-xl w-full max-h-[90vh] overflow-hidden flex flex-col rounded-2xl shadow-2xl sm:border-2 ${darkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-b from-white to-gray-50 border-gray-200'} ring-4 ${darkMode ? 'ring-[#FF8000]/20' : 'ring-[#FF8000]/10'}`}>
                                    <div className={`flex-none flex items-center justify-between px-5 py-4 border-b-2 ${darkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-white/80'} rounded-t-2xl`}>
                                        <div className="h-1 w-12 rounded-full bg-gradient-to-r from-[#FF8000] to-[#FF9500] shrink-0" aria-hidden />
                                        <h3 className={`text-lg font-bold flex-1 text-center ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {facturacionEditId ? 'Editar datos de facturación' : 'Nuevos datos de facturación'}
                                        </h3>
                                        <button type="button" onClick={closeFacturacionModal} className="w-9 h-9 flex items-center justify-center rounded-lg bg-red-500/15 hover:bg-red-500/30 border border-red-500/50 hover:border-red-500 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-transparent" aria-label="Cerrar">
                                            <span className="relative block w-5 h-5">
                                                <Image src="/Imagenes/icon_cerrar.png" alt="" fill className="object-contain" style={{ filter: 'invert(18%) sepia(98%) saturate(5000%) hue-rotate(350deg) brightness(0.95) contrast(1.1)' }} />
                                            </span>
                                        </button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <form onSubmit={handleFacturacionSubmit} className="space-y-4">
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Razón social *</Label>
                                                <Input value={facturacionForm.razon_social} onChange={e => { setFacturacionForm(f => ({ ...f, razon_social: e.target.value })); clearFacturacionRequiredInvalid('razon_social') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(facturacionForm.razon_social ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${facturacionRequiredInvalid.razon_social ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                <InputError messages={facturacionErrors.razon_social} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>RFC * (12-13 caracteres)</Label>
                                                <Input value={facturacionForm.rfc} onChange={e => { setFacturacionForm(f => ({ ...f, rfc: e.target.value.toUpperCase().replace(/\s/g, '') })); clearFacturacionRequiredInvalid('rfc') }} maxLength={14} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(facturacionForm.rfc ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${facturacionRequiredInvalid.rfc ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                <InputError messages={facturacionErrors.rfc} className="mt-1" />
                                            </div>
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Calle *</Label>
                                                <Input value={facturacionForm.calle} onChange={e => { setFacturacionForm(f => ({ ...f, calle: e.target.value })); clearFacturacionRequiredInvalid('calle') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(facturacionForm.calle ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${facturacionRequiredInvalid.calle ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                <InputError messages={facturacionErrors.calle} className="mt-1" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Núm. exterior *</Label>
                                                    <Input value={facturacionForm.numero_exterior} onChange={e => { setFacturacionForm(f => ({ ...f, numero_exterior: e.target.value })); clearFacturacionRequiredInvalid('numero_exterior') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(facturacionForm.numero_exterior ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${facturacionRequiredInvalid.numero_exterior ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={facturacionErrors.numero_exterior} className="mt-1" />
                                                </div>
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Núm. interior (Opcional)</Label>
                                                    <Input value={facturacionForm.numero_interior} onChange={e => setFacturacionForm(f => ({ ...f, numero_interior: e.target.value }))} className={`mt-1.5 w-full rounded-lg ${String(facturacionForm.numero_interior ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Colonia *</Label>
                                                <Input value={facturacionForm.colonia} onChange={e => { setFacturacionForm(f => ({ ...f, colonia: e.target.value })); clearFacturacionRequiredInvalid('colonia') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(facturacionForm.colonia ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${facturacionRequiredInvalid.colonia ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                <InputError messages={facturacionErrors.colonia} className="mt-1" />
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Ciudad *</Label>
                                                    <Input value={facturacionForm.ciudad} onChange={e => { setFacturacionForm(f => ({ ...f, ciudad: e.target.value })); clearFacturacionRequiredInvalid('ciudad') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(facturacionForm.ciudad ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${facturacionRequiredInvalid.ciudad ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={facturacionErrors.ciudad} className="mt-1" />
                                                </div>
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Estado *</Label>
                                                    <Input value={facturacionForm.estado} onChange={e => { setFacturacionForm(f => ({ ...f, estado: e.target.value })); clearFacturacionRequiredInvalid('estado') }} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(facturacionForm.estado ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${facturacionRequiredInvalid.estado ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={facturacionErrors.estado} className="mt-1" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Código postal * (5 dígitos)</Label>
                                                    <Input value={facturacionForm.codigo_postal} onChange={e => { setFacturacionForm(f => ({ ...f, codigo_postal: e.target.value })); clearFacturacionRequiredInvalid('codigo_postal') }} maxLength={5} className={`mt-1.5 w-full rounded-lg focus:border-[#FF8000] focus:ring-[#FF8000]/30 ${String(facturacionForm.codigo_postal ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} ${facturacionRequiredInvalid.codigo_postal ? '!border-red-500 !ring-2 !ring-red-500/30' : ''}`} />
                                                    <InputError messages={facturacionErrors.codigo_postal} className="mt-1" />
                                                </div>
                                                <div>
                                                    <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Email facturación (Opcional)</Label>
                                                    <Input type="email" value={facturacionForm.email_facturacion} onChange={e => setFacturacionForm(f => ({ ...f, email_facturacion: e.target.value }))} className={`mt-1.5 w-full rounded-lg ${String(facturacionForm.email_facturacion ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                                    <InputError messages={facturacionErrors.email_facturacion} className="mt-1" />
                                                </div>
                                            </div>
                                            <div>
                                                <Label className={`text-sm font-medium ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Teléfono (Opcional)</Label>
                                                <Input value={facturacionForm.telefono} onChange={e => setFacturacionForm(f => ({ ...f, telefono: e.target.value }))} className={`mt-1.5 w-full rounded-lg ${String(facturacionForm.telefono ?? '').trim() ? 'bg-[#E5EBFD] border-[#E5EBFD] text-gray-900' : darkMode ? 'bg-gray-700/80 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                            </div>
                                            <InputError messages={facturacionErrors.general} />
                                            <div className="flex justify-end gap-3 pt-4">
                                                <Button type="button" onClick={closeFacturacionModal} className="inline-flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-5 py-2.5 rounded-lg font-semibold transition-colors border border-gray-500 hover:border-gray-600">
                                                    <span className="relative block w-5 h-5 shrink-0">
                                                        <Image src="/Imagenes/icon_cerrar_sesion.webp" alt="" fill className="object-contain brightness-0 invert" />
                                                    </span>
                                                    Cancelar
                                                </Button>
                                                <Button type="submit" disabled={facturacionSubmitting} className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] text-white px-5 py-2.5 rounded-lg font-semibold disabled:opacity-50 border border-[#FF9500]/50 shadow-lg shadow-[#FF8000]/20">
                                                    <span className="relative block w-5 h-5 shrink-0">
                                                        <Image src="/Imagenes/icon_guardar.png" alt="" fill className="object-contain brightness-0 invert" />
                                                    </span>
                                                    {facturacionSubmitting ? 'Guardando…' : 'Guardar'}
                                                </Button>
                                            </div>
                                        </form>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Tab: CHAT CON VENTAS */}
                        {activeTab === 'chat' && (
                            <div className={`rounded-xl shadow-2xl p-6 md:p-8 border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
                                darkMode
                                    ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700 shadow-[#FF8000]/10'
                                    : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 shadow-[#FF8000]/5'
                            }`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FF8000]/20">
                                        <Image src="/Imagenes/icon_mensaje.png" alt="" width={24} height={24} className="object-contain" />
                                    </div>
                                    <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                        Chat con ventas
                                    </h2>
                                </div>
                                <p className={`text-sm mb-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Escribe aquí y un asesor de ventas te responderá. Tus mensajes aparecen en naranja; las respuestas de ventas en morado.
                                </p>
                                <ChatVentasCliente darkMode={darkMode} />
                            </div>
                        )}

                        {/* Tab: CAMBIAR CONTRASEÑA */}
                        {activeTab === 'password' && (() => {
                            const passwordChecks = {
                                minLength: nuevaPassword.length >= 8,
                                hasUppercase: /[A-Z]/.test(nuevaPassword),
                                hasLowercase: /[a-z]/.test(nuevaPassword),
                                hasNumber: /\d/.test(nuevaPassword),
                                hasSymbol: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nuevaPassword),
                            }
                            const passwordRequirements = [
                                { key: 'minLength', label: 'Mínimo 8 caracteres', met: passwordChecks.minLength },
                                { key: 'hasUppercase', label: 'Al menos una mayúscula', met: passwordChecks.hasUppercase },
                                { key: 'hasLowercase', label: 'Al menos una minúscula', met: passwordChecks.hasLowercase },
                                { key: 'hasNumber', label: 'Al menos un número', met: passwordChecks.hasNumber },
                                { key: 'hasSymbol', label: 'Al menos un carácter especial (!@#$%&*...)', met: passwordChecks.hasSymbol },
                            ]
                            const nuevaCumpleRequisitos = passwordChecks.minLength && passwordChecks.hasUppercase && passwordChecks.hasLowercase && passwordChecks.hasNumber && passwordChecks.hasSymbol
                            const canSubmitPassword = !!passwordActual.trim() && nuevaCumpleRequisitos && nuevaPassword === repetirPassword
                            const inputBase = (filled, dark) =>
                                dark
                                    ? (filled ? 'bg-[#E5EBFD] border-2 border-gray-600 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-gray-700/80 border-2 border-gray-600 text-white placeholder-gray-400 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                                    : (filled ? 'bg-[#E5EBFD] border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20' : 'bg-white border-2 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-[#FF8000] focus:ring-2 focus:ring-[#FF8000]/20')
                            return (
                                <div className={`rounded-xl shadow-2xl border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 overflow-hidden ${
                                    darkMode
                                        ? 'bg-gradient-to-br from-gray-800 via-gray-800 to-gray-900 border-gray-700 shadow-[#FF8000]/10'
                                        : 'bg-gradient-to-br from-white via-gray-50 to-white border-gray-200 shadow-[#FF8000]/5'
                                }`}>
                                    <div className="px-6 pt-6 pb-2">
                                        <div className="h-1 w-24 rounded-full bg-gradient-to-r from-[#FF8000] to-[#FF9500] mb-4" />
                                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Cambiar contraseña</h3>
                                        <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                            La nueva contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial (por ejemplo @, #, $).
                                        </p>
                                    </div>
                                    <form onSubmit={handleCambiarPassword} className="p-6 md:p-8 pt-2 max-w-md mx-auto space-y-5">
                                        {/* Contraseña actual */}
                                        <div>
                                            <Label htmlFor="passwordActual" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                                Contraseña actual
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="passwordActual"
                                                    type={showPasswordActual ? 'text' : 'password'}
                                                    value={passwordActual}
                                                    onChange={(e) => setPasswordActual(e.target.value)}
                                                    className={`block w-full px-4 py-3 pr-12 rounded-lg text-sm transition-all duration-200 ${inputBase(!!passwordActual.trim(), darkMode)}`}
                                                    required
                                                    autoComplete="current-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowPasswordActual((s) => !s)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#FF8000]/50"
                                                    aria-label={showPasswordActual ? 'Ocultar contraseña' : 'Ver contraseña'}
                                                    tabIndex={0}
                                                >
                                                    <Image src={showPasswordActual ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                                </button>
                                            </div>
                                            <InputError messages={passwordErrors.current_password} className="mt-1.5" />
                                        </div>
                                        {/* Nueva contraseña + modal requisitos */}
                                        <div>
                                            <Label htmlFor="nuevaPassword" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                                Nueva contraseña
                                            </Label>
                                            <div className={`relative ${showNuevaPasswordModal ? 'z-[60]' : ''}`}>
                                                <Input
                                                    id="nuevaPassword"
                                                    type={showNuevaPassword ? 'text' : 'password'}
                                                    value={nuevaPassword}
                                                    onChange={(e) => setNuevaPassword(e.target.value)}
                                                    className={`block w-full px-4 py-3 pr-12 rounded-lg text-sm transition-all duration-200 ${inputBase(!!nuevaPassword.trim(), darkMode)}`}
                                                    onFocus={() => setShowNuevaPasswordModal(true)}
                                                    onBlur={() => setTimeout(() => setShowNuevaPasswordModal(false), 180)}
                                                    required
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNuevaPassword((s) => !s)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#FF8000]/50"
                                                    aria-label={showNuevaPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                                    tabIndex={0}
                                                >
                                                    <Image src={showNuevaPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                                </button>
                                                {showNuevaPasswordModal && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowNuevaPasswordModal(false)} />
                                                        <div className={`absolute left-full top-1/2 z-50 w-56 max-w-[14rem] -translate-y-1/2 ml-1.5 rounded-xl border-2 shadow-xl transition-all duration-200 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`} role="dialog" aria-labelledby="password-requirements-title" aria-describedby="password-requirements-desc">
                                                            <div className="p-3">
                                                                <p id="password-requirements-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Requisitos de la contraseña</p>
                                                                <ul id="password-requirements-desc" className="space-y-1.5">
                                                                    {passwordRequirements.map(({ key, label, met }) => (
                                                                        <li key={key} className={`flex items-center gap-2 text-sm transition-colors duration-200 ${met ? 'text-green-600 dark:text-green-400' : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                                                                            <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-200 ${met ? 'border-green-500 bg-green-500 text-white dark:border-green-400 dark:bg-green-400' : (darkMode ? 'border-red-400 bg-transparent' : 'border-red-500 bg-transparent')}`} aria-hidden>
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
                                            <InputError messages={passwordErrors.password} className="mt-1.5" />
                                        </div>
                                        {/* Repetir contraseña + modal coincide/no coincide */}
                                        <div>
                                            <Label htmlFor="repetirPassword" className={`text-sm font-medium mb-1.5 block ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                                                Repetir contraseña
                                            </Label>
                                            <div className={`relative ${showRepetirPasswordModal ? 'z-[60]' : ''}`}>
                                                <Input
                                                    id="repetirPassword"
                                                    type={showRepetirPassword ? 'text' : 'password'}
                                                    value={repetirPassword}
                                                    onChange={(e) => setRepetirPassword(e.target.value)}
                                                    className={`block w-full px-4 py-3 pr-12 rounded-lg text-sm transition-all duration-200 ${inputBase(!!repetirPassword.trim(), darkMode)}`}
                                                    onFocus={() => setShowRepetirPasswordModal(true)}
                                                    onBlur={() => setTimeout(() => setShowRepetirPasswordModal(false), 180)}
                                                    required
                                                    autoComplete="new-password"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowRepetirPassword((s) => !s)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#FF8000]/50"
                                                    aria-label={showRepetirPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                                                    tabIndex={0}
                                                >
                                                    <Image src={showRepetirPassword ? '/Imagenes/icon_ojo_cerrado.png' : '/Imagenes/icon_ojo_abierto.png'} alt="" width={22} height={22} className="object-contain" />
                                                </button>
                                                {showRepetirPasswordModal && (
                                                    <>
                                                        <div className="fixed inset-0 z-40" aria-hidden onClick={() => setShowRepetirPasswordModal(false)} />
                                                        <div className={`absolute left-full top-1/2 z-50 w-56 max-w-[14rem] -translate-y-1/2 ml-1.5 rounded-xl border-2 shadow-xl transition-all duration-200 ${darkMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-white'}`} role="dialog" aria-labelledby="confirm-password-modal-title" aria-describedby="confirm-password-modal-desc">
                                                            <div className="p-3">
                                                                <p id="confirm-password-modal-title" className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>Confirmar contraseña</p>
                                                                <div id="confirm-password-modal-desc">
                                                                    {repetirPassword.length === 0 ? (
                                                                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Escribe la misma contraseña para confirmar.</p>
                                                                    ) : nuevaPassword === repetirPassword ? (
                                                                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                                                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-500 text-white">
                                                                                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 12 12"><path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" /></svg>
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
                                            <InputError messages={passwordErrors.repetirPassword} className="mt-1.5" />
                                        </div>
                                        {passwordSuccess && (
                                            <p className="text-center text-emerald-600 dark:text-emerald-400 font-medium text-sm">Contraseña actualizada correctamente.</p>
                                        )}
                                        <div className="text-center pt-2">
                                            <Button
                                                type="submit"
                                                disabled={!canSubmitPassword}
                                                className={`px-10 py-3 rounded-xl font-bold shadow-lg transform transition-all duration-300 ${canSubmitPassword ? 'bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] text-white hover:shadow-xl hover:scale-105 active:scale-95 cursor-pointer' : 'bg-gray-400 dark:bg-gray-600 text-gray-200 dark:text-gray-400 cursor-not-allowed opacity-70'}`}
                                            >
                                                Cambiar contraseña
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            )
                        })()}
                    </div>
                </div>
            </main>

            {/* Modal detalle pedido */}
            {detallePedidoId != null && (
                <>
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" onClick={() => setDetallePedidoId(null)} />
                    <div className={`fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 z-50 sm:max-w-xl w-full rounded-2xl shadow-2xl ring-2 ring-[#FF8000]/20 overflow-hidden max-h-[90vh] flex flex-col ${darkMode ? 'bg-gradient-to-b from-gray-800 to-gray-900 border border-gray-700' : 'bg-gradient-to-b from-white to-gray-50 border border-gray-200'}`}>
                        {/* Header con barra naranja */}
                        <div className="shrink-0 flex items-center justify-between pr-2 pl-4 py-3 bg-gradient-to-r from-[#FF8000]/15 via-[#FF8000]/10 to-transparent border-b border-[#FF8000]/30">
                            <h3 className={`text-xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                                Pedido {detallePedido?.folio ?? '…'}
                            </h3>
                            <button type="button" onClick={() => setDetallePedidoId(null)} className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors" aria-label="Cerrar">
                                <span className="text-xl leading-none">×</span>
                            </button>
                        </div>
                        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
                            {!detallePedido ? (
                                <div className="flex items-center justify-center py-12">
                                    <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Cargando…</p>
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    {/* Resumen en bloques */}
                                    <div className={`grid grid-cols-2 gap-3 rounded-xl p-4 ${darkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-100/80 border border-gray-200'}`}>
                                        <div>
                                            <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Fecha</p>
                                            <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{detallePedido.fecha}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Monto</p>
                                            <p className={`font-semibold ${darkMode ? 'text-[#FF8000]' : 'text-[#e67300]'}`}>$ {Number(detallePedido.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Método de pago</p>
                                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{detallePedido.metodo_pago}</p>
                                        </div>
                                        <div>
                                            <p className={`text-xs font-medium uppercase tracking-wider mb-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Estado</p>
                                            <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{detallePedido.estado_pago} · {detallePedido.estatus_pedido}</p>
                                        </div>
                                    </div>
                                    {/* Productos en tabla */}
                                    <div>
                                        <p className={`font-semibold mb-2 text-sm uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Productos</p>
                                        <div className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                            <table className="w-full text-sm">
                                                <thead className={darkMode ? 'bg-gray-700/80' : 'bg-gray-100'}>
                                                    <tr>
                                                        <th className={`px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wider ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Producto</th>
                                                        <th className={`px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider w-16 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Cant.</th>
                                                        <th className={`px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider w-24 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className={darkMode ? 'divide-y divide-gray-600' : 'divide-y divide-gray-200'}>
                                                    {(detallePedido.items || []).map((it, i) => (
                                                        <tr key={i} className={darkMode ? 'bg-gray-800/50' : 'bg-white'}>
                                                            <td className={`px-3 py-2.5 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{it.nombre_producto}</td>
                                                            <td className={`px-3 py-2.5 text-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{it.cantidad}</td>
                                                            <td className={`px-3 py-2.5 text-right font-medium ${darkMode ? 'text-[#FF8000]' : 'text-[#e67300]'}`}>$ {Number(it.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    {/* Botón Descargar PDF */}
                                    <div className="pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { handleDescargarPdf(detallePedido.id ?? detallePedidoId, detallePedido.folio); setDetallePedidoId(null); }}
                                            className="w-full py-3 px-4 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] shadow-lg shadow-[#FF8000]/25 inline-flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            <div className="relative w-5 h-5 shrink-0">
                                                <Image src="/Imagenes/icon_descarga.webp" alt="" fill className="object-contain brightness-0 invert" />
                                            </div>
                                            Descargar PDF
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* Footer */}
            <footer className={`border-t transition-colors duration-300 ${
                darkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {/* Información de Contacto */}
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="relative w-8 h-8">
                                    <Image
                                        src="/Imagenes/icon_contacto.png"
                                        alt="Contacto"
                                        fill
                                        className={`object-contain ${
                                            darkMode ? 'brightness-0 invert' : ''
                                        }`}
                                    />
                                </div>
                                <h3 className={`text-xl font-bold ${
                                    darkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                    Contáctanos
                                </h3>
                            </div>
                            <div className={`space-y-2 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <p className="text-lg font-semibold text-[#FF8000]">333 616-7279</p>
                                <p className="text-base">desarrollo@nxt.it.com</p>
                                <p className="text-sm leading-relaxed">
                                    Av. Lopez Mateos #1038-11, Col Italia Providencia CP 44630<br />
                                    Jalisco, Guadalajara
                                </p>
                            </div>
                        </div>

                        {/* Enlaces Rápidos */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Enlaces rápidos
                            </h3>
                            <ul className={`space-y-2 ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <li>
                                    <Link href="/" className="hover:text-[#FF8000] transition-colors">
                                        Inicio
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/tienda" className="hover:text-[#FF8000] transition-colors">
                                        Tienda
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/dashboard" className="hover:text-[#FF8000] transition-colors">
                                        Home
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        {/* Información de la Empresa */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Sobre nosotros
                            </h3>
                            <p className={`text-sm leading-relaxed ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                Fundada en 2009 como Arrcuss Comercial de S de RL de CV, ahora NXT.IT, 
                                nació como un proyecto emprendedor para democratizar la creciente necesidad 
                                por equipo de cómputo y electrónica de las PYMES.
                            </p>
                        </div>

                        {/* Redes Sociales / Información Adicional */}
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${
                                darkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                                Información
                            </h3>
                            <div className={`space-y-2 text-sm ${
                                darkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                                <p>
                                    <span className="font-semibold">Misión:</span> Incrementar las capacidades 
                                    de nuestros clientes mediante innovadoras soluciones de software, hardware 
                                    y tecnología de consumo.
                                </p>
                                <p>
                                    <span className="font-semibold">Visión:</span> Ser una empresa reconocida 
                                    por su liderazgo en el mercado de Tecnologías de la Información.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Copyright */}
                    <div className={`mt-8 pt-8 border-t text-center text-sm ${
                        darkMode ? 'border-gray-800 text-gray-400' : 'border-gray-200 text-gray-600'
                    }`}>
                        <p>&copy; {new Date().getFullYear()} NXT.IT. Todos los derechos reservados.</p>
                    </div>
                </div>
            </footer>

            <CheckoutModal
                open={pagarCotizacionModalOpen}
                onClose={() => !checkoutCotizacionLoading && setPagarCotizacionModalOpen(false)}
                darkMode={darkMode}
                onConfirm={(payload) => {
                    setCheckoutCotizacionLoading(true)
                    setCheckoutCotizacionError(null)
                    try {
                        // TODO: enviar payload al backend para convertir cotización en pedido
                        setPagarCotizacionModalOpen(false)
                    } catch (err) {
                        setCheckoutCotizacionError(err?.message || 'Error al crear el pedido')
                    } finally {
                        setCheckoutCotizacionLoading(false)
                    }
                }}
                loading={checkoutCotizacionLoading}
                error={checkoutCotizacionError}
            />
        </div>
    )
}

export default Dashboard
