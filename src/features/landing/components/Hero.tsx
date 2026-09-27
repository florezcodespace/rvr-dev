import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { ESTADO_ORDEN_META, type EstadoOrden } from '@shared/domain/estados'
import { Orbes, Particulas, type Orbe } from '@shared/components/decor'
import { TextoAnimado } from '@shared/components/ui'
import { useContador } from '@shared/hooks/useContador'
import { varsCss } from '@shared/lib/varsCss'
import { IcoFlecha, IcoUbicacion } from './iconos'

/** Muestra del tablero interno: son las mismas etiquetas de estado del portal. */
const MUESTRA: { equipo: string; sede: string; estado: EstadoOrden }[] = [
  { equipo: 'Servidor', sede: 'Sede Norte', estado: 'en_proceso' },
  { equipo: 'CCTV', sede: 'Bodega Sur', estado: 'finalizada' },
  { equipo: 'Cableado', sede: 'Oficina 302', estado: 'en_espera_repuesto' },
]

/**
 * Orbes del hero. En claro van muy velados —el fondo es blanco y cualquier
 * mancha compite con el titular— y en oscuro suben bastante, porque sobre negro
 * casi no se ven.
 */
const ORBES: Orbe[] = [
  { clase: '-top-32 -left-24 size-[460px] bg-[#4f46e5]/20 dark:bg-[#4338ca]/30', duracion: 30, variante: 1 },
  { clase: '-top-20 right-[6%] size-[380px] bg-[#7c3aed]/16 dark:bg-[#6d28d9]/28', duracion: 36, variante: 2 },
  { clase: 'bottom-[-18%] left-[22%] size-[420px] bg-[#38bdf8]/16 dark:bg-[#0ea5e9]/18', duracion: 27, variante: 3 },
  { clase: 'top-[42%] right-[28%] size-[260px] bg-[#a78bfa]/18 dark:bg-[#7c3aed]/24', duracion: 33, variante: 2 },
]

/** Cifras de respaldo. Solo la primera cuenta; las otras dos son texto fijo. */
const CIFRAS: { texto?: string; cuenta?: boolean; etiqueta: string }[] = [
  { cuenta: true, etiqueta: 'servicios ejecutados' },
  { texto: '10+', etiqueta: 'años en Medellín' },
  { texto: '24 h', etiqueta: 'para su cotización' },
]

function Contador() {
  const valor = useContador(500, 1600)
  return <>+{valor}</>
}

