import type { EstadoOrden } from '@shared/domain/estadoOrden'
import { delay } from '@shared/lib/delay'
import type { OrdenesService } from './ordenesService'
import type {
  BloqueAgenda,
  CatalogosOrden,
  ClienteDetalle,
  CotizacionCatalogo,
  FiltrosOrdenes,
  ListadoOrdenes,
  NuevaOrden,
  OpcionFiltro,
  OrdenResumen,
  ServicioCatalogo,
  TecnicoCatalogo,
} from '../types'

export const POR_PAGINA = 8

const CLIENTES: OpcionFiltro[] = [
  { id: 1, nombre: 'Clínica San Rafael' },
  { id: 2, nombre: 'Juan Pérez' },
  { id: 3, nombre: 'María Gómez' },
  { id: 4, nombre: 'Laura Torres' },
  { id: 5, nombre: 'Distribuidora Andina' },
  { id: 6, nombre: 'Ferretería El Roble' },
  { id: 7, nombre: 'Colegio Los Nogales' },
  { id: 8, nombre: 'Inversiones Delta' },
  { id: 9, nombre: 'Hotel Portobelo' },
  { id: 10, nombre: 'Panadería La Espiga' },
]

const TECNICOS: OpcionFiltro[] = [
  { id: 1, nombre: 'Andrés López' },
  { id: 2, nombre: 'Carlos Ruiz' },
  { id: 3, nombre: 'Pedro Díaz' },
  { id: 4, nombre: 'Diana Salas' },
]

/** Descripciones ligadas a un estado concreto: no se reparten al azar. */
const DESC_CANCELADA = 'Cliente canceló: equipo cubierto por garantía'
const DESC_REPROGRAMADA = 'Cliente solicitó cambio de fecha por inventario'

/** Genéricas: sirven para cualquier estado. */
const GENERICAS = [
  'Servidor de historias clínicas sin respuesta',
  'Mantenimiento preventivo de 6 equipos',
  'Impresora láser con atascos recurrentes',
  'Instalación de 8 cámaras IP en bodega',
  'Reconfiguración de red IP y switch principal',
  'Solicitud de mantenimiento de sala de sistemas',
  'Punto de red sin señal en recepción',
  'Actualización de firmware del NVR',
  'Respaldo y migración de datos contables',
  'Revisión de UPS con alarma intermitente',
]

const DESCRIPCIONES = [
  'Servidor de historias clínicas sin respuesta',
  'Mantenimiento preventivo de 6 equipos',
  'Impresora láser con atascos recurrentes',
  'Instalación de 8 cámaras IP en bodega',
  'Reconfiguración de red IP y switch principal',
  'Cliente solicitó cambio de fecha por inventario',
  'Solicitud de mantenimiento de sala de sistemas',
  'Cliente canceló: equipo cubierto por garantía',
  'Punto de red sin señal en recepción',
  'Actualización de firmware del NVR',
  'Respaldo y migración de datos contables',
  'Revisión de UPS con alarma intermitente',
]

/** Las 8 primeras filas replican el mockup; el resto se genera para paginar. */
const SEMILLA: Array<[string, number, number | null, EstadoOrden, number, string | null]> = [
  ['OS-0147', 1, 1, 'programada', 0, '2026-08-12T09:00:00'],
  ['OS-0146', 2, 2, 'completada', 1, '2026-08-08T14:30:00'],
  ['OS-0145', 3, null, 'pendiente', 2, null],
  ['OS-0144', 4, 3, 'en_proceso', 3, '2026-08-11T08:00:00'],
  ['OS-0143', 5, 2, 'aprobada', 4, '2026-08-13T10:00:00'],
  ['OS-0142', 6, 1, 'reprogramada', 5, '2026-08-14T15:00:00'],
  ['OS-0141', 7, null, 'nueva', 6, null],
  ['OS-0140', 8, 3, 'cancelada', 7, '2026-08-07T11:00:00'],
]

