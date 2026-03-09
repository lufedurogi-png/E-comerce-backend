import { useState, useEffect } from 'react'

/**
 * Devuelve un valor debounced: solo se actualiza tras `delay` ms sin cambios.
 * Útil para evitar llamadas API en cada tecla al buscar.
 */
export function useDebounce(value, delay = 300) {
    const [debouncedValue, setDebouncedValue] = useState(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay)
        return () => clearTimeout(timer)
    }, [value, delay])

    return debouncedValue
}
