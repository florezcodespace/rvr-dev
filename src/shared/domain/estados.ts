import type { EstadoMeta, Transiciones } from './tipos'

/* =========================================================================
   Catálogos de estado de las demás entidades del portal.
   Cada uno trae su meta (label, glifo, color, badge) y, cuando el estado se
   puede cambiar desde la interfaz, su mapa de transiciones válidas.
   ========================================================================= */

const badge = (nombre: string) =>
  `bg-[var(--rvr-estado-${nombre}-soft)] text-[var(--rvr-estado-${nombre}-fg)]`

const NEUTRO = 'bg-neutro-soft text-neutro-fg'

/* ---------------------------------- Cotizaciones ---------------------------------- */

export const ESTADOS_COTIZACION = [
  'nueva',
  'pendiente',
  'aprobada',
  'rechazada',
  'vencida',
  'cancelada',
] as const

export type EstadoCotizacion = (typeof ESTADOS_COTIZACION)[number]

export const ESTADO_COTIZACION_META: Record<EstadoCotizacion, EstadoMeta> = {
  nueva: {
    label: 'Nueva',
    labelCorto: 'Nueva',
    glifo: '✦',
    color: 'var(--rvr-estado-nueva)',
    badge: badge('nueva'),
  },
  pendiente: {
    label: 'Pendiente',
    labelCorto: 'Pendiente',
    glifo: '⏱',
    color: 'var(--rvr-estado-pendiente)',
    badge: badge('pendiente'),
  },
  aprobada: {
    label: 'Aprobada',
    labelCorto: 'Aprobada',
    glifo: '◈',
    color: 'var(--rvr-estado-aprobada)',
    badge: badge('aprobada'),
  },
  rechazada: {
    label: 'Rechazada',
    labelCorto: 'Rechaz.',
    glifo: '✕',
    color: 'var(--rvr-estado-cancelada)',
    badge: badge('cancelada'),
  },
  vencida: {
    label: 'Vencida',
    labelCorto: 'Vencida',
    glifo: '↻',
    color: 'var(--rvr-estado-reprogramada)',
    badge: badge('reprogramada'),
  },
  cancelada: {
    label: 'Cancelada',
    labelCorto: 'Cancel.',
    glifo: '✕',
    color: 'var(--rvr-estado-cancelada)',
    badge: badge('cancelada'),
  },
}

export const TRANSICIONES_COTIZACION: Transiciones<EstadoCotizacion> = {
  nueva: ['pendiente', 'cancelada'],
  pendiente: ['aprobada', 'rechazada', 'vencida', 'cancelada'],
  aprobada: ['cancelada'],
  rechazada: ['pendiente'],
  vencida: ['pendiente'],
  cancelada: [],
}

/* -------------------------------------- Pagos ------------------------------------- */

export const ESTADOS_PAGO = [
  'por_conciliar',
  'parcial',
  'conciliado',
  'vencido',
  'reembolsado',
] as const

export type EstadoPago = (typeof ESTADOS_PAGO)[number]

export const ESTADO_PAGO_META: Record<EstadoPago, EstadoMeta> = {
  por_conciliar: {
    label: 'Por conciliar',
    labelCorto: 'Por concil.',
    glifo: '⏱',
    color: 'var(--rvr-estado-pendiente)',
    badge: badge('pendiente'),
  },
  parcial: {
    label: 'Parcial',
    labelCorto: 'Parcial',
    glifo: '◐',
    color: 'var(--rvr-estado-en-proceso)',
    badge: badge('en-proceso'),
  },
  conciliado: {
    label: 'Conciliado',
    labelCorto: 'Conciliado',
    glifo: '✓',
    color: 'var(--rvr-estado-completada)',
    badge: badge('completada'),
  },
  vencido: {
    label: 'Vencido',
    labelCorto: 'Vencido',
    glifo: '!',
    color: 'var(--rvr-estado-cancelada)',
    badge: badge('cancelada'),
  },
  reembolsado: {
    label: 'Reembolsado',
    labelCorto: 'Reembols.',
    glifo: '↺',
    color: 'var(--rvr-estado-reprogramada)',
    badge: badge('reprogramada'),
  },
}

export const TRANSICIONES_PAGO: Transiciones<EstadoPago> = {
  por_conciliar: ['parcial', 'conciliado', 'vencido'],
  parcial: ['conciliado', 'vencido'],
  vencido: ['parcial', 'conciliado'],
  conciliado: ['reembolsado'],
  reembolsado: [],
}

/* ------------------------------------ Usuarios ------------------------------------ */

export const ESTADOS_USUARIO = [
  'activo',
  'invitacion_enviada',
  'inactivo',
  'bloqueado',
] as const

export type EstadoUsuario = (typeof ESTADOS_USUARIO)[number]

export const ESTADO_USUARIO_META: Record<EstadoUsuario, EstadoMeta> = {
  activo: {
    label: 'Activo',
    labelCorto: 'Activo',
    glifo: '✓',
    color: 'var(--rvr-estado-completada)',
    badge: badge('completada'),
  },
  invitacion_enviada: {
    label: 'Invitación enviada',
    labelCorto: 'Invitado',
    glifo: '✉',
    color: 'var(--rvr-estado-pendiente)',
    badge: badge('pendiente'),
  },
  inactivo: {
    label: 'Inactivo',
    labelCorto: 'Inactivo',
    glifo: '○',
    color: 'var(--rvr-neutro-fg)',
    badge: NEUTRO,
  },
  bloqueado: {
    label: 'Bloqueado',
    labelCorto: 'Bloqueado',
    glifo: '✕',
    color: 'var(--rvr-estado-cancelada)',
    badge: badge('cancelada'),
  },
}

