import type { EstadoMeta, Transiciones } from './tipos'

/* =========================================================================
   Catálogos de estado del modelo v6. Cada uno trae su meta (label, glifo,
   color, badge); los valores son exactamente los CHECK de la base.
   ========================================================================= */

const badge = (nombre: string) =>
  `bg-[var(--rvr-estado-${nombre}-soft)] text-[var(--rvr-estado-${nombre}-fg)]`

const meta = (label: string, glifo: string, tono: string, labelCorto = label): EstadoMeta => ({
  label,
  labelCorto,
  glifo,
  color: `var(--rvr-estado-${tono})`,
  badge: badge(tono),
})

/* ----------------------------- activo / inactivo ----------------------------- */

export const ESTADOS_REGISTRO = ['activo', 'inactivo'] as const
export type EstadoRegistro = (typeof ESTADOS_REGISTRO)[number]

export const ESTADO_REGISTRO_META: Record<EstadoRegistro, EstadoMeta> = {
  activo: meta('Activo', '●', 'completada'),
  inactivo: {
    label: 'Inactivo',
    labelCorto: 'Inactivo',
    glifo: '○',
    color: 'var(--rvr-border-strong)',
    badge: 'bg-neutro-soft text-neutro-fg',
  },
}

export const TRANSICIONES_REGISTRO: Transiciones<EstadoRegistro> = {
  activo: ['inactivo'],
  inactivo: ['activo'],
}

/* --------------------------------- cotización -------------------------------- */

export const ESTADOS_COTIZACION = ['solicitada', 'pendiente', 'aprobada', 'rechazada'] as const
export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number]

export const ESTADO_COTIZACION_META: Record<EstadoCotizacion, EstadoMeta> = {
  solicitada: meta('Solicitada', '✦', 'nueva'),
  pendiente: meta('Pendiente', '⏱', 'pendiente'),
  aprobada: meta('Aprobada', '✓', 'completada'),
  rechazada: meta('Rechazada', '✕', 'cancelada', 'Rechaz.'),
}

export const ORIGEN_COTIZACION: Record<string, string> = {
  cliente: 'Solicitud del cliente',
  administrador: 'Registrada por RvR',
  tecnico: 'Recotización del técnico',
}

/* ------------------------------------ orden ---------------------------------- */

export const ESTADOS_ORDEN = ['esperando_anticipo', 'en_proceso', 'en_espera_repuesto', 'finalizada', 'cancelada'] as const
export type EstadoOrden = (typeof ESTADOS_ORDEN)[number]

export const ESTADO_ORDEN_META: Record<EstadoOrden, EstadoMeta> = {
  esperando_anticipo: meta('Esperando anticipo', '⏱', 'pendiente', 'Anticipo'),
  en_proceso: meta('En proceso', '◐', 'en-proceso', 'Proceso'),
  en_espera_repuesto: meta('Espera de repuesto', '↻', 'reprogramada', 'Repuesto'),
  finalizada: meta('Finalizada', '✓', 'completada'),
  cancelada: meta('Cancelada', '✕', 'cancelada', 'Cancel.'),
}

/** CA_48_02 · Mismas transiciones que valida la API. */
export const TRANSICIONES_ORDEN: Transiciones<EstadoOrden> = {
  esperando_anticipo: ['en_proceso', 'cancelada'],
  en_proceso: ['en_espera_repuesto', 'finalizada', 'cancelada'],
  en_espera_repuesto: ['en_proceso', 'cancelada'],
  finalizada: [],
  cancelada: [],
}

export const ESTADOS_ITEM = ['pendiente', 'en_proceso', 'completado'] as const
export type EstadoItem = (typeof ESTADOS_ITEM)[number]

export const ESTADO_ITEM_META: Record<EstadoItem, EstadoMeta> = {
  pendiente: meta('Pendiente', '○', 'pendiente'),
  en_proceso: meta('En proceso', '◐', 'en-proceso'),
  completado: meta('Completado', '✓', 'completada'),
}

export const TRANSICIONES_ITEM: Transiciones<EstadoItem> = {
  pendiente: ['en_proceso', 'completado'],
  en_proceso: ['pendiente', 'completado'],
  completado: ['en_proceso'],
}

/* ------------------------------------ visita --------------------------------- */

export const ESTADOS_VISITA = ['pendiente', 'cumplida', 'reprogramada', 'cancelada'] as const
export type EstadoVisita = (typeof ESTADOS_VISITA)[number]

export const ESTADO_VISITA_META: Record<EstadoVisita, EstadoMeta> = {
  pendiente: meta('Pendiente', '◷', 'programada'),
  cumplida: meta('Cumplida', '✓', 'completada'),
  reprogramada: meta('Reprogramada', '↻', 'reprogramada', 'Reprog.'),
  cancelada: meta('Cancelada', '✕', 'cancelada', 'Cancel.'),
}

