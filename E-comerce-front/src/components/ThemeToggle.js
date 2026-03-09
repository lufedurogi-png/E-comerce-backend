'use client'

import Image from 'next/image'

/**
 * Toggle modo oscuro: imagen icon_modo + switch + etiqueta "Oscuro".
 * Para usar en admin-login y admin-register (layout admin-auth).
 */
export default function ThemeToggle({ dark, onToggle }) {
    return (
        <div className="flex items-center gap-3">
            <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10"
                aria-hidden
            >
                <Image
                    src="/Imagenes/icon_modo.webp"
                    alt=""
                    width={20}
                    height={20}
                    className="h-5 w-5 object-contain"
                    aria-hidden
                />
            </span>
            <button
                type="button"
                role="switch"
                aria-label="Modo oscuro"
                aria-checked={dark}
                onClick={onToggle}
                className="flex items-center gap-3 rounded-full focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
                <span
                    className={`h-5 w-10 flex items-center rounded-full transition-colors ${
                        dark ? 'bg-blue-600' : 'bg-gray-500/40'
                    }`}
                >
                    <span
                        className={`block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            dark ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'
                        }`}
                    />
                </span>
                <span className="text-sm font-medium text-amber-400">Oscuro</span>
            </button>
        </div>
    )
}
