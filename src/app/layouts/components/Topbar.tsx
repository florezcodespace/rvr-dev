import { Link } from 'react-router-dom'
import { InsigniaDemo } from '@app/demo/InsigniaDemo'
import { ROUTES } from '@app/routes/paths'
import { useAuth } from '@features/auth'
import { PanelNotificaciones } from '@features/notificaciones'
import { IconBuscar, IconSalir } from '@shared/components/icons'
import { Avatar } from '@shared/components/ui'
import { nombreLegible } from '@shared/lib/format'

export function Topbar({ onBuscar }: { onBuscar: () => void }) {
  const { usuario, logout } = useAuth()

  return (
    <header className="no-imprimir superficie-superior flex h-16 flex-none items-center gap-3 border-b border-border-base px-4 sm:gap-4 sm:px-7">
      {/* El buscador abre la paleta global (⌘K); no es un campo, es un disparador. */}
      <button
        type="button"
        onClick={onBuscar}
        aria-label="Buscar en el portal"
        aria-keyshortcuts="Meta+K Control+K"
        className="group flex h-[38px] max-w-[420px] min-w-0 flex-1 cursor-pointer items-center gap-[9px] rounded-[9px] border border-border-base bg-bg px-3 text-left transition-[border-color,background-color,box-shadow] duration-150 hover:border-border-strong hover:bg-surface focus-visible:ring-focus"
      >
        <IconBuscar
          width="14"
          height="14"
          className="flex-none text-fg-faint transition-colors group-hover:text-fg-muted"
        />
        <span className="min-w-0 flex-1 truncate text-[12.5px] text-fg-faint">
          Buscar orden, cotización, cliente o módulo…
        </span>
        <kbd className="hidden flex-none rounded-[6px] border border-border-base bg-surface px-1.5 py-px font-mono text-[10px] font-medium text-fg-subtle sm:block">
          ⌘K
        </kbd>
      </button>

      <div className="ml-auto flex items-center gap-2.5 sm:gap-3.5">
        <InsigniaDemo className="hidden sm:inline-flex" />
        <PanelNotificaciones />

        <div className="hidden h-[26px] w-px bg-border-base sm:block" />

        <Link
          to={ROUTES.perfil}
          title="Mi perfil"
          className="flex items-center gap-[9px] rounded-[10px] px-1 py-0.5 transition-colors hover:bg-surface-muted"
        >
          <Avatar nombre={usuario?.nombre ?? 'RvR'} />
          <div className="hidden lg:block">
            <div className="text-[12.5px] leading-tight font-semibold text-fg">
              {usuario?.nombre ?? nombreLegible(usuario?.nombreUsuario)}
            </div>
            <div className="text-[10.5px] text-fg-subtle">
              Rol: {usuario?.rol.nombre ?? '—'}
            </div>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => void logout()}
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
          className="flex size-[34px] flex-none cursor-pointer items-center justify-center rounded-[9px] border border-border-base text-fg-muted transition-[background-color,color,transform] duration-150 hover:-translate-y-px hover:bg-surface-muted hover:text-danger-fg"
        >
          <IconSalir />
        </button>
      </div>
    </header>
  )
}
