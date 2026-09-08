import type { EstadoCotizacion } from '@shared/domain/estados'
import { delay } from '@shared/lib/delay'
import { paginar } from '@shared/lib/paginar'
import { normalizar } from '@shared/lib/texto'
import type { CotizacionesService } from './cotizacionesService'
import type {
  Cotizacion,
  ListadoCotizaciones,
  ParamsCotizaciones,
  TabCotizacion,
} from '../types'

const CLIENTES = [
  'Alcaldía de Envigado',
  'Clínica Las Américas',
  'Distribuciones Yepes',
  'Colegio San Ignacio',
  'Transportes del Café',
  'Panadería La Espiga',
  'Hotel Poblado Plaza',
  'Constructora Aburrá',
  'Almacenes Vélez',
  'Fundación Solidaria',
]

const SERVICIOS = [
  'Mantenimiento preventivo PC',
  'Instalación CCTV — 12 cámaras',
  'Red LAN y cableado estructurado',
  'Soporte de impresoras',
  'Administración de servidores',
  'Diagnóstico de equipos',
  'Wi-Fi corporativo por pisos',
  'Recuperación de datos',
]

/** Las 7 primeras replican el mockup; el resto completa las 43 del contador. */
const SEMILLA: Array<[string, number, number, number, EstadoCotizacion, string]> = [
  ['CT-2088', 0, 0, 4_850_000, 'aprobada', '2026-09-12'],
  ['CT-2087', 1, 1, 9_320_000, 'pendiente', '2026-09-10'],
  ['CT-2086', 2, 2, 6_140_000, 'pendiente', '2026-09-09'],
  ['CT-2085', 3, 3, 1_280_000, 'aprobada', '2026-09-08'],
  ['CT-2084', 4, 4, 12_700_000, 'nueva', '2026-09-07'],
  ['CT-2083', 5, 5, 420_000, 'cancelada', '2026-09-05'],
  ['CT-2082', 6, 6, 7_900_000, 'aprobada', '2026-09-04'],
]

const RESTO: EstadoCotizacion[] = [
  'pendiente',
  'aprobada',
  'nueva',
  'rechazada',
  'aprobada',
  'vencida',
  'pendiente',
  'aprobada',
]

function construir(): Cotizacion[] {
  const lista: Cotizacion[] = SEMILLA.map(
    ([codigo, iCliente, iServicio, valorTotal, estado, vigencia], i) => ({
      id: 2088 - i,
      codigo,
      clienteNombre: CLIENTES[iCliente]!,
      servicioNombre: SERVICIOS[iServicio]!,
      valorTotal,
      estado,
      vigencia,
      version: 1,
    }),
  )

  for (let i = 0; i < 36; i += 1) {
    const numero = 2081 - i
    const fecha = new Date(2026, 8, 3)
    fecha.setDate(fecha.getDate() - i)
    lista.push({
      id: numero,
      codigo: `CT-${numero}`,
      clienteNombre: CLIENTES[i % CLIENTES.length]!,
      servicioNombre: SERVICIOS[i % SERVICIOS.length]!,
      valorTotal: 380_000 + ((i * 917_000) % 11_500_000),
      estado: RESTO[i % RESTO.length]!,
      vigencia: fecha.toISOString().slice(0, 10),
      version: (i % 3) + 1,
    })
  }

  return lista
}

const COTIZACIONES = construir()

const POR_TAB: Record<TabCotizacion, (c: Cotizacion) => boolean> = {
  todas: () => true,
  nuevas: (c) => c.estado === 'nueva',
  pendientes: (c) => c.estado === 'pendiente',
  aprobadas: (c) => c.estado === 'aprobada',
  canceladas: (c) => c.estado === 'cancelada' || c.estado === 'rechazada',
}

export const mockCotizacionesService: CotizacionesService = {
  async listar({ tab, q, pagina }: ParamsCotizaciones): Promise<ListadoCotizaciones> {
    await delay(320)

    const texto = normalizar(q.trim())
    const filtradas = COTIZACIONES.filter(
      (c) =>
        POR_TAB[tab](c) &&
        (!texto ||
          normalizar(
            `${c.codigo} ${c.clienteNombre} ${c.servicioNombre}`,
          ).includes(texto)),
    )

    const enNegociacion = COTIZACIONES.filter(
      (c) => c.estado === 'pendiente' || c.estado === 'nueva',
    )
    const aprobadas = COTIZACIONES.filter((c) => c.estado === 'aprobada')
    const decididas = COTIZACIONES.filter((c) =>
      ['aprobada', 'rechazada', 'cancelada'].includes(c.estado),
    )

    return {
      pagina: paginar(filtradas, pagina),
      resumen: {
        enNegociacion: enNegociacion.length,
        valorEnNegociacion: enNegociacion.reduce((s, c) => s + c.valorTotal, 0),
        aprobadasMes: aprobadas.length,
        tasaCierre: Math.round((aprobadas.length / Math.max(decididas.length, 1)) * 100),
        porVencer: COTIZACIONES.filter(
          (c) => c.estado === 'pendiente' && c.vigencia <= '2026-09-12',
        ).length,
        ticketPromedio: Math.round(
          COTIZACIONES.reduce((s, c) => s + c.valorTotal, 0) / COTIZACIONES.length,
        ),
      },
      conteos: {
        todas: COTIZACIONES.length,
        nuevas: COTIZACIONES.filter(POR_TAB.nuevas).length,
        pendientes: COTIZACIONES.filter(POR_TAB.pendientes).length,
        aprobadas: COTIZACIONES.filter(POR_TAB.aprobadas).length,
        canceladas: COTIZACIONES.filter(POR_TAB.canceladas).length,
      },
    }
  },

  async cambiarEstado(id: number, estado: EstadoCotizacion): Promise<void> {
    await delay(180)
    const cotizacion = COTIZACIONES.find((c) => c.id === id)
    if (cotizacion) cotizacion.estado = estado
  },
}