const FECHAS_SEMILLA = [
  '2026-08-09',
  '2026-08-08',
  '2026-08-08',
  '2026-08-07',
  '2026-08-07',
  '2026-08-06',
  '2026-08-06',
  '2026-08-05',
]

const ESTADOS_ACTIVOS: EstadoOrden[] = [
  'nueva',
  'pendiente',
  'aprobada',
  'programada',
  'reprogramada',
  'en_proceso',
]

function construirOrdenes(): OrdenResumen[] {
  const ordenes: OrdenResumen[] = SEMILLA.map(
    ([codigo, clienteId, tecnicoId, estado, iDesc, programada], i) => ({
      id: 147 - i,
      codigo,
      clienteId,
      clienteNombre: CLIENTES.find((c) => c.id === clienteId)!.nombre,
      tecnicoId,
      tecnicoNombre: TECNICOS.find((t) => t.id === tecnicoId)?.nombre ?? null,
      fechaSolicitud: `${FECHAS_SEMILLA[i]}T08:00:00`,
      fechaProgramada: programada,
      descripcionProblema: DESCRIPCIONES[iDesc]!,
      estado,
    }),
  )

  // 72 órdenes históricas para que la paginación tenga sentido (80 en total).
  for (let i = 0; i < 72; i += 1) {
    const numero = 139 - i
    const cliente = CLIENTES[i % CLIENTES.length]!
    const asignado = i % 5 !== 0
    const tecnico = TECNICOS[i % TECNICOS.length]!
    // Las primeras 28 históricas quedan en curso y el resto cerradas, para que el
    // total de activas (34) coincida con el KPI del dashboard.
    const estado: EstadoOrden =
      i < 28
        ? ESTADOS_ACTIVOS[i % ESTADOS_ACTIVOS.length]!
        : i % 6 === 0
          ? 'cancelada'
          : 'completada'
    const solicitud = new Date(2026, 7, 5)
    solicitud.setDate(solicitud.getDate() - Math.floor(i / 2) - 1)

    const programada = new Date(solicitud)
    programada.setDate(programada.getDate() + 3)

    ordenes.push({
      id: numero,
      codigo: `OS-${String(numero).padStart(4, '0')}`,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      tecnicoId: asignado ? tecnico.id : null,
      tecnicoNombre: asignado ? tecnico.nombre : null,
      fechaSolicitud: `${solicitud.toISOString().slice(0, 10)}T08:00:00`,
      fechaProgramada:
        asignado && estado !== 'nueva' && estado !== 'pendiente'
          ? `${programada.toISOString().slice(0, 10)}T10:00:00`
          : null,
      descripcionProblema:
        estado === 'cancelada'
          ? DESC_CANCELADA
          : estado === 'reprogramada'
            ? DESC_REPROGRAMADA
            : GENERICAS[i % GENERICAS.length]!,
      estado,
    })
  }

  return ordenes
}

const ORDENES = construirOrdenes()

function aplicarFiltros(filtros: FiltrosOrdenes): OrdenResumen[] {
  const texto = filtros.busqueda.trim().toLowerCase()

  return ORDENES.filter((orden) => {
    if (
      texto &&
      !`${orden.codigo} ${orden.clienteNombre} ${orden.descripcionProblema}`
        .toLowerCase()
        .includes(texto)
    )
      return false

    if (filtros.estados.length > 0 && !filtros.estados.includes(orden.estado)) return false
    if (filtros.clienteId !== null && orden.clienteId !== filtros.clienteId) return false
    if (filtros.tecnicoId !== null && orden.tecnicoId !== filtros.tecnicoId) return false

    const fecha = orden.fechaSolicitud.slice(0, 10)
    if (filtros.desde && fecha < filtros.desde) return false
    if (filtros.hasta && fecha > filtros.hasta) return false

    return true
  })
}

/* ---------- Catálogos y creación (Vista 4) ---------- */

