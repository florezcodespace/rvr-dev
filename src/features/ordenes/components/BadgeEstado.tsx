import { ESTADO_ORDEN_META, type EstadoOrden } from '@shared/domain/estadoOrden'
import { cn } from '@shared/lib/cn'

/** Estado de una orden: glifo + texto, nunca solo color. */
export function BadgeEstado({
  estado,
  className,
}: {
  estado: EstadoOrden
  className?: string
}) {
  const meta = ESTADO_ORDEN_META[estado]

  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-[7px] px-[9px] py-1 text-[11px] font-bold tracking-[0.03em] uppercase',
        meta.badge,
        className,
      )}
    >
      <span aria-hidden="true">{meta.glifo}</span>
      {meta.label}
    </span>
  )
}
