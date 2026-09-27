import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { MedidorSegmentado } from '@shared/components/charts'
import { EstadoBadge } from '@shared/components/data'
import { Bloque, Datos, SinDatos, Volver } from '@shared/components/detalle'
import { Alert, SkeletonKpis } from '@shared/components/ui'
import { ESTADO_COTIZACION_META, ESTADO_ITEM_META, ESTADO_ORDEN_META, ESTADO_PAGO_META, ESTADO_VISITA_META } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'

/**
 * HU_82 · Detalle de mi orden (solo lectura, CA_82_05): técnico asignado,
 * estado de pago con anticipo y saldo (CA_82_03) y, cuando está finalizada, la
 * solución aplicada por el técnico (CA_82_04).
 */
export default function MiOrdenPage() {
  const id = Number(useParams().id)
  const cargar = useCallback((oid: number) => portalService.orden(oid), [])
  const { datos: o, error } = useRecurso(cargar, id)

  if (error) return <Alert tone="danger" title="No encontramos esa orden" description={error} />
  if (!o) return <SkeletonKpis />
  const proxima = o.visitas.find((v) => v.estado === 'pendiente')
  const avance = o.venta ? Math.round((o.venta.abonado / Math.max(o.venta.montoTotal, 1)) * 100) : 0

  return (
    <div className="flex flex-col gap-5">
      <Volver a={ROUTES.portalOrdenes} texto="Mis órdenes" />
      <EncabezadoPortal eyebrow="Orden de servicio" titulo={o.codigo}
        descripcion={<span className="inline-flex items-center gap-2">Creada el {formatearFechaHora(o.fechaCreacion)} · <EstadoBadge meta={ESTADO_ORDEN_META[o.estado]} /></span>} />

      {o.estado === 'esperando_anticipo' && <Alert tone="warning" title="Falta el anticipo" description="Para iniciar el servicio se requiere el 50 % del valor. Cuando RvR lo registre, verás la orden en proceso." />}
      {o.estado === 'en_espera_repuesto' && <Alert tone="info" title="Esperando un repuesto" description="El técnico necesita un repuesto. Revisa tus cotizaciones: hay una por aprobar." />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bloque titulo="Visita técnica">
          {proxima ? (
            <Datos columnas={1} items={[
              { label: 'Fecha y hora', valor: formatearFechaHora(proxima.fechaProgramada) },
              { label: 'Técnico asignado', valor: proxima.tecnico },
              { label: 'Estado', valor: proxima.inicio ? 'El técnico ya inició la visita' : 'Programada' },
            ]} />
          ) : o.visitas.length ? (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {o.visitas.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="text-fg">{formatearFechaHora(v.fechaProgramada)} · {v.tecnico}</span>
                  <EstadoBadge meta={ESTADO_VISITA_META[v.estado]} />
                </li>
              ))}
            </ul>
          ) : <SinDatos texto="RvR te contactará para agendar la visita." />}
        </Bloque>

        <Bloque titulo="Estado de pago">
          {o.venta ? (
            <>
              <MedidorSegmentado porcentaje={avance} descripcion={`${avance} % pagado`} />
              <Datos items={[
                { label: 'Valor total', valor: <span className="font-mono">{formatearMoneda(o.venta.montoTotal)}</span> },
                { label: 'Anticipo (50 %)', valor: <span className="font-mono">{formatearMoneda(o.venta.montoAnticipo)}</span> },
                { label: 'Pagado', valor: <span className="font-mono">{formatearMoneda(o.venta.abonado)}</span> },
                { label: 'Saldo pendiente', valor: <span className="font-mono whitespace-nowrap font-bold">{formatearMoneda(o.venta.estadoPago === 'anulada' ? 0 : o.venta.saldo)}</span> },
              ]} />
              <EstadoBadge meta={ESTADO_PAGO_META[o.venta.estadoPago]} />
            </>
          ) : <SinDatos texto="RvR registrará el valor de la orden con el anticipo." />}
        </Bloque>
      </div>

      {o.estado === 'finalizada' && (
        <Bloque titulo="Solución aplicada por el técnico">
          {o.diagnostico && <div><div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Diagnóstico</div><p className="m-0 mt-1 text-[13.5px] text-fg">{o.diagnostico}</p></div>}
          <div><div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Solución</div><p className="m-0 mt-1 text-[13.5px] text-fg">{o.solucion ?? '—'}</p></div>
        </Bloque>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Bloque titulo="Servicios contratados">
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {o.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-3 text-[13px]">
                <span className="min-w-0 text-fg">{i.cantidad} × {i.nombre}</span>
                <EstadoBadge meta={ESTADO_ITEM_META[i.estado]} />
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 border-t border-border-base pt-3">
            {o.cotizaciones.map((q) => (
              <Link key={q.id} to={DETALLE.portalCotizacion(q.id)} className="inline-flex items-center gap-1.5 text-[12px] text-link hover:underline">
                <span className="font-mono">{q.numero}</span> <EstadoBadge meta={ESTADO_COTIZACION_META[q.estado]} />
              </Link>
            ))}
          </div>
        </Bloque>
        <Bloque titulo="Seguimiento">
          <ol className="m-0 flex list-none flex-col gap-2.5 border-l border-border-base p-0 pl-4">
            {o.historial.map((h, i) => (
              <li key={i} className="relative">
                <span aria-hidden="true" className="absolute top-1.5 -left-[21px] size-2.5 rounded-full border-2 border-surface bg-primary" />
                <div className="text-[12.5px] font-semibold text-fg">{ESTADO_ORDEN_META[h.estado]?.label ?? h.estado}</div>
                <div className="text-[11.5px] text-fg-subtle">{formatearFechaHora(h.fecha)} · {h.descripcion}</div>
              </li>
            ))}
          </ol>
        </Bloque>
      </div>
    </div>
  )
}
