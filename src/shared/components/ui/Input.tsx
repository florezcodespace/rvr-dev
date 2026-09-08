import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@shared/lib/cn'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  /** Slot a la derecha de la etiqueta (p. ej. "¿Olvidaste tu contraseña?"). */
  labelAction?: ReactNode
  error?: string
  hint?: ReactNode
  /** Elemento absoluto dentro del campo (botón mostrar/ocultar, icono...). */
  trailing?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, labelAction, error, hint, trailing, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const describedBy = error
    ? `${inputId}-error`
    : hint
      ? `${inputId}-hint`
      : undefined

  return (
    <div className="flex flex-col">
      {(label || labelAction) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && (
            <label
              htmlFor={inputId}
              className="text-[12.5px] font-semibold text-fg"
            >
              {label}
            </label>
          )}
          {labelAction}
        </div>
      )}

      <div className="relative flex items-center">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'h-11 w-full rounded-[10px] border bg-surface px-3.5 text-[13.5px] text-fg',
            'border-border-strong placeholder:text-fg-faint',
            'transition-[box-shadow,border-color] outline-none',
            'focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)]',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error &&
              'border-danger focus:border-danger focus:shadow-[0_0_0_3px_rgb(239_68_68/0.16)]',
            trailing && 'pr-[78px]',
            className,
          )}
          {...props}
        />
        {trailing && (
          <div className="absolute right-3 flex items-center">{trailing}</div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="mt-1.5 text-[11.5px] text-danger-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="mt-1.5 text-[11.5px] text-fg-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  )
})
