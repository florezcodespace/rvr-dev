import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@shared/lib/cn'

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  function Checkbox({ label, className, id, style, ...props }, ref) {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className={cn('flex items-center gap-[9px]', className)} style={style}>
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            'peer size-[17px] flex-none cursor-pointer appearance-none rounded-[5px]',
            'border border-border-strong bg-surface transition-colors',
            'checked:border-primary checked:bg-primary checked:bg-[image:var(--rvr-grad-primary)] checked:shadow-[var(--rvr-brillo)]',
            'checked:bg-[url("data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2016%2016%27%20fill%3D%27none%27%20stroke%3D%27white%27%20stroke-width%3D%272.4%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M3.5%208.5l3%203%206-6%27%2F%3E%3C%2Fsvg%3E")] checked:bg-[length:13px] checked:bg-center checked:bg-no-repeat',
          )}
          {...props}
        />
        <label
          htmlFor={inputId}
          className="cursor-pointer text-[12.5px] font-medium text-fg-muted select-none"
        >
          {label}
        </label>
      </div>
    )
  },
)