export const TRANSICIONES_USUARIO: Transiciones<EstadoUsuario> = {
  activo: ['inactivo', 'bloqueado'],
  invitacion_enviada: ['activo', 'inactivo'],
  inactivo: ['activo'],
  bloqueado: ['activo'],
}

export const ROLES_USUARIO = [
  'administrador',
  'coordinacion',
  'tecnico',
  'facturacion',
  'soporte',
] as const

export type RolUsuario = (typeof ROLES_USUARIO)[number]

/** El rol también se cambia desde su badge, así que cumple la forma de EstadoMeta. */
export const ROL_USUARIO_META: Record<RolUsuario, EstadoMeta & { acceso: string }> = {
  administrador: {
    label: 'Administrador',
    labelCorto: 'Admin',
    glifo: '★',
    color: 'var(--rvr-estado-nueva)',
    badge: badge('nueva'),
    acceso: 'Todos los módulos',
  },
  coordinacion: {
    label: 'Coordinación',
    labelCorto: 'Coord.',
    glifo: '◈',
    color: 'var(--rvr-estado-aprobada)',
    badge: badge('aprobada'),
    acceso: 'Órdenes, Técnicos, Clientes',
  },
  tecnico: {
    label: 'Técnico',
    labelCorto: 'Técnico',
    glifo: '◷',
    color: 'var(--rvr-estado-programada)',
    badge: badge('programada'),
    acceso: 'Órdenes asignadas',
  },
  facturacion: {
    label: 'Facturación',
    labelCorto: 'Factur.',
    glifo: '◆',
    color: 'var(--rvr-estado-completada)',
    badge: badge('completada'),
    acceso: 'Pagos, Cotizaciones, Reportes',
  },
  soporte: {
    label: 'Soporte',
    labelCorto: 'Soporte',
    glifo: '◐',
    color: 'var(--rvr-estado-en-proceso)',
    badge: badge('en-proceso'),
    acceso: 'Órdenes, Clientes',
  },
}

/* ------------------------------------ Técnicos ------------------------------------ */

export const ESTADOS_TECNICO = ['disponible', 'en_ruta', 'en_sitio', 'fuera_turno'] as const

export type EstadoTecnico = (typeof ESTADOS_TECNICO)[number]

export const ESTADO_TECNICO_META: Record<EstadoTecnico, EstadoMeta> = {
  disponible: {
    label: 'Disponible',
    labelCorto: 'Disponible',
    glifo: '✓',
    color: 'var(--rvr-estado-completada)',
    badge: badge('completada'),
  },
  en_ruta: {
    label: 'En ruta',
    labelCorto: 'En ruta',
    glifo: '→',
    color: 'var(--rvr-estado-en-proceso)',
    badge: badge('en-proceso'),
  },
  en_sitio: {
    label: 'En sitio',
    labelCorto: 'En sitio',
    glifo: '◷',
    color: 'var(--rvr-estado-programada)',
    badge: badge('programada'),
  },
  fuera_turno: {
    label: 'Fuera de turno',
    labelCorto: 'Fuera',
    glifo: '○',
    color: 'var(--rvr-neutro-fg)',
    badge: NEUTRO,
  },
}

export const TRANSICIONES_TECNICO: Transiciones<EstadoTecnico> = {
  disponible: ['en_ruta', 'en_sitio', 'fuera_turno'],
  en_ruta: ['en_sitio', 'disponible', 'fuera_turno'],
  en_sitio: ['disponible', 'en_ruta', 'fuera_turno'],
  fuera_turno: ['disponible'],
}

/* ------------------------------------ Clientes ------------------------------------ */

export const ESTADOS_CLIENTE = ['activo', 'con_saldo', 'inactivo'] as const

export type EstadoCliente = (typeof ESTADOS_CLIENTE)[number]

export const ESTADO_CLIENTE_META: Record<EstadoCliente, EstadoMeta> = {
  activo: {
    label: 'Activo',
    labelCorto: 'Activo',
    glifo: '✓',
    color: 'var(--rvr-estado-completada)',
    badge: badge('completada'),
  },
  con_saldo: {
    label: 'Con saldo',
    labelCorto: 'Con saldo',
    glifo: '⏱',
    color: 'var(--rvr-estado-pendiente)',
    badge: badge('pendiente'),
  },
  inactivo: {
    label: 'Inactivo',
    labelCorto: 'Inactivo',
    glifo: '○',
    color: 'var(--rvr-neutro-fg)',
    badge: NEUTRO,
  },
}

export const TRANSICIONES_CLIENTE: Transiciones<EstadoCliente> = {
  activo: ['inactivo'],
  con_saldo: ['activo', 'inactivo'],
  inactivo: ['activo'],
}

/* ------------------------------------ Servicios ----------------------------------- */

export const ESTADOS_SERVICIO = ['activo', 'borrador', 'archivado'] as const

export type EstadoServicio = (typeof ESTADOS_SERVICIO)[number]

export const ESTADO_SERVICIO_META: Record<EstadoServicio, EstadoMeta> = {
  activo: {
    label: 'Activo',
    labelCorto: 'Activo',
    glifo: '✓',
    color: 'var(--rvr-estado-completada)',
    badge: badge('completada'),
  },
  borrador: {
    label: 'Borrador',
    labelCorto: 'Borrador',
    glifo: '○',
    color: 'var(--rvr-neutro-fg)',
    badge: NEUTRO,
  },
  archivado: {
    label: 'Archivado',
    labelCorto: 'Archiv.',
    glifo: '▤',
    color: 'var(--rvr-neutro-fg)',
    badge: NEUTRO,
  },
}

export const TRANSICIONES_SERVICIO: Transiciones<EstadoServicio> = {
  activo: ['borrador', 'archivado'],
  borrador: ['activo', 'archivado'],
  archivado: ['activo'],
}
