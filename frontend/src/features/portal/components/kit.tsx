import { useEffect, useRef, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { GlassFold } from '@shared/components/decor'
import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'
import type { CategoriaServicio, EstadoOrden } from '@shared/domain/estados'
import { IcoAlarma, IcoCctv, IcoMantenimiento, IcoRedes, IcoServidores } from '@features/landing/components/iconos'

/* =========================================================================
   Kit visual del portal del cliente: piezas que comparten todas sus vistas.
   ========================================================================= */

const menosMovimiento = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Cifra que corre hasta su valor (con movimiento reducido, aparece directo). */
export function CifraViva({ valor, formato = (v) => String(v), duracion = 700 }: { valor: number; formato?: (v: number) => string; duracion?: number }) {
  const [mostrado, setMostrado] = useState(menosMovimiento() ? valor : 0)
  const desde = useRef(menosMovimiento() ? valor : 0)
  useEffect(() => {
    if (menosMovimiento()) return setMostrado(valor)
    const inicio = performance.now()
    const origen = desde.current
    let cuadro = 0
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / duracion)
      setMostrado(Math.round(origen + (valor - origen) * (1 - Math.pow(1 - p, 3))))
      if (p < 1) cuadro = requestAnimationFrame(paso)
      else desde.current = valor
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor, duracion])
  return <span className="tabular-nums">{formato(mostrado)}</span>
}

/* ------------------------------ Categorías ------------------------------ */

type Icono = ComponentType<SVGProps<SVGSVGElement>>

export const CATEGORIA_VISUAL: Record<CategoriaServicio, { icono: Icono; fondo: string; corto: string }> = {
  Mantenimiento: { icono: IcoMantenimiento, fondo: 'bg-[#0a6cf0]', corto: 'Mantenimiento' },
  Servidores: { icono: IcoServidores, fondo: 'bg-[#1c283c] dark:bg-[#2b3d5c]', corto: 'Servidores' },
  Redes: { icono: IcoRedes, fondo: 'bg-[#0891b2]', corto: 'Redes' },
  'Cámaras de seguridad': { icono: IcoCctv, fondo: 'bg-[#4f46e5]', corto: 'Cámaras' },
  Alarmas: { icono: IcoAlarma, fondo: 'bg-[#e8590c]', corto: 'Alarmas' },
}

/** Chip redondeado con el icono de la categoría en su color. */
export function IconoCategoria({ categoria, tamano = 40, className }: { categoria: string; tamano?: number; className?: string }) {
  const v = CATEGORIA_VISUAL[categoria as CategoriaServicio] ?? CATEGORIA_VISUAL.Mantenimiento
  const Icono = v.icono
  return (
    <span
      aria-hidden="true"
      className={cn('flex flex-none items-center justify-center text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25),0_6px_14px_-8px_rgb(10_40_100/0.6)]', v.fondo, className)}
      style={{ width: tamano, height: tamano, borderRadius: tamano * 0.32 }}
    >
      <Icono width={tamano * 0.5} height={tamano * 0.5} />
    </span>
  )
}

/* ------------------------- Recorrido de una orden ------------------------- */

export const ETAPAS_ORDEN = ['Solicitud', 'Cotización', 'Anticipo', 'Visita', 'Entrega', 'Garantía'] as const

/** Etapas cumplidas y la actual según el estado de la orden. */
export function etapaDeOrden(estado: EstadoOrden, garantiaVigente = false): { hechas: number; actual: number | null; pausa: boolean } {
  switch (estado) {
    case 'esperando_anticipo':
      return { hechas: 2, actual: 2, pausa: false }
    case 'en_proceso':
      return { hechas: 3, actual: 3, pausa: false }
    case 'en_espera_repuesto':
      return { hechas: 3, actual: 3, pausa: true }
    case 'finalizada':
      return garantiaVigente ? { hechas: 5, actual: 5, pausa: false } : { hechas: 5, actual: null, pausa: false }
    default:
      return { hechas: 0, actual: null, pausa: false }
  }
}

/**
 * Las seis etapas de una orden como una pista: lo cumplido en azul, la etapa
 * actual late. `grande` muestra los nombres de cada etapa.
 */
