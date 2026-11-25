import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { Donut } from '@shared/components/charts'
import { SinDatos } from '@shared/components/detalle'
import { Alert, PageHeader, Skeleton } from '@shared/components/ui'
import { ESTADO_COTIZACION_META, ESTADO_ORDEN_META, type EstadoCotizacion } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { deISO, hoyISO } from '@shared/lib/fechas'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { tableroService } from '../api'
import { rangoPorDefecto } from '../rango'
import { SelectorRango } from '../SelectorRango'
import { Cabeza, Cifra, Delta, EnVivo, FilaBarra, MapaCalor, MiniBarras, ordenDelTablero, TableroWidgets, type DefWidget } from '../Widgets'

const PENDIENTES = [
  { k: 'por_valorar', t: 'Solicitudes por valorar', a: `${ROUTES.cotizaciones}?estado=solicitada` },
  { k: 'esperando_cliente', t: 'Cotizaciones esperando al cliente', a: `${ROUTES.cotizaciones}?estado=pendiente` },
  { k: 'esperando_anticipo', t: 'Órdenes esperando anticipo', a: `${ROUTES.ordenes}?estado=esperando_anticipo` },
  { k: 'en_espera_repuesto', t: 'Órdenes esperando repuesto', a: `${ROUTES.ordenes}?estado=en_espera_repuesto` },
  { k: 'sin_visita', t: 'Órdenes activas sin visita', a: ROUTES.agenda },
]

const NOMBRES: Record<string, string> = {
  ordenes: 'Órdenes', ingresos: 'Ingresos', aprobacion: 'Aprobación', pendientes: 'Pendientes de hoy', cartera: 'Cartera',
  visitas: 'Próximas visitas', estados: 'Órdenes por estado', servicios: 'Servicios más solicitados', metodos: 'Métodos de pago', cotizaciones: 'Cotizaciones por estado',
}

/**
 * HU_65 · Estadísticas generales: total de órdenes, servicios más solicitados,
 * ingresos del período calculados con los abonos (CA_65_02) y tasa de
 * aprobación de cotizaciones, en gráficos, tablas y porcentajes (CA_65_03),
 * con rango de fechas personalizable (CA_65_04). Los widgets se reordenan
 * arrastrándolos y el orden se recuerda por usuario.
 */
