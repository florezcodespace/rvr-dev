import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { prefiereMenosMovimiento } from '@shared/hooks/useContador'
import { useCarrito } from '@shared/hooks/useCarrito'
import { cn } from '@shared/lib/cn'
import { formatearDuracion, formatearGarantia, formatearMoneda } from '@shared/lib/format'
import { CATALOGO, CATEGORIAS } from '../datos'
import { IcoFlecha } from './iconos'
import { Revelable, TituloSeccion } from './Seccion'

/** Cifra que corre hasta su nuevo valor (sin movimiento reducido, salta). */
function CifraViva({ valor }: { valor: number }) {
  const [mostrado, setMostrado] = useState(valor)
  const desde = useRef(valor)

  useEffect(() => {
    if (prefiereMenosMovimiento()) {
      setMostrado(valor)
      return
    }
    const inicio = performance.now()
    const origen = desde.current
    let cuadro = 0
    const paso = (t: number) => {
      const p = Math.min(1, (t - inicio) / 420)
      const v = Math.round(origen + (valor - origen) * (1 - Math.pow(1 - p, 3)))
      setMostrado(v)
      if (p < 1) cuadro = requestAnimationFrame(paso)
      else desde.current = valor
    }
    cuadro = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(cuadro)
  }, [valor])

  return <>{formatearMoneda(mostrado)}</>
}

/**
 * Cotizador: el visitante elige servicios del catálogo real por categoría y el
 * recibo de vidrio se arma solo (total desde, anticipo, tiempo y garantía).
 * «Solicitar esta cotización» deja los servicios en su solicitud del portal.
 */
