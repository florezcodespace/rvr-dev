import { Card } from './Card'
import { cn } from '@shared/lib/cn'

export type TonoStat = 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'cyan'

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

/** Tarjeta de indicador; la usan todas las vistas con fila de KPIs. */
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
    <Card viva className="anim-entrada gap-[6px] px-[17px] py-[15px]">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] font-semibold text-fg-muted">{etiqueta}</span>
        <span
          aria-hidden="true"
          className={cn(
            'flex size-[26px] flex-none items-center justify-center rounded-[9px] text-[11px] font-bold',
            TONOS[tono],
          )}
        >
          {glifo}
        </span>
      </div>

      <div className="mt-0.5 text-[27px] leading-none font-bold tracking-[-1.2px] tabular-nums text-fg">
        {valor}
        {valorSecundario && (
          <span className="text-[14px] font-semibold text-fg-subtle">
            {valorSecundario}
          </span>
        )}
      </div>

      <div
        className={cn(
          'text-[11.5px]',
          detalleDestacado ? 'font-medium text-warning-fg' : 'text-fg-muted',
        )}
      >
        {detalle}
      </div>
    </Card>
  )
}

/** Rejilla estándar de KPIs (3 o 4 por fila según el ancho). */
export function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="escalonado grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {children}
    </div>
  )
}
