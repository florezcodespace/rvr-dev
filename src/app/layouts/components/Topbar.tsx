import { useAuth } from '@features/auth'
import { IconBuscar, IconCampana, IconSalir } from '@shared/components/icons'
import { ThemeToggle } from '@shared/components/theme/ThemeToggle'
import { nombreLegible } from '@shared/lib/format'

/** Texto único para los controles que esperan al backend. */
const PENDIENTE = 'Disponible cuando se conecte el backend'

function iniciales(nombre: string): string {
  return nombre
    .split(/[.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

export function Topbar() {
  const { usuario, logout } = useAuth()

  return (
    <header className="flex h-16 flex-none items-center gap-[18px] border-b border-border-base bg-surface px-7">
      {/*
        El buscador global y la campana todavía no tienen a qué consultar: no
        hay endpoint de búsqueda ni de notificaciones. Mientras tanto van
        deshabilitados, con el motivo en el tooltip. Antes aceptaban texto y
        clics y no pasaba nada, que es la peor de las tres opciones.
      */}
      <div
        title={PENDIENTE}
        className="flex h-[38px] max-w-[400px] flex-1 items-center gap-[9px] rounded-[9px] border border-border-base bg-bg px-3 opacity-60"
      >
        <IconBuscar width="14" height="14" className="flex-none text-fg-faint" />
        <input
          type="search"
          disabled
          placeholder="Buscar orden, cliente o técnico…"
          aria-label={`Buscar en el portal. ${PENDIENTE}`}
          className="min-w-0 flex-1 cursor-not-allowed bg-transparent text-[12.5px] text-fg outline-none placeholder:text-fg-faint"
        />
      </div>

      <div className="ml-auto flex items-center gap-3.5">
        <ThemeToggle />

        <span title={PENDIENTE}>
          <button
            type="button"
            disabled
            aria-label={`Notificaciones. ${PENDIENTE}`}
            className="flex size-[34px] items-center justify-center rounded-[9px] border border-border-base text-fg-muted opacity-60"
          >
            <IconCampana />
          </button>
        </span>

        <div className="h-[26px] w-px bg-border-base" />

        <div className="flex items-center gap-[9px]">
          <div className="flex size-8 items-center justify-center rounded-[9px] bg-primary text-[12px] font-bold text-on-primary">
            {iniciales(usuario?.nombreUsuario ?? 'RvR')}
          </div>
          <div className="hidden sm:block">
            <div className="text-[12.5px] leading-tight font-semibold text-fg">
              {nombreLegible(usuario?.nombreUsuario)}
            </div>
            <div className="text-[10.5px] text-fg-subtle">
              Rol: {usuario?.rol.nombre ?? '—'}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-border-base text-fg-muted transition-colors hover:bg-surface-muted hover:text-danger-fg"
        >
          <IconSalir />
        </button>
      </div>
    </header>
  )
}
