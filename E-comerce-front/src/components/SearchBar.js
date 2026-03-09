'use client'

/**
 * Barra de búsqueda: redirige a /tienda/busqueda?q=... al enviar.
 * Usado en header de tienda, subcategoría y producto.
 */
export default function SearchBar({ darkMode = true, className = '' }) {
    const inputBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
    const inputText = darkMode ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'
    const focusRing = 'focus:outline-none focus:border-[#FF8000] focus:ring-1 focus:ring-[#FF8000]'

    return (
        <form action="/tienda/busqueda" method="get" className={`flex-1 max-w-md ${className}`}>
            <div className="relative w-full flex rounded-lg overflow-hidden border border-transparent focus-within:ring-1 focus-within:ring-[#FF8000] focus-within:border-[#FF8000]">
                <input
                    type="search"
                    name="q"
                    placeholder="Buscar productos"
                    className={`w-full ${inputBg} ${inputText} rounded-l-lg px-4 py-2 text-sm border ${focusRing} pr-24`}
                    aria-label="Buscar productos"
                />
                <button
                    type="submit"
                    className="absolute right-0 top-0 bottom-0 bg-[#FF8000] hover:bg-[#e67300] text-white px-4 py-2 text-sm font-medium transition-colors"
                >
                    Buscar
                </button>
            </div>
        </form>
    )
}
