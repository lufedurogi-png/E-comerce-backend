export default function SubcategoriaLoading() {
    return (
        <div className="min-h-screen min-w-full bg-gray-900">
            <div className="h-14 shrink-0 bg-gray-800 border-b border-gray-700" />
            <div className="flex min-h-[calc(100vh-3.5rem)]">
                <aside className="w-64 shrink-0 border-r border-gray-700 bg-gray-800/80 p-6 space-y-8">
                    <div className="h-4 w-24 rounded bg-gray-700/80" />
                    <div className="h-10 w-full rounded bg-gray-700/80" />
                    <div className="h-4 w-16 rounded bg-gray-700/80" />
                    <div className="h-10 w-full rounded bg-gray-700/80" />
                    <div className="h-4 w-20 rounded bg-gray-700/80" />
                    <div className="h-10 w-full rounded bg-gray-700/80" />
                </aside>
                <main className="flex-1 min-w-0 p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="h-4 w-48 rounded bg-gray-700/80 mb-6" />
                        <div className="h-10 w-64 rounded bg-gray-700/80 mb-8" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {[...Array(12)].map((_, i) => (
                                <div key={i} className="rounded-lg border border-gray-700 bg-gray-800/60 overflow-hidden">
                                    <div className="h-48 bg-gray-700/60" />
                                    <div className="p-4 space-y-2">
                                        <div className="h-4 w-full rounded bg-gray-700/60" />
                                        <div className="h-4 w-2/3 rounded bg-gray-700/60" />
                                        <div className="h-6 w-24 rounded bg-gray-700/60" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
