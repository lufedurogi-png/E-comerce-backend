import { useState, useCallback, useEffect, useMemo } from 'react'
import useSWR from 'swr'
import axios from '@/lib/axios'

const FAVORITOS_CHANGE_EVENT = 'favoritosChange'

/**
 * API favoritos (solo usuario logueado). Devuelve claves y productos en una sola petición.
 */
export async function getFavoritos() {
    const { data } = await axios.get('/favoritos')
    if (data?.success && data?.data) return data.data
    return { claves: [], productos: [] }
}

export async function addFavorito(clave) {
    const { data } = await axios.post('/favoritos', { clave })
    if (data?.success && data?.data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(FAVORITOS_CHANGE_EVENT))
        return data.data
    }
    throw new Error(data?.message || 'Error al agregar favorito')
}

export async function removeFavorito(clave) {
    const { data } = await axios.delete(`/favoritos/items/${encodeURIComponent(clave)}`)
    if (data?.success && data?.data) {
        if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(FAVORITOS_CHANGE_EVENT))
        return data.data
    }
    return { claves: [] }
}

export { FAVORITOS_CHANGE_EVENT }

/**
 * Hook para obtener el número de favoritos y refrescarlo al cambiar.
 * Solo tiene sentido cuando el usuario está logueado.
 */
export function useFavoritosCount(isLogged) {
    const [count, setCount] = useState(0)

    const refresh = useCallback(() => {
        if (!isLogged) {
            setCount(0)
            return
        }
        getFavoritos()
            .then((data) => setCount((data?.claves || []).length))
            .catch(() => setCount(0))
    }, [isLogged])

    useEffect(() => {
        refresh()
    }, [refresh])

    useEffect(() => {
        if (typeof window === 'undefined' || !isLogged) return
        const handler = () => refresh()
        window.addEventListener(FAVORITOS_CHANGE_EVENT, handler)
        return () => window.removeEventListener(FAVORITOS_CHANGE_EVENT, handler)
    }, [refresh, isLogged])

    return { count, refresh }
}

/**
 * Hook para listar favoritos y agregar/quitar. Una sola petición trae claves + productos (imagen, precio, stock).
 */
export function useFavoritos(isLogged) {
    const { data, mutate, isLoading } = useSWR(
        isLogged ? 'favoritos' : null,
        () => getFavoritos(),
        { revalidateOnFocus: false }
    )
    const claves = Array.isArray(data?.claves) ? data.claves : []
    const productByClave = useMemo(() => {
        const m = {}
        const arr = data?.productos
        if (Array.isArray(arr)) arr.forEach((p) => { if (p?.clave) m[p.clave] = p })
        return m
    }, [data?.productos])

    useEffect(() => {
        if (!isLogged || typeof window === 'undefined') return
        const handler = () => mutate()
        window.addEventListener(FAVORITOS_CHANGE_EVENT, handler)
        return () => window.removeEventListener(FAVORITOS_CHANGE_EVENT, handler)
    }, [isLogged, mutate])

    const add = useCallback(
        (clave) => {
            if (claves.includes(clave)) return Promise.resolve({ claves })
            const next = [...claves, clave]
            mutate({ claves: next, productos: data?.productos ?? [] }, false)
            return addFavorito(clave)
                .then((d) => { mutate(d); return d })
                .catch((err) => {
                    mutate()
                    const msg = err.response?.data?.message || err.message || 'Error al agregar favorito'
                    throw new Error(msg)
                })
        },
        [mutate, claves, data?.productos]
    )
    const remove = useCallback(
        (clave) => {
            if (!claves.includes(clave)) return Promise.resolve({ claves })
            const next = claves.filter((c) => c !== clave)
            mutate({ claves: next, productos: data?.productos ?? [] }, false)
            return removeFavorito(clave)
                .then((d) => { mutate(d); return d })
                .catch((err) => {
                    mutate()
                    const msg = err.response?.data?.message || err.message || 'Error al quitar favorito'
                    throw new Error(msg)
                })
        },
        [mutate, claves, data?.productos]
    )
    const isFavorito = useCallback((clave) => claves.includes(clave), [claves])
    const toggle = useCallback(
        (clave) => (isFavorito(clave) ? remove(clave) : add(clave)),
        [add, remove, isFavorito]
    )

    return { claves, productByClave, add, remove, toggle, isFavorito, isLoading }
}
