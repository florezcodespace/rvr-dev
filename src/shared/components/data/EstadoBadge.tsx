import type { EstadoMeta } from '@shared/domain/tipos'
import { cn } from '@shared/lib/cn'

/** Estado como glifo + texto: nunca se distingue solo por color. */
export function EstadoBadge({
  meta,
  className,
}: {
  meta: EstadoMeta
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center gap-1.5 rounded-[7px] px-[9px] py-1 text-[11px] font-bold tracking-[0.03em] whitespace-nowrap uppercase',
        meta.badge,
        className,
      )}
    >
      <span aria-hidden="true">{meta.glifo}</span>
      {meta.label}
    </span>
  )
}
