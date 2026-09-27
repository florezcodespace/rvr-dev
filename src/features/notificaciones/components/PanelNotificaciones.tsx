import { useCallback, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconCampana } from '@shared/components/icons'
import { Skeleton } from '@shared/components/ui'
import { useClickAfuera } from '@shared/hooks/useClickAfuera'
import { cn } from '@shared/lib/cn'
import { tiempoRelativo } from '@shared/lib/format'
import { useNotificaciones } from '../hooks/useNotificaciones'
import type { Notificacion } from '../hooks/useNotificaciones'

const BOTON =
  'relative flex size-[34px] flex-none cursor-pointer items-center justify-center rounded-[9px] border border-border-base transition-[background-color,color,border-color,transform] duration-150'

export function PanelNotificaciones() {
  const [abierto, setAbierto] = useState(false)
  const contenedor = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { items, cargando, sinLeer, marcarLeida, marcarTodas } = useNotificaciones()

  const cerrar = useCallback(() => setAbierto(false), [])
  useClickAfuera(contenedor, cerrar, abierto)

  const abrir = (notificacion: Notificacion) => {
    void marcarLeida(notificacion.id)
    setAbierto(false)
    if (notificacion.enlace && !notificacion.enlace.startsWith('/movil')) navigate(notificacion.enlace)
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((previo) => !previo)}
        aria-expanded={abierto}
        aria-haspopup="dialog"
        aria-label={
          sinLeer > 0 ? `Notificaciones, ${sinLeer} sin leer` : 'Notificaciones, ninguna sin leer'
        }
        className={cn(
          BOTON,
          abierto
            ? 'border-[var(--rvr-ring-border)] bg-primary-soft text-primary-on-soft'
            : 'text-fg-muted hover:-translate-y-px hover:bg-surface-muted hover:text-fg',
        )}
      >
        <IconCampana />
        {sinLeer > 0 && (
          <span className="absolute -top-1 -right-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full border-2 border-surface bg-danger px-1 text-[9px] font-bold text-white">
            {sinLeer > 99 ? '99+' : sinLeer}
          </span>
        )}
      </button>

      {abierto && (
        <div
          role="dialog"
          aria-label="Notificaciones"
          className="anim-entrada absolute top-[calc(100%+10px)] right-0 z-40 flex max-h-[420px] w-[min(94vw,368px)] flex-col overflow-hidden rounded-[14px] border border-border-base bg-surface shadow-[var(--rvr-shadow-lg)]"
        >
          <div className="flex flex-none items-center justify-between gap-3 border-b border-border-base px-4 py-3">
            <div>
              <div className="text-[13.5px] font-bold tracking-[-0.2px] text-fg">
                Notificaciones
              </div>
              <div className="text-[11.5px] text-fg-subtle">
                {sinLeer > 0 ? `${sinLeer} sin leer` : 'Todo al día'}
              </div>
            </div>
            {sinLeer > 0 && (
              <button
                type="button"
                onClick={() => void marcarTodas()}
                className="cursor-pointer rounded-[7px] px-2 py-1 text-[11.5px] font-semibold text-link transition-colors hover:bg-surface-muted"
              >
                Marcar todas
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {cargando && (
              <div className="flex flex-col gap-3 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="size-7 flex-none rounded-[9px]" />
                    <div className="flex flex-1 flex-col gap-2">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-2.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!cargando && items.length === 0 && (
              <p className="m-0 px-4 py-10 text-center text-[12.5px] text-fg-muted">
                No hay notificaciones por ahora.
              </p>
            )}

            <ul className="m-0 flex list-none flex-col p-0">
              {items.map((notificacion) => {
                return (
                  <li key={notificacion.id}>
                    <button
                      type="button"
                      onClick={() => abrir(notificacion)}
                      className={cn(
                        'flex w-full cursor-pointer gap-3 border-b border-border-base px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-surface-muted',
                        !notificacion.leida && 'bg-primary-soft/40',
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-7 flex-none items-center justify-center rounded-[9px] text-[11px] font-bold',
                          'bg-primary-soft text-primary-on-soft',
                        )}
                      >
                        {notificacion.titulo[0]}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <span
                            className={cn(
                              'flex-1 text-[12.5px] leading-snug',
                              notificacion.leida
                                ? 'font-medium text-fg-muted'
                                : 'font-semibold text-fg',
                            )}
                          >
                            {notificacion.titulo}
                          </span>
                          {!notificacion.leida && (
                            <span
                              aria-hidden="true"
                              className="mt-1 size-[7px] flex-none rounded-full bg-primary"
                            />
                          )}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] text-fg-subtle">
                          {notificacion.mensaje}
                        </span>
                        <span className="mt-1 block text-[10.5px] text-fg-faint">
                          {tiempoRelativo(notificacion.fecha)}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
