/**
 * Genera y descarga un PDF de cotización con el mismo formato que en el dashboard.
 * @param {Array<{ nombre_producto?: string, clave?: string, cantidad?: number, precio_unitario?: number, subtotal?: number }>} items
 * @param {number} total
 * @param {string} [nombreArchivo] - Ej: Cotizacion_2025-01-29_14-30.pdf
 */
export async function downloadCotizacionPdf(items, total, nombreArchivo) {
    const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    const file = nombreArchivo || `Cotizacion_${new Date().toISOString().slice(0, 16).replace('T', '_')}.pdf`
    const totalStr = typeof total === 'number' ? total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : String(total)

    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const margin = 14

    const green = [5, 150, 105]
    const greenLight = [236, 253, 245]
    const greenDark = [4, 120, 87]

    doc.setFillColor(...green)
    doc.rect(0, 0, pageW, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text('COTIZACIÓN', margin, 10)
    doc.setFontSize(16)
    doc.text(`Fecha: ${fechaStr}`, pageW - margin, 14, { align: 'right' })

    doc.setTextColor(...greenDark)
    doc.setFontSize(20)
    doc.setFont(undefined, 'bold')
    doc.text('Todo para la oficina', margin, 34)
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Soluciones para tu espacio de trabajo', margin, 39)
    doc.setFontSize(10)
    doc.text('Av. López Mateos #1038-11, Col. Italia Providencia', margin, 46)
    doc.text('CP 44630, Guadalajara, Jalisco', margin, 51)
    doc.text('desarrollo@nxt.it.com · 333 616-7279', margin, 56)

    doc.setDrawColor(...green)
    doc.setLineWidth(0.8)
    doc.line(margin, 62, pageW - margin, 62)

    doc.setFillColor(...greenLight)
    doc.rect(margin, 66, pageW - margin * 2, 8, 'F')
    doc.setTextColor(...greenDark)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('DETALLE DE LA COTIZACIÓN', margin + 4, 71.5)
    doc.setTextColor(0, 0, 0)

    const tableData = (items || []).map((i) => {
        const nombre = (i.nombre_producto || i.clave || '').toString().slice(0, 55) + (i.clave ? ` (${i.clave})` : '')
        const pUnit = typeof i.precio_unitario === 'number' ? '$ ' + i.precio_unitario.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : (i.precio_unitario ?? '-')
        const sub = typeof i.subtotal === 'number' ? '$ ' + i.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : (i.subtotal ?? '-')
        return [nombre, String(i.cantidad ?? 1), pUnit, sub]
    })

    autoTable(doc, {
        startY: 76,
        head: [['Producto', 'Cant.', 'P. unit.', 'Subtotal']],
        body: tableData,
        theme: 'plain',
        headStyles: {
            fillColor: greenLight,
            textColor: greenDark,
            fontStyle: 'bold',
            fontSize: 9
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'right', cellWidth: 18 },
            2: { halign: 'right', cellWidth: 28 },
            3: { halign: 'right', cellWidth: 28 }
        },
        margin: { left: margin, right: margin },
        tableLineColor: [167, 243, 208],
        tableLineWidth: 0.3
    })

    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 14 : 90
    doc.setDrawColor(...green)
    doc.setLineWidth(0.6)
    doc.line(margin, finalY, pageW - margin, finalY)
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.setTextColor(...greenDark)
    doc.text('Total', margin, finalY + 8)
    doc.setFontSize(14)
    doc.text(`$ ${totalStr}`, pageW - margin, finalY + 8, { align: 'right' })

    const footerY = pageH - 12
    doc.setDrawColor(...green)
    doc.setLineWidth(0.4)
    doc.line(margin, footerY - 6, pageW - margin, footerY - 6)
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...greenDark)
    doc.text(`Cotización · Todo para la oficina · ${fechaStr}`, pageW / 2, footerY, { align: 'center' })

    doc.save(file)
}
