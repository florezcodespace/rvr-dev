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
}

const VARIANTS: Record<Variant, string> = {
  primary: 'pintura-primaria text-on-primary',
  secondary:
    'pintura-secundaria border border-border-strong bg-surface text-fg enabled:hover:bg-surface-muted',
  ghost: 'text-fg-muted enabled:hover:bg-surface-muted enabled:hover:text-fg',
  danger: 'pintura-peligro text-white',
}

const SIZES: Record<Size, string> = {
  sm: 'h-[34px] px-3 text-[12px] rounded-[8px]',
  md: 'h-[38px] px-4 text-[12.5px] rounded-[9px]',
  lg: 'h-[46px] px-5 text-[14px] rounded-[10px]',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leadingIcon,
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
        'pintura-boton inline-flex cursor-pointer items-center justify-center gap-[7px] font-semibold tracking-[-0.1px]',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTS[variant],
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
