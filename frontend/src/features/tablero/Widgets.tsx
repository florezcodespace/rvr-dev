import { useEffect, useLayoutEffect, useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '@shared/lib/cn'
import { aISO, deISO } from '@shared/lib/fechas'
import { storage } from '@shared/lib/storage'

/* =========================================================================
   Tablero de widgets: tarjetas reordenables (arrastrar o teclado) con el
   orden guardado en el navegador, y los mini gráficos que usan.
   ========================================================================= */

export interface DefWidget {
  id: string
  /** Columnas que ocupa en escritorio (de 4). */
  ancho: 1 | 2
  contenido: ReactNode
}

const GRIP = (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    {[3, 8, 13].flatMap((y) => [5.5, 10.5].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.25" />))}
  </svg>
)

export function ordenDelTablero(clave: string, porDefecto: string[]) {
  const guardado = storage.get<string[]>(clave, [])
  const validos = guardado.filter((id) => porDefecto.includes(id))
  return [...validos, ...porDefecto.filter((id) => !validos.includes(id))]
}

/** Rejilla de widgets: arrastra por el asa para reordenar; el orden se recuerda. */
export function TableroWidgets({ clave, widgets, nombres }: { clave: string; widgets: DefWidget[]; nombres: Record<string, string> }) {
  const porDefecto = widgets.map((w) => w.id)
  const [orden, setOrden] = useState(() => ordenDelTablero(clave, porDefecto))
  const [arrastrando, setArrastrando] = useState<string | null>(null)
  const [sobre, setSobre] = useState<string | null>(null)
  const [aviso, setAviso] = useState('')
  const asaActiva = useRef<string | null>(null)
  const [asa, setAsa] = useState<string | null>(null)

  useEffect(() => {
    const soltar = () => { asaActiva.current = null; setAsa(null) }
    window.addEventListener('pointerup', soltar)
    window.addEventListener('blur', soltar)
    return () => {
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('blur', soltar)
    }
  }, [])

  useEffect(() => storage.set(clave, orden), [clave, orden])

  const rejilla = useRef<HTMLDivElement>(null)
  const posiciones = useRef(new Map<string, DOMRect>())
  const recordarPosiciones = () => {
    posiciones.current.clear()
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    rejilla.current?.querySelectorAll<HTMLElement>('[data-widget]').forEach((el) => {
      posiciones.current.set(el.dataset.widget!, el.getBoundingClientRect())
    })
  }
  useLayoutEffect(() => {
    rejilla.current?.querySelectorAll<HTMLElement>('[data-widget]').forEach((el) => {
      const antes = posiciones.current.get(el.dataset.widget!)
      if (!antes) return
      const despues = el.getBoundingClientRect()
      const x = antes.left - despues.left
      const y = antes.top - despues.top
      if (x || y) el.animate([{ translate: `${x}px ${y}px` }, { translate: '0 0' }], {
        duration: 320, easing: 'cubic-bezier(.22,1,.36,1)',
      })
    })
    posiciones.current.clear()
  }, [orden])

  const mover = (id: string, destino: number) => {
    recordarPosiciones()
    setOrden((o) => {
      const sin = o.filter((x) => x !== id)
      sin.splice(Math.max(0, Math.min(destino, sin.length)), 0, id)
      return sin
    })
  }

  const teclado = (id: string) => (e: KeyboardEvent) => {
    const i = orden.indexOf(id)
    const d = e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : 0
    if (!d) return
    e.preventDefault()
    mover(id, i + d)
    setAviso(`${nombres[id]} movido a la posición ${Math.max(1, Math.min(orden.length, i + d + 1))} de ${orden.length}`)
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-asa="${id}"]`)?.focus())
  }

  const porId = new Map(widgets.map((w) => [w.id, w]))
  const personalizado = orden.join() !== porDefecto.join()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12.5px] text-fg-subtle">
        <span className="flex items-center gap-2"><span className="text-fg-faint">{GRIP}</span> Arrastra los widgets por el asa para ordenar tu tablero.</span>
        {personalizado && (
          <button type="button" onClick={() => { recordarPosiciones(); setOrden(porDefecto) }} className="cursor-pointer rounded-[10px] px-2.5 py-1 font-semibold text-link transition-colors hover:bg-primary-soft">
            Restablecer orden
          </button>
        )}
      </div>
      <div ref={rejilla} className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-4">
        {orden.map((id) => {
          const w = porId.get(id)
          if (!w) return null
          return (
            <section
              data-widget={id}
              key={id}
              aria-label={nombres[id]}
              draggable={asa === id}
              onDragStart={(e: DragEvent) => {
                if (asaActiva.current !== id) return e.preventDefault()
                setArrastrando(id)
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', id)
              }}
              onDragOver={(e) => {
                if (!arrastrando || arrastrando === id) return
                e.preventDefault()
                setSobre(id)
              }}
              onDragLeave={(e) => {
                if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) setSobre((s) => s === id ? null : s)
              }}
              onDrop={(e) => {
                e.preventDefault()
                if (arrastrando && arrastrando !== id) mover(arrastrando, orden.indexOf(id))
                setSobre(null)
              }}
              onDragEnd={() => {
                setArrastrando(null)
                setSobre(null)
                asaActiva.current = null
                setAsa(null)
              }}
              className={cn(
                'widget vidrio group relative flex min-w-0 flex-col rounded-[24px] border border-[var(--rvr-glass-borde)] p-5 transition-[transform,opacity,box-shadow] duration-200',
                w.ancho === 2 ? 'md:col-span-2' : 'col-span-1',
                (asa === id || arrastrando === id) && 'widget-en-mano',
                sobre === id && 'ring-2 ring-primary/50 ring-offset-2 ring-offset-[var(--rvr-bg)]',
              )}
            >
              <button
                type="button"
                data-asa={id}
                aria-label={`Mover ${nombres[id]} (flechas del teclado)`}
                title="Arrastra para mover"
                onPointerDown={() => { asaActiva.current = id; setAsa(id) }}
                onPointerUp={() => { if (!arrastrando) { asaActiva.current = null; setAsa(null) } }}
                onKeyDown={teclado(id)}
                className="absolute top-3 right-3 z-10 flex size-7 cursor-grab items-center justify-center rounded-[9px] text-fg-faint opacity-0 transition-opacity group-hover:opacity-100 hover:bg-surface-muted hover:text-fg-muted focus-visible:opacity-100 active:cursor-grabbing"
              >
                {GRIP}
              </button>
              {w.contenido}
            </section>
          )
        })}
      </div>
      <p className="sr-only" aria-live="polite">{aviso}</p>
    </div>
  )
}

/* ------------------------------- Piezas ------------------------------- */

/** Etiqueta del widget en versalitas, con algo a la derecha. */
export function Cabeza({ titulo, derecha }: { titulo: string; derecha?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 pr-8">
      <h2 className="m-0 text-[11.5px] font-semibold tracking-[0.14em] text-fg-subtle uppercase">{titulo}</h2>
      {derecha && <div className="text-[12.5px] font-medium whitespace-nowrap text-fg-subtle">{derecha}</div>}
    </div>
  )
}

/** Cifra grande con una unidad pequeña al lado. */
export function Cifra({ valor, unidad }: { valor: ReactNode; unidad?: ReactNode }) {
  return (
    <div className="mt-2 flex items-baseline gap-2">
      <span className="font-display text-[32px] leading-none font-extrabold tracking-[-1px] text-fg tabular-nums sm:text-[36px]">{valor}</span>
      {unidad && <span className="text-[13px] font-medium text-fg-subtle">{unidad}</span>}
    </div>
  )
}

/** Variación frente al período anterior: ↑ verde / ↓ rojo (o al revés si bajar es bueno). */
export function Delta({ actual, anterior, sufijo = 'vs. anterior', bajarEsBueno = false, puntos = false }: { actual: number; anterior: number | null; sufijo?: string; bajarEsBueno?: boolean; puntos?: boolean }) {
  if (anterior === null || (!anterior && !actual)) return <span className="text-fg-faint">— {sufijo}</span>
  const cambio = puntos ? actual - anterior : anterior ? ((actual - anterior) / anterior) * 100 : 100
  const r = Math.round(cambio * 10) / 10
  if (r === 0) return <span className="text-fg-subtle">= {sufijo}</span>
  const sube = r > 0
  const bueno = bajarEsBueno ? !sube : sube
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('font-bold tabular-nums', bueno ? 'text-[var(--rvr-estado-completada-fg)]' : 'text-danger-fg')}>
        {sube ? '↑' : '↓'} {Math.abs(r).toLocaleString('es-CO')}{puntos ? ' pts' : ' %'}
      </span>
      <span>{sufijo}</span>
    </span>
  )
}

/**
 * Mapa de calor: una fila por semana y una columna por día (Lun–Dom); la
 * intensidad es la cantidad del día. «Hoy» lleva aro y su columna se resalta.
 */
export function MapaCalor({ dias, hoy, etiqueta }: { dias: { fecha: string; valor: number }[]; hoy: string; etiqueta: string }) {
  if (!dias.length) return null
  const max = Math.max(1, ...dias.map((d) => d.valor))
  const porFecha = new Map(dias.map((d) => [d.fecha, d.valor]))
  const primero = deISO(dias[0]!.fecha)
  primero.setDate(primero.getDate() - ((primero.getDay() + 6) % 7))
  const ultimo = deISO(dias.at(-1)!.fecha)
  const semanas: string[][] = []
  for (const d = new Date(primero); d <= ultimo; d.setDate(d.getDate() + 7)) {
    semanas.push(Array.from({ length: 7 }, (_, i) => { const x = new Date(d); x.setDate(d.getDate() + i); return aISO(x) }))
  }
  const COLS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const hoyCol = (deISO(hoy).getDay() + 6) % 7
  const nivel = (v: number) => (v <= 0 ? 0 : Math.min(4, Math.ceil((v / max) * 4)))
  const FONDOS = ['bg-[var(--rvr-track)]', 'bg-primary/25', 'bg-primary/45', 'bg-primary/70', 'bg-primary']
  const alto = semanas.length > 8 ? 'h-3' : 'h-[18px]'

  return (
    <div role="img" aria-label={etiqueta} className="flex flex-col gap-1">
      <div className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] gap-1">
        <span />
        {COLS.map((c, i) => <span key={c} className={cn('text-center text-[11px]', i === hoyCol ? 'font-bold text-fg' : 'text-fg-subtle')}>{i === hoyCol ? 'Hoy' : c}</span>)}
      </div>
      {semanas.map((s) => (
        <div key={s[0]} className="grid grid-cols-[52px_repeat(7,minmax(0,1fr))] items-center gap-1">
          <span className="text-[11px] whitespace-nowrap text-fg-subtle">{deISO(s[0]!).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }).replace('.', '')}</span>
          {s.map((f) => {
            const dentro = porFecha.has(f)
            const v = porFecha.get(f) ?? 0
            return (
              <span key={f}
                title={dentro ? `${deISO(f).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })}: ${v}` : undefined}
                className={cn('rounded-[5px] transition-transform hover:scale-110', alto, dentro ? FONDOS[nivel(v)] : 'bg-transparent', f === hoy && 'ring-2 ring-primary ring-offset-2 ring-offset-[var(--rvr-surface-solid)]')} />
            )
          })}
        </div>
      ))}
      <div className="mt-1.5 flex items-center justify-end gap-1.5 text-[11px] text-fg-subtle">
        Menos {FONDOS.map((c) => <span key={c} className={cn('size-2.5 rounded-[3px]', c)} />)} Más
      </div>
    </div>
  )
}

/** Columnas redondeadas (la última resaltada), sin ejes: la tendencia de un vistazo. */
export function MiniBarras({ valores, formato, etiquetas }: { valores: number[]; formato: (v: number) => string; etiquetas?: string[] }) {
  // Más de 15 puntos: se suman en 15 tramos para que la tendencia se lea.
  const tramos = valores.length > 15 ? Math.ceil(valores.length / 15) : 1
  const recorte: number[] = []
  const recorteEtiq: string[] = []
  for (let i = 0; i < valores.length; i += tramos) {
    recorte.push(valores.slice(i, i + tramos).reduce((a, b) => a + b, 0))
    const desde = etiquetas?.[i]
    const hasta = etiquetas?.[Math.min(i + tramos, valores.length) - 1]
    recorteEtiq.push(desde && hasta && desde !== hasta ? `${desde} – ${hasta}` : desde ?? '')
  }
  const max = Math.max(1, ...recorte)
  return (
    <div className="mt-auto flex h-[86px] items-end gap-[5px] pt-4">
      {recorte.map((v, i) => (
        <span key={i} title={`${recorteEtiq?.[i] ?? ''} ${formato(v)}`.trim()}
          className={cn('min-h-[6px] flex-1 origin-bottom rounded-full transition-[filter] hover:brightness-110 widget-barra', i === recorte.length - 1 ? 'bg-primary' : 'bg-[var(--rvr-track-fuerte,var(--rvr-border-strong))]')}
          style={{ height: `${Math.max(7, (v / max) * 100)}%`, animationDelay: `${i * 25}ms` }} />
      ))}
    </div>
  )
}

/** Fila «punto · nombre · barra · valor» como una lista de trazas. */
export function FilaBarra({ nombre, detalle, valor, proporcion, destacada, tono = 'var(--rvr-primary)', a }: { nombre: ReactNode; detalle?: ReactNode; valor: ReactNode; proporcion: number; destacada?: boolean; tono?: string; a?: (n: ReactNode) => ReactNode }) {
  const fila = (
    <span className="grid grid-cols-[minmax(0,1.3fr)_minmax(60px,1fr)_auto] items-center gap-3 py-2 text-[13px]">
      <span className="flex min-w-0 items-center gap-2.5">
        <span className="size-2 flex-none rounded-full" style={{ background: tono }} />
        <span className={cn('truncate', destacada ? 'font-bold text-fg' : 'text-fg-muted')}>{nombre}</span>
        {detalle && <span className="hidden truncate text-fg-subtle sm:inline">{detalle}</span>}
      </span>
      <span className="h-1.5 overflow-hidden rounded-full bg-[var(--rvr-track)]">
        <span className="widget-barra-h block h-full rounded-full" style={{ width: `${Math.max(proporcion > 0 ? 4 : 0, proporcion * 100)}%`, background: destacada ? tono : 'var(--rvr-border-strong)' }} />
      </span>
      <span className={cn('text-right tabular-nums', destacada ? 'font-bold text-fg' : 'text-fg-muted')}>{valor}</span>
    </span>
  )
  return a ? <>{a(fila)}</> : fila
}

/** Punto «en vivo» que late. */
export function EnVivo({ texto = 'al día' }: { texto?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="relative flex size-2"><span className="anim-latido absolute inset-0 rounded-full bg-[var(--rvr-estado-completada)]" /><span className="relative size-2 rounded-full bg-[var(--rvr-estado-completada)]" /></span>
      {texto}
    </span>
  )
}
