import { delay } from '@shared/lib/delay'
import { formatearMoneda } from '@shared/lib/format'
import type { DashboardService } from './dashboardService'
import type { PuntoTendencia, ResumenDashboard } from '../types'

const CREADAS = [4, 6, 5, 9, 8, 12, 10, 15, 13, 17, 15, 19, 17, 21]
const COMPLETADAS = [2, 3, 4, 5, 4, 8, 7, 10, 9, 12, 11, 15, 14, 17]

/** Serie de los últimos 14 días terminando hoy. */
function construirTendencia(): PuntoTendencia[] {
  const hoy = new Date()
  return CREADAS.map((creadas, indice) => {
    const fecha = new Date(hoy)
    fecha.setDate(hoy.getDate() - (CREADAS.length - 1 - indice))
    return {
      fecha: fecha.toISOString().slice(0, 10),
      creadas,
      completadas: COMPLETADAS[indice] ?? 0,
    }
  })
}

function haceMinutos(minutos: number): string {
  return new Date(Date.now() - minutos * 60_000).toISOString()
}

export const mockDashboardService: DashboardService = {
  async obtenerResumen(): Promise<ResumenDashboard> {
    await delay(450)

    return {
      fecha: new Date().toISOString(),
      serviciosAgendadosHoy: 8,
      ordenesPorAprobar: 6,

      kpis: [
        {
          id: 'activas',
          etiqueta: 'Órdenes activas',
          valor: '34',
          detalle: '+6 respecto a la semana anterior',
          glifo: '◆',
          tono: 'primary',
        },
        {
          id: 'pendientes',
          etiqueta: 'Órdenes pendientes',
          valor: '6',
          detalle: '2 llevan más de 48 h sin asignar',
          detalleDestacado: true,
          glifo: '⏱',
          tono: 'warning',
        },
        {
          id: 'completadas',
          etiqueta: 'Completadas (mes)',
          valor: '38',
          detalle: '92 % cerradas dentro del SLA',
          glifo: '✓',
          tono: 'success',
        },
        {
          id: 'tecnicos',
          etiqueta: 'Técnicos disponibles',
          valor: '6',
          valorSecundario: ' / 11',
          detalle: 'Según horarios_tecnicos de hoy',
          glifo: '◍',
          tono: 'primary',
        },
        {
          id: 'cotizaciones',
          etiqueta: 'Cotizaciones en negociación',
          valor: '17',
          detalle: `${formatearMoneda(105_894_000)} en juego`,
          glifo: '◈',
          tono: 'info',
        },
        {
          id: 'pagos',
          etiqueta: 'Pagos por conciliar',
          valor: '24',
          detalle: `${formatearMoneda(95_796_000)} por conciliar`,
          glifo: '◑',
          tono: 'warning',
        },
      ],

      tendencia: construirTendencia(),

      // Reparto real de las 80 órdenes de ordenes_servicio. Si estas cifras se
      // inventan, el gráfico contradice al listado y a la propia tarjeta de
      // "Órdenes activas" de este mismo dashboard.
      ordenesPorEstado: [
        { estado: 'nueva', cantidad: 6 },
        { estado: 'pendiente', cantidad: 6 },
        { estado: 'aprobada', cantidad: 6 },
        { estado: 'programada', cantidad: 6 },
        { estado: 'reprogramada', cantidad: 5 },
        { estado: 'en_proceso', cantidad: 5 },
        { estado: 'completada', cantidad: 38 },
        { estado: 'cancelada', cantidad: 8 },
      ],

      serviciosMasSolicitados: [
        { id: 1, nombre: 'Mantenimiento preventivo PC', cantidad: 62 },
        { id: 2, nombre: 'Soporte de impresoras', cantidad: 44 },
        { id: 3, nombre: 'Instalación CCTV', cantidad: 31 },
        { id: 4, nombre: 'Redes IP y cableado', cantidad: 27 },
        { id: 5, nombre: 'Administración de servidores', cantidad: 18 },
      ],

      actividad: [
        {
          id: 'a1',
          tipo: 'orden',
          titulo: 'OS-0146 marcada como',
          destacado: 'COMPLETADA',
          detalle: 'Carlos Ruiz · Juan Pérez',
          fecha: haceMinutos(12),
        },
        {
          id: 'a2',
          tipo: 'cotizacion',
          titulo: 'CT-2088 aprobada por el cliente',
          detalle: 'Alcaldía de Envigado',
          fecha: haceMinutos(45),
        },
        {
          id: 'a3',
          tipo: 'agendamiento',
          titulo: 'Agendamiento creado para OS-0147',
          detalle: 'Andrés López · 12/08 09:00',
          fecha: haceMinutos(60),
        },
        {
          id: 'a4',
          tipo: 'pago',
          titulo: `Pago parcial registrado · ${formatearMoneda(1_200_000)}`,
          detalle: 'Hotel Poblado Plaza',
          fecha: haceMinutos(120),
        },
      ],
    }
  },
}
