export default function AdminUsuariosLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-700" />
                <div className="space-y-2">
                    <div className="h-8 w-48 rounded bg-gray-700" />
                    <div className="h-4 w-64 rounded bg-gray-700/60" />
                </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 space-y-5">
                    <div className="h-6 w-32 rounded bg-gray-700" />
                    <div className="h-10 w-full rounded bg-gray-700/60" />
                    <div className="h-10 w-full rounded bg-gray-700/60" />
                    <div className="h-10 w-3/4 rounded bg-gray-700/60" />
                </div>
                <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                    <div className="h-6 w-40 rounded bg-gray-700 mb-4" />
                    <div className="h-48 rounded-lg bg-gray-700/30" />
                </div>
            </div>
        </div>
    )
}
