import { useState, useCallback, useEffect, useRef } from 'react'
import useSWR from 'swr'
import axios from '@/lib/axios'
import { getOrCreateGuestId } from '@/lib/guestId'

const CART_GUEST_KEY_PREFIX = 'tienda_carrito_guest_'
const CARRITO_CHANGE_EVENT = 'carritoChange'

/**
 * Carrito invitado (localStorage): array de { clave, cantidad }.
 * Se guarda por guestId (tienda_carrito_guest_${guestId}) para que cada visitante tenga su propio carrito.
 */
export function getGuestCart(guestId) {
    if (typeof window === 'undefined' || !guestId) return []
    try {
        const raw = localStorage.getItem(`${CART_GUEST_KEY_PREFIX}${guestId}`)
        if (!raw) return []
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr : []
    } catch {
        return []
    }
}

export function setGuestCart(items, guestId) {
    if (typeof window === 'undefined' || !guestId) return
    try {
        localStorage.setItem(`${CART_GUEST_KEY_PREFIX}${guestId}`, JSON.stringify(items))
        window.dispatchEvent(new CustomEvent(CARRITO_CHANGE_EVENT))
    } catch {}
}

export function addGuestCart(clave, cantidad = 1, guestId) {
    if (!guestId) return
    const items = getGuestCart(guestId)
    const i = items.findIndex((x) => x.clave === clave)
    if (i >= 0) {
        items[i].cantidad = Math.max(1, (items[i].cantidad || 1) + cantidad)
    } else {
        items.push({ clave, cantidad: Math.max(1, cantidad) })
    }
    setGuestCart(items, guestId)
}

export function removeGuestCart(clave, guestId) {
    if (!guestId) return
    setGuestCart(getGuestCart(guestId).filter((x) => x.clave !== clave), guestId)
}

/**
 * Establece la cantidad de un ítem en el carrito invitado (min 1).
 */
export function setGuestCartQuantity(clave, cantidad, guestId) {
    if (!guestId) return
    const qty = Math.max(1, Number(cantidad) || 1)
    const items = getGuestCart(guestId)
    const i = items.findIndex((x) => x.clave === clave)
    if (i >= 0) {
        items[i].cantidad = qty
        setGuestCart([...items], guestId)
    }
}

export function getGuestCartCount(guestId) {
    if (!guestId) return 0
    return getGuestCart(guestId).reduce((sum, x) => sum + (Number(x.cantidad) || 0), 0)
}

/**
 * API carrito (usuario logueado).
 */
export async function getCart() {
    const { data } = await axios.get('/carrito')
    if (data?.success && data?.data) return data.data
    return { items: [], total: 0 }
}

export async function addToCart(clave, cantidad = 1) {
    const { data } = await axios.post('/carrito', { clave, cantidad })
    if (data?.success && data?.data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CARRITO_CHANGE_EVENT))
        return data.data
    }
    return { items: [], total: 0 }
}

export async function removeFromCart(clave) {
    const { data } = await axios.delete(`/carrito/items/${encodeURIComponent(clave)}`)
    if (data?.success && data?.data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CARRITO_CHANGE_EVENT))
        return data.data
    }
    return { items: [], total: 0 }
}

export async function checkoutCart(metodo_pago) {
    const { data } = await axios.post('/carrito/checkout', { metodo_pago })
    if (data?.success && data?.data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(CARRITO_CHANGE_EVENT))
        return data.data
    }
    throw new Error(data?.message || 'Error al crear el pedido')
}

export { CARRITO_CHANGE_EVENT }

/**
 * Hook con caché SWR para el carrito (logueado) o estado local (invitado).
 * Invitados usan el mismo guestId que cotizaciones para tener su propio carrito por dispositivo.
 */
