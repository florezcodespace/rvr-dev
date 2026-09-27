import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { BarrasRanking, BarrasSerie, Donut, ListaLeyenda } from '@shared/components/charts'
import { Bloque, SinDatos } from '@shared/components/detalle'
import { Alert, Card, PageHeader, SkeletonKpis, StatCard, StatGrid } from '@shared/components/ui'
import { ESTADO_COTIZACION_META, ESTADO_ORDEN_META, type EstadoCotizacion } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { deISO } from '@shared/lib/fechas'
import { formatearFechaHora, formatearMoneda, saludo } from '@shared/lib/format'
import { tableroService } from '../api'
import { rangoPorDefecto } from '../rango'
import { SelectorRango } from '../SelectorRango'

const variacion = (actual: number, anterior: number) => {
  if (!anterior) return actual ? 'Sin datos del período anterior' : 'Igual que el período anterior'
  const p = Math.round(((actual - anterior) / anterior) * 100)
  return `${p > 0 ? '+' : ''}${p} % frente al período anterior`
}

const COLORES_METODO = ['var(--rvr-chart-1)', 'var(--rvr-chart-2)', 'var(--rvr-estado-pendiente)', 'var(--rvr-estado-programada)', 'var(--rvr-estado-reprogramada)']

/**
 * HU_65 · Estadísticas generales: total de órdenes, servicios más solicitados,
 * ingresos del período calculados con los abonos (CA_65_02) y tasa de
 * aprobación de cotizaciones, en gráficos, tablas y porcentajes (CA_65_03),
 * con rango de fechas personalizable (CA_65_04).
 */
