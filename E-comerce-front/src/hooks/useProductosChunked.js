'use client'

import { useMemo } from 'react'
import useSWR from 'swr'
import { getPorClaves } from '@/lib/productos'

const CHUNK_SIZE = 6
const MAX_CHUNKS = 10

/**
 * Obtiene productos por claves en chunks en paralelo.
 * Cada chunk se pide con su propia clave SWR, así los primeros resultados aparecen en 1–2 s
 * y el resto se va rellenando conforme llegan (carga progresiva).
 */
function useProductosByClavesChunked(keys, swrKeyPrefix) {
    const chunks = useMemo(() => {
        const list = keys || []
        if (!list.length) return []
        const c = []
        for (let i = 0; i < list.length && c.length < MAX_CHUNKS; i += CHUNK_SIZE) {
            c.push(list.slice(i, i + CHUNK_SIZE))
        }
        return c
    }, [keys?.join(',')])

    const swr0 = useSWR(
        chunks[0]?.length ? [swrKeyPrefix, '0', chunks[0].join(',')] : null,
        () => getPorClaves(chunks[0]),
        { revalidateOnFocus: false }
    )
    const swr1 = useSWR(
        chunks[1]?.length ? [swrKeyPrefix, '1', chunks[1].join(',')] : null,
        () => getPorClaves(chunks[1]),
        { revalidateOnFocus: false }
    )
    const swr2 = useSWR(
        chunks[2]?.length ? [swrKeyPrefix, '2', chunks[2].join(',')] : null,
        () => getPorClaves(chunks[2]),
        { revalidateOnFocus: false }
    )
    const swr3 = useSWR(
        chunks[3]?.length ? [swrKeyPrefix, '3', chunks[3].join(',')] : null,
        () => getPorClaves(chunks[3]),
        { revalidateOnFocus: false }
    )
    const swr4 = useSWR(
        chunks[4]?.length ? [swrKeyPrefix, '4', chunks[4].join(',')] : null,
        () => getPorClaves(chunks[4]),
        { revalidateOnFocus: false }
    )
    const swr5 = useSWR(
        chunks[5]?.length ? [swrKeyPrefix, '5', chunks[5].join(',')] : null,
        () => getPorClaves(chunks[5]),
        { revalidateOnFocus: false }
    )
    const swr6 = useSWR(
        chunks[6]?.length ? [swrKeyPrefix, '6', chunks[6].join(',')] : null,
        () => getPorClaves(chunks[6]),
        { revalidateOnFocus: false }
    )
    const swr7 = useSWR(
        chunks[7]?.length ? [swrKeyPrefix, '7', chunks[7].join(',')] : null,
        () => getPorClaves(chunks[7]),
        { revalidateOnFocus: false }
    )
    const swr8 = useSWR(
        chunks[8]?.length ? [swrKeyPrefix, '8', chunks[8].join(',')] : null,
        () => getPorClaves(chunks[8]),
        { revalidateOnFocus: false }
    )
    const swr9 = useSWR(
        chunks[9]?.length ? [swrKeyPrefix, '9', chunks[9].join(',')] : null,
        () => getPorClaves(chunks[9]),
        { revalidateOnFocus: false }
    )
    const swr10 = useSWR(
        chunks[10]?.length ? [swrKeyPrefix, '10', chunks[10].join(',')] : null,
        () => getPorClaves(chunks[10]),
        { revalidateOnFocus: false }
    )
    const swr11 = useSWR(
        chunks[11]?.length ? [swrKeyPrefix, '11', chunks[11].join(',')] : null,
        () => getPorClaves(chunks[11]),
        { revalidateOnFocus: false }
    )
    const swr12 = useSWR(
        chunks[12]?.length ? [swrKeyPrefix, '12', chunks[12].join(',')] : null,
        () => getPorClaves(chunks[12]),
        { revalidateOnFocus: false }
    )
    const swr13 = useSWR(
        chunks[13]?.length ? [swrKeyPrefix, '13', chunks[13].join(',')] : null,
        () => getPorClaves(chunks[13]),
        { revalidateOnFocus: false }
    )
    const swr14 = useSWR(
        chunks[14]?.length ? [swrKeyPrefix, '14', chunks[14].join(',')] : null,
        () => getPorClaves(chunks[14]),
        { revalidateOnFocus: false }
    )

    const allData = [swr0.data, swr1.data, swr2.data, swr3.data, swr4.data, swr5.data, swr6.data, swr7.data, swr8.data, swr9.data, swr10.data, swr11.data, swr12.data, swr13.data, swr14.data]

    const productByClave = useMemo(() => {
        const m = {}
        allData.forEach((arr) => {
            if (Array.isArray(arr)) arr.forEach((p) => { if (p?.clave) m[p.clave] = p })
        })
        return m
    }, [swr0.data, swr1.data, swr2.data, swr3.data, swr4.data, swr5.data, swr6.data, swr7.data, swr8.data, swr9.data, swr10.data, swr11.data, swr12.data, swr13.data, swr14.data])

    const isLoading = chunks.length > 0 && allData.slice(0, chunks.length).some((d, i) => chunks[i]?.length && !d)

    return { productByClave, isLoading }
}

/**
 * Una sola petición con todas las claves (carrito/favoritos). Más rápido que chunks cuando el backend
 * ya tiene caché: una ida y vuelta en lugar de varias.
 */
function useProductosByClaves(keys, swrKeyPrefix) {
    const keysList = keys && keys.length ? [...keys] : []
    const keyStr = keysList.join(',')
    const { data, isLoading } = useSWR(
        keyStr ? [swrKeyPrefix, keyStr] : null,
        () => getPorClaves(keysList),
        { revalidateOnFocus: false }
    )
    const productByClave = useMemo(() => {
        const m = {}
        if (Array.isArray(data)) data.forEach((p) => { if (p?.clave) m[p.clave] = p })
        return m
    }, [data])
    return { productByClave, isLoading: keyStr ? isLoading : false }
}

// Export explícito para evitar problemas con Fast Refresh / caché de Next
export { useProductosByClaves, useProductosByClavesChunked }
