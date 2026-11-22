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
        'inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-[3px] text-[12px] leading-[1.3] font-semibold whitespace-nowrap',
        meta.badge,
        className,
      )}
    >
      <span aria-hidden="true">{meta.glifo}</span>
      {meta.label}
    </span>
  )
}
