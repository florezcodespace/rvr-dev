import { gradienteAvatar, iniciales } from '@shared/lib/avatar'
import { cn } from '@shared/lib/cn'

type Tamano = 'sm' | 'md' | 'lg'

const TAMANOS: Record<Tamano, string> = {
  sm: 'size-[22px] rounded-[6px] text-[9.5px]',
  md: 'size-8 rounded-[9px] text-[12px]',
  lg: 'size-10 rounded-[11px] text-[13px]',
}

export function Avatar({
  nombre,
  tamano = 'md',
  className,
}: {
  nombre: string
  tamano?: Tamano
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      style={{ backgroundImage: gradienteAvatar(nombre) }}
      className={cn(
        'flex flex-none items-center justify-center font-bold text-white shadow-[var(--rvr-brillo)]',
        TAMANOS[tamano],
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  )
}
