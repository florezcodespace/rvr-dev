import type { EstadoPago } from '@shared/domain/estados'
import { delay } from '@shared/lib/delay'
import { paginar } from '@shared/lib/paginar'
import { normalizar } from '@shared/lib/texto'
import type { PagosService } from './pagosService'
import type { ListadoPagos, MedioPago, Pago, ParamsPagos, TabPago } from '../types'

const CLIENTES = [
  'Clínica Las Américas',
  'Hotel Poblado Plaza',
  'Distribuciones Yepes',
  'Transportes del Café',
  'Alcaldía de Envigado',
  'Colegio San Ignacio',
  'Panadería La Espiga',
]

const MEDIOS: MedioPago[] = ['transferencia', 'tarjeta', 'efectivo', 'otro']

const SEMILLA: Array<[string, number, string, number, MedioPago, EstadoPago, string]> = [
  ['PG-4471', 0, 'OS-0142', 4_850_000, 'transferencia', 'conciliado', '2026-09-05'],
  ['PG-4470', 1, 'OS-0139', 1_200_000, 'transferencia', 'parcial', '2026-09-05'],
  ['PG-4469', 2, 'OS-0137', 2_310_000, 'tarjeta', 'conciliado', '2026-09-04'],
  ['PG-4468', 3, 'OS-0131', 3_400_000, 'efectivo', 'vencido', '2026-08-28'],
  ['PG-4467', 4, 'OS-0128', 6_750_000, 'transferencia', 'por_conciliar', '2026-08-27'],
  ['PG-4466', 5, 'OS-0124', 980_000, 'tarjeta', 'conciliado', '2026-08-26'],
  ['PG-4465', 6, 'OS-0119', 420_000, 'efectivo', 'reembolsado', '2026-08-24'],
]

const RESTO: EstadoPago[] = [
  'conciliado',
  'conciliado',
  'por_conciliar',
  'conciliado',
  'parcial',
  'conciliado',
  'vencido',
  'conciliado',
]

function construir(): Pago[] {
  const lista: Pago[] = SEMILLA.map(
    ([recibo, iCliente, ordenCodigo, valor, medio, estado, fecha], i) => ({
      id: 4471 - i,
      recibo,
      clienteNombre: CLIENTES[iCliente]!,
      ordenCodigo,
      valor,
      medio,
      estado,
      fecha,
    }),
  )

  for (let i = 0; i < 89; i += 1) {
    const numero = 4464 - i
    const fecha = new Date(2026, 7, 22)
    fecha.setDate(fecha.getDate() - i * 2)
    lista.push({
      id: numero,
      recibo: `PG-${numero}`,
      clienteNombre: CLIENTES[i % CLIENTES.length]!,
      ordenCodigo: `OS-${String(118 - i).padStart(4, '0')}`,
      valor: 260_000 + ((i * 431_000) % 7_400_000),
      medio: MEDIOS[i % MEDIOS.length]!,
      estado: RESTO[i % RESTO.length]!,
      fecha: fecha.toISOString().slice(0, 10),
    })
  }

  return lista
}

const PAGOS = construir()

const POR_TAB: Record<TabPago, (p: Pago) => boolean> = {
  todos: () => true,
  por_conciliar: (p) => p.estado === 'por_conciliar' || p.estado === 'parcial',
  conciliados: (p) => p.estado === 'conciliado',
  vencidos: (p) => p.estado === 'vencido',
}

export const mockPagosService: PagosService = {
  async listar({ tab, q, pagina }: ParamsPagos): Promise<ListadoPagos> {
    await delay(320)

    const texto = normalizar(q.trim())
    const filtrados = PAGOS.filter(
      (p) =>
        POR_TAB[tab](p) &&
        (!texto ||
          normalizar(`${p.recibo} ${p.clienteNombre} ${p.ordenCodigo}`).includes(
            texto,
          )),
    )

    const porConciliar = PAGOS.filter(POR_TAB.por_conciliar)
    const vencidos = PAGOS.filter(POR_TAB.vencidos)

    return {
      pagina: paginar(filtrados, pagina),
      resumen: {
        recaudadoMes: 41_280_000,
        metaMes: 50_000_000,
        porConciliar: porConciliar.length,
        valorPorConciliar: porConciliar.reduce((s, p) => s + p.valor, 0),
        vencidos: vencidos.length,
        valorVencidos: vencidos.reduce((s, p) => s + p.valor, 0),
        diasCobro: 18,
      },
      recaudo: [
        { mes: '2026-04', valor: 31_400_000 },
        { mes: '2026-05', valor: 36_900_000 },
        { mes: '2026-06', valor: 34_200_000 },
        { mes: '2026-07', valor: 44_100_000 },
        { mes: '2026-08', valor: 39_800_000 },
        { mes: '2026-09', valor: 41_280_000 },
      ],
      medios: [
        { medio: 'transferencia', porcentaje: 58 },
        { medio: 'tarjeta', porcentaje: 24 },
        { medio: 'efectivo', porcentaje: 12 },
        { medio: 'otro', porcentaje: 6 },
      ],
      conteos: {
        todos: PAGOS.length,
        por_conciliar: porConciliar.length,
        conciliados: PAGOS.filter(POR_TAB.conciliados).length,
        vencidos: vencidos.length,
      },
    }
  },

  async cambiarEstado(id: number, estado: EstadoPago): Promise<void> {
    await delay(180)
    const pago = PAGOS.find((p) => p.id === id)
    if (pago) pago.estado = estado
  },
}
