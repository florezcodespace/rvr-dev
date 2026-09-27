import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Orbes, Particulas, type Orbe } from '@shared/components/decor'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { Revelable } from './Seccion'
import {
  IcoCandado,
  IcoCorreo,
  IcoFlecha,
  IcoTelefono,
  IcoUbicacion,
} from './iconos'

const CONTACTO = [
  {
    etiqueta: 'Calle 90 N 46-16 Int 302, Medellín',
    href: 'https://maps.google.com/?q=Calle+90+46-16+Medellin',
    icono: IcoUbicacion,
    externo: true,
  },
  {
    etiqueta: '+57 301 527 0761',
    href: 'tel:+573015270761',
    icono: IcoTelefono,
    externo: false,
  },
  {
    etiqueta: 'info@rvrtecnologias.com.co',
    href: 'mailto:info@rvrtecnologias.com.co',
    icono: IcoCorreo,
    externo: false,
  },
]

const ENLACES = [
  { href: '#inicio', label: 'Inicio' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#portafolio', label: 'Portafolio' },
  { href: '#proceso', label: 'Cómo trabajamos' },
  { href: '#nosotros', label: 'Sobre nosotros' },
]

const POLITICAS = [
  'Política de privacidad',
  'Términos y condiciones',
  'Garantías de servicio',
]

/** Orbes del bloque de cierre: van sobre el degradado de marca, así que todos
 *  son claros; uno oscuro ahí dentro se leería como una mancha sucia. */
const ORBES: Orbe[] = [
  { clase: '-top-24 -left-16 size-[360px] bg-white/20', duracion: 29, variante: 1 },
  { clase: '-right-20 -bottom-28 size-[320px] bg-[#c4b5fd]/30', duracion: 35, variante: 2 },
  { clase: 'top-[20%] right-[24%] size-[220px] bg-[#38bdf8]/20', duracion: 26, variante: 3 },
]

/** Llamado final + pie: van juntos porque comparten el ancla `#contacto`. */
export function CierreLanding() {
  return (
    <>
      <section id="contacto" className="px-5 pb-16 sm:px-8 sm:pb-20">
        <Revelable className="mx-auto max-w-[1200px]">
          <div className="marca-degradada relative overflow-hidden rounded-[22px] px-6 py-12 text-center shadow-[0_28px_60px_-28px_var(--rvr-primary)] sm:px-10 sm:py-16">
            <Orbes orbes={ORBES} />
            <Particulas cantidad={14} semilla={63} opacidadMaxima={0.5} />

            <h2 className="relative m-0 font-[family-name:var(--font-display)] text-[28px] leading-[1.15] font-extrabold tracking-[-1px] text-on-primary text-balance sm:text-[38px]">
              ¿Listo para resolver la tecnología de su empresa?
            </h2>
            <p className="relative mx-auto mt-4 mb-0 max-w-[560px] text-[14.5px] leading-[1.6] text-on-primary/85 text-pretty">
              Cuéntenos qué necesita y le enviamos una cotización sin compromiso en
              menos de 24 horas hábiles.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link
                to={ROUTES.catalogo}
                className="pintura-boton inline-flex h-[46px] items-center gap-2 rounded-[11px] bg-surface px-6 text-[13.5px] font-semibold text-fg"
              >
                Solicitar cotización
                <IcoFlecha width="15" height="15" />
              </Link>
              <Link
                to={ROUTES.registro}
                className="pintura-boton inline-flex h-[46px] items-center gap-2 rounded-[11px] border border-on-primary/35 px-6 text-[13.5px] font-semibold text-on-primary"
              >
                Crear mi cuenta
              </Link>
              <Link
                to={ROUTES.login}
                className="pintura-boton inline-flex h-[46px] items-center gap-2 rounded-[11px] border border-on-primary/35 px-6 text-[13.5px] font-semibold text-on-primary"
              >
                <IcoCandado width="14" height="14" />
                Ingresar al portal
              </Link>
            </div>
          </div>
        </Revelable>
      </section>

      <footer className="border-t border-border-base bg-surface-muted/50">
        <div className="mx-auto grid max-w-[1200px] gap-9 px-5 py-12 sm:px-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <span className="flex items-center gap-3">
              <IconoMarca tamano={44} radio="26%" alt="" />
              <span className="font-[family-name:var(--font-display)] text-[17px] font-bold text-fg">
                RvR Tecnologías
              </span>
            </span>
            <p className="mt-3.5 mb-0 max-w-[320px] text-[13px] leading-[1.6] text-fg-muted text-pretty">
              Soluciones a su alcance. Mantenimiento, redes, servidores y seguridad
              electrónica en Medellín, Colombia.
            </p>
          </div>

          <nav aria-label="Enlaces rápidos">
            <h3 className="m-0 text-[12px] font-bold tracking-[0.1em] text-fg uppercase">
              Enlaces rápidos
            </h3>
            <ul className="m-0 mt-3.5 flex list-none flex-col gap-2 p-0">
              {ENLACES.map((enlace) => (
                <li key={enlace.href}>
                  <a
                    href={enlace.href}
                    className="enlace-landing text-[13px] text-fg-muted transition-colors hover:text-fg"
                  >
                    {enlace.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h3 className="m-0 text-[12px] font-bold tracking-[0.1em] text-fg uppercase">
              Contacto
            </h3>
            <ul className="m-0 mt-3.5 flex list-none flex-col gap-2.5 p-0">
              {CONTACTO.map((dato) => {
                const Icono = dato.icono
                return (
                  <li key={dato.href}>
                    <a
                      href={dato.href}
                      {...(dato.externo
                        ? { target: '_blank', rel: 'noreferrer' }
                        : {})}
                      className="flex items-start gap-2.5 text-[13px] leading-[1.5] text-fg-muted transition-colors hover:text-fg"
                    >
                      <Icono
                        width="15"
                        height="15"
                        className="mt-px flex-none text-primary-on-soft"
                      />
                      {dato.etiqueta}
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          <div>
            <h3 className="m-0 text-[12px] font-bold tracking-[0.1em] text-fg uppercase">
              Políticas
            </h3>
            <ul className="m-0 mt-3.5 flex list-none flex-col gap-2 p-0">
              {POLITICAS.map((politica) => (
                <li key={politica} className="text-[13px] text-fg-muted">
                  {politica}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-border-base">
          <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-2 px-5 py-5 text-[12px] text-fg-subtle sm:px-8">
            <span>© 2026 RvR Tecnologías S.A.S. Todos los derechos reservados.</span>
            <span>NIT en trámite · Medellín, Antioquia, Colombia</span>
          </div>
        </div>
      </footer>
    </>
  )
}
