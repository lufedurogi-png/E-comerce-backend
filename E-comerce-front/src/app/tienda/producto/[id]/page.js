import { getProductoByClaveForSSR } from '@/lib/productos-ssr'
import ProductoDetalleClient from './ProductoDetalleClient'

export default async function PageProducto({ params, searchParams }) {
    const clave = params?.id ? decodeURIComponent(params.id) : ''
    const returnUrl = searchParams?.from ? decodeURIComponent(searchParams.from) : null

    if (!clave) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 text-gray-100">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Producto no encontrado</h1>
                    <a href="/tienda" className="text-[#FF8000] hover:underline">
                        Volver a la tienda
                    </a>
                </div>
            </div>
        )
    }

    const { producto, errorCatalog } = await getProductoByClaveForSSR(clave)

    return (
        <ProductoDetalleClient
            clave={clave}
            initialProducto={producto}
            errorCatalog={errorCatalog}
            returnUrl={returnUrl}
        />
    )
}
