import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@shared/lib/cn'
import { Spinner } from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
  leadingIcon?: ReactNode
  /** Vidrio líquido (acciones importantes). Solo para la variante primaria. */
  liquido?: boolean
}

const VARIANTS: Record<Variant, string> = {
  primary: 'pintura-primaria text-on-primary',
  secondary:
    'pintura-secundaria border border-border-base text-fg',
  ghost: 'text-fg-muted enabled:hover:bg-surface-muted enabled:hover:text-fg',
  danger: 'pintura-peligro text-white',
}

const SIZES: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-[10px]',
  md: 'h-10 px-4 text-[13.5px] rounded-[12px]',
  lg: 'h-12 px-6 text-[14.5px] rounded-[14px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leadingIcon,
  liquido = false,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'pintura-boton inline-flex cursor-pointer items-center justify-center gap-[7px] font-semibold',
        'disabled:cursor-not-allowed disabled:opacity-60',
        liquido && variant === 'primary' ? 'boton-liquido' : VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? <Spinner /> : leadingIcon}
      {children}
    </button>
  )
}
