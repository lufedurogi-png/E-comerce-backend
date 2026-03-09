import axios from '@/lib/axios'

/** Formato 12 horas: "Hoy 6:30 PM", "Ayer 6:30 PM", "5 Mar 2025 6:30 PM" */
export function formatMessageTime(isoString) {
    if (!isoString) return ''
    const d = new Date(isoString)
    if (Number.isNaN(d.getTime())) return ''
    const now = new Date()
    const sameDay = d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const isYesterday = d.getDate() === yesterday.getDate() && d.getMonth() === yesterday.getMonth() && d.getFullYear() === yesterday.getFullYear()
    const time = d.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', hour12: true })
    if (sameDay) return `Hoy ${time}`
    if (isYesterday) return `Ayer ${time}`
    const date = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined })
    return `${date} ${time}`.trim()
}

export async function getChatMensajesCliente() {
    const { data } = await axios.get('/chat-mensajes')
    return data?.success && data?.data ? data.data : []
}

export async function enviarMensajeCliente(body) {
    const { data } = await axios.post('/chat-mensajes', { body })
    if (!data?.success) return null
    const msg = data.data ?? data
    return msg && typeof msg === 'object' && 'id' in msg ? msg : null
}

export async function actualizarMensajeCliente(id, body) {
    const { data } = await axios.put(`/chat-mensajes/${id}`, { body })
    return data?.success ? data.data : null
}

export async function eliminarMensajeCliente(id) {
    const { data } = await axios.delete(`/chat-mensajes/${id}`)
    return data?.success
}

// Ventas (mismo axios con token de vendedor)
export async function getChatClientesVentas() {
    const { data } = await axios.get('/ventas/chat/clientes')
    return data?.success && data?.data ? data.data : []
}

export async function getChatMensajesVentas(userId) {
    const { data } = await axios.get(`/ventas/chat/clientes/${userId}`)
    if (!data?.success) return { cliente: null, mensajes: [] }
    return {
        cliente: data.data?.cliente ?? null,
        mensajes: data.data?.mensajes ?? [],
    }
}

export async function enviarMensajeVentas(userId, body) {
    const { data } = await axios.post(`/ventas/chat/clientes/${userId}/mensajes`, { body })
    return data?.success ? data.data : null
}

export async function actualizarMensajeVentas(id, body) {
    const { data } = await axios.put(`/ventas/chat/mensajes/${id}`, { body })
    return data?.success ? data.data : null
}

export async function eliminarMensajeVentas(id) {
    const { data } = await axios.delete(`/ventas/chat/mensajes/${id}`)
    return data?.success
}
