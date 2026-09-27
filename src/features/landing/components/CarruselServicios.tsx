import { useEffect, useState, type ComponentType, type SVGProps } from 'react'
import { cn } from '@shared/lib/cn'
import { prefiereMenosMovimiento } from '@shared/hooks/useContador'
import { Revelable, TituloSeccion } from './Seccion'
import { IcoCheck, IcoFlecha, IcoMantenimiento, IcoRedes, IcoCctv } from './iconos'

interface Destacado {
  etiqueta: string
  titulo: string
  resumen: string
  puntos: string[]
  icono: ComponentType<SVGProps<SVGSVGElement>>
  /** Token base del estado: se usa para el relleno suave. */
  color: string
  /** Variante legible del mismo color sobre superficie clara u oscura. */
  colorFg: string
}

const DESTACADOS: Destacado[] = [
  {
    etiqueta: 'Mantenimiento',
    titulo: 'Mantenimiento preventivo empresarial',
    resumen:
      'Optimización periódica de equipos informáticos para reducir fallas y prolongar su vida útil.',
    puntos: [
      'Diagnóstico completo de hardware y software',
      'Limpieza física y optimización de rendimiento',
      'Informe técnico detallado por equipo',
    ],
    icono: IcoMantenimiento,
    color: 'var(--rvr-estado-aprobada)',
    colorFg: 'var(--rvr-estado-aprobada-fg)',
  },
  {
    etiqueta: 'Infraestructura',
    titulo: 'Infraestructura de redes IP y servidores',
    resumen:
      'Conectividad estable y sin interrupciones para las operaciones diarias de su empresa.',
    puntos: [
      'Montaje y configuración de servidores dedicados',
      'Cableado estructurado certificado',
      'Monitoreo de red y almacenamiento',
    ],
    icono: IcoRedes,
    color: 'var(--rvr-estado-en-proceso)',
    colorFg: 'var(--rvr-estado-en-proceso-fg)',
  },
  {
    etiqueta: 'Seguridad',
    titulo: 'Seguridad integral: CCTV y alarmas',
    resumen:
      'Videovigilancia y seguridad electrónica pensadas para empresas y hogares en Medellín.',
    puntos: [
      'Instalación de sistemas de videovigilancia',
      'Configuración de alarmas y sensores',
      'Monitoreo remoto desde su celular',
    ],
    icono: IcoCctv,
    color: 'var(--rvr-estado-completada)',
    colorFg: 'var(--rvr-estado-completada-fg)',
  },
]

const INTERVALO = 6500

export function CarruselServicios() {
  const [activo, setActivo] = useState(0)
  /** Se detiene al interactuar: avanzar solo mientras el usuario lee molesta. */
  const [pausado, setPausado] = useState(false)

  useEffect(() => {
    if (pausado || prefiereMenosMovimiento()) return
    const reloj = window.setInterval(
      () => setActivo((i) => (i + 1) % DESTACADOS.length),
      INTERVALO,
    )
    return () => window.clearInterval(reloj)
  }, [pausado])

  const ir = (indice: number) => {
    setActivo((indice + DESTACADOS.length) % DESTACADOS.length)
    setPausado(true)
  }

  return (
    <section
      id="servicios"
      className="border-t border-border-base bg-surface-muted/40 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <TituloSeccion
          antetitulo="Servicios destacados"
          titulo="Casos de éxito recientes de nuestro equipo técnico"
          descripcion="Tres frentes que resolvemos a diario para empresas del Área Metropolitana, con el mismo estándar de diagnóstico, ejecución y garantía."
        />

        <Revelable className="mt-10" retraso={120}>
          <div
            className="overflow-hidden rounded-[18px]"
            onMouseEnter={() => setPausado(true)}
            onFocusCapture={() => setPausado(true)}
          >
            <div
              className="flex transition-transform duration-500 ease-[cubic-bezier(0.22,0.8,0.3,1)] motion-reduce:transition-none"
              style={{ transform: `translateX(-${activo * 100}%)` }}
            >
              {DESTACADOS.map((item, indice) => {
                const Icono = item.icono
                return (
                  <article
                    key={item.titulo}
                    aria-hidden={indice !== activo}
                    className="filo-fijo grid w-full flex-none gap-7 rounded-[18px] border border-border-base bg-surface p-6 sm:p-9 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
                  >
                    <div>
                      <span
                        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11.5px] font-bold tracking-[0.08em] uppercase"
                        style={{
                          color: item.colorFg,
                          background: `color-mix(in srgb, ${item.color} 14%, transparent)`,
                        }}
                      >
                        <Icono width="14" height="14" />
                        {item.etiqueta}
                      </span>
                      <h3 className="mt-4 mb-0 font-[family-name:var(--font-display)] text-[24px] leading-[1.2] font-bold tracking-[-0.7px] text-fg text-balance sm:text-[28px]">
                        {item.titulo}
                      </h3>
                      <p className="mt-3 mb-0 text-[14px] leading-[1.65] text-fg-muted text-pretty">
                        {item.resumen}
                      </p>
                      <a
                        href="#contacto"
                        tabIndex={indice === activo ? 0 : -1}
                        className="enlace-landing mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary-on-soft"
                      >
                        Saber más
                        <IcoFlecha width="14" height="14" />
                      </a>
                    </div>

                    <ul className="m-0 flex list-none flex-col justify-center gap-3 p-0">
                      {item.puntos.map((punto) => (
                        <li
                          key={punto}
                          className="flex items-start gap-3 rounded-[12px] border border-border-base bg-surface-muted/60 px-4 py-3.5 text-[13.5px] leading-[1.5] text-fg"
                        >
                          <IcoCheck
                            width="16"
                            height="16"
                            className="mt-px flex-none"
                            style={{ color: item.colorFg }}
                          />
                          {punto}
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>

          <div className="mt-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2" role="tablist" aria-label="Servicios destacados">
              {DESTACADOS.map((item, indice) => (
                <button
                  key={item.titulo}
                  type="button"
                  role="tab"
                  aria-selected={indice === activo}
                  aria-label={item.titulo}
                  onClick={() => ir(indice)}
                  className={cn(
                    'h-2 cursor-pointer rounded-full border-0 transition-all duration-300',
                    indice === activo
                      ? 'w-7 bg-[var(--rvr-primary)]'
                      : 'w-2 bg-border-strong hover:bg-fg-subtle',
                  )}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => ir(activo - 1)}
                aria-label="Servicio anterior"
                className="pintura-boton pintura-secundaria flex size-10 items-center justify-center rounded-[11px] text-fg"
              >
                <IcoFlecha width="15" height="15" className="rotate-180" />
              </button>
              <button
                type="button"
                onClick={() => ir(activo + 1)}
                aria-label="Servicio siguiente"
                className="pintura-boton pintura-secundaria flex size-10 items-center justify-center rounded-[11px] text-fg"
              >
                <IcoFlecha width="15" height="15" />
              </button>
            </div>
          </div>
        </Revelable>
      </div>
    </section>
  )
}
