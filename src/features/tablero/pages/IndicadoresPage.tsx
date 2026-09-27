import { useCallback, useMemo } from 'react'
import { useAuth } from '@features/auth'
import { BarraApilada, BarrasRanking, BarrasSerie } from '@shared/components/charts'
import { Bloque, SinDatos } from '@shared/components/detalle'
import { FiltroSelect } from '@shared/components/form/Campos'
import { EstadoBadge } from '@shared/components/data'
import { Alert, Card, PageHeader, SkeletonKpis, StatCard, StatGrid } from '@shared/components/ui'
import { ESTADO_ORDEN_META, ESTADOS_ORDEN } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { deISO } from '@shared/lib/fechas'
import { tableroService } from '../api'
import { rangoPorDefecto } from '../rango'
import { SelectorRango } from '../SelectorRango'

/**
 * Indicadores de gestión: HU_63 servicios realizados y órdenes por estado con
 * cantidad y porcentaje (CA_63_02), filtrables por fechas o estado (CA_63_03);
 * HU_64 servicios más solicitados y técnicos con más visitas cumplidas.
 * Todo se calcula por consulta sobre las tablas de operación (CA_63_04).
 */
export default function IndicadoresPage() {
  const { tiene } = useAuth()
  const def = useMemo(() => rangoPorDefecto(), [])
  const f = useFiltros(['desde', 'hasta', 'estado'] as const, def)
  const p1 = useMemo(() => ({ desde: f.valores.desde, hasta: f.valores.hasta, estado: f.valores.estado }), [f.valores.desde, f.valores.hasta, f.valores.estado])
  const p2 = useMemo(() => ({ desde: f.valores.desde, hasta: f.valores.hasta }), [f.valores.desde, f.valores.hasta])
  const puedeA = tiene('indicadores.servicios_ordenes')
  const puedeB = tiene('indicadores.mas_solicitados')
  const cargarA = useCallback((p: typeof p1) => (puedeA ? tableroService.serviciosOrdenes(p) : Promise.resolve(null)), [puedeA])
  const cargarB = useCallback((p: typeof p2) => (puedeB ? tableroService.masSolicitados(p) : Promise.resolve(null)), [puedeB])
  const a = useRecurso(cargarA, p1)
  const b = useRecurso(cargarB, p2)

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <PageHeader
        eyebrow="Dashboard"
        titulo="Indicadores de gestión"
        descripcion="Actividad operativa: servicios realizados, dónde se represan las órdenes y qué se pide más."
        acciones={
          <div className="flex flex-wrap items-center gap-2.5">
            <SelectorRango desde={f.valores.desde} hasta={f.valores.hasta} onCambiar={(d, h) => f.actualizar({ desde: d, hasta: h })} />
            {puedeA && <FiltroSelect etiqueta="Estado" valor={f.valores.estado} onChange={(v) => f.set('estado', v)} opciones={ESTADOS_ORDEN.map((e) => ({ valor: e, label: ESTADO_ORDEN_META[e].label }))} />}
          </div>
        }
      />
      {(a.error || b.error) && <Alert tone="danger" title="No pudimos cargar los indicadores" description={a.error ?? b.error ?? ''} />}

      {puedeA && (a.datos ? (
        <>
          <StatGrid>
            <StatCard etiqueta="Servicios realizados" valor={String(a.datos.serviciosRealizados)} detalle="Ítems de servicio completados en órdenes finalizadas" glifo="✓" tono="success" />
            <StatCard etiqueta="Órdenes finalizadas" valor={String(a.datos.ordenesFinalizadas)} detalle="En el período" glifo="▣" tono="primary" />
            <StatCard etiqueta="Órdenes creadas" valor={String(a.datos.totalOrdenes)} detalle={f.valores.estado ? `Con estado ${ESTADO_ORDEN_META[f.valores.estado as keyof typeof ESTADO_ORDEN_META]?.label.toLowerCase()}` : 'Todas las del período'} glifo="✦" tono="info" />
            <StatCard etiqueta="Represadas" valor={String(a.datos.ordenesPorEstado.filter((x) => x.estado === 'esperando_anticipo' || x.estado === 'en_espera_repuesto').reduce((s, x) => s + x.cantidad, 0))}
              detalle="Esperando anticipo o repuesto" glifo="⏱" tono="warning" />
          </StatGrid>
          <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
            <Bloque titulo="Órdenes por estado" subtitulo="Cantidad y porcentaje del período">
              {a.datos.totalOrdenes ? (
                <>
                  <BarraApilada descripcion="Órdenes por estado" segmentos={a.datos.ordenesPorEstado.filter((x) => x.cantidad).map((x) => ({ clave: x.estado, label: ESTADO_ORDEN_META[x.estado].label, valor: x.cantidad, color: ESTADO_ORDEN_META[x.estado].color }))} />
                  <div className="-mx-1 overflow-x-auto px-1"><table className="w-full min-w-[340px] border-collapse text-left text-[13px]">
                    <thead><tr className="text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase"><th className="py-2">Estado</th><th className="py-2 text-right">Cantidad</th><th className="py-2 text-right">%</th></tr></thead>
                    <tbody>
                      {a.datos.ordenesPorEstado.map((x) => (
                        <tr key={x.estado} className="border-t border-border-base">
                          <td className="py-2"><EstadoBadge meta={ESTADO_ORDEN_META[x.estado]} /></td>
                          <td className="py-2 text-right font-mono">{x.cantidad}</td>
                          <td className="py-2 text-right font-mono">{x.porcentaje.toLocaleString('es-CO')} %</td>
                        </tr>
                      ))}
                    </tbody>
                  </table></div>
                </>
              ) : <SinDatos texto="No hay órdenes en el período." />}
            </Bloque>
            <Bloque titulo="Servicios realizados por semana">
              {a.datos.serieSemanal.length ? (
                <BarrasSerie color="var(--rvr-chart-2)" descripcion="Servicios realizados por semana"
                  puntos={a.datos.serieSemanal.map((s) => ({ clave: s.semana, etiqueta: `Sem. ${deISO(s.semana).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`, valor: s.servicios }))} />
              ) : <SinDatos texto="No se finalizaron servicios en el período." />}
            </Bloque>
          </div>
        </>
      ) : !a.error && <SkeletonKpis />)}

      {puedeB && (b.datos ? (
        <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-3">
          <Card className="gap-3 p-5 lg:col-span-2">
            <div className="text-[14px] font-bold text-fg">Servicios más solicitados</div>
            <div className="text-[12px] text-fg-subtle">Ranking por unidades cotizadas en el período</div>
            {b.datos.servicios.length ? (
              <div className="-mx-1 overflow-x-auto px-1"><table className="w-full min-w-[340px] border-collapse text-left text-[13px]">
                <thead><tr className="text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase"><th className="py-2">#</th><th className="py-2">Servicio</th><th className="py-2">Categoría</th><th className="py-2 text-right">Unidades</th><th className="py-2 text-right">Cotizaciones</th><th className="py-2 text-right">Aprobadas</th></tr></thead>
                <tbody>
                  {b.datos.servicios.map((s, i) => (
                    <tr key={s.id} className="border-t border-border-base">
                      <td className="py-2 font-mono text-fg-subtle">{i + 1}</td>
                      <td className="py-2 font-semibold text-fg">{s.nombre}</td>
                      <td className="py-2 text-fg-muted">{s.categoria}</td>
                      <td className="py-2 text-right font-mono">{s.unidades}</td>
                      <td className="py-2 text-right font-mono">{s.cotizaciones}</td>
                      <td className="py-2 text-right font-mono">{s.aprobadas}</td>
                    </tr>
                  ))}
                </tbody>
              </table></div>
            ) : <SinDatos texto="Sin cotizaciones en el período." />}
          </Card>
          <div className="flex flex-col gap-3.5">
            <Bloque titulo="Técnicos con más servicios" subtitulo="Visitas cumplidas">
              {b.datos.tecnicos.length ? <BarrasRanking items={b.datos.tecnicos.map((t) => ({ clave: t.id, nombre: t.nombre, valor: t.cumplidas }))} color="var(--rvr-chart-2)" sufijo="visitas" />
                : <SinDatos texto="Sin visitas cumplidas en el período." />}
            </Bloque>
            <Bloque titulo="Demanda por categoría">
              {b.datos.categorias.length ? <BarrasRanking items={b.datos.categorias.map((c) => ({ clave: c.categoria, nombre: c.categoria, valor: c.unidades }))} sufijo="u." />
                : <SinDatos texto="Sin datos." />}
            </Bloque>
          </div>
        </div>
      ) : !b.error && <SkeletonKpis />)}
    </div>
  )
}
