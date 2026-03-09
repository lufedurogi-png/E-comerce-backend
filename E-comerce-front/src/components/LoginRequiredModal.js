'use client'

import Link from 'next/link'

/**
 * Modal para indicar que debe iniciar sesión para continuar (ej. pagar).
 * Incluye botón X, mensaje, Cancelar (cierra) e Iniciar sesión (va al login con returnUrl).
 */
export default function LoginRequiredModal({ open, onClose, returnUrl = '/tienda/carrito', darkMode = true }) {
    if (!open) return null
    const loginHref = returnUrl ? `/login?returnUrl=${encodeURIComponent(returnUrl)}` : '/login'
    return (
        <>
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
                aria-hidden
            />
            <div
                className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md rounded-xl shadow-xl z-50 p-6 ${
                    darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
                }`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="login-required-title"
            >
                <div className="flex items-start justify-between gap-4">
                    <h2
                        id="login-required-title"
                        className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}
                    >
                        Iniciar sesión requerido
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`shrink-0 p-1 rounded-lg transition-colors ${
                            darkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'
                        }`}
                        aria-label="Cerrar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className={`mt-3 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    No puedes continuar con el pago porque no has iniciado sesión. Si deseas proseguir, primero debes iniciar sesión.
                </p>
                <div className="mt-6 flex gap-3 justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        className={`px-4 py-2 rounded-lg font-medium ${
                            darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                        Cancelar
                    </button>
                    <Link
                        href={loginHref}
                        className="px-6 py-2 rounded-lg font-semibold bg-[#FF8000] hover:bg-[#e67300] text-white transition-colors inline-block text-center"
                    >
                        Iniciar sesión
                    </Link>
                </div>
            </div>
        </>
    )
}
