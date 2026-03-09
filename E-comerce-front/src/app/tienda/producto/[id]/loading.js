/** Carga de /tienda/producto/[id]: barra superior + esqueleto de detalle. */
export default function LoadingProducto() {
    return (
        <>
            <div className="fixed inset-x-0 top-0 z-[9999] h-1 bg-gray-100 dark:bg-gray-800">
                <div className="h-full bg-[#FF8000] animate-loading-bar" style={{ width: '40%' }} />
            </div>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="h-14 shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-pulse" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-1/2 h-80 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                        <div className="flex-1 space-y-4">
                            <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-6 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                            <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
