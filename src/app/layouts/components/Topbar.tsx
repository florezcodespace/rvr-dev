import { useEffect, useRef } from 'react'
import { useAuth } from '@features/auth'
import { IconBuscar, IconCampana, IconSalir } from '@shared/components/icons'
import { ThemeToggle } from '@shared/components/theme/ThemeToggle'
import { nombreLegible } from '@shared/lib/format'

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
  const buscador = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K enfoca el buscador global.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        buscador.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <header className="flex h-16 flex-none items-center gap-[18px] border-b border-border-base bg-surface px-7">
      <div className="flex h-[38px] max-w-[400px] flex-1 items-center gap-[9px] rounded-[9px] border border-border-base bg-bg px-3 focus-within:ring-focus">
        <IconBuscar width="14" height="14" className="flex-none text-fg-faint" />
        <input
          ref={buscador}
          type="search"
          placeholder="Buscar orden, cliente o técnico…"
          aria-label="Buscar en el portal"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-fg outline-none placeholder:text-fg-faint"
        />
        <kbd className="ml-auto rounded-[5px] border border-border-base bg-surface px-[5px] py-0.5 font-mono text-[10.5px] font-medium text-fg-faint">
          ⌘K
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-3.5">
        <ThemeToggle />

        <button
          type="button"
          aria-label="Notificaciones (hay novedades sin leer)"
          className="relative flex size-[34px] cursor-pointer items-center justify-center rounded-[9px] border border-border-base text-fg-muted transition-colors hover:bg-surface-muted"
        >
          <IconCampana />
          <span className="absolute top-1.5 right-1.5 size-[7px] rounded-full border-[1.5px] border-surface bg-danger" />
        </button>

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
