export const SECCIONES_CONFIG = [
  'general',
  'marca',
  'estados',
  'sla',
  'notificaciones',
  'facturacion',
  'integraciones',
  'seguridad',
] as const

export type SeccionConfig = (typeof SECCIONES_CONFIG)[number]

export const SECCION_LABEL: Record<SeccionConfig, string> = {
  general: 'General',
  marca: 'Marca y apariencia',
  estados: 'Estados de órdenes',
  sla: 'SLA y tiempos',
  notificaciones: 'Notificaciones',
  facturacion: 'Facturación',
  integraciones: 'Integraciones',
  seguridad: 'Seguridad',
}

export interface Configuracion {
  empresa: {
    razonSocial: string
    nit: string
    correo: string
    telefono: string
    direccion: string
    zonaHoraria: string
  }
  operacion: {
    asignacionAutomatica: boolean
    exigirCotizacionAprobada: boolean
    reprogramarSinAprobacion: boolean
    cerrarAlPagar: boolean
  }
  numeracion: {
    prefijoOrden: string
    prefijoCotizacion: string
    proximoConsecutivo: string
  }
  marca: {
    temaPorDefecto: 'system' | 'light' | 'dark'
    mostrarLogoEnCorreos: boolean
    piePersonalizado: string
  }
  sla: {
    respuestaHoras: number
    cierreDias: number
    alertaSinAsignarHoras: number
  }
  notificaciones: {
    correoCliente: boolean
    correoTecnico: boolean
    resumenDiario: boolean
    alertaVencimiento: boolean
  }
  facturacion: {
    iva: number
    moneda: string
    anticipoPorcentaje: number
  }
  integraciones: {
    whatsapp: boolean
    correoSaliente: boolean
    contabilidad: boolean
  }
  seguridad: {
    dobleFactor: boolean
    expiracionSesionHoras: number
    intentosMaximos: number
  }
}
