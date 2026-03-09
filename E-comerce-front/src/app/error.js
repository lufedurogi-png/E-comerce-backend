'use client'

export default function Error({ error, reset }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white p-6">
            <h2 className="text-xl font-semibold mb-4">Algo salió mal</h2>
            <p className="text-gray-400 mb-6 text-center max-w-md">{error?.message || 'Ha ocurrido un error inesperado.'}</p>
            <button
                onClick={() => reset()}
                className="px-6 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 transition-colors font-medium"
            >
                Intentar de nuevo
            </button>
        </div>
    )
}
