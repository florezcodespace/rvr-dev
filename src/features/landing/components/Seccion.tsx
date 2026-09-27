import type { ReactNode } from 'react'
import { useRevelar } from '@shared/hooks/useRevelar'
import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'

/**
 * Bloque que aparece la primera vez que entra en pantalla.
 *
 * Siempre renderiza un `div`: hacerlo polimórfico obligaba a tipar la `ref`
 * como la intersección de todos los elementos posibles y no aportaba nada,
 * porque las listas de la landing usan `role="list"` sobre contenedores.
 */
export function Revelable({
  children,
  retraso = 0,
  className,
  rol,
}: {
  children: ReactNode
  retraso?: number
  className?: string
  rol?: 'listitem'
}) {
  const { ref, visible } = useRevelar<HTMLDivElement>()

  return (
    <div
      ref={ref}
      role={rol}
      className={cn('revelar', visible && 'visible', className)}
      style={varsCss({ '--retraso': `${retraso}ms` })}
    >
      {children}
    </div>
  )
}

/** Encabezado común de las secciones: antetítulo, título y bajada. */
export function TituloSeccion({
  antetitulo,
  titulo,
  descripcion,
  centrado = true,
}: {
  antetitulo: string
  titulo: string
  descripcion: string
  centrado?: boolean
}) {
  return (
    <Revelable className={cn('max-w-[640px]', centrado && 'mx-auto text-center')}>
      <span className="text-[12px] font-bold tracking-[0.14em] text-primary-on-soft uppercase">
        {antetitulo}
      </span>
      <h2 className="mt-2 mb-0 font-[family-name:var(--font-display)] text-[30px] leading-[1.15] font-bold tracking-[-0.9px] text-fg text-balance sm:text-[38px]">
        {titulo}
      </h2>
      <p
        className={cn(
          'mt-3.5 mb-0 max-w-[560px] text-[14.5px] leading-[1.6] text-fg-muted text-pretty',
          centrado && 'mx-auto',
        )}
      >
        {descripcion}
      </p>
    </Revelable>
  )
}
