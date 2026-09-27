import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE } from '@app/routes/paths'
import { DataTable, EstadoBadge, type Columna } from '@shared/components/data'
import { FiltroSelect } from '@shared/components/form/Campos'
import { IconExcel, IconPdf } from '@shared/components/icons'
import { Alert, Button, Card, PageHeader, StatCard, StatGrid, Tabs } from '@shared/components/ui'
import { ESTADO_ORDEN_META, ESTADOS_ORDEN, type EstadoOrden } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { descargarExcel, descargarPdf, nombreConFecha, type ColumnaExport } from '@shared/lib/exportar'
import { formatearFecha, formatearMoneda } from '@shared/lib/format'
import { tableroService, type ReporteOrdenes, type ReporteTecnicos } from '../api'
import { rangoPorDefecto } from '../rango'
import { SelectorRango } from '../SelectorRango'

type FilaOrden = ReporteOrdenes['items'][number]
type FilaTecnico = ReporteTecnicos['items'][number]

const COL_ORDEN: ColumnaExport<FilaOrden>[] = [
  { titulo: 'Código', valor: (o) => o.codigo, ancho: 1.1 },
  { titulo: 'Cliente', valor: (o) => o.cliente, ancho: 1.6 },
  { titulo: 'Servicios cotizados', valor: (o) => o.servicios, ancho: 2.6 },
  { titulo: 'Técnico', valor: (o) => o.tecnico, ancho: 1.4 },
  { titulo: 'Fecha', valor: (o) => formatearFecha(o.fecha), ancho: 0.9 },
  { titulo: 'Monto', valor: (o) => o.monto, tipo: 'moneda', ancho: 1.1 },
  { titulo: 'Saldo', valor: (o) => o.saldo, tipo: 'moneda', ancho: 1 },
  { titulo: 'Estado', valor: (o) => ESTADO_ORDEN_META[o.estado].label, ancho: 1.2 },
]

const COL_TECNICO: ColumnaExport<FilaTecnico>[] = [
  { titulo: 'Técnico', valor: (t) => t.tecnico, ancho: 1.6 },
  { titulo: 'Especialidad', valor: (t) => t.especialidad, ancho: 1.8 },
  { titulo: 'Visitas cumplidas', valor: (t) => t.visitasCumplidas, tipo: 'numero' },
  { titulo: 'Órdenes atendidas', valor: (t) => t.ordenesAtendidas, tipo: 'numero' },
  { titulo: 'Servicios ejecutados', valor: (t) => t.serviciosEjecutados, tipo: 'numero' },
  { titulo: 'Pendientes', valor: (t) => t.visitasPendientes, tipo: 'numero' },
  { titulo: 'Canceladas', valor: (t) => t.visitasCanceladas, tipo: 'numero' },
  { titulo: 'Min. promedio', valor: (t) => t.minutosPromedio ?? '—', tipo: 'numero' },
]

/**
 * Reportes operacionales: HU_60 órdenes de servicio por período, cliente,
 * técnico o estado, con totales (CA_60_03) · HU_61 servicios por técnico ·
 * HU_62 exportar en PDF y Excel respetando los filtros, con fecha de
 * generación y período (CA_62_03).
 */
