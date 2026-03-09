'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import axios from '@/lib/axios'
import { resolvePublicidadUrl } from '@/lib/publicidad'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import { swrFetcher } from '@/lib/swrFetcher'

const PUBLICIDAD_KEY = '/admin/publicidad'
const swrConfig = { revalidateOnFocus: false, dedupingInterval: 5000 }

export default function AdminPublicidad() {
    const [darkMode, setDarkMode] = useState(true)
    const [selectedFile, setSelectedFile] = useState(null)
    const [titulo, setTitulo] = useState('')
    const [uploading, setUploading] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [errors, setErrors] = useState({})
    const [success, setSuccess] = useState('')
    const [previewUrl, setPreviewUrl] = useState(null)

    useEffect(() => {
        setDarkMode(JSON.parse(localStorage.getItem('darkMode') ?? 'true'))
    }, [])
    useEffect(() => {
        const onDarkModeChange = (e) => setDarkMode(!!e.detail)
        window.addEventListener('darkModeChange', onDarkModeChange)
        return () => window.removeEventListener('darkModeChange', onDarkModeChange)
    }, [])

    const { data: imagenes = [], mutate } = useSWR(PUBLICIDAD_KEY, swrFetcher, swrConfig)

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        setSelectedFile(file)
        setErrors({})
        setSuccess('')
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl)
        }
        setPreviewUrl(file ? URL.createObjectURL(file) : null)
    }

    const handleGuardar = async (e) => {
        e.preventDefault()
        if (!selectedFile) {
            setErrors({ imagen: ['Selecciona una imagen'] })
            return
        }
        setErrors({})
        setSuccess('')
        setUploading(true)
        try {
            const formData = new FormData()
            formData.append('imagen', selectedFile)
            if (titulo.trim()) formData.append('titulo', titulo.trim())

            const res = await axios.post('/admin/publicidad', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
            if (res.data?.success) {
                setSuccess('Imagen guardada correctamente')
                setSelectedFile(null)
                setTitulo('')
                if (previewUrl) {
                    URL.revokeObjectURL(previewUrl)
                    setPreviewUrl(null)
                }
                e.target.reset()
                await mutate()
                setTimeout(() => setSuccess(''), 4000)
            } else {
                setErrors({ general: [res.data?.message || 'Error al guardar'] })
            }
        } catch (err) {
            const errData = err.response?.data
            setErrors(errData?.errors || { general: [errData?.message || 'Error al subir la imagen'] })
        } finally {
            setUploading(false)
        }
    }

    const handleEliminar = async (id) => {
        setErrors({})
        setDeletingId(id)
        try {
            const res = await axios.delete(`/admin/publicidad/${id}`)
            if (res.data?.success) {
                await mutate()
            } else {
                setErrors({ general: [res.data?.message || 'Error al eliminar'] })
            }
        } catch (err) {
            setErrors({ general: [err.response?.data?.message || 'Error al eliminar'] })
        } finally {
            setDeletingId(null)
        }
    }

    const labelClass = darkMode ? 'text-gray-300 block mb-1.5 text-sm font-medium' : 'text-gray-700 block mb-1.5 text-sm font-medium'
    const inputClass = darkMode
        ? 'w-full px-4 py-2.5 rounded-lg border border-gray-600 bg-gray-700/80 text-white focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500'
        : 'w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500'

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </span>
                <div>
                    <h1 className={`text-2xl font-bold tracking-tight ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Imágenes de publicidad</h1>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Gestiona las imágenes del carrusel de la tienda.</p>
                </div>
            </div>

            <div className={`rounded-xl overflow-hidden border shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-5 py-4 ${darkMode ? 'bg-emerald-600/25 border-b border-emerald-500/30' : 'bg-emerald-50 border-b border-emerald-200'}`}>
                    <div className="flex items-center gap-3">
                        <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${darkMode ? 'bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 text-emerald-600'}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        </span>
                        <h2 className={`text-lg font-bold ${darkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>Cargar imagen</h2>
                    </div>
                </div>
                <div className="p-6">
                    <form onSubmit={handleGuardar} className="space-y-5">
                        <div>
                            <Label className={labelClass}>Imagen (JPG, PNG, GIF, WebP, máx. 9 MB)</Label>
                            <input
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                onChange={handleFileChange}
                                className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium ${
                                    darkMode
                                        ? 'file:bg-emerald-600 file:text-white file:hover:bg-emerald-500 text-gray-300'
                                        : 'file:bg-emerald-600 file:text-white file:hover:bg-emerald-700 text-gray-700'
                                }`}
                            />
                            {previewUrl && (
                                <div className="mt-3 relative w-48 h-24 rounded-lg overflow-hidden border border-gray-600">
                                    <img src={previewUrl} alt="Vista previa" className="object-cover w-full h-full" />
                                </div>
                            )}
                            <InputError messages={errors.imagen} />
                        </div>
                        <div>
                            <Label className={labelClass}>Título (opcional)</Label>
                            <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} className={`${inputClass} ${titulo?.trim() ? '!bg-[#E5EBFD] !text-gray-900' : ''}`} placeholder="Ej: Oferta de temporada" />
                        </div>
                        {success && (
                            <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${darkMode ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-emerald-50 border border-emerald-200'}`}>
                                <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{success}</p>
                            </div>
                        )}
                        <InputError messages={errors.general} />
                        <Button
                            type="submit"
                            disabled={uploading || !selectedFile}
                            className={`w-full sm:w-auto py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-2 ${
                                darkMode ? '!bg-emerald-500 hover:!bg-emerald-400' : '!bg-emerald-600 hover:!bg-emerald-700'
                            } text-white transition-all duration-200`}
                        >
                            {uploading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    Guardar
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>

            <div className={`rounded-xl overflow-hidden border shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-5 py-4 ${darkMode ? 'bg-gray-700/50 border-b border-gray-600' : 'bg-gray-50 border-b border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                        <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Imágenes actuales</h2>
                        <span className={`text-sm font-medium px-3 py-1 rounded-full ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                            {imagenes.length} imagen{imagenes.length !== 1 ? 'es' : ''}
                        </span>
                    </div>
                </div>
                <div className="p-6">
                    {imagenes.length === 0 ? (
                        <div className={`flex flex-col items-center justify-center py-16 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            <span className={`flex h-16 w-16 items-center justify-center rounded-full mb-4 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                <svg className="w-8 h-8 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                            </span>
                            <p className="font-medium">No hay imágenes de publicidad</p>
                            <p className="text-sm mt-1 opacity-80">Sube la primera imagen usando el formulario de arriba.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {imagenes.map((img) => (
                                <div
                                    key={img.id}
                                    className={`rounded-lg overflow-hidden border ${darkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
                                >
                                    <div className="relative aspect-video bg-gray-900">
                                        <img
                                            src={resolvePublicidadUrl(img.url)}
                                            alt={img.titulo || `Publicidad ${img.orden}`}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="p-3 flex items-center justify-between gap-2">
                                        <span className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{img.titulo || `#${img.orden}`}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleEliminar(img.id)}
                                            disabled={deletingId === img.id}
                                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                                darkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/40' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                                            } disabled:opacity-50`}
                                        >
                                            {deletingId === img.id ? (
                                                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                                            ) : (
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            )}
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
