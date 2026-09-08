import { cn } from '@shared/lib/cn'

interface LogoProps {
  /** 'onBrand' se usa sobre el panel morado del login; 'default' sobre superficies claras/oscuras. */
  variant?: 'default' | 'onBrand'
  withText?: boolean
  className?: string
}

export function Logo({ variant = 'default', withText = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-[13px]', className)}>
      <div
        className={cn(
          'flex size-[42px] flex-none items-center justify-center rounded-[11px] text-[15px] font-extrabold tracking-[-0.6px]',
          variant === 'onBrand'
            ? 'bg-white text-[#3730a3] dark:bg-primary dark:text-white'
            : 'bg-primary text-on-primary',
        )}
      >
        RvR
      </div>

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
