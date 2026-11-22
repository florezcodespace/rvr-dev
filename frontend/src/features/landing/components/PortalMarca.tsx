import { useEffect, useState } from 'react'
import { GlassFold } from '@shared/components/decor'
import { GlyphPortal } from '@shared/components/ui'
import { IcoAlarma, IcoCctv, IcoCandado, IcoDiagnostico, IcoFlecha, IcoGarantia, IcoMantenimiento, IcoRedes, IcoServidores } from './iconos'

const FUENTE = "Sora, 'Plus Jakarta Sans', system-ui, sans-serif"

/**
 * Vidrio doblado dentro de las letras. Estos valores están repetidos en el
 * splash de index.html: si cambian aquí, cambiarlos allá también.
 */
const VIDRIO = { color1: '#0a6cf0', color2: '#0f1a2e', color3: '#8ec5ff', speed: 0.35, scale: 1, noise: 0.05 }

const PILARES = [
  { n: '01', titulo: 'Diagnóstico antes del precio', texto: 'Un técnico revisa, le enviamos la cotización detallada y usted decide.', Icono: IcoDiagnostico },
  { n: '02', titulo: 'Pagos claros', texto: 'Anticipo del 50 % para agendar y el saldo cuando el trabajo está terminado.', Icono: IcoCandado },
  { n: '03', titulo: 'Garantía por escrito', texto: 'Cada servicio trae su garantía y la reclama desde su portal.', Icono: IcoGarantia },
]

const FRENTES = [
  { nombre: 'Mantenimiento', Icono: IcoMantenimiento },
  { nombre: 'Servidores', Icono: IcoServidores },
  { nombre: 'Redes', Icono: IcoRedes },
  { nombre: 'Cámaras', Icono: IcoCctv },
  { nombre: 'Alarmas', Icono: IcoAlarma },
]

/** Espera a Sora: el portal mide la tinta de las letras al montarse. */
function useFuenteLista() {
  const [lista, setLista] = useState(false)
  useEffect(() => {
    let vivo = true
    const fin = () => vivo && setLista(true)
    const espera = window.setTimeout(fin, 1800)
    if (document.fonts?.load) document.fonts.load("800 100px Sora", 'RVR').then(fin, fin)
    else fin()
    return () => {
      vivo = false
      window.clearTimeout(espera)
    }
  }, [])
  return lista
}

/**
 * Apertura de la landing: «RVR» enorme, con
 * «TECNOLOGÍA» debajo. Al bajar, la cámara entra por la V y el azul de
 * adentro se convierte en la siguiente escena.
 */
export function PortalMarca() {
  const lista = useFuenteLista()

  // Es lo primero de la página: sube por debajo de la barra flotante.
  return (
    <div id="inicio" className="-mt-[76px] sm:-mt-[80px]">
      {lista ? <Portal /> : <div aria-hidden="true" className="h-[100svh]" />}
    </div>
  )
}

function Portal() {
  return (
    <GlyphPortal
      word="RVR"
      focusChar="V"
      fontFamily={FUENTE}
      fontWeight={800}
      scrollLength={2.2}
      enterLabel="Entrar a RvR"
      enterClassName="boton-liquido"
      className="portal-marca"
      style={{
        '--gp-paper': 'transparent',
        '--gp-ink': 'var(--rvr-fg)',
        '--gp-field': '#1c283c',
        '--gp-foreground': '#ffffff',
      }}
      background={
        <div className="absolute inset-0 bg-[#0f1a2e]" style={{ transform: 'scale(var(--gp-field-scale,1))' }}>
          <GlassFold {...VIDRIO} relojGlobal />
          {/* Velo para que el texto de la bienvenida se lea sobre el vidrio */}
          <div className="portal-marca-velo absolute inset-0 bg-[#0b1424]" />
        </div>
      }
      front={
        <>
          <p className="portal-marca-antetitulo vidrio m-0 rounded-full border border-[var(--rvr-glass-borde)] px-4 py-1.5 text-[12.5px] font-semibold text-primary-on-soft">
            Soluciones a su alcance · Medellín
          </p>
          <p className="portal-marca-palabra m-0 font-display font-extrabold text-fg" aria-label="Tecnología">TECNOLOGÍA</p>
          <span className="portal-marca-pista text-[12.5px] font-medium text-fg-subtle">
            <span className="hidden [@media(any-pointer:fine)]:inline">Pase el cursor por una letra y baje para entrar</span>
            <span className="[@media(any-pointer:fine)]:hidden">Baje para entrar</span>
            <span aria-hidden="true" className="anim-mecer ml-1.5 inline-block">↓</span>
          </span>
        </>
      }
    >
      <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-10 py-10">
        <div className="max-w-[720px]">
          <span className="vidrio-oscuro inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold text-[#8ec5ff]">
            <span aria-hidden="true" className="anim-latido size-1.5 rounded-full bg-[#22c55e]" />
            Bienvenido a RvR Tecnologías
          </span>
          <h2 className="mt-5 mb-0 text-[32px] leading-[1.08] font-extrabold tracking-[-1.2px] text-white text-balance sm:text-[48px]">
            Un solo equipo para todo lo técnico de su empresa.
          </h2>
          <p className="mt-4 mb-0 max-w-[560px] text-[16px] leading-[1.65] text-[#c6d4e8]">
            Del computador que no prende al cableado de una sede completa: las mismas personas, el
            mismo estándar y cada paso a la vista en su portal.
          </p>
        </div>

        <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-3">
          {PILARES.map(({ n, titulo, texto, Icono }) => (
            <li key={n} className="vidrio-oscuro reflejo flex flex-col gap-3 rounded-[22px] p-5">
              <span className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-[13px] bg-[#0a6cf0] text-white">
                  <Icono width="19" height="19" />
                </span>
                <span className="text-[13px] font-semibold text-[#8ec5ff] tabular-nums">{n}</span>
              </span>
              <span className="text-[17px] font-bold text-white">{titulo}</span>
              <span className="text-[14px] leading-[1.6] text-[#c6d4e8]">{texto}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <ul className="m-0 flex list-none flex-wrap gap-2 p-0" aria-label="Frentes de servicio">
            {FRENTES.map(({ nombre, Icono }) => (
              <li key={nombre} className="vidrio-oscuro inline-flex items-center gap-2 rounded-full py-1.5 pr-4 pl-1.5 text-[13.5px] font-semibold text-white">
                <span className="flex size-7 items-center justify-center rounded-full bg-white/12 text-[#8ec5ff]">
                  <Icono width="14" height="14" />
                </span>
                {nombre}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-3">
            <a
              href="#servicios"
              className="pintura-boton boton-liquido-claro inline-flex h-[50px] items-center gap-2 rounded-[16px] px-6 text-[15px] font-semibold"
            >
              Ver servicios y precios
              <IcoFlecha width="16" height="16" />
            </a>
            <a
              href="#cotizador"
              className="vidrio-oscuro pintura-boton inline-flex h-[50px] items-center rounded-[16px] px-6 text-[15px] font-semibold text-white hover:bg-white/15"
            >
              Arme su cotización
            </a>
          </div>
        </div>
      </div>
    </GlyphPortal>
  )
}
