import { createContext, useCallback, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'

export interface Toast {
  id: number
  mensaje: string
  /** Acción de deshacer; si existe, el aviso muestra el botón. */
  deshacer?: () => void
  tono: 'neutro' | 'exito' | 'error'
}

export interface ToastContextValue {
  mostrar: (toast: Omit<Toast, 'id'>) => void
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextValue | null>(null)

const DURACION = 6000

export function ToastProvider({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Toast[]>([])
  const siguienteId = useRef(1)

  const quitar = useCallback((id: number) => {
    setAvisos((previos) => previos.filter((a) => a.id !== id))
  }, [])

  const mostrar = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = siguienteId.current++
      setAvisos((previos) => [...previos.slice(-2), { ...toast, id }])
      setTimeout(() => quitar(id), DURACION)
    },
    [quitar],
  )

  const value = useMemo<ToastContextValue>(() => ({ mostrar }), [mostrar])

  return (
    <ToastContext value={value}>
      {children}

      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2"
      >
        {avisos.map((aviso) => (
          <div
            key={aviso.id}
            className="pointer-events-auto flex items-center gap-3 rounded-[10px] border border-border-base bg-surface px-3.5 py-2.5 shadow-lg"
          >
            <span
              aria-hidden="true"
              className={
                aviso.tono === 'error'
                  ? 'size-2 rounded-full bg-danger'
                  : aviso.tono === 'exito'
                    ? 'size-2 rounded-full bg-success'
                    : 'size-2 rounded-full bg-primary'
              }
            />
            <span className="text-[12.5px] text-fg">{aviso.mensaje}</span>
            {aviso.deshacer && (
              <button
                type="button"
                onClick={() => {
                  aviso.deshacer?.()
                  quitar(aviso.id)
                }}
                className="cursor-pointer text-[12px] font-semibold text-link hover:underline"
              >
                Deshacer
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext>
  )
}