const CLIENTES_DETALLE: ClienteDetalle[] = [
  {
    id: 1,
    nombre: 'Clínica San Rafael',
    documento: 'NIT 900.145.221-4',
    ciudad: 'Bogotá',
    contacto: 'Ana Mejía',
  },
  {
    id: 2,
    nombre: 'Juan Pérez',
    documento: 'CC 79.145.882',
    ciudad: 'Bogotá',
    contacto: 'Juan Pérez',
  },
  {
    id: 3,
    nombre: 'María Gómez',
    documento: 'CC 52.884.190',
    ciudad: 'Soacha',
    contacto: 'María Gómez',
  },
  {
    id: 4,
    nombre: 'Laura Torres',
    documento: 'CC 1.020.445.771',
    ciudad: 'Chía',
    contacto: 'Laura Torres',
  },
  {
    id: 5,
    nombre: 'Distribuidora Andina',
    documento: 'NIT 830.221.907-1',
    ciudad: 'Bogotá',
    contacto: 'Sergio Ramírez',
  },
  {
    id: 6,
    nombre: 'Ferretería El Roble',
    documento: 'NIT 901.554.302-8',
    ciudad: 'Mosquera',
    contacto: 'Elsa Castaño',
  },
  {
    id: 7,
    nombre: 'Colegio Los Nogales',
    documento: 'NIT 860.028.415-2',
    ciudad: 'Bogotá',
    contacto: 'Rectoría',
  },
  {
    id: 8,
    nombre: 'Inversiones Delta',
    documento: 'NIT 901.002.774-5',
    ciudad: 'Bogotá',
    contacto: 'Camilo Vega',
  },
]

const SERVICIOS: ServicioCatalogo[] = [
  {
    id: 1,
    nombre: 'Administración de servidores',
    categoria: 'Infraestructura',
    duracionHoras: 3,
    precio: 3_450_000,
    diasGarantia: 60,
  },
  {
    id: 2,
    nombre: 'Mantenimiento preventivo PC',
    categoria: 'Soporte',
    duracionHoras: 2,
    precio: 480_000,
    diasGarantia: 30,
  },
  {
    id: 3,
    nombre: 'Instalación CCTV',
    categoria: 'Seguridad electrónica',
    duracionHoras: 6,
    precio: 5_200_000,
    diasGarantia: 90,
  },
  {
    id: 4,
    nombre: 'Redes IP y cableado',
    categoria: 'Infraestructura',
    duracionHoras: 4,
    precio: 2_100_000,
    diasGarantia: 60,
  },
  {
    id: 5,
    nombre: 'Soporte de impresoras',
    categoria: 'Soporte',
    duracionHoras: 1,
    precio: 260_000,
    diasGarantia: 15,
  },
]

const TECNICOS_CATALOGO: TecnicoCatalogo[] = [
  { id: 1, nombre: 'Andrés López', especialidad: 'Servidores y redes', disponible: true },
  { id: 2, nombre: 'Carlos Ruiz', especialidad: 'Soporte en sitio', disponible: true },
  { id: 3, nombre: 'Pedro Díaz', especialidad: 'CCTV y cableado', disponible: false },
  { id: 4, nombre: 'Diana Salas', especialidad: 'Infraestructura', disponible: true },
]

const COTIZACIONES: CotizacionCatalogo[] = [
  { id: 91, codigo: 'COT-0091', clienteId: 1, valorTotal: 3_450_000, estado: 'aprobada' },
  { id: 90, codigo: 'COT-0090', clienteId: 5, valorTotal: 2_100_000, estado: 'aprobada' },
  { id: 89, codigo: 'COT-0089', clienteId: 4, valorTotal: 5_200_000, estado: 'enviada' },
  { id: 88, codigo: 'COT-0088', clienteId: 5, valorTotal: 1_850_000, estado: 'aprobada' },
]

