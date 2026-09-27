import { cn } from '@shared/lib/cn'

/**
 * Bloque de carga con la forma del contenido que va a llegar. Un spinner
 * centrado no dice nada; esto mantiene la página quieta y anticipa el layout.
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('anim-pulso rounded-[8px] bg-surface-muted', className)}
    />
  )
}

/** Rejilla de tarjetas KPI mientras carga el resumen. */
export function SkeletonKpis({ cantidad = 4 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: cantidad }, (_, i) => (
        <div
          key={i}
          className="tarjeta flex flex-col gap-3 rounded-[13px] border border-border-base bg-surface px-[17px] py-[15px]"
        >
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="size-[26px] rounded-[9px]" />
          </div>
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
      ))}
    </div>
  )
}

/** Filas de una tabla mientras llega la página. */
export function SkeletonFilas({ filas = 6 }: { filas?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border-base px-4 py-[15px]">
          <Skeleton className="h-3 w-16 flex-none" />
          <Skeleton className="h-3 flex-1" />
          <Skeleton className="h-3 w-24 flex-none" />
          <Skeleton className="h-5 w-24 flex-none rounded-[7px]" />
        </div>
      ))}
    </div>
  )
}
