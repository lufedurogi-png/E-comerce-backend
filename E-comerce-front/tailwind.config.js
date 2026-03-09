module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            keyframes: {
                'loading-bar': {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(350%)' },
                },
            },
            animation: {
                'loading-bar': 'loading-bar 0.8s ease-in-out infinite',
            },
        },
    },
    plugins: [require('@tailwindcss/forms')],
}
