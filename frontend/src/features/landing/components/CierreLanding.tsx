import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { GlassFold } from '@shared/components/decor'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { varsCss } from '@shared/lib/varsCss'
import { CONTACTO } from '../datos'
import { IcoCorreo, IcoFlecha, IcoTelefono, IcoUbicacion } from './iconos'
import { Revelable } from './Seccion'

const CANALES = [
  { titulo: 'Llámenos o escríbanos', valor: CONTACTO.telefono, href: CONTACTO.telefonoHref, icono: IcoTelefono, externo: false },
  { titulo: 'Correo', valor: CONTACTO.correo, href: `mailto:${CONTACTO.correo}`, icono: IcoCorreo, externo: false },
  { titulo: 'Visítenos', valor: `${CONTACTO.direccion}, Medellín`, href: CONTACTO.mapa, icono: IcoUbicacion, externo: true },
]

const ENLACES = [
  { href: '#servicios', label: 'Servicios' },
  { href: '#portal', label: 'Su portal' },
  { href: '#proceso', label: 'Cómo trabajamos' },
  { href: '#cotizador', label: 'Cotizador' },
  { href: '#nosotros', label: 'Por qué RvR' },
]

/** Llamado final (azul tinta con luces y vidrio) + pie de vidrio. */
export function CierreLanding() {
  return (
    <>
      <section id="contacto" className="px-4 pb-16 sm:px-8 sm:pb-20">
        <Revelable className="mx-auto max-w-[1200px]">
          <div className="relative overflow-hidden rounded-[36px] bg-ink px-6 py-12 sm:px-12 sm:py-16">
            {/* Vidrio doblado en los azules del logo; un velo a la izquierda deja leer el texto */}
            <div aria-hidden="true" className="absolute inset-0">
              <GlassFold color1="#0a6cf0" color2="#0f1a2e" color3="#8ec5ff" speed={0.3} scale={0.85} noise={0.05} />
              <div className="absolute inset-0 bg-[#0b1424]/45" />
            </div>
            <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-center">
              <div>
                <h2 className="m-0 max-w-[560px] text-[32px] leading-[1.1] font-extrabold tracking-[-1.2px] text-white text-balance sm:text-[44px]">
                  ¿Hablamos de la tecnología de su empresa?
                </h2>
                <p className="mt-4 mb-0 max-w-[520px] text-[16px] leading-[1.65] text-[#c6d4e8]">
                  Cuéntenos qué necesita. Le respondemos con una cotización detallada y, si la
                  aprueba, agendamos la visita.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="#cotizador"
                    className="pintura-boton boton-liquido-claro inline-flex h-[52px] items-center gap-2 rounded-[16px] px-6 text-[15px] font-semibold"
                  >
                    Arme su cotización
                    <IcoFlecha width="16" height="16" />
                  </a>
                  <Link
                    to={ROUTES.registro}
                    className="vidrio-oscuro pintura-boton inline-flex h-[52px] items-center rounded-[16px] px-6 text-[15px] font-semibold text-white hover:bg-white/15"
                  >
                    Crear mi cuenta
                  </Link>
                </div>
              </div>

              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {CANALES.map((c, i) => {
                  const Icono = c.icono
                  return (
                    <li key={c.titulo} className="anim-entrada" style={varsCss({ '--retraso': `${200 + i * 90}ms` })}>
                      <a
                        href={c.href}
                        {...(c.externo ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="vidrio-oscuro reflejo flex items-center gap-4 rounded-[20px] px-5 py-4 transition-[background-color,transform] duration-200 hover:-translate-y-0.5 hover:bg-white/12"
                      >
                        <span className="flex size-11 flex-none items-center justify-center rounded-[14px] bg-[#0a6cf0] text-white">
                          <Icono width="19" height="19" />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[13px] text-[#9fb6d6]">{c.titulo}</span>
                          <span className="block truncate text-[16px] font-semibold text-white">{c.valor}</span>
                        </span>
                      </a>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </Revelable>
      </section>

      <footer className="px-4 pb-6 sm:px-8">
        <div className="vidrio mx-auto max-w-[1200px] rounded-[28px] border border-[var(--rvr-glass-borde)] px-6 py-8 sm:px-10">
          <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
            <div>
              <span className="flex items-center gap-3">
                <IconoMarca tamano={44} radio="28%" alt="" />
                <span>
                  <span className="block text-[17px] font-bold text-fg">RvR Tecnologías</span>
                  <span className="block text-[13px] text-fg-subtle">Soluciones a su alcance</span>
                </span>
              </span>
              <p className="mt-4 mb-0 max-w-[340px] text-[14px] leading-[1.6] text-fg-muted">
                Mantenimiento, redes, servidores, cámaras y alarmas en Medellín y el Área
                Metropolitana.
              </p>
            </div>
            <nav aria-label="Enlaces del pie">
              <h3 className="m-0 text-[14px] font-bold text-fg">En esta página</h3>
              <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                {ENLACES.map((e) => (
                  <li key={e.href}>
                    <a href={e.href} className="enlace-landing text-[14px] text-fg-muted transition-colors hover:text-fg">
                      {e.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div>
              <h3 className="m-0 text-[14px] font-bold text-fg">Portal</h3>
              <ul className="m-0 mt-3 flex list-none flex-col gap-2 p-0">
                <li><Link to={ROUTES.login} className="enlace-landing text-[14px] text-fg-muted hover:text-fg">Ingresar al portal</Link></li>
                <li><Link to={ROUTES.registro} className="enlace-landing text-[14px] text-fg-muted hover:text-fg">Crear mi cuenta</Link></li>
                <li><Link to={ROUTES.catalogo} className="enlace-landing text-[14px] text-fg-muted hover:text-fg">Catálogo de servicios</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap justify-between gap-2 border-t border-border-base pt-5 text-[13px] text-fg-subtle">
            <span>© {new Date().getFullYear()} RvR Tecnologías S.A.S.</span>
            <span>Medellín, Antioquia, Colombia</span>
          </div>
        </div>
      </footer>
    </>
  )
}
