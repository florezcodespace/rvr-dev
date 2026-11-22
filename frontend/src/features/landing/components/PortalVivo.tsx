import { useEffect, useState, type ComponentType, type ReactNode, type SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { prefiereMenosMovimiento } from '@shared/hooks/useContador'
import { cn } from '@shared/lib/cn'
import { IcoCheck, IcoCotizar, IcoFlecha, IcoGarantia, IcoPersona } from './iconos'
import { Revelable, TituloSeccion } from './Seccion'

interface Vista {
  clave: string
  titulo: string
  texto: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
  pantalla: ReactNode
}

const Fila = ({ izq, der, sub }: { izq: string; der: ReactNode; sub?: string }) => (
  <div className="flex items-center justify-between gap-3 rounded-[16px] bg-surface-muted px-4 py-3">
    <span>
      <span className="block text-[14px] font-semibold text-fg">{izq}</span>
      {sub && <span className="block text-[12.5px] text-fg-subtle">{sub}</span>}
    </span>
    <span className="text-[14px] font-semibold text-fg tabular-nums">{der}</span>
  </div>
)

const Pildora = ({ children, tono = 'azul' }: { children: ReactNode; tono?: 'azul' | 'verde' | 'ambar' }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-semibold',
      tono === 'azul' && 'bg-primary-soft text-primary-on-soft',
      tono === 'verde' && 'bg-[var(--rvr-estado-completada-soft)] text-[var(--rvr-estado-completada-fg)]',
      tono === 'ambar' && 'bg-[var(--rvr-estado-pendiente-soft)] text-[var(--rvr-estado-pendiente-fg)]',
    )}
  >
    {children}
  </span>
)

const VISTAS: Vista[] = [
  {
    clave: 'cotizacion',
    titulo: 'Aprueba la cotización',
    texto: 'Recibe cada servicio con su precio y decide con un toque.',
    icono: IcoCotizar,
    pantalla: (
      <>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-fg-subtle">Cotización COT-2026-0087</span>
          <Pildora tono="ambar">Por decidir</Pildora>
        </div>
        <Fila izq="Configuración de red IP" sub="4 h · garantía de 3 meses" der="$ 280.000" />
        <Fila izq="Instalación de punto de red ×3" sub="1 h 30 min c/u" der="$ 255.000" />
        <div className="flex items-end justify-between px-1 pt-1">
          <span className="text-[13px] text-fg-subtle">Total</span>
          <span className="text-[30px] leading-none font-extrabold tracking-[-1px] text-fg tabular-nums">$ 535.000</span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <span className="flex h-11 items-center justify-center rounded-[14px] bg-primary text-[14px] font-semibold text-white">Aprobar</span>
          <span className="flex h-11 items-center justify-center rounded-[14px] border border-border-base text-[14px] font-semibold text-fg">Rechazar</span>
        </div>
      </>
    ),
  },
  {
    clave: 'visita',
    titulo: 'Sabe cuándo llega el técnico',
    texto: 'La visita queda agendada en una franja de dos horas, con nombre.',
    icono: IcoPersona,
    pantalla: (
      <>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-fg-subtle">Próxima visita</span>
          <Pildora>Programada</Pildora>
        </div>
        <div className="flex items-center gap-4 rounded-[18px] bg-surface-muted p-4">
          <span className="flex w-16 flex-none flex-col items-center overflow-hidden rounded-[14px] bg-surface-raised text-center shadow-[var(--rvr-shadow-sm)]">
            <span className="w-full bg-primary py-1 text-[12px] font-semibold text-white">JUE</span>
            <span className="py-1.5 text-[26px] leading-none font-extrabold text-fg">22</span>
          </span>
          <span>
            <span className="block text-[20px] leading-tight font-extrabold tracking-[-0.5px] text-fg tabular-nums">8:00 – 10:00</span>
            <span className="block text-[13px] text-fg-subtle">Octubre · Oficina, Laureles</span>
          </span>
        </div>
        <Fila izq="Técnico asignado" sub="Lo verá en el portal" der={<span className="flex size-9 items-center justify-center rounded-full bg-ink text-[13px] font-bold text-white">JM</span>} />
        <Fila izq="Orden OS-2026-0152" sub="Mantenimiento preventivo · 3 equipos" der={<Pildora tono="verde">Anticipo listo</Pildora>} />
      </>
    ),
  },
  {
    clave: 'pagos',
    titulo: 'Paga en dos partes',
    texto: 'Anticipo del 50 % para empezar y el saldo al recibir el trabajo.',
    icono: IcoCheck,
    pantalla: (
      <>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-fg-subtle">Pagos de la orden</span>
          <Pildora>Abonada</Pildora>
        </div>
        <div className="rounded-[18px] bg-surface-muted p-4">
          <div className="flex justify-between text-[13px] text-fg-subtle">
            <span>Pagado</span>
            <span className="tabular-nums">50 %</span>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-[var(--rvr-track)]">
            <div className="anim-barra h-full w-1/2 origin-left rounded-full bg-primary" />
          </div>
          <div className="mt-3 flex justify-between">
            <span className="text-[22px] font-extrabold tracking-[-0.6px] text-fg tabular-nums">$ 825.000</span>
            <span className="self-end text-[13px] text-fg-subtle tabular-nums">de $ 1.650.000</span>
          </div>
        </div>
        <Fila izq="Comprobante Nequi" sub="Subido desde el portal" der={<Pildora tono="verde"><IcoCheck width="12" height="12" />Aprobado</Pildora>} />
        <Fila izq="Saldo" sub="Al recibir el trabajo" der="$ 825.000" />
      </>
    ),
  },
  {
    clave: 'garantia',
    titulo: 'Reclama la garantía',
    texto: 'Cada servicio trae sus días de garantía, contados desde la entrega.',
    icono: IcoGarantia,
    pantalla: (
      <>
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-fg-subtle">Garantía</span>
          <Pildora tono="verde">Activa</Pildora>
        </div>
        <div className="flex items-center gap-4 rounded-[18px] bg-surface-muted p-4">
          <span className="flex size-14 flex-none items-center justify-center rounded-[16px] bg-ink text-white">
            <IcoGarantia width="24" height="24" />
          </span>
          <span>
            <span className="block text-[24px] leading-tight font-extrabold tracking-[-0.6px] text-fg">1 año</span>
            <span className="block text-[13px] text-fg-subtle">Instalación de sistema de alarma</span>
          </span>
        </div>
        <Fila izq="Vigente hasta" sub="Desde el día de la entrega" der="22 oct 2027" />
        <span className="flex h-11 items-center justify-center rounded-[14px] border border-border-base text-[14px] font-semibold text-fg">Reportar una falla</span>
      </>
    ),
  },
]

