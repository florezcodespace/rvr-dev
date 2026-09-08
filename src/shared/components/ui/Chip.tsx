import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

/** Etiqueta informativa pequeña (especialidades, categorías). */
export function Chip({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[6px] border border-border-base bg-surface-muted px-2 py-[3px] text-[11px] font-medium text-fg-muted',
        className,
      )}
    >
      {children}
    </span>
  )
}
