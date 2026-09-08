import type { EstadoServicio } from '@shared/domain/estados'
import { delay } from '@shared/lib/delay'
import type { ServiciosService } from './serviciosService'
import type { ListadoServicios, ParamsServicios, Servicio, TabServicio } from '../types'

const SERVICIOS: Servicio[] = [
  {
    id: 1,
    nombre: 'Mantenimiento preventivo PC',
    descripcion:
      'Limpieza, revisión de componentes y actualización de software por equipo.',
    categoria: 'soporte',
    precio: 85_000,
    unidad: 'por equipo',
    ordenes: 62,
    diasGarantia: 30,
    estado: 'activo',
  },
  {
    id: 2,
    nombre: 'Soporte de impresoras',
    descripcion:
      'Diagnóstico, cambio de repuestos y calibración de impresoras de oficina.',
    categoria: 'soporte',
    precio: 120_000,
    unidad: 'por visita',
    ordenes: 44,
    diasGarantia: 15,
    estado: 'activo',
  },
  {
    id: 3,
    nombre: 'Instalación CCTV',
    descripcion: 'Montaje, configuración y puesta en marcha de cámaras de seguridad.',
    categoria: 'seguridad',
    precio: 310_000,
    unidad: 'por cámara',
    ordenes: 31,
    diasGarantia: 90,
    estado: 'activo',
  },
  {
    id: 4,
    nombre: 'Redes y cableado estructurado',
    descripcion: 'Tendido, certificación de puntos y organización de rack.',
    categoria: 'infraestructura',
    precio: 95_000,
    unidad: 'por punto',
    ordenes: 27,
    diasGarantia: 60,
    estado: 'activo',
  },
  {
    id: 5,
    nombre: 'Administración de servidores',
    descripcion:
      'Monitoreo, respaldos y gestión de usuarios sobre servidores del cliente.',
    categoria: 'infraestructura',
    precio: 1_450_000,
    unidad: 'mensual',
    ordenes: 16,
    diasGarantia: 60,
    estado: 'activo',
  },
  {
    id: 6,
    nombre: 'Diagnóstico de equipos',
    descripcion: 'Revisión técnica con informe de estado y recomendación de reparación.',
    categoria: 'soporte',
    precio: 45_000,
    unidad: 'por equipo',
    ordenes: 23,
    diasGarantia: 15,
    estado: 'activo',
  },
  {
    id: 7,
    nombre: 'Wi-Fi corporativo',
    descripcion: 'Diseño de cobertura, instalación de APs y segmentación de red.',
    categoria: 'infraestructura',
    precio: 480_000,
    unidad: 'por punto',
    ordenes: 11,
    diasGarantia: 60,
    estado: 'activo',
  },
  {
    id: 8,
    nombre: 'Recuperación de datos',
    descripcion: 'Extracción de información desde discos con falla lógica o física.',
    categoria: 'datos',
    precio: 620_000,
    unidad: 'por unidad',
    ordenes: 5,
    diasGarantia: 30,
    estado: 'borrador',
  },
  {
    id: 9,
    nombre: 'Control de acceso biométrico',
    descripcion: 'Instalación y enrolamiento de lectores para puertas y torniquetes.',
    categoria: 'seguridad',
    precio: 890_000,
    unidad: 'por puerta',
    ordenes: 8,
    diasGarantia: 90,
    estado: 'activo',
  },
  {
    id: 10,
    nombre: 'Migración a la nube',
    descripcion: 'Traslado de correo y archivos a Microsoft 365 con acompañamiento.',
    categoria: 'datos',
    precio: 2_300_000,
    unidad: 'por proyecto',
    ordenes: 3,
    diasGarantia: 30,
    estado: 'borrador',
  },
  {
    id: 11,
    nombre: 'Mantenimiento de UPS',
    descripcion: 'Revisión de baterías, pruebas de autonomía y reporte de estado.',
    categoria: 'infraestructura',
    precio: 260_000,
    unidad: 'por equipo',
    ordenes: 14,
    diasGarantia: 45,
    estado: 'activo',
  },
  {
    id: 12,
    nombre: 'Alarmas monitoreadas',
    descripcion: 'Instalación de sensores y conexión a central de monitoreo 24/7.',
    categoria: 'seguridad',
    precio: 540_000,
    unidad: 'por zona',
    ordenes: 9,
    diasGarantia: 90,
    estado: 'activo',
  },
]

const POR_TAB: Record<TabServicio, (s: Servicio) => boolean> = {
  todos: () => true,
  soporte: (s) => s.categoria === 'soporte',
  infraestructura: (s) => s.categoria === 'infraestructura',
  seguridad: (s) => s.categoria === 'seguridad',
  borradores: (s) => s.estado === 'borrador',
}

export const mockServiciosService: ServiciosService = {
  async listar({ tab, q }: ParamsServicios): Promise<ListadoServicios> {
    await delay(300)

    const texto = q.trim().toLowerCase()
    const items = SERVICIOS.filter(
      (s) =>
        POR_TAB[tab](s) &&
        (!texto || `${s.nombre} ${s.descripcion}`.toLowerCase().includes(texto)),
    )

    const masSolicitado = [...SERVICIOS].sort((a, b) => b.ordenes - a.ordenes)[0]!

    return {
      items,
      resumen: {
        publicados: SERVICIOS.filter((s) => s.estado === 'activo').length,
        borradores: SERVICIOS.filter((s) => s.estado === 'borrador').length,
        masSolicitado,
        ingresoMes: 41_200_000,
        duracionPromedio: 2.4,
      },
      conteos: {
        todos: SERVICIOS.length,
        soporte: SERVICIOS.filter(POR_TAB.soporte).length,
        infraestructura: SERVICIOS.filter(POR_TAB.infraestructura).length,
        seguridad: SERVICIOS.filter(POR_TAB.seguridad).length,
        borradores: SERVICIOS.filter(POR_TAB.borradores).length,
      },
    }
  },

  async cambiarEstado(id: number, estado: EstadoServicio): Promise<void> {
    await delay(180)
    const servicio = SERVICIOS.find((s) => s.id === id)
    if (servicio) servicio.estado = estado
  },
}