export function useCarrito(isLogged) {
    const guestId = !isLogged && typeof window !== 'undefined' ? getOrCreateGuestId() : null

    const { data, mutate, isLoading } = useSWR(
        isLogged ? 'carrito' : null,
        () => getCart(),
        { revalidateOnFocus: false }
    )

    const [guestItems, setGuestItems] = useState([])
    const refreshGuest = useCallback(() => {
        setGuestItems(guestId ? getGuestCart(guestId) : [])
    }, [guestId])
    useEffect(() => {
        refreshGuest()
    }, [refreshGuest])
    useEffect(() => {
        if (typeof window === 'undefined') return
        const handler = () => refreshGuest()
        window.addEventListener(CARRITO_CHANGE_EVENT, handler)
        return () => window.removeEventListener(CARRITO_CHANGE_EVENT, handler)
    }, [refreshGuest])

    // No refetch en CARRITO_CHANGE_EVENT: add/remove ya actualizan con mutate(d).
    // Así la caché no se sobrescribe por un refetch y el ítem recién agregado no desaparece.

    const itemsLogged = data?.items ?? []
    const isInCartLogged = useCallback((clave) => itemsLogged.some((i) => i.clave === clave), [itemsLogged])

    const addLogged = useCallback(
        async (clave, cantidad = 1) => {
            const qty = Math.max(1, Number(cantidad) || 1)
            const existing = itemsLogged.find((i) => i.clave === clave)
            const optimisticItems = existing
                ? itemsLogged.map((i) => (i.clave === clave ? { ...i, cantidad: (Number(i.cantidad) || 1) + qty } : i))
                : [...itemsLogged, { clave, cantidad: qty, nombre_producto: clave, precio_unitario: 0, subtotal: 0, imagen: null }]
            mutate({ items: optimisticItems, total: data?.total ?? 0 }, false)
            try {
                const d = await addToCart(clave, qty)
                if (d?.items && Array.isArray(d.items)) {
                    mutate(d)
                } else if (optimisticItems.length > 0) {
                    // La API devolvió algo raro o vacío pero teníamos ítems: revalidar para no perder el carrito
                    mutate()
                } else {
                    mutate(d || { items: [], total: 0 })
                }
                return d
            } catch {
                mutate()
                throw new Error('Error al agregar al carrito')
            }
        },
        [mutate, itemsLogged, data?.total]
    )

    const removeLogged = useCallback(
        async (clave) => {
            const next = (data?.items ?? []).filter((i) => i.clave !== clave)
            mutate({ items: next, total: data?.total ?? 0 }, false)
            try {
                const d = await removeFromCart(clave)
                if (!d?.items || !Array.isArray(d.items)) {
                    if (next.length > 0) mutate()
                    return d
                }
                const prevItems = data?.items ?? []
                const prevByClave = Object.fromEntries(prevItems.map((i) => [i.clave, i]))
                const mergedItems = d.items.map((item) => ({
                    ...item,
                    imagen: prevByClave[item.clave]?.imagen ?? item.imagen,
                    imagenes: prevByClave[item.clave]?.imagenes ?? item.imagenes,
                    disponible: prevByClave[item.clave]?.disponible ?? item.disponible,
                    disponible_cd: prevByClave[item.clave]?.disponible_cd ?? item.disponible_cd,
                }))
                mutate({ items: mergedItems, total: d?.total ?? 0 })
                return d
            } catch {
                mutate()
                throw new Error('Error al quitar del carrito')
            }
        },
        [mutate, data]
    )

    // Igual que en dashboard "Mis cotizaciones guardadas": editar cantidad solo actualiza la UI;
    // la BD se toca solo al salir del campo (blur) o al hacer Pagar. Sin timer ni consultas por tecla.
    const pendingQuantityRef = useRef({})

    const setQuantityLogged = useCallback(
        (clave, cantidad) => {
            const qty = Math.max(1, Number(cantidad) || 1)
            const optimisticItems = (data?.items ?? []).map((i) =>
                i.clave === clave ? { ...i, cantidad: qty } : i
            )
            mutate({ items: optimisticItems, total: data?.total ?? 0 }, false)
            pendingQuantityRef.current[clave] = { quantity: qty }
        },
        [mutate, data?.items, data?.total]
    )

    const flushQuantityLogged = useCallback((clave) => {
        const prev = pendingQuantityRef.current[clave]
        if (!prev) return Promise.resolve()
        const qty = prev.quantity
        delete pendingQuantityRef.current[clave]
        return addToCart(clave, qty).then((d) => { mutate(d); return d }).catch(() => { mutate(); throw new Error('Error al actualizar cantidad') })
    }, [mutate])

    const flushAllQuantitiesLogged = useCallback(async () => {
        const entries = Object.entries(pendingQuantityRef.current)
        if (entries.length === 0) return
        pendingQuantityRef.current = {}
        const responses = await Promise.all(entries.map(([clave, { quantity }]) => addToCart(clave, quantity)))
        const last = responses.filter(Boolean).pop()
        if (last) mutate(last)
    }, [mutate])

    const addGuest = useCallback((clave, cantidad = 1) => {
        if (!guestId) return
        addGuestCart(clave, Math.max(1, Number(cantidad) || 1), guestId)
        setGuestItems(getGuestCart(guestId))
    }, [guestId])

    const removeGuest = useCallback((clave) => {
        if (!guestId) return
        removeGuestCart(clave, guestId)
        setGuestItems(getGuestCart(guestId))
    }, [guestId])

    const setQuantityGuest = useCallback((clave, cantidad) => {
        if (!guestId) return
        setGuestCartQuantity(clave, Math.max(1, Number(cantidad) || 1), guestId)
        setGuestItems(getGuestCart(guestId))
    }, [guestId])

    const itemsGuest = guestItems.map(({ clave, cantidad }) => ({
        clave,
        cantidad: Number(cantidad) || 1,
        nombre_producto: clave,
        precio_unitario: 0,
        subtotal: 0,
        imagen: null,
    }))
    const isInCartGuest = useCallback((clave) => guestItems.some((i) => i.clave === clave), [guestItems])

    if (isLogged) {
        return {
            items: itemsLogged,
            total: data?.total ?? 0,
            isLoading,
            mutate,
            add: addLogged,
            remove: removeLogged,
            setQuantity: setQuantityLogged,
            flushQuantity: flushQuantityLogged,
            flushAllQuantities: flushAllQuantitiesLogged,
            isInCart: isInCartLogged,
        }
    }

    return {
        items: itemsGuest,
        total: 0,
        isLoading: false,
        mutate: refreshGuest,
        add: addGuest,
        remove: removeGuest,
        setQuantity: setQuantityGuest,
        flushQuantity: () => Promise.resolve(),
        flushAllQuantities: () => Promise.resolve(),
        isInCart: isInCartGuest,
    }
}

/**
 * Hook para obtener el número de ítems en el carrito (usa useCarrito para compartir caché).
 */
export function useCarritoCount(isLogged) {
    const { items } = useCarrito(isLogged)
    const count = items.reduce((s, i) => s + (Number(i.cantidad) || 0), 0)
    return { count, refresh: () => {} }
}
