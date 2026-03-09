import { Nunito, Playfair_Display, VT323 } from 'next/font/google'
import '@/app/global.css'

const nunitoFont = Nunito({
    subsets: ['latin'],
    display: 'swap',
})

const playfairDisplay = Playfair_Display({
    subsets: ['latin'],
    weight: ['400', '600', '700'],
    display: 'swap',
    variable: '--font-playfair',
})

const vt323 = VT323({
    subsets: ['latin'],
    weight: ['400'],
    display: 'swap',
    variable: '--font-vt323',
})

const RootLayout = ({ children }) => {
    return (
        <html lang="es" className={`${nunitoFont.className} ${playfairDisplay.variable} ${vt323.variable}`}>
            <body className="antialiased bg-gray-950">{children}</body>
        </html>
    )
}

export const metadata = {
    title: 'Laravel',
}

export default RootLayout
