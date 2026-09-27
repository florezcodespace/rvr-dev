import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

/**
 * Cifra grande + nota al lado. Es el patrón que ordena todas las tarjetas del
 * portal: primero el número que importa, después el gráfico que lo explica.
 */
export function CifraDominante({
  valor,
  nota,
  tamano = 'lg',
  className,
}: {
  valor: ReactNode
  nota?: ReactNode
  tamano?: 'md' | 'lg'
  className?: string
}) {
  return (
    <div className={cn('flex flex-wrap items-end gap-x-2.5 gap-y-1', className)}>
      <span
        className={cn(
          'leading-none font-bold tabular-nums text-fg',
          tamano === 'lg'
            ? 'text-[30px] tracking-[-1.3px]'
            : 'text-[26px] tracking-[-1.1px]',
        )}
      >
        {valor}
      </span>
      {nota && <span className="pb-[3px] text-[12px] text-fg-muted">{nota}</span>}
    </div>
  )
}
