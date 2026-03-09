export default function AdminGestionUsuariosLoading() {
    return (
        <div className="space-y-8 animate-pulse">
            <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gray-700" />
                <div className="space-y-2">
                    <div className="h-8 w-48 rounded bg-gray-700" />
                    <div className="h-4 w-64 rounded bg-gray-700/60" />
                </div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-5">
                <div className="h-6 w-24 rounded bg-gray-700 mb-4" />
                <div className="flex gap-4">
                    <div className="h-10 flex-1 rounded bg-gray-700/60" />
                    <div className="h-10 w-32 rounded bg-gray-700/60" />
                    <div className="h-10 w-36 rounded bg-gray-700/60" />
                </div>
            </div>
            <div className="rounded-xl border border-gray-700 bg-gray-800 p-6">
                <div className="h-6 w-40 rounded bg-gray-700 mb-4" />
                <div className="h-64 rounded-lg bg-gray-700/30" />
            </div>
        </div>
    )
}