export function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <Orbes orbes={ORBES} />
      <Particulas
        cantidad={18}
        semilla={5}
        opacidadMaxima={0.34}
        puntoClase="bg-[var(--rvr-primary)] dark:bg-[#a5b4fc]"
      />

      {/* La retícula va en su propia capa: la máscara radial que la difumina
          también recortaría el texto si viviera en la misma caja. */}
      <div
        aria-hidden="true"
        className="reticula-hero pointer-events-none absolute inset-0"
      />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:py-24">
        <div>
          <p
            className="anim-entrada m-0 inline-flex items-center gap-2 rounded-full border border-border-base bg-surface/80 py-1.5 pr-4 pl-2 text-[12px] font-medium text-fg-muted shadow-[var(--rvr-shadow-card)] backdrop-blur-sm"
            style={varsCss({ '--retraso': '60ms' })}
          >
            <span className="flex size-6 items-center justify-center rounded-full bg-primary-soft text-primary-on-soft">
              <IcoUbicacion width="13" height="13" />
            </span>
            Medellín y Área Metropolitana
            <span className="mx-0.5 h-3 w-px bg-border-strong" />
            <span className="anim-pulso size-1.5 rounded-full bg-[var(--rvr-estado-completada)]" />
            Atendiendo hoy
          </p>

          <h1 className="resplandor mt-5 mb-0 font-[family-name:var(--font-display)] text-[34px] leading-[1.08] font-extrabold tracking-[-1.4px] text-fg text-balance sm:text-[46px] lg:text-[52px]">
            <TextoAnimado
              texto="La continuidad operativa de su empresa,"
              retraso={140}
              paso={48}
            />{' '}
            {/* Color sólido y no degradado recortado al texto: `TextoAnimado`
                mete cada palabra en una caja con `overflow: hidden`, y ahí el
                recorte al glifo deja de aplicarse y el texto desaparece. */}
            <span className="text-primary-on-soft">
              <TextoAnimado
                texto="sostenida por tecnología en la que puede confiar."
                retraso={470}
                paso={48}
              />
            </span>
          </h1>

          <p
            className="anim-entrada mt-5 mb-0 max-w-[560px] text-[15px] leading-[1.65] text-fg-muted text-pretty"
            style={varsCss({ '--retraso': '900ms' })}
          >
            Mantenimiento, redes, servidores y seguridad electrónica para empresas y
            hogares en Medellín. Un solo equipo técnico, diagnósticos certeros y
            respuesta cuando la necesita.
          </p>

          <div
            className="anim-entrada mt-7 flex flex-wrap gap-3"
            style={varsCss({ '--retraso': '1020ms' })}
          >
            <Link
              to={ROUTES.catalogo}
              className="pintura-boton pintura-primaria inline-flex h-[48px] items-center gap-2 rounded-[12px] px-6 text-[13.5px] font-semibold text-on-primary shadow-[0_14px_30px_-12px_var(--rvr-primary)]"
            >
              Solicitar cotización
              <IcoFlecha width="15" height="15" />
            </Link>
            <a
              href="#servicios"
              className="pintura-boton pintura-secundaria inline-flex h-[48px] items-center gap-2 rounded-[12px] px-6 text-[13.5px] font-semibold text-fg"
            >
              Ver nuestros servicios
            </a>
          </div>

          <dl
            className="anim-entrada mt-9 grid max-w-[520px] grid-cols-3 gap-4 border-t border-border-base pt-6"
            style={varsCss({ '--retraso': '1140ms' })}
          >
            {/* Orden invertido con flex: dentro de un `dl` el término va antes
                que la definición, pero la cifra tiene que verse encima. */}
            {CIFRAS.map((cifra) => (
              <div key={cifra.etiqueta} className="flex flex-col-reverse">
                <dt className="mt-1.5 text-[11.5px] leading-[1.35] text-fg-subtle">
                  {cifra.etiqueta}
                </dt>
                <dd className="m-0 font-[family-name:var(--font-display)] text-[28px] leading-none font-extrabold tracking-[-1px] text-fg tabular-nums sm:text-[32px]">
                  {cifra.cuenta ? <Contador /> : cifra.texto}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div
          className="anim-entrada anim-mecer filo-fijo rounded-[20px] border border-border-base bg-surface p-5 sm:p-6"
          style={varsCss({ '--retraso': '620ms' })}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="anim-pulso size-2 flex-none rounded-full bg-[var(--rvr-estado-completada)]" />
              <span className="text-[13px] font-semibold text-fg">
                Así se ve su operación
              </span>
            </div>
            <Link
              to={ROUTES.login}
              className="enlace-landing text-[12px] font-medium text-primary-on-soft"
            >
              Ingresar
            </Link>
          </div>

          <ul className="escalonado m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
            {MUESTRA.map((fila) => {
              const meta = ESTADO_ORDEN_META[fila.estado]
              return (
                <li
                  key={fila.sede}
                  className="anim-entrada flex items-center justify-between gap-3 rounded-[13px] border border-border-base bg-surface-muted/60 px-3.5 py-3"
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="size-8 flex-none rounded-[10px]"
                      style={{
                        background: `color-mix(in srgb, ${meta.color} 16%, transparent)`,
                        border: `1px solid color-mix(in srgb, ${meta.color} 32%, transparent)`,
                      }}
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-fg">
                        {fila.equipo}
                      </span>
                      <span className="block truncate text-[11.5px] text-fg-subtle">
                        {fila.sede}
                      </span>
                    </span>
                  </span>
                  <span
                    className={`inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.badge}`}
                  >
                    <span aria-hidden="true">{meta.glifo}</span>
                    {meta.label}
                  </span>
                </li>
              )
            })}
          </ul>

          <p className="m-0 mt-4 text-[11.5px] leading-[1.5] text-fg-subtle">
            Cada orden queda registrada con su técnico, su evidencia y su fecha de
            cierre. Consulte el avance de las suyas ingresando al portal.
          </p>
        </div>
      </div>
    </section>
  )
}
