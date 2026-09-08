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
        'inline-flex items-center rounded-full px-[7px] py-0.5 text-[10.5px] font-bold',
        className,
      )}
    >
      {children}
    </span>
  )
}
