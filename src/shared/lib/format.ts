const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

const NUMERO = new Intl.NumberFormat('es-CO')

const DECIMAL = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 })

const FECHA_LARGA = new Intl.DateTimeFormat('es-CO', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

const MESES_CORTOS = [
  'ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC',
] as const

/** $ 24.850.000 */
export const formatearMoneda = (valor: number): string => COP.format(valor)

export const formatearNumero = (valor: number): string => NUMERO.format(valor)

/** 2,4 — decimales con coma, como se escriben en Colombia. */
export const formatearDecimal = (valor: number): string => DECIMAL.format(valor)

/** Martes, 11 de agosto de 2026 */
export function formatearFechaLarga(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  const texto = FECHA_LARGA.format(d)
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

/** 11 AGO — para ejes de gráficos */
export function formatearFechaEje(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  const dia = String(d.getDate()).padStart(2, '0')
  return `${dia} ${MESES_CORTOS[d.getMonth()]}`
}

const FECHA_CORTA = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const HORA = new Intl.DateTimeFormat('es-CO', { hour: '2-digit', minute: '2-digit', hour12: false })

/** 21/09/2026 */
export const formatearFecha = (fecha: Date | string): string =>
  FECHA_CORTA.format(typeof fecha === 'string' ? new Date(fecha) : fecha)

/** 21/09/2026 · 14:30 */
export function formatearFechaHora(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  return `${FECHA_CORTA.format(d)} · ${HORA.format(d)}`
}

const DIAS_CORTOS = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'] as const

/**
 * 'YYYY-MM-DD' como fecha local. `new Date(iso)` la interpreta en UTC y en
 * Colombia (UTC-5) eso adelanta un día a cualquier fecha sin hora.
 */
export function fechaLocal(iso: string): Date {
  const [anio, mes, dia] = iso.split('-').map(Number)
  return new Date(anio ?? 1970, (mes ?? 1) - 1, dia ?? 1)
}

/** HOY para la fecha de hoy; si no, la abreviatura del día (MIÉ, JUE…). */
export function etiquetaDiaCorto(iso: string): string {
  const d = fechaLocal(iso)
  const hoy = new Date()
  const esHoy =
    d.getFullYear() === hoy.getFullYear() &&
    d.getMonth() === hoy.getMonth() &&
    d.getDate() === hoy.getDate()
  return esHoy ? 'HOY' : (DIAS_CORTOS[d.getDay()] ?? '')
}

/** $ 41,3M — cifras de eje y notas donde el importe exacto estorba. */
export function formatearMillones(valor: number): string {
  return `$ ${DECIMAL.format(valor / 1_000_000)}M`
}

/** 'ricardo.vargas' → 'Ricardo Vargas' */
export function nombreLegible(nombreUsuario: string | undefined): string {
  if (!nombreUsuario) return '—'
  return nombreUsuario
    .split(/[._\s]+/)
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ')
}

/** hace 12 min · hace 2 h · hace 3 d */
export function tiempoRelativo(fecha: Date | string): string {
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha
  const minutos = Math.round((Date.now() - d.getTime()) / 60000)

  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} min`

  const horas = Math.round(minutos / 60)
  if (horas < 24) return `hace ${horas} h`

  const dias = Math.round(horas / 24)
  return `hace ${dias} d`
}

/** Saludo según la hora local. */
export function saludo(fecha: Date = new Date()): string {
  const hora = fecha.getHours()
  if (hora < 12) return 'Buen día'
  if (hora < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
