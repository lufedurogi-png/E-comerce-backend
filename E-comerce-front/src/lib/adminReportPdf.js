/**
 * Genera PDF de informes del dashboard admin. Mismo estilo que cotizaciones (verde, cabecera, tablas).
 */

const margin = 14
const green = [5, 150, 105]
const greenLight = [236, 253, 245]
const greenDark = [4, 120, 87]

function headerPdf(doc, titulo) {
    const pageW = doc.internal.pageSize.getWidth()
    const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    doc.setFillColor(...green)
    doc.rect(0, 0, pageW, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(11)
    doc.setFont(undefined, 'bold')
    doc.text(titulo, margin, 10)
    doc.setFontSize(10)
    doc.text(`Fecha del informe: ${fechaStr}`, pageW - margin, 14, { align: 'right' })
    doc.setTextColor(...greenDark)
    doc.setFontSize(16)
    doc.text('Panel de administración', margin, 34)
    doc.setFontSize(9)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Dashboard · Informe generado desde admin', margin, 39)
    doc.setDrawColor(...green)
    doc.setLineWidth(0.8)
    doc.line(margin, 46, pageW - margin, 46)
}

function footerPdf(doc, subtitulo) {
    const pageW = doc.internal.pageSize.getWidth()
    const pageH = doc.internal.pageSize.getHeight()
    const footerY = pageH - 12
    const fechaStr = new Date().toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
    doc.setDrawColor(...green)
    doc.setLineWidth(0.4)
    doc.line(margin, footerY - 6, pageW - margin, footerY - 6)
    doc.setFontSize(8)
    doc.setFont(undefined, 'normal')
    doc.setTextColor(...greenDark)
    doc.text(`${subtitulo} · ${fechaStr}`, pageW / 2, footerY, { align: 'center' })
}

/**
 * PDF: Informe de categorías más vistas en búsquedas.
 * @param {Array<{ nombre?: string, total?: number }>} categorias
 */
export async function downloadInformeCategorias(categorias) {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()

    headerPdf(doc, 'INFORME · CATEGORÍAS MÁS VISTAS')

    doc.setFillColor(...greenLight)
    doc.rect(margin, 52, pageW - margin * 2, 8, 'F')
    doc.setTextColor(...greenDark)
    doc.setFontSize(10)
    doc.setFont(undefined, 'bold')
    doc.text('DETALLE POR CATEGORÍA', margin + 4, 57.5)
    doc.setTextColor(0, 0, 0)

    const tableData = (categorias || []).map((c) => [
        (c.nombre || 'Sin categoría').toString().slice(0, 60),
        String(c.total ?? 0),
    ])

    autoTable(doc, {
        startY: 62,
        head: [['Categoría', 'Total búsquedas']],
        body: tableData.length ? tableData : [['Sin datos', '-']],
        theme: 'plain',
        headStyles: {
            fillColor: greenLight,
            textColor: greenDark,
            fontStyle: 'bold',
            fontSize: 9,
        },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { halign: 'right', cellWidth: 35 },
        },
        margin: { left: margin, right: margin },
        tableLineColor: [167, 243, 208],
        tableLineWidth: 0.3,
    })

    footerPdf(doc, 'Informe categorías más vistas')
    doc.save(`Informe_Categorias_${new Date().toISOString().slice(0, 10)}.pdf`)
}

const TIPO_LABELS = { 1: 'Admin', 2: 'Cliente', 3: 'Vendedor' }

/**
 * PDF: Informe de actividad de usuarios (por mes o por eventos día/hora).
 * @param {Array<{ mes: string, registros: number, logins: number }>} actividadData
 * @param {Array<{ dia: number, hora: number, tipo: number, evento: string }>} eventos
 */
export async function downloadInformeActividad(actividadData, eventos) {
    const { jsPDF } = await import('jspdf')
    const autoTable = (await import('jspdf-autotable')).default
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageW = doc.internal.pageSize.getWidth()

    headerPdf(doc, 'INFORME · ACTIVIDAD DE USUARIOS')

    const startY = 52
    let y = startY

    if (eventos && eventos.length > 0) {
        doc.setFillColor(...greenLight)
        doc.rect(margin, y, pageW - margin * 2, 8, 'F')
        doc.setTextColor(...greenDark)
        doc.setFontSize(10)
        doc.setFont(undefined, 'bold')
        doc.text('EVENTOS (últimos 31 días) · Día · Hora · Tipo · Evento', margin + 4, y + 5.5)
        doc.setTextColor(0, 0, 0)
        y += 12

        const hora12 = (h) => {
            if (h === 0) return '12:00 am'
            if (h === 12) return '12:00 pm'
            return h < 12 ? `${h}:00 am` : `${h - 12}:00 pm`
        }
        const tableData = eventos
            .slice(0, 80)
            .map((e) => [
                String(e.dia),
                hora12(Number(e.hora)),
                TIPO_LABELS[e.tipo] || 'Usuario',
                e.evento === 'registro' ? 'Registro' : 'Inicio de sesión',
            ])

        autoTable(doc, {
            startY: y,
            head: [['Día', 'Hora', 'Tipo', 'Evento']],
            body: tableData,
            theme: 'plain',
            headStyles: {
                fillColor: greenLight,
                textColor: greenDark,
                fontStyle: 'bold',
                fontSize: 9,
            },
            margin: { left: margin, right: margin },
            tableLineColor: [167, 243, 208],
            tableLineWidth: 0.3,
        })
        y = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : y + 30
    }

    if (actividadData && actividadData.length > 0) {
        doc.setFillColor(...greenLight)
        doc.rect(margin, y, pageW - margin * 2, 8, 'F')
        doc.setTextColor(...greenDark)
        doc.setFontSize(10)
        doc.setFont(undefined, 'bold')
        doc.text('RESUMEN POR MES', margin + 4, y + 5.5)
        doc.setTextColor(0, 0, 0)
        y += 12

        const tableData = actividadData.map((r) => [
            String(r.mes || '-'),
            String(r.registros ?? 0),
            String(r.logins ?? 0),
        ])

        autoTable(doc, {
            startY: y,
            head: [['Mes', 'Registros', 'Inicios de sesión']],
            body: tableData,
            theme: 'plain',
            headStyles: {
                fillColor: greenLight,
                textColor: greenDark,
                fontStyle: 'bold',
                fontSize: 9,
            },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
            },
            margin: { left: margin, right: margin },
            tableLineColor: [167, 243, 208],
            tableLineWidth: 0.3,
        })
    }

    footerPdf(doc, 'Informe actividad de usuarios')
    doc.save(`Informe_Actividad_${new Date().toISOString().slice(0, 10)}.pdf`)
}
