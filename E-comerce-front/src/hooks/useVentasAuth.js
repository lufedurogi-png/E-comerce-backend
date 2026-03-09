import useSWR from 'swr'
import axios from '@/lib/axios'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

const VENTAS_AUTH_PREFIX = '/ventas/auth/'

export const useVentasAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
    const router = useRouter()

    const getUser = async () => {
        const token = localStorage.getItem('auth_token')
        if (!token) throw new Error('No token')

        const cachedUser = localStorage.getItem('auth_user')
        if (cachedUser) {
            try {
                const user = JSON.parse(cachedUser)
                if (user?.tipo === 3 || user?.roles?.includes?.('seller')) {
                    return user
                }
            } catch (_) {}
        }

        try {
            const response = await axios.get('/auth/profile')
            const userData = response.data?.data || response.data?.user || response.data
            const isSeller = userData?.tipo === 3 || userData?.roles?.includes?.('seller')
            if (!isSeller) {
                localStorage.removeItem('auth_token')
                localStorage.removeItem('auth_user')
                localStorage.removeItem('auth_ventas')
                throw new Error('No seller')
            }
            localStorage.setItem('auth_user', JSON.stringify(userData))
            return userData
        } catch (error) {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            localStorage.removeItem('auth_ventas')
            throw error
        }
    }

    const { data: user, error, mutate } = useSWR(
        typeof window !== 'undefined' && localStorage.getItem('auth_token') && localStorage.getItem('auth_ventas')
            ? '/auth/profile'
            : null,
        getUser,
        { revalidateOnFocus: false, revalidateOnReconnect: false }
    )

    const login = async ({ setErrors, setStatus, ...props }) => {
        setErrors?.([])
        setStatus?.(null)
        try {
            const response = await axios.post(VENTAS_AUTH_PREFIX + 'token', {
                email: props.email,
                password: props.password,
            })
            if (response.data?.success && response.data?.token) {
                localStorage.removeItem('auth_admin')
                localStorage.setItem('auth_token', response.data.token)
                localStorage.setItem('auth_ventas', 'true')
                if (response.data?.data) {
                    localStorage.setItem('auth_user', JSON.stringify(response.data.data))
                } else if (response.data?.user) {
                    localStorage.setItem('auth_user', JSON.stringify(response.data.user))
                }
                await mutate()
                router.push(redirectIfAuthenticated || '/ventas-home')
            } else {
                setErrors({
                    email: [response.data?.message || 'Solo vendedores pueden acceder'],
                })
            }
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data?.errors || {})
            } else {
                setErrors({
                    email: [err.response?.data?.message || 'Credenciales incorrectas o no tienes permisos de vendedor'],
                })
            }
        }
    }

    const logout = async () => {
        try {
            const token = localStorage.getItem('auth_token')
            if (token) {
                try {
                    await axios.post('/auth/revoke-tokens')
                } catch (_) {}
            }
        } catch (_) {}
        finally {
            localStorage.removeItem('auth_token')
            localStorage.removeItem('auth_user')
            localStorage.removeItem('auth_ventas')
            await mutate(null, false)
            if (typeof window !== 'undefined') {
                window.location.href = '/ventas-login'
            }
        }
    }

    useEffect(() => {
        if (middleware === 'guest' && redirectIfAuthenticated && user) {
            const isSeller = user?.tipo === 3 || user?.roles?.includes?.('seller')
            if (isSeller) router.push(redirectIfAuthenticated)
        }
        if (middleware === 'auth' && error) logout()
    }, [user, error])

    return { user, login, logout }
}
