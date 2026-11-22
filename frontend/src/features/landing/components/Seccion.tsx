import type { CSSProperties, ReactNode } from 'react'
import { useRevelar } from '@shared/hooks/useRevelar'
import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'

/** Bloque que aparece (sube y se aclara) la primera vez que entra en pantalla. */
export function Revelable({
  children,
  retraso = 0,
  className,
  rol,
  estilo,
}: {
  children: ReactNode
  retraso?: number
  className?: string
  rol?: 'listitem'
  estilo?: CSSProperties
}) {
  const { ref, visible } = useRevelar<HTMLDivElement>()

  return (
    <div
      ref={ref}
      role={rol}
      className={cn('revelar', visible && 'visible', className)}
      style={{ ...estilo, ...varsCss({ '--retraso': `${retraso}ms` }) }}
    >
      {children}
    </div>
  )
}

/** Encabezado de sección: píldora de vidrio, título y bajada. */
export function TituloSeccion({
  antetitulo,
  titulo,
  destacado,
  descripcion,
  centrado = false,
}: {
  antetitulo: string
  titulo: string
  /** Parte final del título en azul. */
  destacado?: string
  descripcion: string
  centrado?: boolean
}) {
  return (
    <Revelable className={cn('max-w-[680px]', centrado && 'mx-auto text-center')}>
      <span className="vidrio inline-flex items-center gap-2 rounded-full border border-[var(--rvr-glass-borde)] px-3.5 py-1.5 text-[12.5px] font-semibold text-primary-on-soft">
        <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
        {antetitulo}
      </span>
      <h2 className="mt-4 mb-0 text-[30px] leading-[1.12] font-extrabold tracking-[-1.1px] text-fg text-balance sm:text-[40px]">
        {titulo}
        {destacado && <span className="text-primary"> {destacado}</span>}
      </h2>
      <p
        className={cn(
          'mt-4 mb-0 max-w-[600px] text-[16px] leading-[1.65] text-fg-muted text-pretty',
          centrado && 'mx-auto',
        )}
      >
        {descripcion}
      </p>
    </Revelable>
  )
}

/** Cuadro de icono tipo app de iOS: azul lleno, icono blanco. */
export function IconoApp({ children, className, tono = 'azul' }: { children: ReactNode; className?: string; tono?: 'azul' | 'tinta' | 'cielo' }) {
  const fondos = {
    azul: 'bg-primary text-white shadow-[0_10px_22px_-10px_var(--rvr-halo-primary)]',
    tinta: 'bg-ink text-white shadow-[0_10px_22px_-10px_rgb(28_40_60/0.6)]',
    cielo: 'bg-primary-soft text-primary-on-soft',
  }
  return (
    <span className={cn('flex size-12 flex-none items-center justify-center rounded-[15px]', fondos[tono], className)}>
      {children}
    </span>
  )
}