export function Cotizador() {
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0])
  const [marcados, setMarcados] = useState<number[]>([1])
  const { agregar } = useCarrito()
  const navigate = useNavigate()

  const elegidos = useMemo(() => CATALOGO.filter((s) => marcados.includes(s.id)), [marcados])
  const total = elegidos.reduce((s, x) => s + x.precioBase, 0)
  const minutos = elegidos.reduce((s, x) => s + x.duracionMin, 0)
  const garantias = elegidos.map((x) => x.diasGarantia)
  const garantia =
    garantias.length === 0
      ? '—'
      : Math.min(...garantias) === Math.max(...garantias)
        ? formatearGarantia(garantias[0]!)
        : `${formatearGarantia(Math.min(...garantias))} a ${formatearGarantia(Math.max(...garantias))}`

  const alternar = (id: number) =>
    setMarcados((actual) => (actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id]))

  const solicitar = () => {
    if (!elegidos.length) return
    elegidos.forEach((s) => agregar({ servicioId: s.id, nombre: s.nombre, categoria: s.categoria, precioBase: s.precioBase }))
    navigate(ROUTES.portalSolicitar)
  }

  const cuantosEn = (c: string) => elegidos.filter((s) => s.categoria === c).length

  return (
    <section id="cotizador" aria-labelledby="titulo-cotizador" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <TituloSeccion
          antetitulo="Cotizador"
          titulo="Arme su cotización"
          destacado="en un minuto."
          descripcion="Marque lo que necesita y vea al instante el precio desde, cuánto tarda y cuánta garantía trae. Luego la envía desde su portal."
        />

        <Revelable retraso={100} className="mt-10">
          <div className="vidrio grid gap-6 rounded-[32px] border border-[var(--rvr-glass-borde)] p-4 sm:p-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] lg:gap-8 lg:p-8">
            <div className="min-w-0">
              {/* Control segmentado tipo iOS */}
              <div role="tablist" aria-label="Categorías" className="flex gap-1 overflow-x-auto rounded-[16px] bg-surface-muted p-1 [scrollbar-width:none]">
                {CATEGORIAS.map((c) => {
                  const sel = c === categoria
                  const n = cuantosEn(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      role="tab"
                      aria-selected={sel}
                      onClick={() => setCategoria(c)}
                      className={cn(
                        'relative flex flex-none cursor-pointer items-center gap-1.5 rounded-[12px] px-3.5 py-2 text-[13.5px] font-semibold whitespace-nowrap transition-all duration-200',
                        sel ? 'bg-surface-raised text-fg shadow-[var(--rvr-shadow-sm)]' : 'text-fg-subtle hover:text-fg',
                      )}
                    >
                      {c}
                      {n > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-primary text-[11.5px] font-bold text-white">{n}</span>
                      )}
                    </button>
                  )
                })}
              </div>

              <ul key={categoria} className="escalonado m-0 mt-4 flex list-none flex-col gap-2 p-0">
                {CATALOGO.filter((s) => s.categoria === categoria).map((s) => {
                  const on = marcados.includes(s.id)
                  return (
                    <li key={s.id} className="anim-entrada">
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-4 rounded-[18px] border p-4 transition-all duration-200',
                          on ? 'border-[var(--rvr-filo-tinte)] bg-primary-soft' : 'border-border-base bg-surface-raised hover:border-border-strong',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold text-fg">{s.nombre}</span>
                          <span className="block text-[13px] text-fg-subtle tabular-nums">
                            Desde {formatearMoneda(s.precioBase)} · {formatearDuracion(s.duracionMin)} · garantía de {formatearGarantia(s.diasGarantia)}
                          </span>
                        </span>
                        {/* Interruptor tipo iOS */}
                        <input type="checkbox" className="peer sr-only" checked={on} onChange={() => alternar(s.id)} />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'relative h-[30px] w-[50px] flex-none rounded-full transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--rvr-ring)]',
                            on ? 'bg-primary' : 'bg-[var(--rvr-border-strong)]',
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-[3px] left-[3px] size-6 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                              on && 'translate-x-5',
                            )}
                          />
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
            </div>

            {/* Recibo */}
            <div className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-[24px] bg-surface-raised p-5 shadow-[var(--rvr-shadow-card)] sm:p-6" aria-live="polite">
                <div className="flex items-center justify-between">
                  <span className="text-[15px] font-bold text-fg">Cotización estimada</span>
                  <span className="rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary-on-soft">
                    {elegidos.length} {elegidos.length === 1 ? 'servicio' : 'servicios'}
                  </span>
                </div>

                {elegidos.length ? (
                  <ul className="m-0 mt-4 flex list-none flex-col gap-2.5 p-0">
                    {elegidos.map((s) => (
                      <li key={s.id} className="anim-entrada flex justify-between gap-3 text-[14px]">
                        <span className="text-fg-muted">{s.nombre}</span>
                        <span className="font-semibold whitespace-nowrap text-fg tabular-nums">{formatearMoneda(s.precioBase)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="m-0 mt-4 text-[14px] text-fg-subtle">Active al menos un servicio para armar la cotización.</p>
                )}

                <div className="mt-5 border-t border-border-base pt-4">
                  <div className="text-[13px] text-fg-subtle">Total desde</div>
                  <div className="mt-1 text-[40px] leading-none font-extrabold tracking-[-1.5px] text-fg tabular-nums">
                    <CifraViva valor={total} />
                  </div>
                </div>

                <dl className="m-0 mt-5 grid grid-cols-3 gap-2">
                  {[
                    ['Anticipo 50 %', formatearMoneda(Math.round(total / 2))],
                    ['Tiempo', minutos ? formatearDuracion(minutos) : '—'],
                    ['Garantía', garantia],
                  ].map(([t, v]) => (
                    <div key={t} className="rounded-[14px] bg-surface-muted px-3 py-2.5">
                      <dt className="text-[12px] text-fg-subtle">{t}</dt>
                      <dd className="m-0 mt-0.5 text-[13.5px] font-bold text-fg tabular-nums">{v}</dd>
                    </div>
                  ))}
                </dl>

                <button
                  type="button"
                  onClick={solicitar}
                  disabled={!elegidos.length}
                  className="pintura-boton boton-liquido mt-5 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] text-[15px] font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Solicitar esta cotización
                  <IcoFlecha width="16" height="16" />
                </button>
                <p className="m-0 mt-3 text-[12.5px] leading-[1.5] text-fg-subtle">
                  Precios base de referencia. El valor final lo confirma la cotización que RvR le
                  envía a su portal. <Link to={ROUTES.catalogo} className="font-semibold text-link hover:underline">Ver catálogo completo</Link>
                </p>
              </div>
            </div>
          </div>
        </Revelable>
      </div>
    </section>
  )
}
