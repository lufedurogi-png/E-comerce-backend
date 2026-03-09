'use client'

import axios from '@/lib/axios'

/** true si userId corresponde a un usuario logueado (numérico). */
export function isLoggedInUserId(userId) {
    if (userId == null || userId === '') return false
    if (typeof userId === 'number' && !Number.isNaN(userId)) return true
    if (typeof userId === 'string' && /^\d+$/.test(userId)) return true
    return false
}

/** Formatea items para enviar al API: clave, cantidad, nombre_producto, precio_unitario, imagen */
function formatItemsForApi(itemsConProducto) {
    return (itemsConProducto || []).map((i) => ({
        clave: i.clave,
        cantidad: Number(i.cantidad) || 1,
        nombre_producto: i.nombre_producto || i.clave || '',
        precio_unitario: Number(i.precio_unitario) ?? 0,
        imagen: i.imagen || null,
    }))
}

/** Formatea respuesta del API al formato del frontend (id, fecha, items, total). */
function formatFromApi(c) {
    const items = (c.items || []).map((i) => ({
        clave: i.clave,
        cantidad: i.cantidad,
        nombre_producto: i.nombre_producto,
        precio_unitario: i.precio_unitario,
        subtotal: i.subtotal ?? (Number(i.cantidad) || 1) * (Number(i.precio_unitario) ?? 0),
        imagen: i.imagen,
    }))
    return {
        id: c.id,
        fecha: c.fecha || new Date().toISOString(),
        items,
        total: Number(c.total) ?? 0,
        fecha_editada: c.fecha_editada || null,
    }
}

/** Obtener cotizaciones guardadas desde API. */
export async function fetchCotizacionesGuardadas() {
    const { data } = await axios.get('/cotizaciones')
    if (!data.success || !data.data) return []
    const list = Array.isArray(data.data) ? data.data : []
    return list.map(formatFromApi)
}

/** Obtener papelera desde API. */
export async function fetchCotizacionesPapelera() {
    const { data } = await axios.get('/cotizaciones/papelera')
    if (!data.success || !data.data?.cotizaciones) return []
    return data.data.cotizaciones.map(formatFromApi)
}

/** Guardar nueva cotización en API. itemsConProducto: [{ clave, cantidad, nombre_producto, precio_unitario, imagen }] */
export async function saveCotizacionApi(itemsConProducto, total) {
    const items = formatItemsForApi(itemsConProducto)
    if (items.length === 0) throw new Error('Debe incluir al menos un ítem.')
    const { data } = await axios.post('/cotizaciones', { items, total: Number(total) ?? 0 })
    if (!data.success) throw new Error(data.message || 'Error al guardar.')
    return formatFromApi(data.data)
}

/** Actualizar cotización en API. */
export async function updateCotizacionApi(id, itemsConProducto, total) {
    const items = formatItemsForApi(itemsConProducto)
    if (items.length === 0) throw new Error('Debe incluir al menos un ítem.')
    const { data } = await axios.put(`/cotizaciones/${id}`, { items, total: Number(total) ?? 0 })
    if (!data.success) throw new Error(data.message || 'Error al actualizar.')
    return formatFromApi(data.data)
}

/** Mover cotización a papelera. */
export async function moveCotizacionToPapeleraApi(id) {
    const { data } = await axios.delete(`/cotizaciones/${id}`)
    if (!data.success) throw new Error(data.message || 'Error al mover a papelera.')
}

/** Restaurar cotización desde papelera. */
export async function restoreCotizacionFromPapeleraApi(id) {
    const { data } = await axios.post(`/cotizaciones/${id}/restore`)
    if (!data.success) throw new Error(data.message || 'Error al restaurar.')
}
