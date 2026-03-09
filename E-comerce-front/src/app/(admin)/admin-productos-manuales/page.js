'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import axios from '@/lib/axios'
import Button from '@/components/Button'
import Input from '@/components/Input'
import InputError from '@/components/InputError'
import Label from '@/components/Label'
import { swrFetcher } from '@/lib/swrFetcher'
import { resolveStorageUrl } from '@/lib/productos'

const LIST_KEY = '/admin/productos-manuales'
const swrConfig = { revalidateOnFocus: false, dedupingInterval: 3000 }
const CATEGORIAS_FALLBACK = [
    { id: 'accesorios', nombre: 'Accesorios', subcategorias: [] },
    { id: 'laptops', nombre: 'Laptops', subcategorias: [] },
    { id: 'monitores', nombre: 'Monitores', subcategorias: [] },
    { id: 'audio', nombre: 'Audio', subcategorias: [] },
    { id: 'almacenamiento', nombre: 'Almacenamiento', subcategorias: [] },
    { id: 'componentes', nombre: 'Componentes', subcategorias: [] },
    { id: 'impresoras', nombre: 'Impresoras', subcategorias: [] },
    { id: 'pcs', nombre: "PC's / Computadoras", subcategorias: [] },
    { id: 'otros', nombre: 'Otros', subcategorias: [] },
]

