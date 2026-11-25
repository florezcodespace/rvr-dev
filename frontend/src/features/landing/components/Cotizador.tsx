import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { prefiereMenosMovimiento } from '@shared/hooks/useContador'
import { storage } from '@shared/lib/storage'
import { CLAVE_REPUESTOS, useCarrito } from '@shared/hooks/useCarrito'
import { cn } from '@shared/lib/cn'
import { formatearDuracion, formatearGarantia, formatearMoneda } from '@shared/lib/format'
import type { ServicioCatalogo } from '@shared/lib/catalogo'
import { descargarPdf, nombreConFecha } from '@shared/lib/exportar'
import { useAuth } from '@features/auth'
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
export function Cotizador({ catalogo }: { catalogo: ServicioCatalogo[] }) {
  const categorias = [...new Set(catalogo.map((s) => s.categoria))]
  const { usuario } = useAuth()
  const [titular, setTitular] = useState('')
  const [categoria, setCategoria] = useState('Todos')
  const [busqueda, setBusqueda] = useState('')
  const [repuestos, setRepuestos] = useState(() => storage.get(CLAVE_REPUESTOS, ''))
  const normalizar = (texto: string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  const visibles = catalogo.filter((s) => (categoria === 'Todos' || s.categoria === categoria) && normalizar(s.nombre + ' ' + s.categoria).includes(normalizar(busqueda.trim())))
  const [marcados, setMarcados] = useState<number[]>(() => catalogo.slice(0, 1).map((s) => s.id))
  const { agregar, tiene } = useCarrito()
  const navigate = useNavigate()

  const elegidos = catalogo.filter((s) => marcados.includes(s.id))
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

  const solicitar = (destino: string) => {
    if (!elegidos.length) return
    elegidos.filter((s) => !tiene(s.id)).forEach((s) => agregar({ servicioId: s.id, nombre: s.nombre, categoria: s.categoria, precioBase: s.precioBase }))
    storage.set(CLAVE_REPUESTOS, repuestos.trim())
    navigate(destino)
  }

  const guardarPdf = () => {
    if (!titular.trim() || !elegidos.length) return
    descargarPdf<ServicioCatalogo>(
      nombreConFecha('cotizacion-estimada-rvr', 'pdf'),
      { titulo: 'Cotización estimada', lineas: [
        `A nombre de: ${titular.trim()}`,
        ...(repuestos.trim() ? ['Repuestos por valorar (fuera del total):', ...(repuestos.trim().replace(/\s+/g, ' ').match(/.{1,90}(?:\s|$)|.{1,90}/g) ?? [])] : []),
        'Precios de referencia en pesos colombianos. RvR confirma el valor final al enviar la cotización.',
      ] },
      [
        { titulo: 'Servicio', valor: (s) => s.nombre, ancho: 3 },
        { titulo: 'Duración', valor: (s) => formatearDuracion(s.duracionMin) },
        { titulo: 'Garantía', valor: (s) => formatearGarantia(s.diasGarantia) },
        { titulo: 'Precio desde', valor: (s) => s.precioBase, tipo: 'moneda' },
      ],
      elegidos,
      ['Total estimado', null, null, total],
      [{ etiqueta: 'Anticipo estimado (50 %)', valor: formatearMoneda(Math.round(total / 2)) }],
    )
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
              <label htmlFor="buscar-cotizador" className="mb-2 block text-lg font-bold text-fg">Servicios disponibles</label>
              <input id="buscar-cotizador" type="search" placeholder="Buscar por servicio o categoría" value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)} className="mb-3 w-full rounded-2xl border border-border-strong bg-surface-raised px-4 py-3 text-fg" />
              <div role="tablist" aria-label="Categorías" className="flex flex-wrap gap-1 rounded-[16px] bg-surface-muted p-1 [scrollbar-width:none]">
                {['Todos', ...categorias].map((c) => {
                  const sel = c === categoria
                  const n = c === 'Todos' ? elegidos.length : cuantosEn(c)
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
                {visibles.map((s) => {
                  const on = marcados.includes(s.id)
                  return (
                    <li key={s.id} className="anim-entrada">
                      <label
                        className={cn(
                          'flex cursor-pointer items-center gap-2 sm:gap-4 rounded-[18px] border p-4 transition-all duration-200',
                          on ? 'border-[var(--rvr-filo-tinte)] bg-primary-soft' : 'border-border-base bg-surface-raised hover:border-border-strong',
                        )}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold text-fg">{s.nombre}</span>
                          <span className="block text-[13px] text-fg-subtle tabular-nums">
                            {s.categoria} · {formatearDuracion(s.duracionMin)} · garantía de {formatearGarantia(s.diasGarantia)}
                          </span>
                        </span>
                        <strong className="shrink-0 text-sm tabular-nums text-primary-on-soft">{formatearMoneda(s.precioBase)}</strong>
                        <input type="checkbox" className="peer sr-only" checked={on} onChange={() => alternar(s.id)} />
                        <span
                          aria-hidden="true"
                          className={cn(
                            'relative h-[26px] w-[44px] flex-none rounded-full transition-colors duration-200 peer-focus-visible:ring-[3px] peer-focus-visible:ring-[var(--rvr-ring)]',
                            on ? 'bg-primary' : 'bg-[var(--rvr-border-strong)]',
                          )}
                        >
                          <span
                            className={cn(
                              'absolute top-[3px] left-[3px] size-5 rounded-full bg-white shadow-[0_2px_6px_rgb(0_0_0/0.2)] transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]',
                              on && 'translate-x-[18px]',
                            )}
                          />
                        </span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              {!visibles.length && <p role="status" className="p-3 text-sm text-fg-muted">Sin servicios para esta búsqueda.</p>}
              <label htmlFor="repuestos-cotizador" className="mt-5 block text-sm font-bold text-fg">Repuestos o insumos (opcional)</label>
              <p id="ayuda-repuestos" className="my-1 text-sm text-fg-muted">Indique la pieza, referencia y cantidad. RvR confirmará el precio al valorar la solicitud.</p>
              <textarea id="repuestos-cotizador" aria-describedby="ayuda-repuestos" rows={2} maxLength={240} value={repuestos}
                onChange={(e) => setRepuestos(e.target.value)} className="w-full rounded-2xl border border-border-base bg-surface-raised p-3 text-fg" />
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

                {repuestos.trim() && <p className="mt-3 rounded-xl bg-surface-muted p-3 text-sm text-fg-muted"><strong>Repuestos por valorar</strong><br />{repuestos}</p>}
                <div className="mt-5 border-t border-border-base pt-4">
                  <div className="text-[13px] text-fg-subtle">Total desde</div>
                  <div className="mt-1 text-primary-on-soft text-[40px] leading-none font-extrabold tracking-[-1.5px] tabular-nums">
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

                <form className="mt-5 border-t border-border-base pt-4" onSubmit={(e) => { e.preventDefault(); guardarPdf() }}>
                  <label className="block text-sm font-semibold text-fg" htmlFor="titular-estimacion">A nombre de</label>
                  <input id="titular-estimacion" autoComplete="name" maxLength={100} required value={titular}
                    placeholder="Nombre de la persona o empresa" aria-describedby="ayuda-pdf"
                    onChange={(e) => setTitular(e.target.value)} className="mt-2 min-h-12 w-full rounded-2xl border border-border-strong bg-surface-raised px-4 text-base text-fg placeholder:text-fg-subtle focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link" />
                  <p id="ayuda-pdf" className="mt-2 text-sm text-fg-subtle">
                    {elegidos.length ? 'Este nombre aparecerá en la estimación.' : 'Seleccione al menos un servicio para descargar la estimación.'}
                  </p>
                  <button type="submit" disabled={!titular.trim() || !elegidos.length}
                    className="mt-3 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-2xl border border-transparent bg-primary px-4 py-3 font-semibold text-on-primary shadow-[var(--rvr-shadow-sm)] transition-[background-color,transform] enabled:hover:bg-primary-hover enabled:active:scale-[0.985] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:border-border-base disabled:bg-surface-muted disabled:text-fg-subtle disabled:shadow-none motion-reduce:transition-none motion-reduce:active:scale-100">
                    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3v12m-5-5 5 5 5-5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
                    </svg>
                    Descargar estimación en PDF
                  </button>
                </form>
                {(!usuario || usuario.tipo === 'cliente') && <button
                  type="button"
                  onClick={() => solicitar(usuario ? ROUTES.portalSolicitar : ROUTES.registro)}
                  disabled={!elegidos.length}
                  className="pintura-boton boton-liquido mt-5 flex h-[52px] w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] text-[15px] font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {usuario ? 'Solicitar esta cotización' : 'Registrarme con esta selección'}
                  <IcoFlecha width="16" height="16" />
                </button>}
                {!usuario && <button type="button" disabled={!elegidos.length} onClick={() => solicitar(ROUTES.login)}
                  className="mt-3 w-full text-sm font-semibold text-link disabled:opacity-60">Ya tengo cuenta · Iniciar sesión</button>}
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
