import { useEffect, useState, useSyncExternalStore, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Orbes, type Orbe } from '@shared/components/decor'
import { IconCheck } from '@shared/components/icons'
import { Logo, TextoAnimado } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'
import { FormLogin } from './FormLogin'
import { FormRegistro } from './FormRegistro'

export type ModoAcceso = 'login' | 'registro'

const CONSULTA = '(min-width: 1024px)'
/** ¿Pantalla ancha? Se monta solo una versión de los formularios. */
function useEscritorio() {
  return useSyncExternalStore(
    (avisar) => {
      const mq = window.matchMedia(CONSULTA)
      mq.addEventListener('change', avisar)
      return () => mq.removeEventListener('change', avisar)
    },
    () => window.matchMedia(CONSULTA).matches,
    () => true,
  )
}

/** Luces del panel deslizante, en los azules del logo. */
const ORBES: Orbe[] = [
  { clase: '-top-24 -right-20 size-[380px] bg-[#0a6cf0]/60', duracion: 26, variante: 1 },
  { clase: '-bottom-28 -left-16 size-[320px] bg-[#1e88ff]/40', duracion: 32, variante: 2 },
  { clase: 'top-[35%] left-[30%] size-[220px] bg-[#0050c8]/45', duracion: 29, variante: 3 },
]

const IconVolver = () => (
  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M10 3 5 8l5 5" />
  </svg>
)

/** Encabezado de cada formulario. */
function Cabecera({ eyebrow, titulo, texto, animar }: { eyebrow: string; titulo: string; texto: string; animar: boolean }) {
  return (
    <header className="mb-5">
      <div className="text-[12.5px] font-semibold text-primary-on-soft">{eyebrow}</div>
      <h1 className="m-0 mt-1.5 text-[30px] leading-[1.1] font-extrabold tracking-[-1px] text-fg">
        {animar ? <TextoAnimado key={titulo} texto={titulo} paso={60} /> : titulo}
      </h1>
      <p className="m-0 mt-2 text-[14px] leading-[1.55] text-fg-muted">{texto}</p>
    </header>
  )
}

