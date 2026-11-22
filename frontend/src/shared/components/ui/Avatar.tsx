import { gradienteAvatar, iniciales } from '@shared/lib/avatar'
import { cn } from '@shared/lib/cn'

type Tamano = 'sm' | 'md' | 'lg'

const TAMANOS: Record<Tamano, string> = {
  sm: 'size-[22px] rounded-[10px] text-[12px]',
  md: 'size-8 rounded-[10px] text-[12px]',
  lg: 'size-10 rounded-[14px] text-[13px]',
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
        'flex flex-none items-center justify-center font-semibold text-white shadow-[var(--rvr-brillo)]',
        TAMANOS[tamano],
        className,
      )}
    >
      {iniciales(nombre)}
    </span>
  )
}
