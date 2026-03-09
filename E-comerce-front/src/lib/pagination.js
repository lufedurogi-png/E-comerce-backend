/**
 * Ventana deslizante de páginas para controles de paginación.
 * Devuelve hasta 7 números de página + opción de "..." y última página.
 * @param {number} currentPage - Página actual (base 1)
 * @param {number} totalPages - Total de páginas
 * @returns {{ windowPages: number[], showEllipsis: boolean, showLastPage: boolean }}
 */
export function getPaginationWindow(currentPage, totalPages) {
    const total = Math.max(1, totalPages)
    const current = Math.max(1, Math.min(currentPage, total))
    if (total <= 7) {
        return { windowPages: Array.from({ length: total }, (_, i) => i + 1), showEllipsis: false, showLastPage: false }
    }
    const startPage = Math.max(1, Math.min(current, total - 6))
    const endPage = Math.min(startPage + 6, total)
    const windowPages = []
    for (let p = startPage; p <= endPage; p++) windowPages.push(p)
    const showEllipsis = endPage < total - 1
    return { windowPages, showEllipsis, showLastPage: true }
}
