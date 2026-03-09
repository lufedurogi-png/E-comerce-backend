export default function AdminHomeLoading() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                    <div className="h-12 bg-gray-700/50" />
                    <div className="p-6">
                        <div className="h-64 rounded-lg bg-gray-700/30" />
                    </div>
                </div>
                <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                    <div className="h-12 bg-gray-700/50" />
                    <div className="p-6">
                        <div className="h-64 rounded-lg bg-gray-700/30" />
                    </div>
                </div>
            </div>
            <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800">
                <div className="h-16 bg-gray-700/50" />
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="h-32 rounded-lg bg-gray-700/30" />
                    <div className="h-32 rounded-lg bg-gray-700/30" />
                    <div className="h-32 rounded-lg bg-gray-700/30" />
                </div>
            </div>
        </div>
    )
}