export default function EstadisticasPage() {
  const { usuario } = useAuth()
  const def = useMemo(() => rangoPorDefecto(), [])
  const f = useFiltros(['desde', 'hasta'] as const, def)
  const params = useMemo(() => ({ desde: f.valores.desde, hasta: f.valores.hasta }), [f.valores.desde, f.valores.hasta])
  const cargar = useCallback((p: typeof params) => tableroService.estadisticas(p), [])
  const { datos: e, error, cargando } = useRecurso(cargar, params)

  const puntos = (e?.serie ?? []).map((s) => ({
    clave: s.fecha,
    etiqueta: e?.agrupacion === 'mes'
      ? deISO(s.fecha).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })
      : deISO(s.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
    valor: s.ingresos,
  }))

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <PageHeader
        eyebrow={`${saludo()}, ${usuario?.nombres ?? ''}`}
        titulo="Estadísticas generales"
        descripcion="La operación de RvR Tecnologías en el período elegido, con datos reales de la base."
        acciones={<SelectorRango desde={f.valores.desde} hasta={f.valores.hasta} onCambiar={(d, h) => f.actualizar({ desde: d, hasta: h })} />}
      />
      {error && <Alert tone="danger" title="No pudimos cargar las estadísticas" description={error} />}
      {!e && !error && <SkeletonKpis cantidad={4} />}
      {e && (
        <div className={cargando ? 'opacity-70 transition-opacity' : undefined}>
          <StatGrid>
            <StatCard etiqueta="Total de órdenes" valor={e.totalOrdenes.toLocaleString('es-CO')} detalle={variacion(e.totalOrdenes, e.totalOrdenesAnterior)} glifo="▣" tono="primary" />
            <StatCard etiqueta="Ingresos del período" valor={formatearMoneda(e.ingresos)} detalle={variacion(e.ingresos, e.ingresosAnterior)} glifo="$" tono="success" />
            <StatCard etiqueta="Aprobación de cotizaciones" valor={e.tasaAprobacion === null ? '—' : `${e.tasaAprobacion.toLocaleString('es-CO')} %`}
              detalle={`${e.cotizacionesRespondidas} respondidas en el período`} glifo="✓" tono="info" />
            <StatCard etiqueta="Cartera por cobrar" valor={formatearMoneda(e.cartera.saldo)} detalle={`${e.cartera.ventas} venta(s) con saldo`} glifo="!" tono="warning" detalleDestacado={e.cartera.saldo > 0} />
          </StatGrid>

          <div className="mt-3.5 grid grid-cols-1 gap-3.5 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <Bloque titulo="Ingresos" subtitulo={`Abonos recibidos por ${e.agrupacion === 'mes' ? 'mes' : 'día'} · ventas anuladas excluidas`}>
              {puntos.some((p) => p.valor > 0) ? (
                <BarrasSerie puntos={puntos} formato={formatearMoneda} descripcion="Ingresos del período" />
              ) : <SinDatos texto="No hubo abonos en este período." />}
            </Bloque>
            <Bloque titulo="Pendientes de hoy" subtitulo="Lo que espera una acción">
              <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {[
                  { k: 'por_valorar', t: 'Solicitudes por valorar', a: `${ROUTES.cotizaciones}?estado=solicitada` },
                  { k: 'esperando_cliente', t: 'Cotizaciones esperando al cliente', a: `${ROUTES.cotizaciones}?estado=pendiente` },
                  { k: 'esperando_anticipo', t: 'Órdenes esperando anticipo', a: `${ROUTES.ordenes}?estado=esperando_anticipo` },
                  { k: 'en_espera_repuesto', t: 'Órdenes en espera de repuesto', a: `${ROUTES.ordenes}?estado=en_espera_repuesto` },
                  { k: 'sin_visita', t: 'Órdenes activas sin visita', a: ROUTES.agenda },
                ].map((p) => (
                  <li key={p.k}>
                    <Link to={p.a} className="flex items-center justify-between gap-3 rounded-[10px] border border-border-base px-3.5 py-2.5 transition-colors hover:bg-surface-muted">
                      <span className="text-[13px] text-fg">{p.t}</span>
                      <span className={(e.pendientes[p.k] ?? 0) > 0 ? 'rounded-full bg-warning-soft px-2 text-[12px] font-bold text-warning-fg' : 'text-[12px] font-bold text-fg-faint'}>{e.pendientes[p.k] ?? 0}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Bloque>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-3">
            <Bloque titulo="Órdenes por estado" subtitulo="Creadas en el período">
              {e.totalOrdenes ? (
                <Donut etiquetaTotal="órdenes" segmentos={e.ordenesPorEstado.filter((x) => x.cantidad).map((x) => ({ clave: x.estado, label: ESTADO_ORDEN_META[x.estado].label, valor: x.cantidad, color: ESTADO_ORDEN_META[x.estado].color }))} />
              ) : <SinDatos texto="Sin órdenes en el período." />}
            </Bloque>
            <Bloque titulo="Cotizaciones por estado" subtitulo="Emitidas en el período">
              {e.cotizacionesPorEstado.some((x) => x.cantidad) ? (
                <Donut etiquetaTotal="cotizaciones" segmentos={e.cotizacionesPorEstado.filter((x) => x.cantidad).map((x) => {
                  const m = ESTADO_COTIZACION_META[x.estado as EstadoCotizacion]
                  return { clave: x.estado, label: m.label, valor: x.cantidad, color: m.color }
                })} />
              ) : <SinDatos texto="Sin cotizaciones en el período." />}
            </Bloque>
            <Bloque titulo="Servicios más solicitados" subtitulo="Unidades cotizadas">
              {e.serviciosMasSolicitados.length ? (
                <BarrasRanking items={e.serviciosMasSolicitados.map((s) => ({ clave: s.nombre, nombre: s.nombre, valor: s.unidades }))} sufijo="u." />
              ) : <SinDatos texto="Sin cotizaciones en el período." />}
            </Bloque>
          </div>

          <div className="mt-3.5 grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <Bloque titulo="Ingresos por método de pago">
              {e.ingresosPorMetodo.length ? (
                <ListaLeyenda anchoExtra="w-[60px]" filas={e.ingresosPorMetodo.map((m, i) => ({
                  clave: m.metodo, label: m.metodo, color: COLORES_METODO[i % COLORES_METODO.length]!,
                  valor: formatearMoneda(m.total), extra: e.ingresos ? `${Math.round((m.total / e.ingresos) * 100)} %` : undefined,
                }))} />
              ) : <SinDatos texto="Sin abonos en el período." />}
            </Bloque>
            <Card className="gap-3 p-5">
              <div className="flex items-center justify-between">
                <div className="text-[14px] font-bold text-fg">Próximas visitas</div>
                <Link to={ROUTES.agenda} className="text-[12.5px] font-semibold text-link hover:underline">Ver agenda</Link>
              </div>
              {e.proximasVisitas.length === 0 ? <SinDatos texto="No hay visitas pendientes." /> : (
                <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                  {e.proximasVisitas.map((v) => (
                    <li key={v.id}>
                      <Link to={DETALLE.orden(v.ordenId)} className="flex items-center justify-between gap-3 rounded-[9px] px-2 py-1.5 hover:bg-surface-muted">
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-fg">{v.cliente || v.codigo}</span>
                          <span className="block text-[11.5px] text-fg-subtle"><span className="font-mono">{v.codigo}</span> · {v.tecnico}</span>
                        </span>
                        <span className="flex-none text-[12px] font-medium text-fg-muted">{formatearFechaHora(v.fecha)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="grid grid-cols-2 gap-2 border-t border-border-base pt-3 text-[12.5px]">
                <div><span className="text-fg-subtle">Órdenes finalizadas:</span> <strong className="text-fg">{e.ordenesFinalizadas}</strong></div>
                <div><span className="text-fg-subtle">Clientes nuevos:</span> <strong className="text-fg">{e.clientesNuevos}</strong></div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
