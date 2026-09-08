import type { EstadoCliente } from '@shared/domain/estados'
import { delay } from '@shared/lib/delay'
import { paginar } from '@shared/lib/paginar'
import { normalizar } from '@shared/lib/texto'
import type { ClientesService } from './clientesService'
import type { Cliente, ListadoClientes, ParamsClientes, TabCliente } from '../types'

const SECTORES = [
  'Salud',
  'Sector público',
  'Retail',
  'Hotelería',
  'Educación',
  'Logística',
  'Alimentos',
  'Construcción',
  'Servicios',
]

const SEMILLA: Array<[string, string, string, number, number, EstadoCliente, string]> = [
  ['Clínica Las Américas', 'NIT 890.905.177-1', 'Salud', 24, 38_400_000, 'activo', '2026-09-06'],
  ['Alcaldía de Envigado', 'NIT 890.907.113-4', 'Sector público', 18, 29_750_000, 'activo', '2026-09-08'],
  ['Distribuciones Yepes', 'NIT 900.412.008-6', 'Retail', 31, 21_300_000, 'activo', '2026-09-03'],
  ['Hotel Poblado Plaza', 'NIT 811.020.334-9', 'Hotelería', 12, 17_900_000, 'con_saldo', '2026-09-07'],
  ['Colegio San Ignacio', 'NIT 890.980.116-2', 'Educación', 9, 8_150_000, 'activo', '2026-08-31'],
  ['Transportes del Café', 'NIT 901.334.771-0', 'Logística', 7, 12_700_000, 'inactivo', '2026-07-08'],
  ['Panadería La Espiga', 'NIT 43.118.902-3', 'Alimentos', 4, 1_980_000, 'activo', '2026-08-27'],
]

function construir(): Cliente[] {
  const lista: Cliente[] = SEMILLA.map(
    ([nombre, documento, sector, ordenes, facturacion, estado, ultimaOrden], i) => ({
      id: i + 1,
      nombre,
      documento,
      sector,
      ordenes,
      facturacion,
      estado,
      ultimaOrden,
      correo: `contacto@${nombre.toLowerCase().replace(/[^a-z]/g, '').slice(0, 12)}.co`,
      telefono: `+57 604 ${400 + i} ${10 + i} ${20 + i}`,
      ciudad: ['Medellín', 'Envigado', 'Itagüí', 'Bello', 'Sabaneta'][i % 5]!,
    }),
  )

  const NOMBRES = [
    'Constructora Aburrá',
    'Almacenes Vélez',
    'Fundación Solidaria',
    'Inversiones Delta',
    'Textiles del Norte',
    'Café de la Montaña',
    'Seguros Andinos',
    'Laboratorio Vida',
    'Autopartes Ríos',
    'Editorial Palabra',
  ]

  for (let i = 0; i < 141; i += 1) {
    const nombre = `${NOMBRES[i % NOMBRES.length]} ${i > 9 ? Math.floor(i / 10) + 1 : ''}`.trim()
    const estado: EstadoCliente =
      i % 17 === 0 ? 'con_saldo' : i % 11 === 0 ? 'inactivo' : 'activo'
    const fecha = new Date(2026, 8, 1)
    fecha.setDate(fecha.getDate() - i * 2)

    lista.push({
      id: 100 + i,
      nombre,
      documento: `NIT 9${String(10_000_000 + i * 7919).slice(0, 8)}-${i % 10}`,
      sector: SECTORES[i % SECTORES.length]!,
      ordenes: 1 + ((i * 3) % 27),
      facturacion: 450_000 + ((i * 613_000) % 24_000_000),
      estado,
      ultimaOrden: fecha.toISOString().slice(0, 10),
      correo: `contacto${i}@empresa.co`,
      telefono: `+57 604 ${300 + (i % 90)} ${10 + (i % 80)} ${20 + (i % 70)}`,
      ciudad: ['Medellín', 'Envigado', 'Itagüí', 'Bello', 'Sabaneta', 'Rionegro'][i % 6]!,
    })
  }

  return lista
}

const CLIENTES = construir()

const POR_TAB: Record<TabCliente, (c: Cliente) => boolean> = {
  todos: () => true,
  activos: (c) => c.estado === 'activo',
  con_saldo: (c) => c.estado === 'con_saldo',
  inactivos: (c) => c.estado === 'inactivo',
}

export const mockClientesService: ClientesService = {
  async listar({ tab, q, pagina }: ParamsClientes): Promise<ListadoClientes> {
    await delay(320)

    const texto = normalizar(q.trim())
    const filtrados = CLIENTES.filter(
      (c) =>
        POR_TAB[tab](c) &&
        (!texto ||
          normalizar(`${c.nombre} ${c.documento} ${c.sector}`).includes(texto)),
    )

    const conSaldo = CLIENTES.filter((c) => c.estado === 'con_saldo')

    return {
      pagina: paginar(filtrados, pagina),
      resumen: {
        activos: CLIENTES.filter((c) => c.estado === 'activo').length,
        total: CLIENTES.length,
        nuevosMes: 6,
        conSaldo: conSaldo.length,
        valorSaldo: 6_320_000,
        facturacionAnual: CLIENTES.reduce((s, c) => s + c.facturacion, 0),
      },
      conteos: {
        todos: CLIENTES.length,
        activos: CLIENTES.filter(POR_TAB.activos).length,
        con_saldo: conSaldo.length,
        inactivos: CLIENTES.filter(POR_TAB.inactivos).length,
      },
    }
  },

  async cambiarEstado(id: number, estado: EstadoCliente): Promise<void> {
    await delay(180)
    const cliente = CLIENTES.find((c) => c.id === id)
    if (cliente) cliente.estado = estado
  },
}
