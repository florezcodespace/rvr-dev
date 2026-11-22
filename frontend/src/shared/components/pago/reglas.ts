import type { MetodoPago } from '@shared/domain/estados'
import { detectarTarjeta, largoCvv, numeroValido, soloDigitos, vencimientoValido } from '@shared/lib/tarjetas'

/**
 * Reglas del pago en el portal: qué opción eligió la persona, qué datos pide y
 * qué se envía a la API. El espejo en la API es backend/src/utils/pagos.ts.
 */
export type OpcionPago = 'nequi' | 'pse' | 'credito' | 'debito' | 'daviplata' | 'transferencia' | 'efectivo'

export const METODO_DE: Record<OpcionPago, MetodoPago> = {
  nequi: 'Nequi', pse: 'PSE', credito: 'Tarjeta', debito: 'Tarjeta',
  daviplata: 'Daviplata', transferencia: 'Transferencia', efectivo: 'Efectivo',
}

export const TIPOS_DOCUMENTO = [
  { valor: 'CC', label: 'CC' }, { valor: 'CE', label: 'CE' }, { valor: 'TI', label: 'TI' },
  { valor: 'PP', label: 'PP' }, { valor: 'NIT', label: 'NIT' },
] as const

export interface DatosPago {
  opcion: OpcionPago | null
  referencia: string
  /** Número completo: se usa para detectar el banco y validar, nunca se envía. */
  numero: string
  vencimiento: string
  cvv: string
  titular: string
  tipoDocumento: string
  documento: string
  cuotas: string
  celular: string
  /** Banco elegido a mano (PSE, transferencia, o tarjeta que no se reconoce). */
  banco: string
}

export const PAGO_INICIAL: DatosPago = {
  opcion: null, referencia: '', numero: '', vencimiento: '', cvv: '', titular: '',
  tipoDocumento: 'CC', documento: '', cuotas: '1', celular: '', banco: '',
}

const REFERENCIA_OBLIGATORIA: Partial<Record<OpcionPago, string>> = {
  nequi: 'Escribe el número de referencia del pago',
  daviplata: 'Escribe el número de referencia del pago',
  pse: 'Escribe el CUS de la transacción',
}

export const esTarjeta = (o: OpcionPago | null) => o === 'credito' || o === 'debito'

/** Revisa lo que falta y arma lo que se envía a la API (sin número completo, vencimiento ni CVV). */
export function armarPago(d: DatosPago) {
  const errores: Record<string, string> = {}
  if (!d.opcion) return { errores: { metodo: 'Elige cómo pagaste' }, metodoPago: null, referencia: null, detalle: null }
  const falta = (campo: string, mensaje: string) => { errores[`detalle_${campo}`] = mensaje }
  const titular = d.titular.trim()
  const documento = d.documento.trim()
  const pideTitular = () => { if (titular.length < 3) falta('titular', 'Escribe el nombre del titular') }
  const pideDocumento = () => { if (!/^[0-9A-Za-z]{5,15}$/.test(documento)) falta('documento', 'Escribe el documento sin puntos') }
  const pideCelular = () => { if (!/^3[0-9]{9}$/.test(d.celular)) falta('celular', 'Escribe un celular de 10 dígitos que empiece por 3') }
  const pideBanco = () => { if (!d.banco) falta('banco', 'Elige el banco') }

  let detalle: Record<string, string | number> | null = null
  switch (d.opcion) {
    case 'credito':
    case 'debito': {
      const t = detectarTarjeta(d.numero)
      if (!numeroValido(d.numero)) falta('numero', 'Revisa el número de la tarjeta')
      if (!vencimientoValido(d.vencimiento)) falta('vencimiento', d.vencimiento.length === 5 ? 'La tarjeta está vencida o la fecha no es válida' : 'Escribe el vencimiento (MM/AA)')
      if (soloDigitos(d.cvv).length !== largoCvv(t.franquicia)) falta('cvv', `Escribe los ${largoCvv(t.franquicia)} dígitos de atrás`)
      if (!t.banco && !d.banco) falta('banco', 'No reconocimos el banco: elígelo')
      pideTitular()
      pideDocumento()
      detalle = {
        tipoTarjeta: d.opcion === 'credito' ? 'Crédito' : 'Débito',
        franquicia: t.franquicia ?? 'Otra',
        banco: t.banco ?? d.banco,
        ultimos4: soloDigitos(d.numero).slice(-4),
        titular, tipoDocumento: d.tipoDocumento, documento,
        cuotas: d.opcion === 'credito' ? Number(d.cuotas) : 1,
      }
      break
    }
    case 'nequi':
    case 'daviplata':
      pideCelular()
      pideTitular()
      detalle = { celular: d.celular, titular }
      break
    case 'pse':
      pideBanco()
      pideTitular()
      pideDocumento()
      detalle = { banco: d.banco, titular, tipoDocumento: d.tipoDocumento, documento }
      break
    case 'transferencia':
      pideBanco()
      detalle = { banco: d.banco }
      break
    case 'efectivo':
      break
  }
  const referencia = d.referencia.trim() || null
  const sinReferencia = REFERENCIA_OBLIGATORIA[d.opcion]
  if (sinReferencia && !referencia) errores.referencia = sinReferencia
  return { errores, metodoPago: METODO_DE[d.opcion], referencia, detalle }
}
