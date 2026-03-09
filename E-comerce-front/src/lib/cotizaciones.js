'use client'

import { useState, useEffect, useCallback } from 'react'
import { getOrCreateGuestId } from '@/lib/guestId'

const COTIZACION_MODE_KEY = 'cotizacion_modo_activo'
const COTIZACION_ITEMS_KEY = 'cotizacion_items'
const COTIZACIONES_GUARDADAS_KEY = 'cotizaciones_guardadas'
const COTIZACIONES_PAPELERA_KEY = 'cotizaciones_papelera'
const COTIZACION_CHANGE_EVENT = 'cotizacionChange'
const DIAS_PAPELERA = 30

/**
 * Modo cotización: activado/desactivado.
 * - Invitado: persistido en localStorage por guestId (cotizacion_modo_activo_guest_xxx).
 * - Usuario logueado: persistido en localStorage por usuario (cotizacion_modo_activo_${userId}).
 */
export function getModoCotizacion(userId) {
    if (typeof window === 'undefined') return false
    if (userId == null || userId === '') return false
    try {
        const v = localStorage.getItem(`${COTIZACION_MODE_KEY}_${userId}`)
        return v === 'true'
    } catch {
        return false
    }
}

export function setModoCotizacion(activo, userId) {
    if (typeof window === 'undefined') return
    if (userId == null || userId === '') return
    try {
        localStorage.setItem(`${COTIZACION_MODE_KEY}_${userId}`, String(activo))
        window.dispatchEvent(new CustomEvent(COTIZACION_CHANGE_EVENT, { detail: { type: 'modo', activo, userId } }))
    } catch {}
}

export function toggleModoCotizacion(userId) {
    if (userId == null || userId === '') return false
    const next = !getModoCotizacion(userId)
    setModoCotizacion(next, userId)
    return next
}

/**
 * Ítems de la cotización actual (selección temporal): { clave, cantidad }[].
 * Persistido en localStorage por usuario/invitado (cotizacion_items_${userId}) para no mezclar sesiones.
 */
export function getCotizacionItems(userId) {
    if (typeof window === 'undefined' || userId == null || userId === '') return []
    try {
        const raw = localStorage.getItem(`${COTIZACION_ITEMS_KEY}_${userId}`)
        if (!raw) return []
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr : []
    } catch {
        return []
    }
}

export function setCotizacionItems(items, userId) {
    if (typeof window === 'undefined' || userId == null || userId === '') return
    try {
        const list = items.filter((i) => i && i.clave && (Number(i.cantidad) || 0) > 0)
        localStorage.setItem(`${COTIZACION_ITEMS_KEY}_${userId}`, JSON.stringify(list))
        window.dispatchEvent(new CustomEvent(COTIZACION_CHANGE_EVENT, { detail: { type: 'items', userId } }))
    } catch {}
}

export function addCotizacionItem(clave, cantidad = 1, userId) {
    if (userId == null || userId === '') return
    const items = getCotizacionItems(userId)
    const idx = items.findIndex((i) => i.clave === clave)
    const q = Math.max(1, Number(cantidad) || 1)
    if (idx >= 0) {
        items[idx].cantidad = q
    } else {
        items.push({ clave, cantidad: q })
    }
    setCotizacionItems(items, userId)
}

export function removeCotizacionItem(clave, userId) {
    if (userId == null || userId === '') return
    setCotizacionItems(getCotizacionItems(userId).filter((i) => i.clave !== clave), userId)
}

export function setCotizacionCantidad(clave, cantidad, userId) {
    if (userId == null || userId === '') return
    const q = Math.max(0, Number(cantidad) || 0)
    if (q <= 0) {
        removeCotizacionItem(clave, userId)
        return
    }
    addCotizacionItem(clave, q, userId)
}

export function isInCotizacion(clave, userId) {
    if (userId == null || userId === '') return false
    return getCotizacionItems(userId).some((i) => i.clave === clave)
}

export function getCotizacionCantidad(clave, userId) {
    if (userId == null || userId === '') return 0
    const item = getCotizacionItems(userId).find((i) => i.clave === clave)
    return item ? Number(item.cantidad) || 1 : 0
}

export function getCotizacionCount(userId) {
    if (userId == null || userId === '') return 0
    return getCotizacionItems(userId).reduce((s, i) => s + (Number(i.cantidad) || 0), 0)
}

/**
 * Id efectivo: usuario logueado (user.id) o visitante (guestId). Usar en guardadas/papelera.
 */