/** Agenda simulada: dos franjas libres y una ocupada por la orden del mockup. */
const AGENDAS: Record<number, BloqueAgenda[]> = {
  1: [
    { hora: '09:00', ocupadoPor: 'OS-0147 · Clínica San Rafael' },
    { hora: '11:30', ocupadoPor: null },
    { hora: '15:00', ocupadoPor: null },
  ],
  2: [
    { hora: '08:00', ocupadoPor: 'OS-0146 · Juan Pérez' },
    { hora: '10:30', ocupadoPor: null },
    { hora: '14:00', ocupadoPor: 'OS-0143 · Distribuidora Andina' },
  ],
  3: [
    { hora: '09:00', ocupadoPor: 'Novedad: incapacidad médica' },
    { hora: '11:00', ocupadoPor: 'Novedad: incapacidad médica' },
    { hora: '15:00', ocupadoPor: 'Novedad: incapacidad médica' },
  ],
  4: [
    { hora: '09:30', ocupadoPor: null },
    { hora: '13:00', ocupadoPor: 'OS-0144 · Laura Torres' },
    { hora: '16:00', ocupadoPor: null },
  ],
}

export const mockOrdenesService: OrdenesService = {
  async listar(filtros: FiltrosOrdenes): Promise<ListadoOrdenes> {
    await delay(350)

    const filtradas = aplicarFiltros(filtros)
    const inicio = (filtros.pagina - 1) * POR_PAGINA

    return {
      items: filtradas.slice(inicio, inicio + POR_PAGINA),
      total: filtradas.length,
      totalGeneral: ORDENES.length,
      activas: ORDENES.filter((o) => ESTADOS_ACTIVOS.includes(o.estado)).length,
      pagina: filtros.pagina,
      porPagina: POR_PAGINA,
      clientes: CLIENTES,
      tecnicos: TECNICOS,
    }
  },

  async catalogos(): Promise<CatalogosOrden> {
    await delay(300)
    const ultimo = Math.max(...ORDENES.map((o) => o.id))
    return {
      clientes: CLIENTES_DETALLE,
      servicios: SERVICIOS,
      tecnicos: TECNICOS_CATALOGO,
      cotizaciones: COTIZACIONES,
      siguienteCodigo: `OS-${String(ultimo + 1).padStart(4, '0')}`,
    }
  },

  async agendaTecnico(tecnicoId: number): Promise<BloqueAgenda[]> {
    await delay(200)
    return AGENDAS[tecnicoId] ?? []
  },

  async crear(orden: NuevaOrden): Promise<OrdenResumen> {
    await delay(700)

    const id = Math.max(...ORDENES.map((o) => o.id)) + 1
    const cliente = CLIENTES_DETALLE.find((c) => c.id === orden.clienteId)!
    const tecnico = TECNICOS_CATALOGO.find((t) => t.id === orden.tecnicoId) ?? null

    const creada: OrdenResumen = {
      id,
      codigo: `OS-${String(id).padStart(4, '0')}`,
      clienteId: cliente.id,
      clienteNombre: cliente.nombre,
      tecnicoId: tecnico?.id ?? null,
      tecnicoNombre: tecnico?.nombre ?? null,
      fechaSolicitud: new Date().toISOString(),
      fechaProgramada: orden.fechaProgramada,
      descripcionProblema: orden.diagnostico,
      estado: orden.estadoInicial,
    }

    // El backend lo hará en una transacción junto con el primer registro de seguimiento.
    ORDENES.unshift(creada)
    return creada
  },

  async cambiarEstado(id: number, estado: EstadoOrden): Promise<void> {
    await delay(180)
    const orden = ORDENES.find((o) => o.id === id)
    if (orden) orden.estado = estado
  },

  async asignarTecnico(id: number, tecnicoId: number | null): Promise<void> {
    await delay(180)
    const orden = ORDENES.find((o) => o.id === id)
    if (!orden) return
    const tecnico = TECNICOS.find((t) => t.id === tecnicoId) ?? null
    orden.tecnicoId = tecnico?.id ?? null
    orden.tecnicoNombre = tecnico?.nombre ?? null
  },
}
