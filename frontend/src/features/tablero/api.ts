import { api } from '@shared/lib/api'
import type { EstadoOrden } from '@shared/domain/estados'

export interface Estadisticas {
  desde: string
  hasta: string
  anterior: { desde: string; hasta: string }
  totalOrdenes: number
  totalOrdenesAnterior: number
  ordenesFinalizadas: number
  ingresos: number
  ingresosAnterior: number
  tasaAprobacion: number | null
  tasaAprobacionAnterior: number | null
  cotizacionesRespondidas: number
  clientesNuevos: number
  cartera: { saldo: number; ventas: number }
  agrupacion: 'dia' | 'mes'
  serie: { fecha: string; ingresos: number; ordenes: number }[]
  ordenesPorEstado: { estado: EstadoOrden; cantidad: number }[]
  cotizacionesPorEstado: { estado: string; cantidad: number }[]
  serviciosMasSolicitados: { nombre: string; unidades: number }[]
  ingresosPorMetodo: { metodo: string; total: number }[]
  proximasVisitas: { id: number; ordenId: number; codigo: string; tecnico: string; cliente: string; fecha: string }[]
  pendientes: Record<string, number>
}

export interface IndicadoresServicios {
  desde: string
  hasta: string
  serviciosRealizados: number
  ordenesFinalizadas: number
  totalOrdenes: number
  ordenesPorEstado: { estado: EstadoOrden; cantidad: number; porcentaje: number }[]
  serieSemanal: { semana: string; servicios: number }[]
}

export interface IndicadoresSolicitados {
  desde: string
  hasta: string
  servicios: { id: number; nombre: string; categoria: string; unidades: number; cotizaciones: number; aprobadas: number }[]
  tecnicos: { id: number; nombre: string; especialidad: string; cumplidas: number }[]
  categorias: { categoria: string; unidades: number }[]
}

export interface ReporteOrdenes {
  desde: string
  hasta: string
  generado: string
  items: { id: number; codigo: string; cliente: string; servicios: string; tecnico: string; fecha: string; monto: number; abonado: number; saldo: number; estado: EstadoOrden }[]
  totales: { ordenes: number; monto: number; abonado: number; saldo: number; porEstado: { estado: EstadoOrden; cantidad: number }[] }
}

export interface ReporteTecnicos {
  desde: string
  hasta: string
  generado: string
  items: {
    id: number; tecnico: string; especialidad: string; estado: string; visitasCumplidas: number; visitasPendientes: number
    visitasCanceladas: number; visitasReprogramadas: number; ordenesAtendidas: number; serviciosEjecutados: number; minutosPromedio: number | null
  }[]
  totales: { visitasCumplidas: number; visitasPendientes: number; visitasCanceladas: number; ordenesAtendidas: number; serviciosEjecutados: number }
}

export const tableroService = {
  estadisticas: (p: { desde: string; hasta: string }) => api.get<Estadisticas>('/estadisticas', p),
  serviciosOrdenes: (p: { desde: string; hasta: string; estado: string }) => api.get<IndicadoresServicios>('/indicadores/servicios-ordenes', p),
  masSolicitados: (p: { desde: string; hasta: string }) => api.get<IndicadoresSolicitados>('/indicadores/mas-solicitados', p),
  reporteOrdenes: (p: { desde: string; hasta: string; cliente: string; tecnico: string; estado: string }) => api.get<ReporteOrdenes>('/reportes/ordenes', p),
  reporteTecnicos: (p: { desde: string; hasta: string; tecnico: string }) => api.get<ReporteTecnicos>('/reportes/tecnicos', p),
  tecnicos: () => api.get<{ id: number; nombre: string }[]>('/tecnicos/opciones'),
  clientes: () => api.get<{ id: number; nombre: string }[]>('/clientes/opciones', { todos: 1 }),
}
