import { delay } from '@shared/lib/delay'
import type { ReportesService } from './reportesService'
import type { PuntoQuincena, RangoReporte, ResumenReportes } from '../types'

const QUINCENAS = [
  '01 ABR', '15 ABR', '01 MAY', '15 MAY', '01 JUN', '15 JUN',
  '01 JUL', '15 JUL', '01 AGO', '15 AGO', '01 SEP',
]

const CREADAS = [12, 15, 14, 18, 17, 21, 19, 24, 22, 26, 23]
const COMPLETADAS = [9, 12, 13, 15, 15, 18, 17, 21, 20, 23, 21]

/** Cuántas quincenas mostrar según el rango elegido. */
const PUNTOS: Record<RangoReporte, number> = { '30d': 2, '90d': 6, '6m': 11, '12m': 11 }
const FACTOR: Record<RangoReporte, number> = { '30d': 0.2, '90d': 0.55, '6m': 1, '12m': 1.9 }
const DESDE: Record<RangoReporte, string> = {
  '30d': '9 de agosto',
  '90d': '10 de junio',
  '6m': '1 de abril',
  '12m': '8 de septiembre de 2025',
}

export const mockReportesService: ReportesService = {
  async resumen({ rango }): Promise<ResumenReportes> {
    await delay(360)

    const puntos = PUNTOS[rango]
    const factor = FACTOR[rango]

    const serie: PuntoQuincena[] = QUINCENAS.slice(-puntos).map((etiqueta, i) => ({
      etiqueta,
      creadas: CREADAS[CREADAS.length - puntos + i]!,
      completadas: COMPLETADAS[COMPLETADAS.length - puntos + i]!,
    }))

    const completadas = Math.round(148 * factor)

    return {
      desde: DESDE[rango],
      hasta: '8 de septiembre de 2026',
      completadas,
      cumplimientoSla: 92,
      ingresos: Math.round(214_600_000 * factor),
      variacionIngresos: 18,
      tiempoCierre: 1.8,
      variacionTiempo: -0.4,
      satisfaccion: 4.7,
      encuestas: Math.round(96 * factor),
      serie,
      porEstado: [
        { estado: 'completada', cantidad: completadas },
        { estado: 'en_proceso', cantidad: Math.round(34 * factor) },
        { estado: 'pendiente', cantidad: Math.round(12 * factor) },
        { estado: 'cancelada', cantidad: Math.round(6 * factor) },
      ],
      servicios: [
        { id: 1, nombre: 'Mantenimiento preventivo PC', cantidad: Math.round(62 * factor) },
        { id: 2, nombre: 'Soporte de impresoras', cantidad: Math.round(44 * factor) },
        { id: 3, nombre: 'Instalación CCTV', cantidad: Math.round(31 * factor) },
        { id: 4, nombre: 'Redes y cableado', cantidad: Math.round(27 * factor) },
        { id: 6, nombre: 'Diagnóstico de equipos', cantidad: Math.round(23 * factor) },
        { id: 5, nombre: 'Administración de servidores', cantidad: Math.round(16 * factor) },
      ],
      tecnicos: [
        { id: 2, nombre: 'Ana Torres', cerradas: Math.round(41 * factor) },
        { id: 1, nombre: 'Carlos Ramírez', cerradas: Math.round(38 * factor) },
        { id: 4, nombre: 'María Gómez', cerradas: Math.round(34 * factor) },
        { id: 3, nombre: 'Luis Morales', cerradas: Math.round(29 * factor) },
        { id: 7, nombre: 'Andrés Loaiza', cerradas: Math.round(22 * factor) },
      ],
    }
  },
}
