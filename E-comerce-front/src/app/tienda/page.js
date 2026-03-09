import { Suspense } from 'react'
import { getTiendaDataForSSR } from '@/lib/productos'
import TiendaClient from './TiendaClient'

/** Página Tienda: datos cargados en el servidor (BD) para que al abrir /tienda todo esté ya cargado al instante. */
export default async function TiendaPage() {
    const initialData = await getTiendaDataForSSR()
    return (
        <Suspense fallback={null}>
            <TiendaClient initialData={initialData} />
        </Suspense>
    )
}
