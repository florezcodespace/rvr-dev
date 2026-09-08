import type { ReactNode } from 'react'
import { Card } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'

export function SeccionFormulario({
  numero,
  titulo,
  children,
  className,
}: {
  numero: number
  titulo: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('gap-[15px] px-5 py-[18px]', className)}>
      <div className="flex items-center gap-[9px]">
        <span className="flex size-5 items-center justify-center rounded-[6px] bg-primary-soft text-[10.5px] font-bold text-primary-on-soft">
          {numero}
        </span>
        <h2 className="m-0 text-[14px] font-bold tracking-[-0.2px] text-fg">{titulo}</h2>
      </div>
      {children}
    </Card>
  )
}
