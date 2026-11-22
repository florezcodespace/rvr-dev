import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

export function Badge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold',
        className,
      )}
    >
      {children}
    </span>
  )
}
