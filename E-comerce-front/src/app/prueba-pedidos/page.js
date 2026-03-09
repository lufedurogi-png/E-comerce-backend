'use client'

import { useState } from 'react'
import Link from 'next/link'
import axios from '@/lib/axios'
import Input from '@/components/Input'
import Label from '@/components/Label'
import Button from '@/components/Button'

const DEFAULT_ITEMS = [
  { nombre_producto: '', cantidad: 1, precio_unitario: '' },
  { nombre_producto: '', cantidad: 1, precio_unitario: '' },
  { nombre_producto: '', cantidad: 1, precio_unitario: '' },
]

export default function PruebaPedidosPage() {
  const [fecha, setFecha] = useState(() => {
    const d = new Date()
    return d.toISOString().slice(0, 10)
  })
  const [folio, setFolio] = useState('')
  const [metodoPago, setMetodoPago] = useState('MercadoPago')
  const [estadoPago, setEstadoPago] = useState('pendiente')
  const [estatusPedido, setEstatusPedido] = useState('en_proceso')
  const [items, setItems] = useState(DEFAULT_ITEMS)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const updateItem = (i, field, value) => {
    setItems((prev) => {
      const next = [...prev]
      next[i] = { ...next[i], [field]: value }
      return next
    })
  }

  const filledItems = items.filter((it) => it.nombre_producto.trim())
  const monto = filledItems.reduce((sum, it) => {
    const q = parseInt(it.cantidad, 10) || 0
    const p = parseFloat(it.precio_unitario) || 0
    return sum + q * p
  }, 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!folio.trim()) {
      setError('El folio es obligatorio.')
      return
    }
    if (filledItems.length === 0) {
      setError('Añade al menos un producto.')
      return
    }

    setLoading(true)
    try {
      const payload = {
        fecha,
        folio: folio.trim(),
        monto: Math.round(monto * 100) / 100,
        metodo_pago: metodoPago,
        estado_pago: estadoPago,
        estatus_pedido: estatusPedido,
        items: filledItems.map((it) => ({
          nombre_producto: it.nombre_producto.trim(),
          cantidad: parseInt(it.cantidad, 10) || 1,
          precio_unitario: parseFloat(it.precio_unitario) || 0,
        })),
      }

      const { data } = await axios.post('/prueba-pedido', payload)
      if (!data?.success || !data?.data?.id) {
        setError(data?.message || 'Error al crear el pedido.')
        return
      }

      const { id, folio: f } = data.data
      setSuccess(`Pedido ${f} creado. Descargando PDF…`)

      const pdf = await axios.get(`/pedidos/${id}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(pdf.data)
      const a = document.createElement('a')
      a.href = url
      a.download = `pedido-${f}.pdf`
      a.click()
      URL.revokeObjectURL(url)

      setSuccess(`Pedido ${f} creado y PDF descargado.`)
      setFolio('')
      setItems(DEFAULT_ITEMS.map((it) => ({ ...it, cantidad: 1, precio_unitario: '' })))
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.errors?.folio?.[0] || err.message || 'Error al crear el pedido.'
      setError(String(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[#FF8000]">Prueba pedidos (temporal)</h1>
          <Link
            href="/dashboard"
            className="text-sm text-gray-400 hover:text-[#FF8000] transition-colors"
          >
            ← Volver al dashboard
          </Link>
        </div>

        <p className="text-gray-400 text-sm mb-6">
          Rellena el formulario y pulsa «Crear y descargar PDF». Se creará un pedido en la BD
          y se descargará el PDF con el diseño de factura. Debes estar <strong>logueado</strong> (mismo usuario que en el dashboard).
          <br />
          <span className="text-amber-400/90">Vista temporal:</span> borrar esta página cuando termines las pruebas.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6 rounded-xl bg-gray-800/80 border border-gray-700 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-200">Fecha</Label>
              <Input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="mt-1 w-full bg-gray-700 border-gray-600 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-gray-200">Folio (único)</Label>
              <Input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                placeholder="Ej. 000099"
                className="mt-1 w-full bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label className="text-gray-200">Método de pago</Label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
              >
                <option value="MercadoPago">MercadoPago</option>
                <option value="Tarjeta">Tarjeta</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Efectivo">Efectivo</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-200">Estado pago</Label>
              <select
                value={estadoPago}
                onChange={(e) => setEstadoPago(e.target.value)}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
              >
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="reembolsado">Reembolsado</option>
              </select>
            </div>
            <div>
              <Label className="text-gray-200">Estatus pedido</Label>
              <select
                value={estatusPedido}
                onChange={(e) => setEstatusPedido(e.target.value)}
                className="mt-1 w-full rounded-md bg-gray-700 border-gray-600 text-white px-3 py-2"
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_proceso">En proceso</option>
                <option value="enviado">Enviado</option>
                <option value="completado">Completado</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-gray-200">Productos (mín. 1)</Label>
            <p className="text-gray-500 text-xs mt-1 mb-2">Deja vacías las filas que no uses. El monto se calcula solo.</p>
            <div className="space-y-3">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-6">
                    <Input
                      value={it.nombre_producto}
                      onChange={(e) => updateItem(i, 'nombre_producto', e.target.value)}
                      placeholder="Nombre producto"
                      className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      type="number"
                      min="1"
                      value={it.cantidad}
                      onChange={(e) => updateItem(i, 'cantidad', e.target.value)}
                      placeholder="Cant."
                      className="w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.precio_unitario}
                      onChange={(e) => updateItem(i, 'precio_unitario', e.target.value)}
                      placeholder="P. unitario"
                      className="w-full bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-[#FF8000] font-medium">Total: $ {monto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}
          {success && <p className="text-emerald-400 text-sm">{success}</p>}

          <div className="flex flex-wrap gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[#FF8000] to-[#FF9500] hover:from-[#FF9500] hover:to-[#FFAA00] text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? 'Creando…' : 'Crear pedido y descargar PDF'}
            </Button>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