/* ------------------------------------ franja --------------------------------- */

export const ESTADOS_FRANJA = ['disponible', 'ocupada', 'bloqueada'] as const
export type EstadoFranja = (typeof ESTADOS_FRANJA)[number]

export const ESTADO_FRANJA_META: Record<EstadoFranja, EstadoMeta> = {
  disponible: meta('Disponible', '●', 'completada'),
  ocupada: meta('Ocupada', '◉', 'programada'),
  bloqueada: meta('Bloqueada', '⊘', 'cancelada'),
}

/* ------------------------------------- venta --------------------------------- */

export const ESTADOS_PAGO = ['pendiente_anticipo', 'abonada', 'pagada', 'anulada'] as const
export type EstadoPago = (typeof ESTADOS_PAGO)[number]

export const ESTADO_PAGO_META: Record<EstadoPago, EstadoMeta> = {
  pendiente_anticipo: meta('Pendiente de anticipo', '⏱', 'pendiente', 'Sin anticipo'),
  abonada: meta('Abonada', '◐', 'en-proceso'),
  pagada: meta('Pagada', '✓', 'completada'),
  anulada: meta('Anulada', '✕', 'cancelada'),
}

export const METODOS_PAGO = ['Efectivo', 'Transferencia', 'Nequi', 'Daviplata', 'PSE', 'Tarjeta'] as const
export type MetodoPago = (typeof METODOS_PAGO)[number]

/** Bancos para PSE, transferencias y tarjetas que no se reconocen por el BIN. */
export const BANCOS = [
  'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA', 'Banco de Occidente', 'Banco Popular', 'Banco AV Villas',
  'Scotiabank Colpatria', 'Banco Caja Social', 'Banco Agrario', 'Itaú', 'Banco Falabella', 'Banco Pichincha',
  'Bancoomeva', 'Banco GNB Sudameris', 'Lulo Bank', 'Nu Colombia', 'Otro',
] as const

/** Datos del pago según el método, como los muestra la API. */
export type DetallePagoVista = { etiqueta: string; valor: string }[]

/** Cómo se llama la referencia según el método. */
export function etiquetaReferencia(metodo: string): string {
  if (metodo === 'Tarjeta') return 'Número de aprobación'
  if (metodo === 'PSE') return 'CUS'
  if (metodo === 'Nequi' || metodo === 'Daviplata') return 'Referencia del pago'
  return 'Referencia'
}

/* ------------------------------- registro de accesos ------------------------------- */

export const RESULTADOS_ACCESO = ['exitoso', 'fallido', 'bloqueado', 'cierre_sesion', 'recuperacion', 'restablecimiento'] as const
export type ResultadoAcceso = (typeof RESULTADOS_ACCESO)[number]

export const RESULTADO_ACCESO_META: Record<ResultadoAcceso, EstadoMeta> = {
  exitoso: meta('Exitoso', '✓', 'completada'),
  fallido: meta('Fallido', '✕', 'pendiente'),
  bloqueado: meta('Bloqueo', '⊘', 'cancelada'),
  cierre_sesion: meta('Cierre de sesión', '⇥', 'programada', 'Cierre'),
  recuperacion: meta('Recuperación', '✉', 'nueva'),
  restablecimiento: meta('Restablecimiento', '⟳', 'aprobada', 'Restablec.'),
}

/** Categorías del catálogo (CA_15_03): el mismo CHECK de la base. */
export const CATEGORIAS_SERVICIO = ['Mantenimiento', 'Servidores', 'Redes', 'Cámaras de seguridad', 'Alarmas'] as const
export type CategoriaServicio = (typeof CATEGORIAS_SERVICIO)[number]

/* ---------------- [Feedback 12] comprobantes · [Feedback 13] reclamos ---------------- */

export const ESTADOS_REVISION = ['pendiente', 'aprobado', 'rechazado'] as const
export type EstadoRevision = (typeof ESTADOS_REVISION)[number]

export const ESTADO_COMPROBANTE_META: Record<EstadoRevision, EstadoMeta> = {
  pendiente: meta('Por revisar', '◐', 'pendiente'),
  aprobado: meta('Aprobado', '✓', 'aprobada'),
  rechazado: meta('Rechazado', '✕', 'cancelada'),
}

export const ESTADO_RECLAMO_META: Record<EstadoRevision, EstadoMeta> = {
  pendiente: meta('En revisión', '◐', 'pendiente'),
  aprobado: meta('Aprobado', '✓', 'aprobada'),
  rechazado: meta('No aprobado', '✕', 'cancelada'),
}

export const GARANTIA_VIGENTE_META: EstadoMeta = meta('Vigente', '●', 'completada')
export const GARANTIA_VENCIDA_META: EstadoMeta = meta('Vencida', '○', 'cancelada')
