import { BANCOS_BIN, BINS_COLOMBIA } from './bins-colombia'

/** Lo que se sabe de una tarjeta por sus primeros dígitos. */
export interface TarjetaDetectada {
  franquicia: string | null
  /** Banco emisor, si el BIN está en la tabla de Colombia. */
  banco: string | null
  tipo: 'Crédito' | 'Débito' | null
}

export const soloDigitos = (v: string) => v.replace(/[^0-9]/g, '')

/** Franquicia por el prefijo (rangos públicos de cada red). */
export function franquiciaDe(numero: string): string | null {
  const n = soloDigitos(numero)
  if (/^4/.test(n)) return 'Visa'
  if (/^3[47]/.test(n)) return 'American Express'
  if (/^3(0[0-5]|[68])/.test(n)) return 'Diners Club'
  if (/^(5[1-5]|2(2[2-9]|[3-6]|7[01]|720))/.test(n)) return 'Mastercard'
  if (/^(50|5[6-9]|6[0-9])/.test(n) && !/^6(011|5)/.test(n)) return 'Maestro'
  if (/^6(011|5)/.test(n)) return 'Discover'
  return null
}

let tabla: Map<string, { banco: string; tipo: 'Crédito' | 'Débito' }> | null = null
function tablaBins() {
  if (!tabla) {
    tabla = new Map()
    for (const e of BINS_COLOMBIA.split(' ')) {
      tabla.set(e.slice(0, 6), { tipo: e[6] === 'D' ? 'Débito' : 'Crédito', banco: BANCOS_BIN[parseInt(e.slice(7), 36)]! })
    }
  }
  return tabla
}

/** Franquicia, banco y tipo a partir del número (basta con los 6 primeros). */
export function detectarTarjeta(numero: string): TarjetaDetectada {
  const n = soloDigitos(numero)
  const bin = n.length >= 6 ? tablaBins().get(n.slice(0, 6)) : undefined
  return { franquicia: franquiciaDe(n), banco: bin?.banco ?? null, tipo: bin?.tipo ?? null }
}

export const largoNumero = (franquicia: string | null) => (franquicia === 'American Express' ? 15 : franquicia === 'Diners Club' ? 14 : 16)
export const largoCvv = (franquicia: string | null) => (franquicia === 'American Express' ? 4 : 3)

/** 0000 0000 0000 0000, o 0000 000000 00000 para Amex y Diners. */
export function formatearNumero(numero: string): string {
  const n = soloDigitos(numero)
  const f = franquiciaDe(n)
  const n2 = n.slice(0, largoNumero(f))
  if (f === 'American Express' || f === 'Diners Club') {
    return [n2.slice(0, 4), n2.slice(4, 10), n2.slice(10)].filter(Boolean).join(' ')
  }
  return n2.replace(/(.{4})(?=.)/g, '$1 ')
}

/** Algoritmo de Luhn: descarta números mal escritos. */
export function numeroValido(numero: string): boolean {
  const n = soloDigitos(numero)
  if (n.length < 13 || n.length !== largoNumero(franquiciaDe(n))) return false
  let suma = 0
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i])
    if (i % 2 === 1) {
      d *= 2
      if (d > 9) d -= 9
    }
    suma += d
  }
  return suma % 10 === 0
}

/** MM/AA mientras se escribe. */
export function formatearVencimiento(v: string): string {
  const n = soloDigitos(v).slice(0, 4)
  return n.length > 2 ? `${n.slice(0, 2)}/${n.slice(2)}` : n
}

/** Mes válido y que no haya vencido (la tarjeta sirve hasta el último día del mes). */
export function vencimientoValido(v: string, hoy = new Date()): boolean {
  const m = /^(\d{2})\/(\d{2})$/.exec(v)
  if (!m) return false
  const mes = Number(m[1])
  const anio = 2000 + Number(m[2])
  if (mes < 1 || mes > 12) return false
  return anio > hoy.getFullYear() || (anio === hoy.getFullYear() && mes >= hoy.getMonth() + 1)
}
