import { NavLink } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { Badge } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import { nombreLegible } from '@shared/lib/format'
import { NAV_GROUPS } from '../navigation'

function iniciales(nombre: string): string {
  return nombre
    .split(/[.\s]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}

export function Sidebar({ className }: { className?: string }) {
  const { usuario } = useAuth()

  return (
    <aside
      className={cn(
        'flex w-[252px] flex-none flex-col gap-5 border-r border-border-base bg-surface px-3.5 py-[18px]',
        className,
      )}
    >
      <div className="flex items-center gap-[11px] px-2 py-1">
        <div className="flex size-[34px] flex-none items-center justify-center rounded-[9px] bg-primary text-[13px] font-extrabold tracking-[-0.5px] text-on-primary">
          RvR
        </div>
        <div>
          <div className="text-[13.5px] font-bold tracking-[-0.2px] text-fg">
            Portal RvR
          </div>
          <div className="text-[10.5px] font-medium text-fg-subtle">Tecnologías</div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-[18px]" aria-label="Navegación principal">
        {NAV_GROUPS.map((grupo) => (
          <div key={grupo.titulo} className="flex flex-col gap-[3px]">
            <div className="px-3 pb-1.5 text-[10px] font-bold tracking-[0.11em] text-fg-faint uppercase">
              {grupo.titulo}
            </div>

            {grupo.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-[11px] rounded-[9px] px-3 py-[9px] text-[13.5px] transition-colors',
                    isActive
                      ? 'bg-primary-soft font-semibold text-primary-on-soft'
                      : 'font-medium text-fg-muted hover:bg-surface-muted hover:text-fg',
                  )
                }
              >
                <item.icon className="flex-none" />
                {item.label}
                {item.badge && (
                  <Badge
                    className={cn(
                      'ml-auto',
                      item.badge.tono === 'primary'
                        ? 'bg-primary-soft text-primary-on-soft'
                        : 'bg-warning-soft text-warning-fg',
                    )}
                  >
                    {item.badge.valor}
                  </Badge>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-border-base px-2 pt-3.5">
        <div className="flex size-8 flex-none items-center justify-center rounded-[9px] bg-primary-soft text-[12px] font-bold text-primary-on-soft">
          {iniciales(usuario?.nombreUsuario ?? 'RvR')}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold text-fg">
            {nombreLegible(usuario?.nombreUsuario)}
          </div>
          <div className="text-[10.5px] font-medium text-fg-subtle">
            {usuario?.rol.nombre ?? '—'}
          </div>
        </div>
        <span className="text-[14px] text-fg-faint">⋯</span>
      </div>
    </aside>
  )
}
