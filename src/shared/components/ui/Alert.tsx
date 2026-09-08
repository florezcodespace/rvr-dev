import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

type Tone = 'danger' | 'warning' | 'success' | 'info'

const TONES: Record<Tone, { wrap: string; badge: string; title: string; glyph: string }> = {
  danger: {
    wrap: 'bg-danger-soft border-danger-border',
    badge: 'bg-danger text-white',
    title: 'text-danger-fg',
    glyph: '!',
  },
  warning: {
    wrap: 'bg-warning-soft border-warning/40',
    badge: 'bg-warning text-white',
    title: 'text-warning-fg',
    glyph: '!',
  },
  success: {
    wrap: 'bg-success-soft border-success/40',
    badge: 'bg-success text-white',
    title: 'text-success-fg',
    glyph: '✓',
  },
  info: {
    wrap: 'bg-info-soft border-info/40',
    badge: 'bg-info text-white',
    title: 'text-info-fg',
    glyph: 'i',
  },
}

export interface AlertProps {
  tone?: Tone
  title: string
  description?: ReactNode
  className?: string
}

export function Alert({ tone = 'danger', title, description, className }: AlertProps) {
  const styles = TONES[tone]

  return (
    <div
      role="alert"
      className={cn(
        'flex items-start gap-2.5 rounded-[10px] border px-3.5 py-[11px]',
        styles.wrap,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          'mt-px flex size-[17px] flex-none items-center justify-center rounded-full text-[11px] font-bold',
          styles.badge,
        )}
      >
        {styles.glyph}
      </span>
      <div className="min-w-0">
        <div className={cn('text-[12.5px] font-semibold', styles.title)}>{title}</div>
        {description && (
          <div className="mt-0.5 text-[11.5px] text-fg-muted">{description}</div>
        )}
      </div>
    </div>
  )
}