/** Contenido del panel azul que se desliza (cambia según el modo). */
function PanelInvitacion({ titulo, texto, boton, onClick, puntos }: { titulo: string; texto: string; boton: string; onClick: () => void; puntos: string[] }) {
  return (
    <div key={titulo} className="anim-entrada flex h-full flex-col justify-center px-10 xl:px-14" style={varsCss({ '--retraso': '320ms' })}>
      <h2 className="m-0 text-[36px] leading-[1.08] font-extrabold tracking-[-1.2px] text-white">
        <TextoAnimado texto={titulo} retraso={380} paso={70} />
      </h2>
      <p className="m-0 mt-4 max-w-[340px] text-[15px] leading-[1.6] text-[#c6d4e8]">{texto}</p>
      <ul className="m-0 mt-6 flex list-none flex-col gap-2.5 p-0">
        {puntos.map((p, i) => (
          <li key={p} className="anim-entrada flex items-center gap-3 text-[14px] text-[#e3ecf8]" style={varsCss({ '--retraso': `${520 + i * 80}ms` })}>
            <span className="flex size-7 flex-none items-center justify-center rounded-[9px] bg-white/12 text-[#8ec5ff]">
              <IconCheck width="14" height="14" strokeWidth={2.2} />
            </span>
            {p}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClick}
        className="vidrio-oscuro pintura-boton mt-8 inline-flex h-12 w-fit cursor-pointer items-center gap-2 rounded-[16px] px-7 text-[15px] font-semibold text-white hover:bg-white/15"
      >
        {boton}
      </button>
    </div>
  )
}

/**
 * Ingreso y registro en una sola tarjeta de vidrio (idea del panel deslizante):
 * un panel azul tinta con luces cubre la mitad de la tarjeta y se desliza al
 * otro lado al cambiar de modo, dejando ver el formulario que estaba detrás.
 * La URL cambia sin recargar (/login ↔ /registro). En el teléfono, un control
 * segmentado cambia de formulario.
 */
export function AccesoDoble({ modoInicial }: { modoInicial: ModoAcceso }) {
  const [modo, setModo] = useState<ModoAcceso>(modoInicial)
  const [tocado, setTocado] = useState(false)
  const esLogin = modo === 'login'
  const escritorio = useEscritorio()

  const cambiar = (m: ModoAcceso) => {
    setModo(m)
    setTocado(true)
    window.history.replaceState(window.history.state, '', m === 'login' ? ROUTES.login : ROUTES.registro)
  }

  useEffect(() => {
    document.title = esLogin ? 'Iniciar sesión · Portal RvR' : 'Crear cuenta · Portal RvR'
  }, [esLogin])

  const lado = (m: ModoAcceso, contenido: ReactNode) => {
    const activo = modo === m
    return (
      <section
        aria-hidden={!activo}
        inert={!activo}
        className={cn(
          'flex flex-col justify-center px-7 py-9 transition-[opacity,transform,filter] duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] motion-reduce:transition-none sm:px-10',
          activo ? 'opacity-100' : 'pointer-events-none opacity-0 blur-[2px] lg:scale-[0.96]',
        )}
      >
        {contenido}
      </section>
    )
  }

  const formLogin = (
    <>
      <Cabecera eyebrow="Gestión de acceso" titulo="Iniciar sesión" texto="Personal de RvR y clientes ingresan con su usuario o correo." animar={esLogin} />
      <FormLogin />
    </>
  )
  const formRegistro = (
    <>
      <Cabecera eyebrow="Portal del cliente" titulo="Crea tu cuenta" texto="Solicita servicios, aprueba cotizaciones y sigue tus órdenes en línea." animar={!esLogin && tocado} />
      <FormRegistro onIrALogin={() => cambiar('login')} />
    </>
  )

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center px-4 py-20 sm:px-6">
      <Link
        to={ROUTES.inicio}
        className="vidrio absolute top-5 left-5 inline-flex items-center gap-2 rounded-[14px] border border-[var(--rvr-glass-borde)] px-3.5 py-2 text-[13px] font-semibold text-fg-muted transition-colors hover:text-fg"
      >
        <IconVolver />
        Volver al inicio
      </Link>

      {/* ---------- Escritorio: tarjeta doble con panel deslizante ---------- */}
      {escritorio ? (
      <div className="relative w-full max-w-[1120px]">
        {/* Halo: un resplandor azul que respira detrás de la tarjeta */}
        <div aria-hidden="true" className="anim-halo pointer-events-none absolute -inset-10 rounded-[60px] bg-[#0a6cf0]/25 blur-[70px] [animation-duration:5s] dark:bg-[#1e88ff]/20" />

        <div className="vidrio anim-entrada relative grid min-h-[700px] grid-cols-2 overflow-hidden rounded-[36px] border border-[var(--rvr-glass-borde)] shadow-[0_40px_100px_-30px_rgb(10_60_140/0.45)]">
          {lado('login', formLogin)}
          {lado('registro', formRegistro)}

          {/* Panel deslizante */}
          <div
            className={cn(
              'absolute inset-y-3 left-3 z-10 w-[calc(50%-12px)] overflow-hidden rounded-[28px] bg-ink shadow-[0_24px_60px_-20px_rgb(10_40_100/0.7)] transition-transform duration-[800ms] ease-[cubic-bezier(0.76,0,0.24,1)] will-change-transform motion-reduce:transition-none',
              esLogin ? 'translate-x-full' : 'translate-x-0',
            )}
          >
            <Orbes orbes={ORBES} />
            <div className="relative flex h-full flex-col">
              <div className="flex items-center justify-between px-10 pt-9 xl:px-14">
                <Logo variant="onBrand" />
              </div>
              <div className="flex-1">
                {esLogin ? (
                  <PanelInvitacion
                    titulo="¿Primera vez en RvR?"
                    texto="Crea tu cuenta de cliente y lleva tus servicios desde el portal."
                    boton="Crear mi cuenta"
                    onClick={() => cambiar('registro')}
                    puntos={['Aprueba cotizaciones en línea', 'Sigue la visita del técnico', 'Paga en dos partes y reclama garantía']}
                  />
                ) : (
                  <PanelInvitacion
                    titulo="¡Hola de nuevo!"
                    texto="¿Ya tienes cuenta? Ingresa para ver tus cotizaciones, órdenes y pagos."
                    boton="Iniciar sesión"
                    onClick={() => cambiar('login')}
                    puntos={['Tus órdenes en un solo lugar', 'Avisos de cada cambio', 'Acceso seguro por roles']}
                  />
                )}
              </div>
              <div className="flex items-center gap-2 px-10 pb-8 text-[12.5px] font-medium text-[#8ec5ff] xl:px-14">
                <span aria-hidden="true" className="anim-latido size-[7px] rounded-full bg-[#22c55e]" />
                Conexión cifrada · Medellín y Área Metropolitana
              </div>
            </div>
          </div>
        </div>
      </div>

      ) : (
      /* ---------- Teléfono y tableta: control segmentado ---------- */
      <div className="relative w-full max-w-[560px]">
        <div aria-hidden="true" className="anim-halo pointer-events-none absolute -inset-6 rounded-[48px] bg-[#0a6cf0]/20 blur-[50px] [animation-duration:5s]" />
        <div className="vidrio anim-entrada relative overflow-hidden rounded-[30px] border border-[var(--rvr-glass-borde)]">
          <div className="px-5 pt-6 sm:px-8">
            <Logo />
            <div role="tablist" aria-label="Acceso" className="relative mt-5 grid grid-cols-2 rounded-[16px] bg-surface-muted p-1">
              <span
                aria-hidden="true"
                className={cn(
                  'absolute inset-y-1 w-[calc(50%-4px)] rounded-[12px] bg-surface-raised shadow-[var(--rvr-shadow-sm)] transition-[left] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]',
                  esLogin ? 'left-1' : 'left-[calc(50%)]',
                )}
              />
              {(['login', 'registro'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  role="tab"
                  aria-selected={modo === m}
                  onClick={() => cambiar(m)}
                  className={cn('relative z-10 h-10 cursor-pointer rounded-[12px] text-[14px] font-semibold transition-colors', modo === m ? 'text-fg' : 'text-fg-subtle')}
                >
                  {m === 'login' ? 'Ingresar' : 'Crear cuenta'}
                </button>
              ))}
            </div>
          </div>
          <div key={modo} className={cn('px-5 pt-6 pb-7 sm:px-8', tocado && (esLogin ? 'anim-desde-izq' : 'anim-desde-der'))}>
            {esLogin ? formLogin : formRegistro}
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