export function RecorridoOrden({ estado, garantiaVigente, grande = false, oscuro = false }: { estado: EstadoOrden; garantiaVigente?: boolean; grande?: boolean; oscuro?: boolean }) {
  if (estado === 'cancelada') {
    return <div className={cn('text-[12.5px] font-semibold', oscuro ? 'text-[#ffb4b4]' : 'text-danger-fg')}>Orden cancelada</div>
  }
  const { hechas, actual, pausa } = etapaDeOrden(estado, garantiaVigente)
  return (
    <ol className={cn('m-0 grid list-none grid-cols-6 p-0', grande ? 'gap-2' : 'gap-1')} aria-label={`Etapa: ${ETAPAS_ORDEN[actual ?? hechas - 1] ?? ''}`}>
      {ETAPAS_ORDEN.map((nombre, i) => {
        const hecha = i < hechas && i !== actual
        const esActual = i === actual
        return (
          <li key={nombre} className="flex min-w-0 flex-col gap-1.5" aria-current={esActual ? 'step' : undefined}>
            <span
              className={cn(
                'relative h-1.5 overflow-hidden rounded-full',
                grande && 'h-2',
                hecha ? 'bg-primary' : oscuro ? 'bg-white/15' : 'bg-[var(--rvr-track)]',
              )}
            >
              {esActual && (
                <span
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full',
                    pausa ? 'w-1/2 bg-[var(--rvr-estado-pendiente)]' : 'portal-pista-viva w-full bg-[var(--rvr-azul-vivo)]',
                  )}
                />
              )}
            </span>
            {grande && (
              <span
                className={cn(
                  'text-[11.5px] whitespace-nowrap sm:truncate sm:text-[12px]',
                  // En el teléfono solo se nombra la etapa actual: seis nombres no caben.
                  !esActual && 'max-sm:invisible',
                  esActual ? (oscuro ? 'font-bold text-white' : 'font-bold text-fg') : hecha ? (oscuro ? 'font-semibold text-[#c6d4e8]' : 'font-semibold text-fg-muted') : oscuro ? 'text-white/40' : 'text-fg-faint',
                )}
              >
                {esActual && pausa ? 'Repuesto' : nombre}
              </span>
            )}
          </li>
        )
      })}
    </ol>
  )
}

/* ---------------------------- Anillo de avance ---------------------------- */

/** Anillo de progreso (pago, garantía). El centro recibe lo que se quiera mostrar. */
export function AnilloProgreso({ porcentaje, tamano = 132, grosor = 12, color = 'var(--rvr-primary)', children }: { porcentaje: number; tamano?: number; grosor?: number; color?: string; children?: ReactNode }) {
  const r = (tamano - grosor) / 2
  const c = 2 * Math.PI * r
  const p = Math.max(0, Math.min(100, porcentaje))
  return (
    <div className="relative flex-none" style={{ width: tamano, height: tamano }}>
      <svg width={tamano} height={tamano} className="-rotate-90" aria-hidden="true">
        <circle cx={tamano / 2} cy={tamano / 2} r={r} fill="none" stroke="var(--rvr-track)" strokeWidth={grosor} />
        <circle
          cx={tamano / 2}
          cy={tamano / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={grosor}
          strokeLinecap="round"
          strokeDasharray={c}
          className="portal-anillo"
          style={varsCss({ '--vacio': c, '--lleno': c * (1 - p / 100) })}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/* ------------------------------ Panel tinta ------------------------------ */

/** Panel azul tinta con el vidrio doblado de la marca detrás (hero de las vistas). */
export function PanelTinta({ children, className, intensidad = 0.5 }: { children: ReactNode; className?: string; intensidad?: number }) {
  return (
    <section className={cn('anim-entrada relative isolate overflow-hidden rounded-[30px] bg-[#0f1a2e] text-white shadow-[0_30px_70px_-30px_rgb(10_40_100/0.6)]', className)}>
      <div aria-hidden="true" className="absolute inset-0 -z-10">
        <GlassFold color1="#0a6cf0" color2="#0f1a2e" color3="#8ec5ff" speed={0.25} scale={0.9} noise={0.05} />
        <div className="absolute inset-0 bg-[#0b1424]" style={{ opacity: intensidad }} />
      </div>
      {children}
    </section>
  )
}

/* ----------------------------- Estado vacío ----------------------------- */

export function EstadoVacio({ icono: Icono, titulo, texto, accion }: { icono: Icono; titulo: string; texto: string; accion?: { a: string; texto: string } }) {
  return (
    <div className="vidrio anim-entrada flex flex-col items-center gap-3 rounded-[24px] border border-[var(--rvr-glass-borde)] px-6 py-12 text-center">
      <span className="relative flex size-20 items-center justify-center">
        <span aria-hidden="true" className="anim-halo absolute inset-0 rounded-full bg-primary/20 blur-xl" />
        <span className="relative flex size-16 items-center justify-center rounded-[22px] bg-primary text-white shadow-[0_14px_30px_-12px_var(--rvr-halo-primary)]">
          <Icono width="28" height="28" />
        </span>
      </span>
      <p className="m-0 mt-1 text-[17px] font-bold text-fg">{titulo}</p>
      <p className="m-0 max-w-[420px] text-[14px] leading-[1.6] text-fg-muted">{texto}</p>
      {accion && (
        <Link to={accion.a} className="pintura-boton boton-liquido mt-2 inline-flex h-11 items-center rounded-[14px] px-5 text-[14px] font-semibold">
          {accion.texto}
        </Link>
      )}
    </div>
  )
}

/* ------------------------------ Encabezados ------------------------------ */

/** Título de bloque con icono y acción opcional. */
export function TituloBloque({ icono: Icono, titulo, accion }: { icono?: Icono; titulo: string; accion?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="m-0 flex items-center gap-2.5 text-[16px] font-bold tracking-[-0.3px] text-fg">
        {Icono && (
          <span className="flex size-8 items-center justify-center rounded-[10px] bg-primary-soft text-primary-on-soft">
            <Icono width="16" height="16" />
          </span>
        )}
        {titulo}
      </h2>
      {accion}
    </div>
  )
}

/** Hoja de calendario con el mes y el día. */
export function HojaCalendario({ fecha, tamano = 'md', oscuro = false }: { fecha: string; tamano?: 'md' | 'lg'; oscuro?: boolean }) {
  const d = new Date(fecha)
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex flex-none flex-col items-center overflow-hidden text-center shadow-[0_10px_24px_-12px_rgb(10_40_100/0.5)]',
        tamano === 'lg' ? 'w-[76px] rounded-[18px]' : 'w-14 rounded-[14px]',
        oscuro ? 'bg-white text-ink' : 'border border-border-base bg-surface-solid text-fg',
      )}
    >
      <span className={cn('w-full bg-primary font-semibold text-white uppercase', tamano === 'lg' ? 'py-1 text-[12px]' : 'py-0.5 text-[11px]')}>
        {d.toLocaleDateString('es-CO', { month: 'short' }).replace('.', '')}
      </span>
      <span className={cn('font-display leading-none font-extrabold', tamano === 'lg' ? 'py-2 text-[34px]' : 'py-1.5 text-[24px]')}>{d.getDate()}</span>
      {tamano === 'lg' && <span className="pb-1.5 text-[11px] font-semibold text-[#5f6e7d] capitalize">{d.toLocaleDateString('es-CO', { weekday: 'short' }).replace('.', '')}</span>}
    </span>
  )
}