/**
 * «Su portal»: lo que el cliente ve en línea, en cuatro pantallas de muestra.
 * Avanza solo cada pocos segundos hasta que el visitante elige una.
 */
export function PortalVivo() {
  const [activa, setActiva] = useState(0)
  const [quieta, setQuieta] = useState(false)

  useEffect(() => {
    if (quieta || prefiereMenosMovimiento()) return
    const reloj = window.setInterval(() => setActiva((i) => (i + 1) % VISTAS.length), 5200)
    return () => window.clearInterval(reloj)
  }, [quieta])

  const vista = VISTAS[activa]!

  return (
    <section id="portal" className="relative py-20 sm:py-24">
      <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <TituloSeccion
            antetitulo="Su portal"
            titulo="Todo su servicio,"
            destacado="a la vista."
            descripcion="Sin llamadas ni mensajes para saber en qué va: la cotización, la visita, los pagos y la garantía quedan en su portal de cliente."
          />

          <div role="tablist" aria-label="Pantallas del portal" className="mt-8 flex flex-col gap-2.5">
            {VISTAS.map((v, i) => {
              const Icono = v.icono
              const sel = i === activa
              return (
                <button
                  key={v.clave}
                  type="button"
                  role="tab"
                  aria-selected={sel}
                  aria-controls="pantalla-portal"
                  onClick={() => {
                    setActiva(i)
                    setQuieta(true)
                  }}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-[20px] border p-4 text-left transition-all duration-300',
                    sel
                      ? 'vidrio border-[var(--rvr-glass-borde)] shadow-[var(--rvr-shadow-card-up)]'
                      : 'border-transparent hover:bg-surface-muted',
                  )}
                >
                  <span
                    className={cn(
                      'flex size-11 flex-none items-center justify-center rounded-[14px] transition-colors duration-300',
                      sel ? 'bg-primary text-white' : 'bg-primary-soft text-primary-on-soft',
                    )}
                  >
                    <Icono width="20" height="20" />
                  </span>
                  <span>
                    <span className="block text-[16px] font-bold text-fg">{v.titulo}</span>
                    <span className="block text-[14px] text-fg-muted">{v.texto}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <Link
            to={ROUTES.registro}
            className="enlace-landing mt-7 inline-flex items-center gap-2 text-[15px] font-semibold text-link"
          >
            Crear mi cuenta de cliente
            <IcoFlecha width="15" height="15" />
          </Link>
        </div>

        <Revelable retraso={120} className="relative mx-auto w-full max-w-[440px]">
          {/* Marco de teléfono de vidrio */}
          <div className="vidrio rounded-[42px] border border-[var(--rvr-glass-borde)] p-3 shadow-[var(--rvr-shadow-lg)]">
            <div className="rounded-[32px] bg-surface-raised p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[13px] font-bold text-fg">Portal RvR</span>
                <span className="h-1.5 w-14 rounded-full bg-[var(--rvr-track)]" />
                <span className="flex size-8 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-white">AS</span>
              </div>
              <div id="pantalla-portal" role="tabpanel" key={vista.clave} className="anim-entrada flex min-h-[340px] flex-col gap-2.5">
                {vista.pantalla}
              </div>
            </div>
          </div>
          <p className="m-0 mt-4 text-center text-[13px] text-fg-subtle">Pantallas de muestra del portal del cliente</p>
        </Revelable>
      </div>
    </section>
  )
}
