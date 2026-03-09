/** Carga de /favoritos: barra superior + esqueleto de tarjetas. */
export default function LoadingFavoritos() {
    return (
        <>
            <div className="fixed inset-x-0 top-0 z-[9999] h-1 bg-gray-100 dark:bg-gray-800">
                <div className="h-full bg-[#FF8000] animate-loading-bar" style={{ width: '40%' }} />
            </div>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <div className="h-14 shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 animate-pulse" />
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                <div className="h-48 bg-gray-200 dark:bg-gray-700 animate-pulse" />
                                <div className="p-4 space-y-2">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                    <div className="h-5 w-1/3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </>
    )
}
