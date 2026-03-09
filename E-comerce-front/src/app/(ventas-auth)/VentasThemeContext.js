'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const VentasThemeContext = createContext({ darkMode: true, setDarkMode: () => {} })

export function VentasThemeProvider({ children }) {
    const [darkMode, setDarkMode] = useState(true)

    useEffect(() => {
        if (typeof window === 'undefined') return
        const saved = localStorage.getItem('darkMode')
        if (saved !== null) setDarkMode(JSON.parse(saved))
    }, [])

    useEffect(() => {
        if (darkMode) {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }, [darkMode])

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'darkMode' && e.newValue !== null) {
                setDarkMode(JSON.parse(e.newValue))
            }
        }
        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    return (
        <VentasThemeContext.Provider value={{ darkMode, setDarkMode }}>
            {children}
        </VentasThemeContext.Provider>
    )
}

export function useVentasTheme() {
    const ctx = useContext(VentasThemeContext)
    if (!ctx) throw new Error('useVentasTheme must be used within VentasThemeProvider')
    return ctx
}