export default function ReportesPage() {
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const def = useMemo(() => ({ ...rangoPorDefecto(), tipo: tiene('reportes.ordenes') ? 'ordenes' : 'tecnicos' }), [tiene])
  const f = useFiltros(['tipo', 'desde', 'hasta', 'cliente', 'tecnico', 'estado'] as const, def)
  const [tecnicos, setTecnicos] = useState<{ id: number; nombre: string }[]>([])
  const [clientes, setClientes] = useState<{ id: number; nombre: string }[]>([])
  useEffect(() => {
    tableroService.tecnicos().then(setTecnicos).catch(() => undefined)
    tableroService.clientes().then(setClientes).catch(() => undefined)
  }, [])

  const tipo = f.valores.tipo as 'ordenes' | 'tecnicos'
  const params = useMemo(() => ({ ...f.valores }), [f.valores])
  const cargar = useCallback(
    (p: typeof params) => (p.tipo === 'tecnicos' ? tableroService.reporteTecnicos(p) : tableroService.reporteOrdenes(p)) as Promise<ReporteOrdenes | ReporteTecnicos>,
    [],
  )
  const { datos, cargando, error } = useRecurso(cargar, params)
  const ordenes = tipo === 'ordenes' ? (datos as ReporteOrdenes | null) : null
  const porTecnico = tipo === 'tecnicos' ? (datos as ReporteTecnicos | null) : null

  const lineas = () => {
    const l = [`Período: ${formatearFecha(`${f.valores.desde}T12:00:00`)} – ${formatearFecha(`${f.valores.hasta}T12:00:00`)}`]
    const filtros: string[] = []
    if (f.valores.cliente) filtros.push(`cliente ${clientes.find((c) => String(c.id) === f.valores.cliente)?.nombre ?? f.valores.cliente}`)
    if (f.valores.tecnico) filtros.push(`técnico ${tecnicos.find((t) => String(t.id) === f.valores.tecnico)?.nombre ?? f.valores.tecnico}`)
    if (f.valores.estado && tipo === 'ordenes') filtros.push(`estado ${ESTADO_ORDEN_META[f.valores.estado as EstadoOrden].label.toLowerCase()}`)
    if (filtros.length) l.push(`Filtros: ${filtros.join(' · ')}`)
    return l
  }

  const exportar = (formato: 'pdf' | 'excel') => {
    if (!datos) return
    const inicio = performance.now()
    if (ordenes) {
      const enc = { titulo: 'Reporte de órdenes de servicio', lineas: lineas() }
      const totales = ['Totales', `${ordenes.totales.ordenes} órdenes`, '', '', '', ordenes.totales.monto, ordenes.totales.saldo, '']
      if (formato === 'pdf') {
        descargarPdf(nombreConFecha('reporte-ordenes', 'pdf'), enc, COL_ORDEN, ordenes.items, totales, [
          { etiqueta: 'Órdenes', valor: String(ordenes.totales.ordenes) },
          { etiqueta: 'Monto', valor: formatearMoneda(ordenes.totales.monto) },
          { etiqueta: 'Abonado', valor: formatearMoneda(ordenes.totales.abonado) },
          { etiqueta: 'Saldo', valor: formatearMoneda(ordenes.totales.saldo) },
        ])
      } else descargarExcel(nombreConFecha('reporte-ordenes', 'xlsx'), enc, COL_ORDEN, ordenes.items, totales)
    } else if (porTecnico) {
      const enc = { titulo: 'Reporte de servicios por técnico', lineas: lineas() }
      const t = porTecnico.totales
      const totales = ['Totales', '', t.visitasCumplidas, t.ordenesAtendidas, t.serviciosEjecutados, t.visitasPendientes, t.visitasCanceladas, '']
      if (formato === 'pdf') {
        descargarPdf(nombreConFecha('reporte-tecnicos', 'pdf'), enc, COL_TECNICO, porTecnico.items, totales, [
          { etiqueta: 'Visitas cumplidas', valor: String(t.visitasCumplidas) },
          { etiqueta: 'Órdenes atendidas', valor: String(t.ordenesAtendidas) },
          { etiqueta: 'Servicios ejecutados', valor: String(t.serviciosEjecutados) },
        ])
      } else descargarExcel(nombreConFecha('reporte-tecnicos', 'xlsx'), enc, COL_TECNICO, porTecnico.items, totales)
    }
    mostrar({ tono: 'exito', mensaje: `Reporte exportado en ${formato === 'pdf' ? 'PDF' : 'Excel'} (${Math.round(performance.now() - inicio)} ms)` })
  }

  const colOrdenes: Columna<FilaOrden>[] = [
    { clave: 'codigo', titulo: 'Código', ancho: '130px', render: (o) => <Link to={DETALLE.orden(o.id)} className="font-mono whitespace-nowrap font-semibold text-link hover:underline">{o.codigo}</Link> },
    { clave: 'cliente', titulo: 'Cliente', recortar: true, render: (o) => o.cliente },
    { clave: 'servicios', titulo: 'Servicios cotizados', recortar: true, render: (o) => o.servicios },
    { clave: 'tecnico', titulo: 'Técnico', ancho: '150px', recortar: true, render: (o) => o.tecnico },
    { clave: 'fecha', titulo: 'Fecha', ancho: '96px', render: (o) => formatearFecha(o.fecha) },
    { clave: 'monto', titulo: 'Monto', ancho: '120px', alinear: 'right', render: (o) => <span className="font-mono">{formatearMoneda(o.monto)}</span> },
    { clave: 'estado', titulo: 'Estado', ancho: '170px', render: (o) => <EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} /> },
  ]
  const colTecnicos: Columna<FilaTecnico>[] = [
    { clave: 'tecnico', titulo: 'Técnico', render: (t) => <div><div className="font-semibold text-fg">{t.tecnico}</div><div className="text-[11px] text-fg-subtle">{t.especialidad || '—'}{t.estado !== 'activo' && ' · inactivo'}</div></div> },
    { clave: 'cumplidas', titulo: 'Visitas cumplidas', ancho: '140px', alinear: 'right', render: (t) => <span className="font-mono whitespace-nowrap font-semibold text-fg">{t.visitasCumplidas}</span> },
    { clave: 'ordenes', titulo: 'Órdenes atendidas', ancho: '140px', alinear: 'right', render: (t) => <span className="font-mono">{t.ordenesAtendidas}</span> },
    { clave: 'servicios', titulo: 'Servicios ejecutados', ancho: '150px', alinear: 'right', render: (t) => <span className="font-mono">{t.serviciosEjecutados}</span> },
    { clave: 'pendientes', titulo: 'Pendientes', ancho: '100px', alinear: 'right', render: (t) => <span className="font-mono">{t.visitasPendientes}</span> },
    { clave: 'canceladas', titulo: 'Canceladas', ancho: '100px', alinear: 'right', render: (t) => <span className="font-mono">{t.visitasCanceladas}</span> },
    { clave: 'min', titulo: 'Min. promedio', ancho: '110px', alinear: 'right', render: (t) => <span className="font-mono">{t.minutosPromedio ?? '—'}</span> },
  ]

  const vacio = datos && datos.items.length === 0
  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <PageHeader
        eyebrow="Dashboard"
        titulo="Reportes operacionales"
        descripcion="Historial operativo por período, con totales y exportación en PDF o Excel."
        acciones={tiene('reportes.exportar') && (
          <>
            <Button variant="secondary" leadingIcon={<IconPdf />} disabled={!datos || cargando} onClick={() => exportar('pdf')}>Exportar PDF</Button>
            <Button variant="secondary" leadingIcon={<IconExcel />} disabled={!datos || cargando} onClick={() => exportar('excel')}>Exportar Excel</Button>
          </>
        )}
      />
      <Card className="gap-3 p-4">
        <Tabs etiqueta="Reporte" valor={tipo} onChange={(v) => f.set('tipo', v)}
          opciones={[
            ...(tiene('reportes.ordenes') ? [{ valor: 'ordenes' as const, label: 'Órdenes de servicio' }] : []),
            ...(tiene('reportes.tecnicos') ? [{ valor: 'tecnicos' as const, label: 'Servicios por técnico' }] : []),
          ]} />
        <div className="flex flex-wrap items-center gap-2.5">
          <SelectorRango desde={f.valores.desde} hasta={f.valores.hasta} onCambiar={(d, h) => f.actualizar({ desde: d, hasta: h })} />
          {tipo === 'ordenes' && <FiltroSelect etiqueta="Cliente" valor={f.valores.cliente} onChange={(v) => f.set('cliente', v)} opciones={clientes.map((c) => ({ valor: String(c.id), label: c.nombre }))} />}
          <FiltroSelect etiqueta="Técnico" valor={f.valores.tecnico} onChange={(v) => f.set('tecnico', v)} opciones={tecnicos.map((t) => ({ valor: String(t.id), label: t.nombre }))} />
          {tipo === 'ordenes' && <FiltroSelect etiqueta="Estado" valor={f.valores.estado} onChange={(v) => f.set('estado', v)} opciones={ESTADOS_ORDEN.map((e) => ({ valor: e, label: ESTADO_ORDEN_META[e].label }))} />}
        </div>
      </Card>

      {error && <Alert tone="danger" title="No pudimos generar el reporte" description={error} />}
      {vacio && <Alert tone="info" title="No hay datos en el período seleccionado" description="Amplía el rango de fechas o quita algún filtro (CA_60_04)." />}

      {ordenes && (
        <StatGrid>
          <StatCard etiqueta="Órdenes" valor={String(ordenes.totales.ordenes)} detalle="Creadas en el período" glifo="▣" tono="primary" />
          <StatCard etiqueta="Monto total" valor={formatearMoneda(ordenes.totales.monto)} detalle="Sin canceladas" glifo="$" tono="info" />
          <StatCard etiqueta="Abonado" valor={formatearMoneda(ordenes.totales.abonado)} detalle="Recaudado de esas órdenes" glifo="✓" tono="success" />
          <StatCard etiqueta="Saldo" valor={formatearMoneda(ordenes.totales.saldo)} detalle="Por cobrar" glifo="!" tono="warning" />
        </StatGrid>
      )}
      {porTecnico && (
        <StatGrid>
          <StatCard etiqueta="Visitas cumplidas" valor={String(porTecnico.totales.visitasCumplidas)} detalle="Todos los técnicos" glifo="✓" tono="success" />
          <StatCard etiqueta="Órdenes atendidas" valor={String(porTecnico.totales.ordenesAtendidas)} detalle="Con visita cumplida" glifo="▣" tono="primary" />
          <StatCard etiqueta="Servicios ejecutados" valor={String(porTecnico.totales.serviciosEjecutados)} detalle="Unidades de servicio" glifo="◆" tono="info" />
          <StatCard etiqueta="Visitas pendientes" valor={String(porTecnico.totales.visitasPendientes)} detalle="En el período" glifo="◷" tono="cyan" />
        </StatGrid>
      )}

      <Card className="flex min-h-[360px] flex-col overflow-hidden p-0">
        {tipo === 'ordenes' ? (
          <DataTable columnas={colOrdenes} filas={ordenes?.items ?? []} claveFila={(o) => o.id} cargando={cargando} vacio={{ titulo: 'Sin órdenes', descripcion: 'No hay órdenes con esos filtros.' }} />
        ) : (
          <DataTable columnas={colTecnicos} filas={porTecnico?.items ?? []} claveFila={(t) => t.id} cargando={cargando} vacio={{ titulo: 'Sin técnicos', descripcion: 'No hay técnicos con esos filtros.' }} />
        )}
      </Card>
    </div>
  )
}
