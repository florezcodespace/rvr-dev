import { z } from 'zod'

/**
 * Datos de cada método de pago: los usan el comprobante que sube el cliente
 * (portal) y el abono que registra RvR (ventas). El espejo en el portal web es
 * frontend/src/shared/components/pago/reglas.ts: si cambias uno, cambia el otro.
 *
 * De una tarjeta solo llega lo que se puede guardar sin pasarela de pago:
 * banco, franquicia, tipo, últimos 4, titular, documento y cuotas. El número
 * completo, el vencimiento y el CVV se quedan en el navegador.
 */
export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'PSE', 'Tarjeta'] as const
export type MetodoPago = (typeof METODOS_PAGO)[number]

export const TIPOS_DOCUMENTO = ['CC', 'CE', 'TI', 'PP', 'NIT'] as const

export const detallePago = z.object({
  tipoTarjeta: z.enum(['Crédito', 'Débito'], { error: 'Elige crédito o débito' }),
  franquicia: z.string().trim().min(2, 'No reconocimos la franquicia').max(30),
  banco: z.string().trim().min(2, 'Elige el banco').max(80),
  titular: z.string().trim().min(3, 'Escribe el nombre del titular').max(100),
  ultimos4: z.string().regex(/^[0-9]{4}$/, 'Escribe el número de la tarjeta'),
  cuotas: z.coerce.number().int().min(1, 'Mínimo 1 cuota').max(36, 'Máximo 36 cuotas'),
  celular: z.string().trim().regex(/^3[0-9]{9}$/, 'Escribe un celular de 10 dígitos que empiece por 3'),
  tipoDocumento: z.enum(TIPOS_DOCUMENTO, { error: 'Elige el tipo de documento' }),
  documento: z.string().trim().regex(/^[0-9A-Za-z]{5,15}$/, 'Escribe el documento sin puntos'),
}).partial()
export type DetallePago = z.infer<typeof detallePago>

/** Qué pide cada método, además de la referencia. */
export const CAMPOS_METODO: Record<MetodoPago, (keyof DetallePago)[]> = {
  Efectivo: [],
  Transferencia: ['banco'],
  Nequi: ['celular', 'titular'],
  Daviplata: ['celular', 'titular'],
  PSE: ['banco', 'titular', 'tipoDocumento', 'documento'],
  Tarjeta: ['tipoTarjeta', 'franquicia', 'banco', 'ultimos4', 'titular', 'tipoDocumento', 'documento', 'cuotas'],
}

const REFERENCIA_OBLIGATORIA: Partial<Record<MetodoPago, string>> = {
  Nequi: 'Escribe el número de referencia del pago',
  Daviplata: 'Escribe el número de referencia del pago',
  PSE: 'Escribe el CUS de la transacción',
}

const ETIQUETAS: Record<keyof DetallePago, string> = {
  tipoTarjeta: 'Tipo de tarjeta', franquicia: 'Franquicia', banco: 'Banco', titular: 'Titular', ultimos4: 'Tarjeta',
  cuotas: 'Cuotas', celular: 'Celular', tipoDocumento: 'Tipo de documento', documento: 'Documento del titular',
}

/** Revisa que lleguen los datos del método elegido (dentro de un superRefine). */
export function revisarPago(
  d: { metodoPago: MetodoPago; referencia?: string | null; detalle?: DetallePago | null },
  ctx: z.RefinementCtx,
) {
  const pedidos = CAMPOS_METODO[d.metodoPago].filter((c) => !(c === 'cuotas' && d.detalle?.tipoTarjeta === 'Débito'))
  for (const c of pedidos) {
    if (d.detalle?.[c] === undefined || d.detalle[c] === null) {
      ctx.addIssue({ code: 'custom', path: [`detalle_${c}`], message: `Falta: ${ETIQUETAS[c].toLowerCase()}` })
    }
  }
  const falta = REFERENCIA_OBLIGATORIA[d.metodoPago]
  if (falta && !d.referencia) ctx.addIssue({ code: 'custom', path: ['referencia'], message: falta })
}

/** Deja solo los datos del método elegido; null si el método no pide ninguno. */
export function limpiarDetalle(metodo: MetodoPago, detalle: DetallePago | null | undefined): DetallePago | null {
  const campos = CAMPOS_METODO[metodo]
  if (!campos.length) return null
  const limpio: Record<string, unknown> = {}
  for (const c of campos) if (detalle?.[c] !== undefined) limpio[c] = detalle[c]
  if (limpio.tipoTarjeta === 'Débito') limpio.cuotas = 1
  return limpio as DetallePago
}

/** El detalle como filas «etiqueta: valor», listo para mostrar. */
export function describirDetalle(metodo: string, d: DetallePago | null): { etiqueta: string; valor: string }[] {
  if (!d) return []
  const campos = CAMPOS_METODO[metodo as MetodoPago] ?? []
  const filas: { etiqueta: string; valor: string }[] = []
  for (const c of campos) {
    if (d[c] === undefined || d[c] === null || c === 'tipoDocumento') continue
    if (c === 'ultimos4') filas.push({ etiqueta: ETIQUETAS[c], valor: `${d.franquicia ?? ''} •••• ${d[c]}`.trim() })
    else if (c === 'documento') filas.push({ etiqueta: ETIQUETAS[c], valor: `${d.tipoDocumento ?? ''} ${d[c]}`.trim() })
    else if (c === 'franquicia') continue
    else if (c === 'cuotas') { if (d.tipoTarjeta !== 'Débito') filas.push({ etiqueta: ETIQUETAS[c], valor: d[c] === 1 ? '1 cuota' : `${d[c]} cuotas` }) }
    else filas.push({ etiqueta: ETIQUETAS[c], valor: String(d[c]) })
  }
  return filas
}
