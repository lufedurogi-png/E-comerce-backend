import useSWR from 'swr'
import axios from '@/lib/axios'
import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
    const router = useRouter()
    const params = useParams()

    // Función para obtener el usuario desde localStorage o desde la API
    const getUser = async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) {
            throw new Error('No token')
        }

        // Primero intentar obtener de localStorage
        const cachedUser = localStorage.getItem('auth_user')
        if (cachedUser) {
            try {
                return JSON.parse(cachedUser)
            } catch (e) {
                // Si hay error parseando, continuar para obtener de la API
            }
        }

        // Si no hay usuario en cache, obtener de la API
        try {
            const response = await axios.get('/auth/profile')
            const userData = response.data?.data || response.data
            localStorage.setItem('auth_user', JSON.stringify(userData))
            return userData
        } catch (error) {
            // Si falla, limpiar token y usuario
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            throw error
        }
    }

    const { data: user, error, mutate } = useSWR(
        typeof window !== 'undefined' && localStorage.getItem('auth_token') ? '/auth/profile' : null,
        getUser,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
        }
    )

    const register = async ({ setErrors, ...props }) => {
        setErrors([])

        try {
            const response = await axios.post('/auth/register', {
                name: props.name,
                email: props.email,
                password: props.password,
                password_confirmation: props.password_confirmation,
                remember: props.remember || false,
            })

            // Verificar si la respuesta indica éxito
            if (response.data?.success && response.data?.token) {
                // Guardar token y usuario
                localStorage.setItem('auth_token', response.data.token)
                if (response.data?.data) {
                    localStorage.setItem('auth_user', JSON.stringify(response.data.data))
                }
                await mutate()
                router.push(redirectIfAuthenticated || '/tienda')
            } else {
                // Si success es false, mostrar el mensaje de error
                setErrors({
                    general: [response.data?.message || 'Error al registrar usuario']
                })
            }
        } catch (error) {
            if (error.response?.status === 422) {
                // Manejar errores de validación
                const errors = error.response.data?.errors || {}
                setErrors(errors)
            } else {
                // Otros errores
                setErrors({
                    general: [error.response?.data?.message || 'Error al registrar usuario']
                })
            }
        }
    }

    const login = async ({ setErrors, setStatus, ...props }) => {
        setErrors([])
        setStatus(null)

        try {
            const response = await axios.post('/auth/token', {
                email: props.email,
                password: props.password,
            })

            // Verificar si la respuesta indica éxito
            if (response.data?.success && response.data?.token) {
                // Guardar token y usuario
                localStorage.setItem('auth_token', response.data.token)
                if (response.data?.data) {
                    localStorage.setItem('auth_user', JSON.stringify(response.data.data))
                }
                await mutate()
                router.push(redirectIfAuthenticated || '/tienda')
            } else {
                // Si success es false, mostrar el mensaje de error
                setErrors({
                    email: [response.data?.message || 'Las credenciales proporcionadas son incorrectas.']
                })
            }
        } catch (error) {
            if (error.response?.status === 422) {
                // Manejar errores de validación
                const errors = error.response.data?.errors || {}
                setErrors(errors)
            } else if (error.response?.status === 401 || !error.response?.data?.success) {
                setErrors({
                    email: [error.response?.data?.message || 'Las credenciales proporcionadas son incorrectas.']
                })
            } else {
                setErrors({
                    general: [error.response?.data?.message || 'Error al iniciar sesión']
                })
            }
        }
    }

    const forgotPassword = async ({ setErrors, setStatus, email }) => {
        setErrors([])
        setStatus(null)

        try {
            const response = await axios.post('/auth/forgot-password', { email })
            setStatus(response.data?.message || 'Se ha enviado un enlace de restablecimiento a tu correo.')
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {})
            } else {
                setErrors({
                    email: [error.response?.data?.message || 'Error al enviar el correo de restablecimiento']
                })
            }
        }
    }

    const resetPassword = async ({ setErrors, setStatus, ...props }) => {
        setErrors([])
        setStatus(null)

        try {
            const response = await axios.post('/auth/reset-password', { 
                token: params.token, 
                ...props 
            })
            router.push('/login?reset=' + btoa(response.data?.message || 'Contraseña restablecida correctamente'))
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(error.response.data.errors || {})
            } else {
                setErrors({
                    general: [error.response?.data?.message || 'Error al restablecer la contraseña']
                })
            }
        }
    }

    const resendEmailVerification = async ({ setStatus }) => {
        try {
            const response = await axios.post('/auth/email/verification-notification')
            setStatus(response.data?.message || 'Se ha enviado un nuevo enlace de verificación.')
        } catch (error) {
            setStatus(error.response?.data?.message || 'Error al enviar el correo de verificación')
        }
    }

    const logout = async () => {
        try {
            // Intentar revocar tokens en el servidor si hay token
            const token = localStorage.getItem('auth_token')
            if (token) {
                try {
                    await axios.post('/auth/revoke-tokens')
                } catch (error) {
                    // Si falla la revocación, continuar con el logout de todas formas
                    console.error('Error al revocar tokens:', error)
                }
            }
        } catch (error) {
            console.error('Error en logout:', error)
        } finally {
            // Limpiar localStorage primero
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            
            // Invalidar el cache de SWR
            await mutate(null, false)
            
            // Redirigir al login usando window.location para forzar recarga
            if (typeof window !== 'undefined') {
                window.location.href = '/login'
            }
        }
    }

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && user)
            router.push(redirectIfAuthenticated)

        // Verificación de email desactivada - permite acceso sin verificar email
        // if (middleware === 'auth' && (user && !user.email_verified_at))
        //     router.push('/verify-email')
        
        if (
            window.location.pathname === '/verify-email' &&
            user?.email_verified_at
        )
            router.push(redirectIfAuthenticated)
        if (middleware === 'auth' && error) logout()
    }, [user, error])

    return {
        user,
        register,
        login,
        forgotPassword,
        resetPassword,
        resendEmailVerification,
        logout,
    }
}
