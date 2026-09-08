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
