import { IconoMarca } from './IconoMarca'
import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'

/**
 * Pantalla de carga con la marca. Se usa en el arranque de la aplicación y
 * mientras se resuelve la sesión; dentro de las vistas, la carga se muestra con
 * esqueletos, que conservan el layout y no tapan lo que ya está pintado.
 */
export function PantallaCarga({
  mensaje = 'Preparando el portal…',
  completa = true,
}: {
  mensaje?: string
  /** `false` la encaja dentro del área de contenido en vez de ocupar la pantalla. */
  completa?: boolean
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-6 bg-bg',
        completa ? 'fixed inset-0 z-[60]' : 'h-full w-full',
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Halo que respira detrás del icono: da sensación de trabajo en curso
            sin recurrir a un spinner genérico. */}
        <span
          aria-hidden="true"
          className="anim-halo absolute size-[132px] rounded-[30%] bg-primary/25 blur-2xl"
        />
        <IconoMarca tamano={92} className="anim-entrada relative" />
      </div>

      <div className="flex flex-col items-center gap-3">
        <p className="m-0 text-[13.5px] font-medium text-fg-muted">{mensaje}</p>

        <div className="h-[3px] w-[148px] overflow-hidden rounded-full bg-surface-muted">
          <span className="anim-barrido block h-full w-1/3 rounded-full bg-[image:var(--rvr-grad-primary)]" />
        </div>
      </div>

      <p className="sr-only">Cargando</p>

      <div
        aria-hidden="true"
        className="anim-entrada absolute bottom-10 text-[11px] font-semibold tracking-[0.11em] text-fg-faint uppercase"
        style={varsCss({ '--retraso': '400ms' })}
      >
        Portal RvR Tecnologías
      </div>
    </div>
  )
}
