import { Card } from './Card'
import { cn } from '@shared/lib/cn'

export type TonoStat = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'cyan'

/** Color del chip del indicador: fondo suave y glifo en el color del estado. */
const TONOS: Record<TonoStat, string> = {
  primary: 'bg-[var(--rvr-estado-nueva-soft)] text-[var(--rvr-estado-nueva-fg)]',
  success: 'bg-[var(--rvr-estado-completada-soft)] text-[var(--rvr-estado-completada-fg)]',
  warning: 'bg-[var(--rvr-estado-pendiente-soft)] text-[var(--rvr-estado-pendiente-fg)]',
  danger: 'bg-[var(--rvr-estado-cancelada-soft)] text-[var(--rvr-estado-cancelada-fg)]',
  info: 'bg-[var(--rvr-estado-aprobada-soft)] text-[var(--rvr-estado-aprobada-fg)]',
  cyan: 'bg-[var(--rvr-estado-programada-soft)] text-[var(--rvr-estado-programada-fg)]',
}

export interface StatCardProps {
  etiqueta: string
  valor: string
  /** Se muestra más pequeño junto al valor (p. ej. " / 11"). */
  valorSecundario?: string
  detalle: string
  /** Resalta el detalle cuando exige atención. */
  detalleDestacado?: boolean
  glifo: string
  tono: TonoStat
}

/**
 * Indicador tipo widget de iOS: vidrio, un chip redondo con el glifo en el
 * color de su tono y la cifra grande. Sube al pasar el cursor.
 */
export function StatCard({
  etiqueta,
  valor,
  valorSecundario,
  detalle,
  detalleDestacado = false,
  glifo,
  tono,
}: StatCardProps) {
  return (
    <Card viva className="anim-entrada relative gap-2 overflow-hidden px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <span className="text-[13px] font-semibold text-fg-subtle">{etiqueta}</span>
        <span
          aria-hidden="true"
          className={cn('flex size-8 flex-none items-center justify-center rounded-full text-[14px] font-bold', TONOS[tono])}
        >
          {glifo}
        </span>
      </div>

      <div className="text-[23px] leading-none font-bold tracking-[-0.8px] tabular-nums text-fg sm:text-[29px]">
        {valor}
        {valorSecundario && (
          <span className="text-[14px] font-medium tracking-normal text-fg-subtle">
            {valorSecundario}
          </span>
        )}
      </div>

      <div
        className={cn(
          'text-[12.5px]',
          detalleDestacado ? 'font-semibold text-warning-fg' : 'text-fg-muted',
        )}
      >
        {detalle}
      </div>
    </Card>
  )
}

/** Rejilla estándar de KPIs (2 en el teléfono, 4 en pantallas anchas). */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="escalonado grid grid-cols-2 gap-3 xl:grid-cols-4">
      {children}
    </div>
  )
}
