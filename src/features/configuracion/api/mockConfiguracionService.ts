import { delay } from '@shared/lib/delay'
import type { ConfiguracionService } from './configuracionService'
import type { Configuracion } from '../types'

let actual: Configuracion = {
  empresa: {
    razonSocial: 'RvR Tecnologías S.A.S.',
    nit: '901.556.240-7',
    correo: 'contacto@rvrtecnologias.co',
    telefono: '+57 604 448 90 21',
    direccion: 'Cra. 43A #18-95, El Poblado, Medellín',
    zonaHoraria: 'América/Bogotá (GMT-5)',
  },
  operacion: {
    asignacionAutomatica: true,
    exigirCotizacionAprobada: true,
    reprogramarSinAprobacion: false,
    cerrarAlPagar: true,
  },
  numeracion: {
    prefijoOrden: 'OS-',
    prefijoCotizacion: 'CT-',
    proximoConsecutivo: '0149',
  },
  marca: {
    temaPorDefecto: 'system',
    mostrarLogoEnCorreos: true,
    piePersonalizado: 'RvR Tecnologías · Soluciones tecnológicas integrales',
  },
  sla: {
    respuestaHoras: 4,
    cierreDias: 3,
    alertaSinAsignarHoras: 48,
  },
  notificaciones: {
    correoCliente: true,
    correoTecnico: true,
    resumenDiario: false,
    alertaVencimiento: true,
  },
  facturacion: {
    iva: 19,
    moneda: 'COP',
    anticipoPorcentaje: 50,
  },
  integraciones: {
    whatsapp: true,
    correoSaliente: true,
    contabilidad: false,
  },
  seguridad: {
    dobleFactor: false,
    expiracionSesionHoras: 8,
    intentosMaximos: 3,
  },
}

export const mockConfiguracionService: ConfiguracionService = {
  async obtener(): Promise<Configuracion> {
    await delay(280)
    return structuredClone(actual)
  },

  async guardar(configuracion: Configuracion): Promise<void> {
    await delay(500)
    actual = structuredClone(configuracion)
  },
}
