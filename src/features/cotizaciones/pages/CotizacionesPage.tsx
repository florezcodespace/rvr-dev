import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { AccionesFila, EstadoBadge, Listado, type Columna } from '@shared/components/data'
import { FiltroFecha, FiltroSelect } from '@shared/components/form/Campos'
import { IconEditar, IconMas, IconVer } from '@shared/components/icons'
import { Button, SearchInput, StatCard, StatGrid, Tabs } from '@shared/components/ui'
import { ESTADO_COTIZACION_META, ORIGEN_COTIZACION } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFecha, formatearMoneda } from '@shared/lib/format'
import { cotizacionesService, type CotizacionResumen } from '../api'

const cargar = cotizacionesService.listar.bind(cotizacionesService)

/** HU_38 Listar · HU_37 Buscar por cliente, fecha o estado */
export default function CotizacionesPage() {
  const { tiene } = useAuth()
  const navigate = useNavigate()
  const f = useFiltros(['estado', 'origen', 'desde', 'hasta'] as const)
  const { datos, cargando, error } = useRecurso(cargar, f.params)

  const columnas: Columna<CotizacionResumen>[] = [
    {
      clave: 'numero', titulo: 'Número', ancho: '120px',
      render: (q) => (
        <div>
          <div className="font-mono whitespace-nowrap font-semibold text-fg">{q.numero}</div>
          {/* CA_38_02 · se distinguen las solicitadas por los clientes */}
          {q.estado === 'solicitada' && q.origen !== 'administrador' && <div className="text-[10.5px] font-bold tracking-[0.04em] text-warning-fg uppercase">Por valorar</div>}
        </div>
      ),
    },
    {
      clave: 'cliente', titulo: 'Cliente',
      render: (q) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-fg">{q.cliente.nombre}</div>
          <div className="truncate text-[11px] text-fg-subtle">{ORIGEN_COTIZACION[q.origen]}{q.ordenOrigen && ` · ${q.ordenOrigen.codigo}`}</div>
        </div>
      ),
    },
    { clave: 'fecha', titulo: 'Fecha', ancho: '104px', render: (q) => formatearFecha(q.fecha) },
    { clave: 'items', titulo: 'Ítems', ancho: '70px', alinear: 'right', render: (q) => <span className="font-mono">{q.items}</span> },
    { clave: 'monto', titulo: 'Monto total', ancho: '130px', alinear: 'right', render: (q) => <span className="font-mono whitespace-nowrap text-fg">{q.montoTotal ? formatearMoneda(q.montoTotal) : '—'}</span> },
    { clave: 'estado', titulo: 'Estado', ancho: '130px', render: (q) => <EstadoBadge meta={ESTADO_COTIZACION_META[q.estado]} /> },
    { clave: 'orden', titulo: 'Orden', ancho: '120px', render: (q) => (q.orden ? <Link to={DETALLE.orden(q.orden.id)} className="font-mono whitespace-nowrap text-link hover:underline">{q.orden.codigo}</Link> : '—') },
    {
      clave: 'acciones', titulo: '', ancho: '92px', alinear: 'right',
      render: (q) => (
        <AccionesFila acciones={[
          ...(tiene('cotizaciones.ver_detalle') ? [{ clave: 'ver', etiqueta: `Ver ${q.numero}`, icono: <IconVer />, a: DETALLE.cotizacion(q.id) }] : []),
          ...(tiene('cotizaciones.editar') && (q.estado === 'solicitada' || q.estado === 'pendiente')
            ? [{ clave: 'editar', etiqueta: q.estado === 'solicitada' ? `Valorar ${q.numero}` : `Editar ${q.numero}`, icono: <IconEditar />, a: DETALLE.cotizacionEditar(q.id) }] : []),
        ]} />
      ),
    },
  ]

  const c = datos?.conteos
  return (
    <Listado
      eyebrow="Venta – Órdenes"
      titulo="Cotizaciones"
      descripcion="Solicitudes de los clientes y propuestas económicas: se valoran, se envían al portal y se registra la decisión."
      acciones={tiene('cotizaciones.registrar') && <Button leadingIcon={<IconMas />} onClick={() => navigate(ROUTES.cotizacionNueva)}>Registrar cotización</Button>}
      indicadores={c && (
        <StatGrid>
          <StatCard etiqueta="Por valorar" valor={String(c.por_valorar)} detalle="Solicitudes de clientes y técnicos" glifo="✦" tono="warning" detalleDestacado={c.por_valorar > 0} />
          <StatCard etiqueta="Esperando al cliente" valor={String(c.pendiente)} detalle="Enviadas, sin respuesta" glifo="⏱" tono="info" />
          <StatCard etiqueta="Aprobadas" valor={String(c.aprobada)} detalle="Dan origen a órdenes" glifo="✓" tono="success" />
          <StatCard etiqueta="Rechazadas" valor={String(c.rechazada)} detalle="No generan orden" glifo="✕" tono="danger" />
        </StatGrid>
      )}
      barra={
        <>
          {tiene('cotizaciones.buscar') && <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Cliente, documento o número…" className="w-full max-w-[260px]" />}
          <Tabs etiqueta="Estado" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
            opciones={[
              { valor: 'todos', label: 'Todas', conteo: c?.todos },
              { valor: 'solicitada', label: 'Solicitadas', conteo: c?.solicitada },
              { valor: 'pendiente', label: 'Pendientes', conteo: c?.pendiente },
              { valor: 'aprobada', label: 'Aprobadas', conteo: c?.aprobada },
              { valor: 'rechazada', label: 'Rechazadas', conteo: c?.rechazada },
            ]} />
          <FiltroSelect etiqueta="Origen" valor={f.valores.origen} onChange={(v) => f.set('origen', v)} opciones={Object.entries(ORIGEN_COTIZACION).map(([valor, label]) => ({ valor, label }))} />
          <FiltroFecha etiqueta="Desde" valor={f.valores.desde} onChange={(v) => f.set('desde', v)} max={f.valores.hasta || undefined} />
          <FiltroFecha etiqueta="Hasta" valor={f.valores.hasta} onChange={(v) => f.set('hasta', v)} min={f.valores.desde || undefined} />
          {f.hayFiltros && <Button variant="ghost" size="sm" onClick={f.limpiar}>Limpiar</Button>}
        </>
      }
      columnas={columnas}
      filas={datos?.items ?? []}
      claveFila={(q) => q.id}
      cargando={cargando}
      error={error}
      onAbrir={tiene('cotizaciones.ver_detalle') ? (q) => navigate(DETALLE.cotizacion(q.id)) : undefined}
      vacio={{ titulo: 'No se encontraron cotizaciones', descripcion: 'Prueba con otro término o cambia los filtros.' }}
      pagina={datos ?? undefined}
      onPagina={f.setPagina}
    />
  )
}
