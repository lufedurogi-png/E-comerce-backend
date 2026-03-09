'use client'

import Link from 'next/link'
import Image from 'next/image'
import ThemeToggle from '@/components/ThemeToggle'
import { AdminThemeProvider, useAdminTheme } from './AdminThemeContext'

function LayoutContent({ children }) {
    const { darkMode, setDarkMode } = useAdminTheme()

    return (
        <div className={`min-h-screen transition-colors duration-300 flex flex-col ${
            darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
            <header className={`sticky top-0 z-50 border-b flex-shrink-0 ${
                darkMode ? 'bg-gray-900/95 backdrop-blur-sm border-gray-800' : 'bg-white/95 backdrop-blur-sm border-gray-200'
            }`} style={{ height: '4rem' }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link href="/" className="flex items-center">
                            <Image src="/Imagenes/logo_en.png" alt="NXT.IT" width={120} height={40} className="h-8 w-auto" />
                        </Link>
                        <ThemeToggle dark={darkMode} onToggle={() => setDarkMode((d) => !d)} />
                    </div>
                </div>
            </header>
            <main className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">{children}</main>
        </div>
    )
}

const Layout = ({ children }) => (
    <AdminThemeProvider>
        <LayoutContent>{children}</LayoutContent>
    </AdminThemeProvider>
)

export default Layout
