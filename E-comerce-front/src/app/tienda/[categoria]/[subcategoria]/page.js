import { getSubcategoriaDataForSSR } from '@/lib/productos-ssr'
import VistaSubcategoriaClient from './VistaSubcategoriaClient'

/** Subcategoría: datos en servidor para que la vista cargue al instante con productos. */
export default async function PageSubcategoria({ params, searchParams }) {
    const categoriaRaw = params?.categoria ?? ''
    const subcategoriaParam = params?.subcategoria ?? ''
    const categoria = categoriaRaw ? decodeURIComponent(categoriaRaw) : ''
    const subcategoria = subcategoriaParam ? decodeURIComponent(subcategoriaParam) : ''

    const urlFilters = (searchParams && typeof searchParams === 'object') ? { ...searchParams } : {}

    if (!categoria || !subcategoriaParam) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">404 | NOT FOUND</h1>
                    <p className="mb-4">Categoría o subcategoría no encontrada</p>
                    <a href="/tienda" className="text-[#FF8000] hover:underline">
                        Volver a la tienda
                    </a>
                </div>
            </div>
        )
    }

    const initialData = await getSubcategoriaDataForSSR(categoria, subcategoria)

    return (
        <VistaSubcategoriaClient
            categoria={categoria}
            subcategoria={subcategoria}
            initialData={initialData}
            urlFilters={urlFilters}
        />
    )
}