export default function EstadisticasPage() {
  const { usuario } = useAuth()
  const def = useMemo(() => rangoPorDefecto(), [])
  const f = useFiltros(['desde', 'hasta'] as const, def)
  const params = useMemo(() => ({ desde: f.valores.desde, hasta: f.valores.hasta }), [f.valores.desde, f.valores.hasta])
  const cargar = useCallback((p: typeof params) => tableroService.estadisticas(p), [])
  const { datos: e, error, cargando } = useRecurso(cargar, params)

  const claveTablero = `rvr.tablero.${usuario?.id ?? 'anon'}`
  const widgets: DefWidget[] = e
    ? (() => {
        const hoy = hoyISO()
        const etiqueta = (s: string) => (e.agrupacion === 'mes' ? deISO(s).toLocaleDateString('es-CO', { month: 'short', year: '2-digit' }) : deISO(s).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }))
        const ordenesHoy = e.serie.find((s) => s.fecha === hoy)?.ordenes ?? 0
        const maxPend = Math.max(1, ...PENDIENTES.map((p) => e.pendientes[p.k] ?? 0))
        const maxServ = Math.max(1, ...e.serviciosMasSolicitados.map((s) => s.unidades))
        const maxMet = Math.max(1, ...e.ingresosPorMetodo.map((m) => m.total))
        const totalPend = PENDIENTES.reduce((s, p) => s + (e.pendientes[p.k] ?? 0), 0)
        const respondidas = e.cotizacionesRespondidas
        const aprobadas = e.tasaAprobacion === null ? 0 : Math.round((e.tasaAprobacion / 100) * respondidas)
        return [
          {
            id: 'ordenes', ancho: 2,
            contenido: (
              <>
                <Cabeza titulo="Órdenes del período" derecha={<Delta actual={e.totalOrdenes} anterior={e.totalOrdenesAnterior} />} />
                <Cifra valor={e.totalOrdenes.toLocaleString('es-CO')} unidad={`${e.ordenesFinalizadas} finalizadas · ${ordenesHoy} hoy`} />
                <div className="mt-auto pt-5">
                  {e.agrupacion === 'dia'
                    ? <MapaCalor dias={e.serie.map((s) => ({ fecha: s.fecha, valor: s.ordenes }))} hoy={hoy} etiqueta="Órdenes creadas por día" />
                    : <MiniBarras valores={e.serie.map((s) => s.ordenes)} etiquetas={e.serie.map((s) => etiqueta(s.fecha))} formato={(v) => `${v} órdenes`} />}
                </div>
              </>
            ),
          },
          {
            id: 'ingresos', ancho: 1,
            contenido: (
              <>
                <Cabeza titulo="Ingresos" derecha={<Delta actual={e.ingresos} anterior={e.ingresosAnterior} sufijo="" />} />
                <Cifra valor={formatearMoneda(e.ingresos)} />
                <div className="mt-1 text-[12.5px] text-fg-subtle">Abonos recibidos · sin anuladas</div>
                <MiniBarras valores={e.serie.map((s) => s.ingresos)} etiquetas={e.serie.map((s) => etiqueta(s.fecha))} formato={formatearMoneda} />
              </>
            ),
          },
          {
            id: 'aprobacion', ancho: 1,
            contenido: (
              <>
                <Cabeza titulo="Aprobación" derecha={<Delta actual={e.tasaAprobacion ?? 0} anterior={e.tasaAprobacionAnterior} puntos sufijo="" />} />
                <Cifra valor={e.tasaAprobacion === null ? '—' : `${e.tasaAprobacion.toLocaleString('es-CO')}%`} unidad="de cotizaciones" />
                <div className="mt-auto flex flex-col gap-2 pt-5">
                  <div className="flex h-2.5 gap-[3px] overflow-hidden rounded-full">
                    {respondidas > 0 ? (
                      <>
                        <span className="widget-barra-h rounded-full bg-[var(--rvr-estado-completada)]" style={{ width: `${(aprobadas / respondidas) * 100}%` }} />
                        <span className="flex-1 rounded-full bg-[var(--rvr-track)]" />
                      </>
                    ) : <span className="flex-1 rounded-full bg-[var(--rvr-track)]" />}
                  </div>
                  <div className="flex justify-between text-[12.5px] text-fg-subtle">
                    <span><b className="font-semibold text-fg">{aprobadas}</b> aprobadas</span>
                    <span>{respondidas} respondidas</span>
                  </div>
                </div>
              </>
            ),
          },
          {
            id: 'pendientes', ancho: 2,
            contenido: (
              <>
                <Cabeza titulo="Pendientes de hoy" derecha={<EnVivo texto={totalPend ? `${totalPend} por atender` : 'todo al día'} />} />
                <Cifra valor={totalPend} unidad="acciones esperando a alguien" />
                <div className="mt-4 flex flex-col">
                  {PENDIENTES.map((p, i) => {
                    const v = e.pendientes[p.k] ?? 0
                    return (
                      <FilaBarra key={p.k} nombre={p.t} valor={v} proporcion={v / maxPend} destacada={v > 0 && i === PENDIENTES.findIndex((x) => (e.pendientes[x.k] ?? 0) > 0)}
                        tono={v > 0 ? 'var(--rvr-estado-pendiente)' : 'var(--rvr-border-strong)'}
                        a={(fila) => <Link to={p.a} className="-mx-2 block rounded-[10px] px-2 transition-colors hover:bg-surface-muted">{fila}</Link>} />
                    )
                  })}
                </div>
              </>
            ),
          },
          {
            id: 'cartera', ancho: 1,
            contenido: (
              <>
                <Cabeza titulo="Cartera por cobrar" />
                <Cifra valor={formatearMoneda(e.cartera.saldo)} />
                <div className="mt-2 text-[13px] font-semibold">
                  {e.cartera.saldo > 0
                    ? <span className="inline-flex items-center gap-1.5 text-warning-fg"><span className="size-2 rounded-full bg-[var(--rvr-estado-pendiente)]" />{e.cartera.ventas} venta{e.cartera.ventas === 1 ? '' : 's'} con saldo</span>
                    : <span className="inline-flex items-center gap-1.5 text-[var(--rvr-estado-completada-fg)]"><span className="size-2 rounded-full bg-[var(--rvr-estado-completada)]" />Todo cobrado</span>}
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-5 text-[12.5px]">
                  <div className="rounded-[14px] bg-surface-muted p-3"><div className="font-display text-[20px] font-extrabold text-fg">{e.clientesNuevos}</div><div className="text-fg-subtle">clientes nuevos</div></div>
                  <div className="rounded-[14px] bg-surface-muted p-3"><div className="font-display text-[20px] font-extrabold text-fg">{e.ordenesFinalizadas}</div><div className="text-fg-subtle">finalizadas</div></div>
                </div>
              </>
            ),
          },
          {
            id: 'visitas', ancho: 1,
            contenido: (
              <>
                <Cabeza titulo="Próximas visitas" derecha={<Link to={ROUTES.agenda} className="font-semibold text-link hover:underline">Agenda</Link>} />
                {e.proximasVisitas.length === 0 ? <div className="mt-4"><SinDatos texto="No hay visitas pendientes." /></div> : (
                  <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
                    {e.proximasVisitas.slice(0, 4).map((v) => (
                      <li key={v.id}>
                        <Link to={DETALLE.orden(v.ordenId)} className="-mx-2 flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-surface-muted">
                          <span className="flex w-11 flex-none flex-col items-center rounded-[10px] bg-primary-soft py-1 text-primary-on-soft">
                            <span className="text-[10.5px] font-bold uppercase">{deISO(v.fecha.slice(0, 10)).toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}</span>
                            <span className="font-display text-[17px] leading-none font-extrabold">{deISO(v.fecha.slice(0, 10)).getDate()}</span>
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13px] font-semibold text-fg">{v.cliente || v.codigo}</span>
                            <span className="block truncate text-[12px] text-fg-subtle">{formatearFechaHora(v.fecha).split(' ').at(-1)} · {v.tecnico}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ),
          },
          {
            id: 'servicios', ancho: 2,
            contenido: (
              <>
                <Cabeza titulo="Servicios más solicitados" derecha="unidades cotizadas" />
                {e.serviciosMasSolicitados.length ? (
                  <div className="mt-3 flex flex-col">
                    {e.serviciosMasSolicitados.slice(0, 6).map((s, i) => (
                      <FilaBarra key={s.nombre} nombre={s.nombre} valor={`${s.unidades} u.`} proporcion={s.unidades / maxServ} destacada={i === 0} />
                    ))}
                  </div>
                ) : <div className="mt-4"><SinDatos texto="Sin cotizaciones en el período." /></div>}
              </>
            ),
          },
          {
            id: 'estados', ancho: 1,
            contenido: (
              <>
                <Cabeza titulo="Órdenes por estado" />
                <div className="mt-3">
                  {e.totalOrdenes ? (
                    <Donut etiquetaTotal="órdenes" segmentos={e.ordenesPorEstado.filter((x) => x.cantidad).map((x) => ({ clave: x.estado, label: ESTADO_ORDEN_META[x.estado].label, valor: x.cantidad, color: ESTADO_ORDEN_META[x.estado].color }))} />
                  ) : <SinDatos texto="Sin órdenes en el período." />}
                </div>
              </>
            ),
          },
          {
            id: 'cotizaciones', ancho: 1,
            contenido: (
              <>
                <Cabeza titulo="Cotizaciones por estado" />
                <div className="mt-3">
                  {e.cotizacionesPorEstado.some((x) => x.cantidad) ? (
                    <Donut etiquetaTotal="cotizaciones" segmentos={e.cotizacionesPorEstado.filter((x) => x.cantidad).map((x) => {
                      const m = ESTADO_COTIZACION_META[x.estado as EstadoCotizacion]
                      return { clave: x.estado, label: m.label, valor: x.cantidad, color: m.color }
                    })} />
                  ) : <SinDatos texto="Sin cotizaciones en el período." />}
                </div>
              </>
            ),
          },
          {
            id: 'metodos', ancho: 2,
            contenido: (
              <>
                <Cabeza titulo="Ingresos por método de pago" derecha={formatearMoneda(e.ingresos)} />
                {e.ingresosPorMetodo.length ? (
                  <div className="mt-3 flex flex-col">
                    {e.ingresosPorMetodo.map((m, i) => (
                      <FilaBarra key={m.metodo} nombre={m.metodo} detalle={e.ingresos ? `${Math.round((m.total / e.ingresos) * 100)} %` : undefined} valor={formatearMoneda(m.total)} proporcion={m.total / maxMet} destacada={i === 0} />
                    ))}
                  </div>
                ) : <div className="mt-4"><SinDatos texto="No hubo abonos en este período." /></div>}
              </>
            ),
          },
        ] satisfies DefWidget[]
      })()
    : []

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <PageHeader
        titulo="Estadísticas generales"
        descripcion="La operación de RvR Tecnologías en el período elegido, con datos reales de la base."
        acciones={<SelectorRango desde={f.valores.desde} hasta={f.valores.hasta} onCambiar={(d, h) => f.actualizar({ desde: d, hasta: h })} />}
      />
      {error && <Alert tone="danger" title="No pudimos cargar las estadísticas" description={error} />}
      {!e && !error && (
        <div role="status" aria-label="Cargando estadísticas">
          <Skeleton className="mb-3.5 h-4 w-64 max-w-full" />
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
            {ordenDelTablero(claveTablero, ['ordenes', 'ingresos', 'aprobacion', 'pendientes', 'cartera', 'visitas', 'servicios', 'estados', 'cotizaciones', 'metodos']).map((id) => (
              <div key={id} aria-hidden="true" className={`vidrio flex min-h-48 flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5 ${['ordenes', 'pendientes', 'servicios', 'metodos'].includes(id) ? 'md:col-span-2' : ''}`}>
                <Skeleton className="h-3 w-2/5" />
                <Skeleton className="h-8 w-1/3" />
                {id === 'ingresos' || id === 'ordenes' ? (
                  <div className="mt-auto flex h-14 items-end gap-1">
                    {[35, 60, 48, 74, 56, 88, 63, 95].map((altura) => (
                      <div key={altura} className="flex-1" style={{ height: altura + '%' }}><Skeleton className="h-full rounded-sm" /></div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-auto space-y-3"><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-3/4" /></div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {e && (
        <div aria-busy={cargando} className={cargando ? 'opacity-70 transition-opacity' : undefined}>
          <TableroWidgets clave={claveTablero} widgets={widgets} nombres={NOMBRES} />
        </div>
      )}
    </div>
  )
}