export function getEffectiveUserId(user) {
    return user?.id ?? (typeof window !== 'undefined' ? getOrCreateGuestId() : null)
}

/**
 * Cotizaciones guardadas (historial): por usuario o visitante (userId = user?.id ?? guestId).
 */
export function getCotizacionesGuardadas(userId) {
    if (typeof window === 'undefined') return []
    const uid = userId ?? getOrCreateGuestId()
    if (!uid) return []
    try {
        const key = `${COTIZACIONES_GUARDADAS_KEY}_${uid}`
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr : []
    } catch {
        return []
    }
}

export function saveCotizacionActual(itemsConProducto, total, userId) {
    const uid = userId ?? getOrCreateGuestId()
    if (!uid) return null
    const list = getCotizacionesGuardadas(uid)
    const id = `cot-${Date.now()}`
    const cot = {
        id,
        fecha: new Date().toISOString(),
        items: itemsConProducto,
        total: total ?? 0,
    }
    list.unshift(cot)
    try {
        localStorage.setItem(`${COTIZACIONES_GUARDADAS_KEY}_${uid}`, JSON.stringify(list))
    } catch {}
    return cot
}

export function getCotizacionGuardadaById(id, userId) {
    const uid = userId ?? getOrCreateGuestId()
    return getCotizacionesGuardadas(uid).find((c) => c.id === id)
}

/**
 * Actualiza una cotización guardada (ítems, total).
 * Opciones: { setFechaEditada } — si true (por defecto), actualiza fecha_editada; si false, solo actualiza ítems y total (no muestra "Cotización editada" hasta que el usuario pulse Guardar).
 */
export function updateCotizacionGuardada(id, { items, total }, opts = {}, userId) {
    const uid = userId ?? getOrCreateGuestId()
    if (!uid) return false
    const { setFechaEditada = true } = opts
    const list = getCotizacionesGuardadas(uid)
    const idx = list.findIndex((c) => c.id === id)
    if (idx < 0) return false
    const cot = list[idx]
    const updated = {
        ...cot,
        items: items ?? cot.items,
        total: total ?? cot.total,
        ...(setFechaEditada ? { fecha_editada: new Date().toISOString() } : {}),
    }
    list[idx] = updated
    try {
        localStorage.setItem(`${COTIZACIONES_GUARDADAS_KEY}_${uid}`, JSON.stringify(list))
        window.dispatchEvent(new CustomEvent(COTIZACION_CHANGE_EVENT, { detail: { type: 'guardadas' } }))
    } catch {
        return false
    }
    return true
}

/**
 * Papelera: cotizaciones eliminadas. 30 días para restaurar. Por usuario o visitante.
 */
function getPapeleraRaw(userId) {
    if (typeof window === 'undefined') return []
    const uid = userId ?? getOrCreateGuestId()
    if (!uid) return []
    try {
        const key = `${COTIZACIONES_PAPELERA_KEY}_${uid}`
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr : []
    } catch {
        return []
    }
}

function setPapeleraRaw(list, userId) {
    if (typeof window === 'undefined') return
    const uid = userId ?? getOrCreateGuestId()
    if (!uid) return
    try {
        localStorage.setItem(`${COTIZACIONES_PAPELERA_KEY}_${uid}`, JSON.stringify(list))
        window.dispatchEvent(new CustomEvent(COTIZACION_CHANGE_EVENT, { detail: { type: 'papelera' } }))
    } catch {}
}

export function getCotizacionesPapelera(userId) {
    const uid = userId ?? getOrCreateGuestId()
    const raw = getPapeleraRaw(uid)
    const now = Date.now()
    return raw
        .map((c) => {
            const deletedAt = c.deleted_at ? new Date(c.deleted_at).getTime() : now
            const diasRestantes = DIAS_PAPELERA - Math.floor((now - deletedAt) / 86400000)
            return { ...c, dias_para_restaurar: Math.max(0, diasRestantes) }
        })
        .sort((a, b) => (b.deleted_at || '').localeCompare(a.deleted_at || ''))
}

export function moveCotizacionToPapelera(id, userId) {
    const uid = userId ?? getOrCreateGuestId()
    if (!uid) return false
    const list = getCotizacionesGuardadas(uid)
    const cot = list.find((c) => c.id === id)
    if (!cot) return false
    const newList = list.filter((c) => c.id !== id)
    try {
        localStorage.setItem(`${COTIZACIONES_GUARDADAS_KEY}_${uid}`, JSON.stringify(newList))
    } catch {
        return false
    }
    const papelera = getPapeleraRaw(uid)
    papelera.push({ ...cot, deleted_at: new Date().toISOString() })
    setPapeleraRaw(papelera, uid)
    window.dispatchEvent(new CustomEvent(COTIZACION_CHANGE_EVENT, { detail: { type: 'guardadas' } }))
    return true
}