export default function AdminProductosManuales() {
    const [darkMode, setDarkMode] = useState(true)
    const [errors, setErrors] = useState({})
    const [success, setSuccess] = useState('')
    const [saving, setSaving] = useState(false)
    const [deletingId, setDeletingId] = useState(null)
    const [editingId, setEditingId] = useState(null)
    const [search, setSearch] = useState('')
    const [filterGrupo, setFilterGrupo] = useState('')
    const [filterMarca, setFilterMarca] = useState('')
    const [filterAnulado, setFilterAnulado] = useState('')
    const [page, setPage] = useState(1)
    const [form, setForm] = useState({
        descripcion: '',
        codigo_fabricante: '',
        principal: 'accesorios',
        grupo: '',
        marca: '',
        garantia: '',
        clase: '',
        moneda: 'MXN',
        precio: '',
        disponible: 0,
        disponible_cd: 0,
        ficha_tecnica: '',
        ficha_comercial: '',
        destacado: false,
        especificaciones_tecnicas: [],
        informacion_general: [],
    })
    const [imagen, setImagen] = useState(null)
    const [imagenesSecundarias, setImagenesSecundarias] = useState([])
    const [previewMain, setPreviewMain] = useState(null)
    const [previewsSecundarias, setPreviewsSecundarias] = useState([])
    const [imagenesExistentes, setImagenesExistentes] = useState([])
    const [imagenesExistentesRaw, setImagenesExistentesRaw] = useState([])
    const [eliminarImagenPrincipal, setEliminarImagenPrincipal] = useState(false)
    const [imagenesSecundariasEliminar, setImagenesSecundariasEliminar] = useState([])
    const MAX_SECUNDARIAS = 20

    useEffect(() => {
        setDarkMode(JSON.parse(localStorage.getItem('darkMode') ?? 'true'))
    }, [])
    useEffect(() => {
        const onDarkModeChange = (e) => setDarkMode(!!e.detail)
        window.addEventListener('darkModeChange', onDarkModeChange)
        return () => window.removeEventListener('darkModeChange', onDarkModeChange)
    }, [])

    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filterGrupo) params.set('grupo', filterGrupo)
    if (filterMarca) params.set('marca', filterMarca)
    if (filterAnulado !== '') params.set('anulado', filterAnulado)
    params.set('page', page)
    const listUrl = `${LIST_KEY}?${params}`

    const fetcherWithMeta = async (url) => {
        const res = await axios.get(url)
        return { data: res.data?.data ?? [], meta: res.data?.meta ?? { total: 0, last_page: 1 } }
    }
    const { data: listData, mutate } = useSWR(listUrl, fetcherWithMeta, swrConfig)
    const productos = listData?.data ?? []
    const meta = listData?.meta ?? { total: 0, last_page: 1 }
    const { data: grupos = [] } = useSWR(`${LIST_KEY}/grupos`, swrFetcher, swrConfig)
    const { data: marcas = [] } = useSWR(`${LIST_KEY}/marcas`, swrFetcher, swrConfig)
    const { data: categoriasPrincipalesApi = [] } = useSWR('/catalogos/categorias-principales', swrFetcher, swrConfig)
    const categoriasPrincipales = Array.isArray(categoriasPrincipalesApi) && categoriasPrincipalesApi.length > 0 ? categoriasPrincipalesApi : CATEGORIAS_FALLBACK

    const subcategoriasDelPrincipalRaw = categoriasPrincipales.find((c) => c.id === form.principal)?.subcategorias ?? []
    const subcategoriasSource = subcategoriasDelPrincipalRaw.length > 0 ? subcategoriasDelPrincipalRaw : (Array.isArray(grupos) ? grupos : [])
    const subcategoriasDelPrincipal = [...new Set([...(form.grupo && !subcategoriasSource.includes(form.grupo) ? [form.grupo] : []), ...subcategoriasSource])].sort()
    const inputHasValue = (v) => v !== '' && v !== undefined && v !== null && String(v).trim() !== ''

    const labelClass = darkMode ? 'text-gray-300 block mb-1.5 text-sm font-medium' : 'text-gray-700 block mb-1.5 text-sm font-medium'
    const inputClass = darkMode ? 'w-full px-4 py-2.5 rounded-lg border border-gray-600 bg-gray-700/80 text-white focus:ring-2 focus:ring-emerald-500/40' : 'w-full px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 focus:ring-2 focus:ring-emerald-500/30'
    const inputClassWithValue = (val) => `${inputClass} ${inputHasValue(val) ? '!bg-[#E5EBFD] !text-gray-900' : ''}`

    const resetForm = () => {
        setForm({
            descripcion: '',
            codigo_fabricante: '',
            principal: 'accesorios',
            grupo: '',
            marca: '',
            garantia: '',
            clase: '',
            moneda: 'MXN',
            precio: '',
            disponible: 0,
            disponible_cd: 0,
            ficha_tecnica: '',
            ficha_comercial: '',
            destacado: false,
            especificaciones_tecnicas: [],
            informacion_general: [],
        })
        setImagen(null)
        setImagenesSecundarias([])
        setPreviewMain(null)
        setPreviewsSecundarias([])
        setImagenesExistentes([])
        setImagenesExistentesRaw([])
        setEliminarImagenPrincipal(false)
        setImagenesSecundariasEliminar([])
        setEditingId(null)
    }

    const addImagenesSecundarias = (newFiles) => {
        const files = Array.from(newFiles || [])
        setImagenesSecundarias((prev) => [...prev, ...files].slice(0, MAX_SECUNDARIAS))
    }

    const removeImagenSecundaria = (index) => {
        setImagenesSecundarias((prev) => prev.filter((_, i) => i !== index))
    }

    const removeImagenExistente = (index) => {
        const raw = imagenesExistentesRaw[index]
        if (raw) setImagenesSecundariasEliminar((prev) => [...prev, raw])
        setImagenesExistentes((prev) => prev.filter((_, i) => i !== index))
        setImagenesExistentesRaw((prev) => prev.filter((_, i) => i !== index))
    }

    useEffect(() => {
        const urls = imagenesSecundarias.map((f) => URL.createObjectURL(f))
        setPreviewsSecundarias(urls)
        return () => urls.forEach((url) => URL.revokeObjectURL(url))
    }, [imagenesSecundarias])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setErrors({})
        setSuccess('')
        setSaving(true)
        try {
            const formData = new FormData()
            formData.append('descripcion', form.descripcion)
            formData.append('principal', form.principal)
            formData.append('grupo', form.grupo)
            formData.append('marca', form.marca)
            formData.append('moneda', form.moneda)
            formData.append('precio', form.precio || 0)
            formData.append('disponible', form.disponible || 0)
            formData.append('disponible_cd', form.disponible_cd || 0)
            formData.append('destacado', form.destacado ? '1' : '0')
            if (form.codigo_fabricante) formData.append('codigo_fabricante', form.codigo_fabricante)
            if (form.garantia) formData.append('garantia', form.garantia)
            if (form.clase) formData.append('clase', form.clase)
            if (form.ficha_tecnica) formData.append('ficha_tecnica', form.ficha_tecnica)
            if (form.ficha_comercial) formData.append('ficha_comercial', form.ficha_comercial)
            if (imagen) formData.append('imagen', imagen)
            imagenesSecundarias.forEach((f) => formData.append('imagenes_secundarias[]', f))
            if (editingId) {
                if (eliminarImagenPrincipal) formData.append('eliminar_imagen_principal', '1')
                imagenesSecundariasEliminar.forEach((url) => formData.append('imagenes_secundarias_eliminar[]', url))
            }
            formData.append('especificaciones_tecnicas', JSON.stringify(form.especificaciones_tecnicas))
            formData.append('informacion_general', JSON.stringify(form.informacion_general))
            if (editingId) formData.append('_method', 'PUT')

            const url = editingId ? `${LIST_KEY}/${editingId}` : LIST_KEY
            const res = await axios.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
            if (res.data?.success) {
                setSuccess(editingId ? 'Producto actualizado' : 'Producto creado')
                resetForm()
                await mutate()
                setTimeout(() => setSuccess(''), 4000)
            } else {
                setErrors({ general: [res.data?.message || 'Error'] })
            }
        } catch (err) {
            setErrors(err.response?.data?.errors || { general: [err.response?.data?.message || 'Error al guardar'] })
        } finally {
            setSaving(false)
        }
    }

    const handleEdit = (p) => {
        setEditingId(p.id)
        setImagen(null)
        setImagenesSecundarias([])
        const imgs = p.imagenes || []
        setImagenesExistentes(imgs.map((u) => resolveStorageUrl(u)))
        setImagenesExistentesRaw(imgs)
        setForm({
            descripcion: p.descripcion || '',
            codigo_fabricante: p.codigo_fabricante || '',
            principal: p.principal || 'accesorios',
            grupo: p.grupo || '',
            marca: p.marca || '',
            garantia: p.garantia || '',
            clase: p.clase || '',
            moneda: p.moneda || 'MXN',
            precio: p.precio ?? '',
            disponible: p.disponible ?? 0,
            disponible_cd: p.disponible_cd ?? 0,
            ficha_tecnica: p.ficha_tecnica || '',
            ficha_comercial: p.ficha_comercial || '',
            destacado: !!p.destacado,
            especificaciones_tecnicas: p.especificaciones_tecnicas || [],
            informacion_general: p.informacion_general || [],
        })
        setPreviewMain(p.imagen ? resolveStorageUrl(p.imagen) : null)
        setEliminarImagenPrincipal(false)
        setImagenesSecundariasEliminar([])
    }

    const handleDelete = async (id) => {
        setErrors({})
        setDeletingId(id)
        try {
            await axios.delete(`${LIST_KEY}/${id}`)
            await mutate()
        } catch (err) {
            setErrors({ general: [err.response?.data?.message || 'Error al eliminar'] })
        } finally {
            setDeletingId(null)
        }
    }

    const handleAnular = async (id) => {
        try {
            await axios.post(`${LIST_KEY}/${id}/anular`)
            await mutate()
        } catch (err) {
            setErrors({ general: [err.response?.data?.message || 'Error'] })
        }
    }

    const addSpec = (tipo) => {
        const key = tipo === 'especificaciones' ? 'especificaciones_tecnicas' : 'informacion_general'
        setForm((f) => ({ ...f, [key]: [...(f[key] || []), { nombre: '', valor: '' }] }))
    }

    const updateSpec = (tipo, i, field, val) => {
        const key = tipo === 'especificaciones' ? 'especificaciones_tecnicas' : 'informacion_general'
        setForm((f) => {
            const arr = [...(f[key] || [])]
            arr[i] = { ...arr[i], [field]: val }
            return { ...f, [key]: arr }
        })
    }

    const removeSpec = (tipo, i) => {
        const key = tipo === 'especificaciones' ? 'especificaciones_tecnicas' : 'informacion_general'
        setForm((f) => ({ ...f, [key]: (f[key] || []).filter((_, idx) => idx !== i) }))
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8 4-8-4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                </span>
                <div>
                    <h1 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>Productos manuales</h1>
                    <p className={`text-sm mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Crear y gestionar productos que se muestran en la tienda junto a los de CVA.</p>
                </div>
            </div>

            {/* Formulario */}
            <div className={`rounded-xl overflow-hidden border shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-5 py-4 ${darkMode ? 'bg-emerald-600/25 border-b border-emerald-500/30' : 'bg-emerald-50 border-b border-emerald-200'}`}>
                    <h2 className={`text-lg font-bold ${darkMode ? 'text-emerald-200' : 'text-emerald-800'}`}>{editingId ? 'Editar producto' : 'Nuevo producto'}</h2>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <h3 className={`text-base font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Información general</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <Label className={labelClass}>Nombre / Descripción *</Label>
                                <Input value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} className={inputClassWithValue(form.descripcion)} required />
                                <InputError messages={errors.descripcion} />
                            </div>
                            <div>
                                <Label className={labelClass}>Código fabricante</Label>
                                <Input value={form.codigo_fabricante} onChange={(e) => setForm((f) => ({ ...f, codigo_fabricante: e.target.value }))} className={inputClassWithValue(form.codigo_fabricante)} />
                            </div>
                            <div>
                                <Label className={labelClass}>Categoría *</Label>
                                <select value={form.principal} onChange={(e) => {
                                    const nuevoPrincipal = e.target.value
                                    const cat = categoriasPrincipales.find((c) => c.id === nuevoPrincipal)
                                    const subs = cat?.subcategorias ?? []
                                    const grupoValido = subs.includes(form.grupo)
                                    setForm((f) => ({ ...f, principal: nuevoPrincipal, grupo: grupoValido ? f.grupo : (subs[0] || '') }))
                                }} className={inputClassWithValue(form.principal)}>
                                    {(Array.isArray(categoriasPrincipales) ? categoriasPrincipales : []).map((c) => (
                                        <option key={c.id} value={c.id}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label className={labelClass}>Grupo / Subcategoría *</Label>
                                <select value={form.grupo} onChange={(e) => setForm((f) => ({ ...f, grupo: e.target.value }))} className={inputClassWithValue(form.grupo)} required>
                                    <option value="">{subcategoriasDelPrincipal.length > 0 ? 'Seleccione subcategoría' : 'Cargando...'}</option>
                                    {subcategoriasDelPrincipal.map((sub) => (
                                        <option key={sub} value={sub}>{sub}</option>
                                    ))}
                                </select>
                                <InputError messages={errors.grupo} />
                            </div>
                            <div>
                                <Label className={labelClass}>Marca *</Label>
                                <Input value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} className={inputClassWithValue(form.marca)} required />
                                <InputError messages={errors.marca} />
                            </div>
                            <div>
                                <Label className={labelClass}>Garantía</Label>
                                <Input value={form.garantia} onChange={(e) => setForm((f) => ({ ...f, garantia: e.target.value }))} className={inputClassWithValue(form.garantia)} />
                            </div>
                            <div>
                                <Label className={labelClass}>Moneda</Label>
                                <select value={form.moneda} onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))} className={inputClassWithValue(form.moneda)}>
                                    <option value="MXN">MXN</option>
                                    <option value="USD">USD</option>
                                </select>
                            </div>
                            <div>
                                <Label className={labelClass}>Precio *</Label>
                                <Input type="number" step="0.01" min="0" value={form.precio} onChange={(e) => setForm((f) => ({ ...f, precio: e.target.value }))} className={inputClassWithValue(form.precio)} required />
                                <InputError messages={errors.precio} />
                            </div>
                            <div>
                                <Label className={labelClass}>Stock disponible</Label>
                                <Input type="number" min="0" value={form.disponible} onChange={(e) => setForm((f) => ({ ...f, disponible: parseInt(e.target.value, 10) || 0 }))} className={inputClassWithValue(form.disponible)} />
                            </div>
                            <div>
                                <Label className={labelClass}>Stock CD</Label>
                                <Input type="number" min="0" value={form.disponible_cd} onChange={(e) => setForm((f) => ({ ...f, disponible_cd: parseInt(e.target.value, 10) || 0 }))} className={inputClassWithValue(form.disponible_cd)} />
                            </div>
                            <div className="md:col-span-2">
                                <label
                                    htmlFor="destacado"
                                    className={`flex items-center gap-3 cursor-pointer rounded-lg px-4 py-3 border transition-all duration-200 ${
                                        darkMode
                                            ? form.destacado
                                                ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
                                                : 'border-gray-600 bg-gray-700/50 hover:border-gray-500 text-gray-300'
                                            : form.destacado
                                                ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300 text-gray-700'
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        id="destacado"
                                        checked={form.destacado}
                                        onChange={(e) => setForm((f) => ({ ...f, destacado: e.target.checked }))}
                                        className="h-5 w-5 rounded accent-emerald-500 focus:ring-2 focus:ring-emerald-500/40"
                                    />
                                    <span className="font-medium">Destacado</span>
                                    <svg className={`w-4 h-4 ml-auto opacity-60 ${form.destacado ? 'text-emerald-500' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                    </svg>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div>
                        <Label className={labelClass}>Imagen principal * (JPG, PNG, GIF, WebP, máx. 9 MB)</Label>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            onChange={(e) => { const f = e.target.files?.[0]; setImagen(f); setPreviewMain(f ? URL.createObjectURL(f) : null); setEliminarImagenPrincipal(false); }}
                            required={!editingId}
                            className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium ${
                                darkMode
                                    ? 'file:bg-emerald-600 file:text-white file:hover:bg-emerald-500 text-gray-300'
                                    : 'file:bg-emerald-600 file:text-white file:hover:bg-emerald-700 text-gray-700'
                            }`}
                        />
                        {(previewMain || (editingId && eliminarImagenPrincipal)) && (
                            <div className="mt-3 flex items-center gap-3">
                                {previewMain && (
                                    <div className={`relative w-48 h-24 rounded-lg overflow-hidden border group ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                        <img src={previewMain} alt="Vista previa" className="object-cover w-full h-full" />
                                        {editingId && (
                                            <button
                                                type="button"
                                                onClick={() => { setPreviewMain(null); setImagen(null); setEliminarImagenPrincipal(true); }}
                                                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                ×
                                            </button>
                                        )}
                                    </div>
                                )}
                                {eliminarImagenPrincipal && editingId && (
                                    <span className={`text-sm ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Imagen principal marcada para eliminar. Selecciona una nueva para reemplazar.</span>
                                )}
                            </div>
                        )}
                        <InputError messages={errors.imagen} />
                    </div>

                    <div>
                        <Label className={labelClass}>Imágenes secundarias (opcional, hasta {MAX_SECUNDARIAS})</Label>
                        <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                            multiple
                            onChange={(e) => { addImagenesSecundarias(e.target.files); e.target.value = '' }}
                            disabled={imagenesSecundarias.length >= MAX_SECUNDARIAS}
                            className={`block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium disabled:opacity-60 ${
                                darkMode
                                    ? 'file:bg-emerald-600 file:text-white file:hover:bg-emerald-500 text-gray-300'
                                    : 'file:bg-emerald-600 file:text-white file:hover:bg-emerald-700 text-gray-700'
                            }`}
                        />
                        {(previewsSecundarias.length > 0 || imagenesExistentes.length > 0) && (
                            <div className="mt-3 flex flex-wrap gap-3">
                                {imagenesExistentes.map((url, i) => (
                                    <div key={`ex-${i}`} className={`relative w-24 h-24 rounded-lg overflow-hidden border group ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                        <img src={url} alt={`Existente ${i + 1}`} className="object-cover w-full h-full" />
                                        <button
                                            type="button"
                                            onClick={() => removeImagenExistente(i)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Eliminar imagen"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                                {previewsSecundarias.map((url, i) => (
                                    <div key={`new-${i}`} className={`relative w-24 h-24 rounded-lg overflow-hidden border group ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                                        <img src={url} alt={`Nueva ${i + 1}`} className="object-cover w-full h-full" />
                                        <button
                                            type="button"
                                            onClick={() => removeImagenSecundaria(i)}
                                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500/90 text-white flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Quitar"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className={`text-base font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Información general</h3>
                        {(form.informacion_general || []).map((ig, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <Input value={ig.nombre} onChange={(e) => updateSpec('informacion_general', i, 'nombre', e.target.value)} placeholder="Campo (ej. Presentación)" className={inputClassWithValue(ig.nombre)} />
                                <Input value={ig.valor} onChange={(e) => updateSpec('informacion_general', i, 'valor', e.target.value)} placeholder="Valor" className={inputClassWithValue(ig.valor)} />
                                <button type="button" onClick={() => removeSpec('informacion_general', i)} className={`px-3 py-2 rounded ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>Eliminar</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addSpec('informacion_general')} className={`text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>+ Agregar campo</button>
                    </div>

                    <div>
                        <h3 className={`text-base font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Especificaciones técnicas</h3>
                        {(form.especificaciones_tecnicas || []).map((s, i) => (
                            <div key={i} className="flex gap-2 mb-2">
                                <Input value={s.nombre} onChange={(e) => updateSpec('especificaciones', i, 'nombre', e.target.value)} placeholder="Nombre" className={inputClassWithValue(s.nombre)} />
                                <Input value={s.valor} onChange={(e) => updateSpec('especificaciones', i, 'valor', e.target.value)} placeholder="Valor" className={inputClassWithValue(s.valor)} />
                                <button type="button" onClick={() => removeSpec('especificaciones', i)} className={`px-3 py-2 rounded ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'}`}>Eliminar</button>
                            </div>
                        ))}
                        <button type="button" onClick={() => addSpec('especificaciones')} className={`text-sm ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>+ Agregar especificación</button>
                    </div>

                    {success && <div className={`p-3 rounded ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'}`}>{success}</div>}
                    <InputError messages={errors.general} />
                    <div className="flex gap-3">
                        <Button type="submit" disabled={saving} className={`${darkMode ? '!bg-emerald-500 hover:!bg-emerald-400' : '!bg-emerald-600 hover:!bg-emerald-700'} text-white px-6 py-2.5`}>
                            {saving ? 'Guardando...' : editingId ? 'Actualizar' : 'Guardar'}
                        </Button>
                        {editingId && <button type="button" onClick={resetForm} className={`px-4 py-2 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>Cancelar</button>}
                    </div>
                </form>
            </div>

            {/* Listado con filtros */}
            <div className={`rounded-xl overflow-hidden border shadow-xl ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                <div className={`px-5 py-4 ${darkMode ? 'bg-gray-700/50 border-b border-gray-600' : 'bg-gray-50 border-b border-gray-200'}`}>
                    <h2 className={`text-lg font-bold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Productos</h2>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[180px]">
                            <Label className={labelClass}>Buscar</Label>
                            <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Nombre, clave, marca" className={inputClassWithValue(search)} />
                        </div>
                        <div>
                            <Label className={labelClass}>Grupo</Label>
                            <select value={filterGrupo} onChange={(e) => { setFilterGrupo(e.target.value); setPage(1); }} className={inputClassWithValue(filterGrupo)}>
                                <option value="">Todos</option>
                                {(Array.isArray(grupos) ? grupos : []).map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className={labelClass}>Marca</Label>
                            <select value={filterMarca} onChange={(e) => { setFilterMarca(e.target.value); setPage(1); }} className={inputClassWithValue(filterMarca)}>
                                <option value="">Todas</option>
                                {(Array.isArray(marcas) ? marcas : []).map((m) => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label className={labelClass}>Estado</Label>
                            <select value={filterAnulado} onChange={(e) => { setFilterAnulado(e.target.value); setPage(1); }} className={inputClassWithValue(filterAnulado)}>
                                <option value="">Todos</option>
                                <option value="0">Activos</option>
                                <option value="1">Anulados</option>
                            </select>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    {productos.length === 0 ? (
                        <div className={`py-16 text-center ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>No hay productos manuales</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={darkMode ? 'bg-gray-700/60' : 'bg-gray-100'}>
                                    <th className={`py-3 px-4 text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Clave</th>
                                    <th className={`py-3 px-4 text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Descripción</th>
                                    <th className={`py-3 px-4 text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Grupo</th>
                                    <th className={`py-3 px-4 text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Marca</th>
                                    <th className={`py-3 px-4 text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Precio</th>
                                    <th className={`py-3 px-4 text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Stock</th>
                                    <th className={`py-3 px-4 text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Estado</th>
                                    <th className={`py-3 px-4 text-left ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map((p) => (
                                    <tr key={p.id} className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.clave}</td>
                                        <td className={`py-3 px-4 max-w-xs truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.descripcion}</td>
                                        <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.grupo}</td>
                                        <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.marca}</td>
                                        <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{p.moneda} {Number(p.precio).toFixed(2)}</td>
                                        <td className={`py-3 px-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{(p.disponible || 0) + (p.disponible_cd || 0)}</td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-0.5 rounded text-xs ${p.anulado ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                                {p.anulado ? 'Anulado' : 'Activo'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <button type="button" onClick={() => handleEdit(p)} className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>Editar</button>
                                                <button type="button" onClick={() => handleAnular(p.id)} className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>{p.anulado ? 'Reactivar' : 'Anular'}</button>
                                                <button type="button" onClick={() => handleDelete(p.id)} disabled={deletingId === p.id} className={`px-2 py-1 rounded text-xs ${darkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-600'} disabled:opacity-50`}>Eliminar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                    {meta.last_page > 1 && (
                        <div className="flex justify-center gap-2 py-4">
                            <button type="button" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} disabled:opacity-50`}>Anterior</button>
                            <span className={`py-1 px-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{page} / {meta.last_page}</span>
                            <button type="button" onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))} disabled={page >= meta.last_page} className={`px-3 py-1 rounded ${darkMode ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'} disabled:opacity-50`}>Siguiente</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
