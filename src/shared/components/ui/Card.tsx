import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** Sube 2 px al pasar el cursor: solo para tarjetas que llevan a algún sitio. */
  viva?: boolean
}

/** Contenedor base de los paneles del portal. */
export function Card({ className, children, viva = false, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'tarjeta flex flex-col rounded-[13px] border border-border-base bg-surface',
        viva && 'tarjeta-viva',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  titulo,
  subtitulo,
  accion,
  className,
}: {
  titulo: string
  subtitulo?: string
  accion?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex items-baseline justify-between gap-4', className)}>
      <div>
        <h2 className="m-0 text-[14px] font-bold tracking-[-0.2px] text-fg">{titulo}</h2>
        {subtitulo && (
          <p className="m-0 mt-0.5 text-[11.5px] text-fg-subtle">{subtitulo}</p>
        )}
      </div>
      {accion}
    </div>
  )
}
