import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Card, CardHeader } from '@shared/components/ui'
import { tiempoRelativo } from '@shared/lib/format'
import type { EventoActividad, TipoActividad } from '../types'

const PUNTO: Record<TipoActividad, string> = {
  orden: 'var(--rvr-estado-completada)',
  cotizacion: 'var(--rvr-estado-aprobada)',
  agendamiento: 'var(--rvr-estado-programada)',
  pago: 'var(--rvr-estado-pendiente)',
}

export function ActividadOperativa({ eventos }: { eventos: EventoActividad[] }) {
  return (
    <Card className="min-h-0 flex-1 gap-2.5 px-4 py-3.5">
      <CardHeader
        titulo="Actividad operativa"
        accion={
          <Link
            to={ROUTES.ordenes}
            className="text-[11.5px] font-semibold text-link hover:underline"
          >
            Ver todo
          </Link>
        }
      />

      <ul className="flex list-none flex-col gap-[9px] overflow-y-auto p-0">
        {eventos.map((evento) => (
          <li key={evento.id} className="flex gap-[11px]">
            <span
              aria-hidden="true"
              className="mt-[5px] size-2 flex-none rounded-full"
              style={{ background: PUNTO[evento.tipo] }}
            />
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold text-fg">
                {evento.titulo}
                {evento.destacado && (
                  <span className="text-success-fg"> {evento.destacado}</span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-fg-subtle">
                {evento.detalle} · {tiempoRelativo(evento.fecha)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  )
}