export function restoreCotizacionFromPapelera(id, userId) {
    const uid = userId ?? getOrCreateGuestId()
    if (!uid) return false
    const papelera = getPapeleraRaw(uid)
    const cot = papelera.find((c) => c.id === id)
    if (!cot) return false
    const deletedAt = cot.deleted_at ? new Date(cot.deleted_at).getTime() : 0
    const diasRestantes = DIAS_PAPELERA - Math.floor((Date.now() - deletedAt) / 86400000)
    if (diasRestantes <= 0) return false
    const { deleted_at, ...rest } = cot
    const guardadas = getCotizacionesGuardadas(uid)
    guardadas.unshift(rest)
    try {
        localStorage.setItem(`${COTIZACIONES_GUARDADAS_KEY}_${uid}`, JSON.stringify(guardadas))
    } catch {
        return false
    }
    const newPapelera = papelera.filter((c) => c.id !== id)
    setPapeleraRaw(newPapelera, uid)
    window.dispatchEvent(new CustomEvent(COTIZACION_CHANGE_EVENT, { detail: { type: 'guardadas' } }))
    return true
}

export { COTIZACION_CHANGE_EVENT }

/**
 * Hook para modo cotización y ítems (reactivo a cambios vía evento).
 * Invitados usan un guestId en localStorage como "token temporal" para persistir el modo por visitante.
 * @param {object|null} user - Usuario logueado (con .id). Si null/undefined (invitado), se usa guestId de localStorage.
 */
export function useCotizacion(user) {
    const effectiveUserId = user?.id ?? (typeof window !== 'undefined' ? getOrCreateGuestId() : null)
    const [modoActivo, setModoActivo] = useState(false)
    const [items, setItems] = useState([])

    useEffect(() => {
        if (effectiveUserId) setModoActivo(getModoCotizacion(effectiveUserId))
    }, [effectiveUserId])

    const refresh = useCallback(() => {
        if (typeof window === 'undefined') return
        if (effectiveUserId) setModoActivo(getModoCotizacion(effectiveUserId))
        setItems(effectiveUserId ? getCotizacionItems(effectiveUserId) : [])
    }, [effectiveUserId])

    useEffect(() => {
        refresh()
    }, [refresh])

    useEffect(() => {
        if (typeof window === 'undefined') return
        const handler = () => refresh()
        window.addEventListener(COTIZACION_CHANGE_EVENT, handler)
        return () => window.removeEventListener(COTIZACION_CHANGE_EVENT, handler)
    }, [refresh])

    const toggleModo = useCallback(() => {
        if (!effectiveUserId) return false
        const next = toggleModoCotizacion(effectiveUserId)
        setModoActivo(next)
        return next
    }, [effectiveUserId])

    const setCantidad = useCallback((clave, cantidad) => {
        if (!effectiveUserId) return
        setCotizacionCantidad(clave, cantidad, effectiveUserId)
        setItems(getCotizacionItems(effectiveUserId))
    }, [effectiveUserId])

    const toggleItem = useCallback((clave, checked, cantidad = 1) => {
        if (!effectiveUserId) return
        if (checked) {
            addCotizacionItem(clave, cantidad, effectiveUserId)
        } else {
            removeCotizacionItem(clave, effectiveUserId)
        }
        setItems(getCotizacionItems(effectiveUserId))
    }, [effectiveUserId])

    const clearItems = useCallback(() => {
        if (!effectiveUserId) return
        setCotizacionItems([], effectiveUserId)
        setItems([])
    }, [effectiveUserId])

    const removeItem = useCallback((clave) => {
        if (!effectiveUserId) return
        removeCotizacionItem(clave, effectiveUserId)
        setItems(getCotizacionItems(effectiveUserId))
    }, [effectiveUserId])

    const cantidad = useCallback(
        (clave) => {
            const item = items.find((i) => i.clave === clave)
            return item ? Number(item.cantidad) || 1 : 0
        },
        [items]
    )
    const isInQuote = useCallback((clave) => items.some((i) => i.clave === clave), [items])
    const count = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0)

    return {
        modoActivo,
        items,
        count,
        toggleModo,
        setCantidad,
        toggleItem,
        clearItems,
        removeItem,
        cantidad,
        isInQuote,
        refresh,
    }
}
