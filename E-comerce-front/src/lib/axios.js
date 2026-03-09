import Axios from 'axios'

const axios = Axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000/api/v1',
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
})

// Interceptor para agregar el token Bearer a las peticiones
axios.interceptors.request.use(
    config => {
        const token = localStorage.getItem('auth_token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

// Interceptor para manejar errores de autenticación
axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            const path = typeof window !== 'undefined' ? window.location?.pathname : ''
            const isAdminPath = path.startsWith('/admin')
            const isVentasPath = path.startsWith('/ventas')
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            if (isAdminPath) localStorage.removeItem('auth_admin')
            if (isVentasPath) localStorage.removeItem('auth_ventas')
            if (typeof window !== 'undefined') {
                if (isAdminPath) window.location.href = '/admin-login'
                else if (isVentasPath) window.location.href = '/ventas-login'
                else window.location.href = '/login'
            }
        }
        return Promise.reject(error)
    }
)

export default axios
