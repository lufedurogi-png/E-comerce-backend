'use client'

const GUEST_ID_KEY = 'tienda_guest_id'

/**
 * Obtiene o crea un ID único para el visitante invitado (sin usuario logueado).
 * Se guarda en localStorage como "token temporal" para persistir preferencias por visitante.
 * @returns {string|null} ID del invitado en cliente; null en SSR.
 */
export function getOrCreateGuestId() {
    if (typeof window === 'undefined') return null
    try {
        let id = localStorage.getItem(GUEST_ID_KEY)
        if (!id || typeof id !== 'string') {
            id = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
            localStorage.setItem(GUEST_ID_KEY, id)
        }
        return id
    } catch {
        return null
    }
}
