import { Suspense } from 'react'
import { getBusquedaForSSR } from '@/lib/busqueda'
import BusquedaClient from './BusquedaClient'

/** Búsqueda: datos en servidor para primera pintura al instante; cliente usa initialData y refetch si cambia q. */
export default async function PageBusqueda({ searchParams }) {
    const raw = searchParams?.q
    const q = Array.isArray(raw) ? raw[0] : (typeof raw === 'string' ? raw : '')
    const initialData = await getBusquedaForSSR(q ?? '')
    return (
        <Suspense fallback={null}>
            <BusquedaClient initialData={initialData} initialQuery={q ?? ''} />
        </Suspense>
    )
}
