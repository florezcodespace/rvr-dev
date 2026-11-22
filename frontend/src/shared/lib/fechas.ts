/** Utilidades de fechas locales (Colombia) sin librerías. */

const dos = (n: number) => String(n).padStart(2, '0')

/** Date → YYYY-MM-DD en hora local. */
export const aISO = (d: Date) => `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`

/** YYYY-MM-DD → Date local a mediodía (evita saltos por zona horaria). */
export const deISO = (s: string) => {
  const [a, m, d] = s.split('-').map(Number)
  return new Date(a!, (m ?? 1) - 1, d ?? 1, 12)
}

export const hoyISO = () => aISO(new Date())

export const sumarDias = (s: string, dias: number) => {
  const d = deISO(s)
  d.setDate(d.getDate() + dias)
  return aISO(d)
}

/** Lunes de la semana de la fecha. */
export const lunesDe = (s: string) => {
  const d = deISO(s)
  const dia = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dia)
  return aISO(d)
}

export const primeroDelMes = (s: string) => `${s.slice(0, 7)}-01`

export const ultimoDelMes = (s: string) => {
  const d = deISO(primeroDelMes(s))
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return aISO(d)
}

export const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export const etiquetaDia = (s: string) =>
  deISO(s).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })

export const etiquetaMes = (s: string) => {
  const t = deISO(s).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** ISO completo → «08:00» local. */
export const horaDe = (iso: string) => new Date(iso).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })

/** ISO completo → YYYY-MM-DD local. */
export const fechaDe = (iso: string) => aISO(new Date(iso))

/** Rango de los últimos N días, terminando hoy. */
export const ultimosDias = (n: number) => ({ desde: sumarDias(hoyISO(), -(n - 1)), hasta: hoyISO() })