/** Insignia de estado legible sobre los paneles oscuros. */
export function SobreOscuro({ children }: { children: ReactNode }) {
  return <span className="inline-flex rounded-full bg-white/95 p-px">{children}</span>
}

/** Descarga la visita como evento de calendario (.ics), sin servicios externos. */
export function descargarEventoCalendario({ titulo, inicio, minutos = 120, lugar = '', descripcion = '' }: { titulo: string; inicio: string; minutos?: number; lugar?: string; descripcion?: string }) {
  const f = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
  const desde = new Date(inicio)
  const hasta = new Date(desde.getTime() + minutos * 60_000)
  const limpio = (t: string) => t.replace(/[,;\\]/g, (m) => `\\${m}`).replace(/\n/g, '\\n')
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//RvR Tecnologias//Portal//ES', 'BEGIN:VEVENT',
    `UID:${f(desde)}-${Math.random().toString(36).slice(2)}@rvrtecnologias`,
    `DTSTAMP:${f(new Date())}`, `DTSTART:${f(desde)}`, `DTEND:${f(hasta)}`,
    `SUMMARY:${limpio(titulo)}`, `LOCATION:${limpio(lugar)}`, `DESCRIPTION:${limpio(descripcion)}`,
    'BEGIN:VALARM', 'TRIGGER:-PT2H', 'ACTION:DISPLAY', 'DESCRIPTION:Visita de RvR Tecnologías', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n')
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = 'visita-rvr.ics'
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

/** «Martes 20 de octubre» (sin año: el contexto ya lo da). */
export function fechaAmable(fecha: string): string {
  const t = new Date(fecha).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** «Hoy», «Mañana», «En 3 días», «Hace 2 días». */
export function cuantoFalta(fecha: string): string {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  const dias = Math.round((d.getTime() - hoy.getTime()) / 86_400_000)
  if (dias === 0) return 'Hoy'
  if (dias === 1) return 'Mañana'
  if (dias > 1) return `En ${dias} días`
  if (dias === -1) return 'Ayer'
  return `Hace ${-dias} días`
}
