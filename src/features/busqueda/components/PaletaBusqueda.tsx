import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconBuscar } from '@shared/components/icons'
import { Spinner } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import { STORAGE_KEYS, storage } from '@shared/lib/storage'
import { useBusqueda } from '../hooks/useBusqueda'
import { COLOR_TIPO, type ResultadoBusqueda } from '../tipos'

const MAX_RECIENTES = 5

const leerRecientes = () => storage.get<string[]>(STORAGE_KEYS.busquedasRecientes, [])

function guardarReciente(termino: string) {
  const limpio = termino.trim()
  if (limpio.length < 2) return
  const previas = leerRecientes().filter((t) => t !== limpio)
  storage.set(STORAGE_KEYS.busquedasRecientes, [limpio, ...previas].slice(0, MAX_RECIENTES))
}

/**
 * Búsqueda global. Un solo campo sobre todos los módulos, con el teclado como
 * vía principal: ⌘K abre, las flechas recorren, Enter abre y Esc cierra.
 */
export function PaletaBusqueda({ abierta, onCerrar }: { abierta: boolean; onCerrar: () => void }) {
  const [termino, setTermino] = useState('')
  const [indice, setIndice] = useState(0)
  const [recientes, setRecientes] = useState<string[]>(leerRecientes)
  const campo = useRef<HTMLInputElement>(null)
  const lista = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const { grupos, cargando } = useBusqueda(termino)

  /** Los grupos se aplanan para que las flechas recorran todo de corrido, y
   *  cada resultado lleva su posición para no llevar la cuenta en el render. */
  const planos = useMemo(() => grupos.flatMap((g) => g.items), [grupos])
  const numerados = useMemo(
    () =>
      grupos.reduce<{
        lista: { tipo: string; label: string; items: { item: ResultadoBusqueda; posicion: number }[] }[]
        desde: number
      }>(
        (acumulador, grupo) => {
          acumulador.lista.push({
            tipo: grupo.tipo,
            label: grupo.label,
            items: grupo.items.map((item, i) => ({ item, posicion: acumulador.desde + i })),
          })
          acumulador.desde += grupo.items.length
          return acumulador
        },
        { lista: [], desde: 0 },
      ).lista,
    [grupos],
  )

  // Sincronización en el render: al abrir se limpia todo y al cambiar el
  // término el foco vuelve al primer resultado. En un efecto serían renders de
  // más mostrando el estado anterior.
  const [abiertaPrevia, setAbiertaPrevia] = useState(abierta)
  if (abierta !== abiertaPrevia) {
    setAbiertaPrevia(abierta)
    if (abierta) {
      setTermino('')
      setIndice(0)
      setRecientes(leerRecientes())
    }
  }

  const [terminoPrevio, setTerminoPrevio] = useState(termino)
  if (termino !== terminoPrevio) {
    setTerminoPrevio(termino)
    setIndice(0)
  }

  useEffect(() => {
    if (!abierta) return
    const id = requestAnimationFrame(() => campo.current?.focus())
    return () => cancelAnimationFrame(id)
  }, [abierta])

  // El elemento activo se mantiene a la vista al moverse con el teclado.
  useEffect(() => {
    lista.current?.querySelector('[data-activo="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [indice, planos])

  // Con la paleta abierta, la página de atrás no se desplaza.
  useEffect(() => {
    if (!abierta) return
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previo
    }
  }, [abierta])

  if (!abierta) return null

  const abrirResultado = (resultado: ResultadoBusqueda) => {
    guardarReciente(termino)
    onCerrar()
    navigate(resultado.ruta)
  }

  const alPulsar = (evento: React.KeyboardEvent) => {
    if (evento.key === 'Escape') {
      evento.preventDefault()
      onCerrar()
      return
    }
    if (evento.key === 'ArrowDown' || evento.key === 'ArrowUp') {
      evento.preventDefault()
      if (planos.length === 0) return
      const paso = evento.key === 'ArrowDown' ? 1 : -1
      setIndice((previo) => (previo + paso + planos.length) % planos.length)
      return
    }
    if (evento.key === 'Enter') {
      evento.preventDefault()
      const elegido = planos[indice]
      if (elegido) abrirResultado(elegido)
    }
  }

  const sinResultados = termino.trim().length >= 2 && !cargando && planos.length === 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[12vh]"
      role="presentation"
      onClick={onCerrar}
    >
      <div className="anim-velo absolute inset-0 bg-[rgb(15_23_42/0.45)] backdrop-blur-[2px] dark:bg-[rgb(0_0_0/0.65)]" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={alPulsar}
        className="anim-entrada relative flex max-h-[68vh] w-full max-w-[620px] flex-col overflow-hidden rounded-[16px] border border-border-base bg-surface shadow-[var(--rvr-shadow-lg)]"
      >
        <div className="flex flex-none items-center gap-3 border-b border-border-base px-4">
          <IconBuscar width="17" height="17" className="flex-none text-fg-faint" />
          <input
            ref={campo}
            type="text"
            value={termino}
            onChange={(e) => setTermino(e.target.value)}
            placeholder="Buscar órdenes, cotizaciones, clientes, técnicos, módulos…"
            aria-label="Buscar en el portal"
            className="h-[54px] min-w-0 flex-1 bg-transparent text-[14.5px] text-fg outline-none placeholder:text-fg-faint"
          />
          {cargando && <Spinner className="size-4 flex-none text-fg-faint" />}
          <kbd className="flex-none rounded-[6px] border border-border-base bg-surface-muted px-1.5 py-0.5 font-mono text-[10px] text-fg-subtle">
            ESC
          </kbd>
        </div>

        <div ref={lista} className="min-h-0 flex-1 overflow-y-auto p-2">
          {termino.trim().length < 2 && (
            <div className="flex flex-col gap-1 p-1">
              {recientes.length > 0 && (
                <>
                  <p className="px-2 pt-1 pb-1.5 text-[10px] font-bold tracking-[0.11em] text-fg-faint uppercase">
                    Búsquedas recientes
                  </p>
                  {recientes.map((reciente) => (
                    <button
                      key={reciente}
                      type="button"
                      onClick={() => setTermino(reciente)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-[9px] px-2.5 py-2 text-left text-[13px] text-fg-muted hover:bg-surface-muted hover:text-fg"
                    >
                      <IconBuscar width="13" height="13" className="flex-none text-fg-faint" />
                      {reciente}
                    </button>
                  ))}
                </>
              )}
              <p className="px-2.5 py-3 text-[12.5px] text-fg-subtle">
                Escribe al menos dos letras. Busca por código de orden, número de
                cotización, cliente, técnico, servicio, usuario o nombre del módulo.
              </p>
            </div>
          )}

          {sinResultados && (
            <div className="flex flex-col items-center gap-1.5 px-4 py-12 text-center">
              <p className="m-0 text-[14px] font-semibold text-fg">
                Nada coincide con «{termino.trim()}»
              </p>
              <p className="m-0 text-[12.5px] text-fg-muted">
                Prueba con el código de la orden, el número de la cotización o el nombre del cliente.
              </p>
            </div>
          )}

          {numerados.map((grupo) => (
            <div key={grupo.tipo} className="mb-1">
              <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold tracking-[0.11em] text-fg-faint uppercase">
                {grupo.label}
              </p>

              {grupo.items.map(({ item, posicion }) => {
                const activo = posicion === indice

                return (
                  <button
                    key={item.clave}
                    type="button"
                    data-activo={activo}
                    onPointerEnter={() => setIndice(posicion)}
                    onClick={() => abrirResultado(item)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors',
                      activo ? 'bg-primary-soft' : 'hover:bg-surface-muted',
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className="size-2 flex-none rounded-full"
                      style={{ background: COLOR_TIPO[item.tipo] ?? 'var(--rvr-fg-subtle)' }}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          'block truncate text-[13px] font-semibold',
                          activo ? 'text-primary-on-soft' : 'text-fg',
                        )}
                      >
                        {item.titulo}
                      </span>
                      <span className="block truncate text-[11.5px] text-fg-subtle">
                        {item.subtitulo}
                      </span>
                    </span>
                    {item.meta && (
                      <span className="flex-none text-[11px] font-medium whitespace-nowrap text-fg-subtle">
                        {item.meta}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex flex-none items-center gap-4 border-t border-border-base bg-surface-muted px-4 py-2 text-[11px] text-fg-subtle">
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-[5px] border border-border-base bg-surface px-1 font-mono">↑↓</kbd>
            moverse
          </span>
          <span className="flex items-center gap-1.5">
            <kbd className="rounded-[5px] border border-border-base bg-surface px-1 font-mono">↵</kbd>
            abrir
          </span>
          <span className="ml-auto flex items-center gap-1.5">
            <kbd className="rounded-[5px] border border-border-base bg-surface px-1 font-mono">⌘K</kbd>
            en cualquier momento
          </span>
        </div>
      </div>
    </div>
  )
}
