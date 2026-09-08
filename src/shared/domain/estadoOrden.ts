import type { EstadoMeta, Transiciones } from './tipos'

/**
 * Estados de una orden de servicio (enum `estado_orden` del modelo de datos).
 * Vive en shared/domain porque lo consumen varias features (dashboard, órdenes,
 * cotizaciones); shared/components sigue sin conocer el dominio.
 *
 * El orden del arreglo es el del flujo de negocio y también el de las barras del
 * dashboard: reprogramada va antes de en_proceso para que naranja y rojo no
 * queden adyacentes (no pasaban el umbral de distinción de color).
 */
export const ESTADOS_ORDEN = [
  'nueva',
  'pendiente',
  'aprobada',
  'programada',
  'reprogramada',
  'en_proceso',
  'completada',
  'cancelada',
] as const

export type EstadoOrden = (typeof ESTADOS_ORDEN)[number]


export const ESTADO_ORDEN_META: Record<EstadoOrden, EstadoMeta> = {
  nueva: {
    label: 'Nueva',
    labelCorto: 'Nueva',
    glifo: '✦',
    color: 'var(--rvr-estado-nueva)',
    badge: 'bg-[var(--rvr-estado-nueva-soft)] text-[var(--rvr-estado-nueva-fg)]',
  },
  pendiente: {
    label: 'Pendiente',
    labelCorto: 'Pendiente',
    glifo: '⏱',
    color: 'var(--rvr-estado-pendiente)',
    badge: 'bg-[var(--rvr-estado-pendiente-soft)] text-[var(--rvr-estado-pendiente-fg)]',
  },
  aprobada: {
    label: 'Aprobada',
    labelCorto: 'Aprobada',
    glifo: '◈',
    color: 'var(--rvr-estado-aprobada)',
    badge: 'bg-[var(--rvr-estado-aprobada-soft)] text-[var(--rvr-estado-aprobada-fg)]',
  },
  programada: {
    label: 'Programada',
    labelCorto: 'Program.',
    glifo: '◷',
    color: 'var(--rvr-estado-programada)',
    badge:
      'bg-[var(--rvr-estado-programada-soft)] text-[var(--rvr-estado-programada-fg)]',
  },
  reprogramada: {
    label: 'Reprogramada',
    labelCorto: 'Reprog.',
    glifo: '↻',
    color: 'var(--rvr-estado-reprogramada)',
    badge:
      'bg-[var(--rvr-estado-reprogramada-soft)] text-[var(--rvr-estado-reprogramada-fg)]',
  },
  en_proceso: {
    label: 'En proceso',
    labelCorto: 'En proc.',
    glifo: '◐',
    color: 'var(--rvr-estado-en-proceso)',
    badge:
      'bg-[var(--rvr-estado-en-proceso-soft)] text-[var(--rvr-estado-en-proceso-fg)]',
  },
  completada: {
    label: 'Completada',
    labelCorto: 'Complet.',
    glifo: '✓',
    color: 'var(--rvr-estado-completada)',
    badge:
      'bg-[var(--rvr-estado-completada-soft)] text-[var(--rvr-estado-completada-fg)]',
  },
  cancelada: {
    label: 'Cancelada',
    labelCorto: 'Cancel.',
    glifo: '✕',
    color: 'var(--rvr-estado-cancelada)',
    badge: 'bg-[var(--rvr-estado-cancelada-soft)] text-[var(--rvr-estado-cancelada-fg)]',
  },
}

/**
 * Transiciones válidas del flujo de órdenes. Es lo que alimenta el menú que se
 * abre al hacer clic en el badge de estado: solo se ofrecen los destinos legales,
 * así nadie tiene que recordar el flujo ni abrir un formulario para cambiarlo.
 */
export const TRANSICIONES_ORDEN: Transiciones<EstadoOrden> = {
  nueva: ['pendiente', 'aprobada', 'cancelada'],
  pendiente: ['aprobada', 'programada', 'cancelada'],
  aprobada: ['programada', 'cancelada'],
  programada: ['en_proceso', 'reprogramada', 'cancelada'],
  reprogramada: ['programada', 'en_proceso', 'cancelada'],
  en_proceso: ['completada', 'reprogramada', 'cancelada'],
  completada: [],
  cancelada: [],
}
