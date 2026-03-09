'use client'

import { createContext, useContext, useState, useEffect } from 'react'

const AdminThemeContext = createContext({ darkMode: true, setDarkMode: () => {} })

export function AdminThemeProvider({ children }) {
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
        <AdminThemeContext.Provider value={{ darkMode, setDarkMode }}>
            {children}
        </AdminThemeContext.Provider>
    )
}

export function useAdminTheme() {
    const ctx = useContext(AdminThemeContext)
    if (!ctx) throw new Error('useAdminTheme must be used within AdminThemeProvider')
    return ctx
}
