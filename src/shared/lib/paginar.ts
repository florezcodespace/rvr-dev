export const POR_PAGINA = 7

export interface Pagina<T> {
  items: T[]
  total: number
  pagina: number
  totalPaginas: number
}

/** Corta una lista ya filtrada en la página pedida. */
export function paginar<T>(lista: T[], pagina: number, porPagina = POR_PAGINA): Pagina<T> {
  const totalPaginas = Math.max(Math.ceil(lista.length / porPagina), 1)
  const actual = Math.min(Math.max(pagina, 1), totalPaginas)
  const inicio = (actual - 1) * porPagina

  return {
    items: lista.slice(inicio, inicio + porPagina),
    total: lista.length,
    pagina: actual,
    totalPaginas,
  }
}

/** "Mostrando 1–7 de 43 cotizaciones" */
export function textoPagina(
  { items, total, pagina }: Pagina<unknown>,
  sustantivo: string,
  porPagina = POR_PAGINA,
): string {
  if (total === 0) return `Sin ${sustantivo}`
  const desde = (pagina - 1) * porPagina + 1
  return `Mostrando ${desde}–${desde + items.length - 1} de ${total} ${sustantivo}`
}
