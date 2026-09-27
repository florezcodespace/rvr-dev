import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { cn } from '@shared/lib/cn'

interface LogoProps {
  /** 'onBrand' se usa sobre el panel morado del login; 'default' sobre superficies claras/oscuras. */
  variant?: 'default' | 'onBrand'
  withText?: boolean
  tamano?: number
  className?: string
}

/**
 * Marca del portal: el icono real de la empresa más el nombre.
 *
 * Antes era un cuadro con las letras "RvR" dibujadas en CSS. Se cambió por el
 * PNG oficial —que ya existe en dos versiones, clara y oscura— porque el cuadro
 * no era la marca y, sobre el panel del login en modo oscuro, quedaba blanco
 * sobre blanco: `dark:marca-degradada` nunca se generó, porque Tailwind no
 * aplica variantes a una clase de `@layer components`.
 */
export function Logo({
  variant = 'default',
  withText = true,
  tamano = 42,
  className,
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-[13px]', className)}>
      <IconoMarca tamano={tamano} radio="26%" />

      {withText && (
        <div className="min-w-0">
          <div
            className={cn(
              'text-[15px] font-bold tracking-[-0.2px]',
              variant === 'onBrand' ? 'text-brand-fg' : 'text-fg',
            )}
          >
            Portal RvR Tecnologías
          </div>
          <div
            className={cn(
              'text-[11.5px] font-medium',
              variant === 'onBrand' ? 'text-brand-fg-muted' : 'text-fg-subtle',
            )}
          >
            Soluciones tecnológicas integrales
          </div>
        </div>
      )}
    </div>
  )
}
