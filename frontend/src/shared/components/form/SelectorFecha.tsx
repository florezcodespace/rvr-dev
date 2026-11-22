import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@shared/lib/cn'
import { aISO, deISO, hoyISO } from '@shared/lib/fechas'

/* =========================================================================
   Calendario del portal: reemplaza al <input type="date"> del navegador.
   Encabezado «‹ octubre | 2026 ›», días con hoy en aro y el elegido lleno,
   teclado completo y el panel flotando en el body (no lo recortan los modales).
   ========================================================================= */

const DIAS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const textoFecha = (iso: string) => {
  const d = deISO(iso)
  return `${d.getDate()} ${MESES[d.getMonth()]!.slice(0, 3)} ${d.getFullYear()}`
}

/** Las 42 casillas (6 semanas) del mes, empezando en domingo. */
function casillas(anio: number, mes: number): string[] {
  const primero = new Date(anio, mes, 1, 12)
  const inicio = new Date(primero)
  inicio.setDate(1 - primero.getDay())
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(inicio)
    d.setDate(inicio.getDate() + i)
    return aISO(d)
  })
}

const IconCal = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" />
  </svg>
)
const Flecha = ({ izq }: { izq?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={izq ? 'M10 3.5 5.5 8l4.5 4.5' : 'm6 3.5 4.5 4.5L6 12.5'} />
  </svg>
)

export interface CalendarioProps {
  valor: string
  onElegir: (iso: string) => void
  min?: string
  max?: string
  /** Fecha con la que se abre si no hay valor. */
  inicial?: string
  className?: string
}

/** El calendario en sí (sin campo). Sirve suelto o dentro del selector. */
export function Calendario({ valor, onElegir, min, max, inicial, className }: CalendarioProps) {
  const hoy = hoyISO()
  const base = deISO(valor || inicial || hoy)
  const [vista, setVista] = useState({ anio: base.getFullYear(), mes: base.getMonth() })
  const [modo, setModo] = useState<'dias' | 'meses' | 'anios'>('dias')
  const [foco, setFoco] = useState(valor || inicial || hoy)
  const rejilla = useRef<HTMLDivElement>(null)

  const fuera = (iso: string) => (min && iso < min) || (max && iso > max)
  const mover = (dMes: number) =>
    setVista((v) => {
      const d = new Date(v.anio, v.mes + dMes, 1)
      return { anio: d.getFullYear(), mes: d.getMonth() }
    })

  // El foco del teclado sigue a `foco` y la vista se mueve si sale del mes.
  useEffect(() => {
    const d = deISO(foco)
    if (d.getMonth() !== vista.mes || d.getFullYear() !== vista.anio) setVista({ anio: d.getFullYear(), mes: d.getMonth() })
    rejilla.current?.querySelector<HTMLButtonElement>(`[data-dia="${foco}"]`)?.focus({ preventScroll: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [foco])

  const teclado = (e: KeyboardEvent) => {
    const pasos: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }
    if (e.key in pasos) {
      e.preventDefault()
      const d = deISO(foco)
      d.setDate(d.getDate() + pasos[e.key]!)
      setFoco(aISO(d))
    } else if (e.key === 'PageUp' || e.key === 'PageDown') {
      e.preventDefault()
      const d = deISO(foco)
      d.setMonth(d.getMonth() + (e.key === 'PageUp' ? -1 : 1))
      setFoco(aISO(d))
    } else if (e.key === 'Home' || e.key === 'End') {
      e.preventDefault()
      const d = deISO(foco)
      d.setDate(d.getDate() - (e.key === 'Home' ? d.getDay() : d.getDay() - 6))
      setFoco(aISO(d))
    }
  }

  const anioInicio = vista.anio - (vista.anio % 12)

  return (
    <div className={cn('w-[300px] select-none', className)}>
      {/* Encabezado */}
      <div className="flex items-center justify-between px-1 pb-3">
        <button type="button" aria-label="Mes anterior" onClick={() => (modo === 'anios' ? setVista((v) => ({ ...v, anio: v.anio - 12 })) : modo === 'meses' ? setVista((v) => ({ ...v, anio: v.anio - 1 })) : mover(-1))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg">
          <Flecha izq />
        </button>
        <div className="flex items-center gap-1 text-[14.5px] font-bold text-fg">
          <button type="button" onClick={() => setModo(modo === 'meses' ? 'dias' : 'meses')} className="cursor-pointer rounded-[10px] px-2 py-1 capitalize transition-colors hover:bg-surface-muted">
            {MESES[vista.mes]}
          </button>
          <span aria-hidden="true" className="h-4 w-px bg-border-strong" />
          <button type="button" onClick={() => setModo(modo === 'anios' ? 'dias' : 'anios')} className="cursor-pointer rounded-[10px] px-2 py-1 tabular-nums transition-colors hover:bg-surface-muted">
            {vista.anio}
          </button>
        </div>
        <button type="button" aria-label="Mes siguiente" onClick={() => (modo === 'anios' ? setVista((v) => ({ ...v, anio: v.anio + 12 })) : modo === 'meses' ? setVista((v) => ({ ...v, anio: v.anio + 1 })) : mover(1))}
          className="flex size-8 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg">
          <Flecha />
        </button>
      </div>

      {modo === 'dias' && (
        <div ref={rejilla} role="grid" aria-label={`${MESES[vista.mes]} ${vista.anio}`} onKeyDown={teclado} className="anim-entrada">
          <div role="row" className="grid grid-cols-7 pb-1">
            {DIAS.map((d) => <span key={d} role="columnheader" className="py-1.5 text-center text-[12px] font-semibold text-fg-subtle">{d}</span>)}
          </div>
          <div className="grid grid-cols-7 gap-y-0.5">
            {casillas(vista.anio, vista.mes).map((iso) => {
              const d = deISO(iso)
              const delMes = d.getMonth() === vista.mes
              const elegido = iso === valor
              const esHoy = iso === hoy
              const bloqueado = !!fuera(iso)
              return (
                <button key={iso} type="button" role="gridcell" data-dia={iso}
                  tabIndex={iso === foco ? 0 : -1}
                  aria-selected={elegido}
                  aria-current={esHoy ? 'date' : undefined}
                  aria-label={d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  disabled={bloqueado}
                  onClick={() => onElegir(iso)}
                  className={cn(
                    'mx-auto flex size-10 cursor-pointer items-center justify-center rounded-full text-[14px] tabular-nums outline-none transition-[background-color,color,transform,box-shadow] duration-150',
                    'focus-visible:ring-2 focus-visible:ring-[var(--rvr-ring-border)]',
                    elegido
                      ? 'scale-[1.04] bg-primary font-bold text-white shadow-[0_8px_18px_-8px_var(--rvr-halo-primary)]'
                      : esHoy
                        ? 'font-bold text-fg ring-1 ring-border-strong hover:bg-surface-muted'
                        : delMes
                          ? 'text-fg hover:bg-surface-muted'
                          : 'text-fg-faint hover:bg-surface-muted',
                    bloqueado && 'cursor-not-allowed opacity-30 hover:bg-transparent',
                  )}>
                  {d.getDate()}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {modo === 'meses' && (
        <div className="anim-entrada grid grid-cols-3 gap-2 py-2">
          {MESES.map((m, i) => (
            <button key={m} type="button" onClick={() => { setVista((v) => ({ ...v, mes: i })); setModo('dias') }}
              className={cn('h-12 cursor-pointer rounded-[14px] text-[13.5px] font-semibold capitalize transition-colors',
                i === vista.mes ? 'bg-primary text-white' : 'text-fg hover:bg-surface-muted')}>
              {m.slice(0, 3)}
            </button>
          ))}
        </div>
      )}

      {modo === 'anios' && (
        <div className="anim-entrada grid grid-cols-3 gap-2 py-2">
          {Array.from({ length: 12 }, (_, i) => anioInicio + i).map((a) => (
            <button key={a} type="button" onClick={() => { setVista((v) => ({ ...v, anio: a })); setModo('meses') }}
              className={cn('h-12 cursor-pointer rounded-[14px] text-[13.5px] font-semibold tabular-nums transition-colors',
                a === vista.anio ? 'bg-primary text-white' : 'text-fg hover:bg-surface-muted')}>
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export interface SelectorFechaProps {
  /** Valor controlado (YYYY-MM-DD o ''). Si se omite, el campo es no controlado. */
  valor?: string
  valorInicial?: string
  onChange?: (iso: string) => void
  min?: string
  max?: string
  /** Para formularios con FormData: se envía en un input oculto con este nombre. */
  name?: string
  id?: string
  placeholder?: string
  tamano?: 'sm' | 'md'
  disabled?: boolean
  invalido?: boolean
  /** Permite quitar la fecha (filtros). */
  borrable?: boolean
  className?: string
  'aria-label'?: string
  'aria-describedby'?: string
}

/** Campo de fecha con el calendario en un panel flotante. */
export function SelectorFecha({
  valor, valorInicial = '', onChange, min, max, name, id, placeholder = 'Elegir fecha', tamano = 'md', disabled, invalido, borrable = false, className, ...aria
}: SelectorFechaProps) {
  const [interno, setInterno] = useState(valorInicial)
  const actual = valor ?? interno
  const [abierto, setAbierto] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number; arriba: boolean } | null>(null)
  const boton = useRef<HTMLButtonElement>(null)
  const panel = useRef<HTMLDivElement>(null)
  const oculto = useRef<HTMLInputElement>(null)
  const idPanel = useId()

  const elegir = useCallback((iso: string) => {
    if (valor === undefined) setInterno(iso)
    onChange?.(iso)
    // Avisa al <form> (FormularioModal escucha onChange del formulario).
    const el = oculto.current
    if (el) {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set?.call(el, iso)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    setAbierto(false)
    boton.current?.focus()
  }, [valor, onChange])

  const colocar = useCallback(() => {
    const r = boton.current?.getBoundingClientRect()
    if (!r) return
    const alto = panel.current?.offsetHeight ?? 400
    const ancho = panel.current?.offsetWidth ?? 332
    const arriba = r.bottom + alto + 12 > window.innerHeight && r.top > alto + 12
    const left = Math.min(Math.max(8, r.left), window.innerWidth - ancho - 8)
    setPos({ top: arriba ? r.top - alto - 8 : r.bottom + 8, left, arriba })
  }, [])

  useLayoutEffect(() => {
    if (!abierto) return
    colocar()
    const alMover = () => colocar()
    window.addEventListener('resize', alMover)
    window.addEventListener('scroll', alMover, true)
    const fueraClic = (e: PointerEvent) => {
      if (!panel.current?.contains(e.target as Node) && !boton.current?.contains(e.target as Node)) setAbierto(false)
    }
    const esc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setAbierto(false)
        boton.current?.focus()
      }
    }
    document.addEventListener('pointerdown', fueraClic)
    document.addEventListener('keydown', esc, true)
    return () => {
      window.removeEventListener('resize', alMover)
      window.removeEventListener('scroll', alMover, true)
      document.removeEventListener('pointerdown', fueraClic)
      document.removeEventListener('keydown', esc, true)
    }
  }, [abierto, colocar])

  return (
    <div className={cn('relative', className)}>
      {name && <input ref={oculto} type="text" name={name} value={actual} readOnly hidden aria-hidden="true" tabIndex={-1} />}
      <button ref={boton} id={id} type="button" disabled={disabled}
        aria-haspopup="dialog" aria-expanded={abierto} aria-controls={abierto ? idPanel : undefined}
        aria-invalid={invalido || undefined} {...aria}
        onClick={() => setAbierto((a) => !a)}
        className={cn(
          'group flex w-full cursor-pointer items-center gap-2.5 rounded-[12px] border bg-[var(--rvr-surface-raised)] text-left text-fg outline-none transition-[border-color,box-shadow]',
          tamano === 'sm' ? 'h-[34px] px-2.5 text-[13px]' : 'h-11 px-3.5 text-[13.5px]',
          abierto ? 'border-[var(--rvr-ring-border)] shadow-[0_0_0_3px_var(--rvr-ring)]' : invalido ? 'border-danger' : 'border-border-base hover:border-border-strong',
          'focus-visible:border-[var(--rvr-ring-border)] focus-visible:shadow-[0_0_0_3px_var(--rvr-ring)] disabled:cursor-not-allowed disabled:opacity-60',
        )}>
        <span className={cn('flex-none transition-colors', abierto ? 'text-primary' : 'text-fg-subtle group-hover:text-fg-muted')}><IconCal /></span>
        <span className={cn('min-w-0 flex-1 truncate', !actual && 'text-fg-faint')}>{actual ? textoFecha(actual) : placeholder}</span>
        {borrable && actual && (
          <span role="button" tabIndex={-1} aria-label="Quitar fecha" onClick={(e) => { e.stopPropagation(); elegir('') }}
            className="flex size-5 flex-none items-center justify-center rounded-full text-fg-subtle hover:bg-surface-muted hover:text-fg">×</span>
        )}
      </button>

      {abierto && createPortal(
        <div ref={panel} id={idPanel} role="dialog" aria-label="Elegir fecha"
          className={cn('vidrio-denso fixed z-[80] rounded-[24px] border border-[var(--rvr-glass-borde)] p-4', pos?.arriba ? 'origin-bottom' : 'origin-top', 'animate-[rvr-calendario_0.18s_cubic-bezier(0.22,1,0.36,1)]')}
          style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999 }}>
          <Calendario valor={actual} onElegir={elegir} min={min} max={max} />
          <div className="mt-3 flex items-center justify-between border-t border-border-base pt-3">
            <button type="button" disabled={!!((min && hoyISO() < min) || (max && hoyISO() > max))} onClick={() => elegir(hoyISO())}
              className="cursor-pointer rounded-[10px] px-2.5 py-1.5 text-[13px] font-semibold text-link transition-colors hover:bg-primary-soft disabled:opacity-40">Hoy</button>
            {borrable && actual && (
              <button type="button" onClick={() => elegir('')} className="cursor-pointer rounded-[10px] px-2.5 py-1.5 text-[13px] font-semibold text-fg-muted transition-colors hover:bg-surface-muted">Borrar</button>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}

/** Selector con etiqueta, ayuda y error, con la misma forma que <Input>. */
export function CampoFecha({ label, error, hint, className, ...props }: SelectorFechaProps & { label?: string; error?: string; hint?: string }) {
  const id = useId()
  return (
    <div className={cn('flex flex-col', className)}>
      {label && <label htmlFor={id} className="mb-1.5 text-[13px] font-semibold text-fg">{label}</label>}
      <SelectorFecha id={id} invalido={!!error} aria-describedby={error ? `${id}-e` : undefined} {...props} />
      {error ? <p id={`${id}-e`} className="mt-1.5 text-[12px] text-danger-fg">{error}</p> : hint ? <p className="mt-1.5 text-[12px] text-fg-subtle">{hint}</p> : null}
    </div>
  )
}
