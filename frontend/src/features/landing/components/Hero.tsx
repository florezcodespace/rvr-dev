import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Orbes, type Orbe } from '@shared/components/decor'
import { TextoAnimado } from '@shared/components/ui'
import { varsCss } from '@shared/lib/varsCss'
import { ETAPAS } from '../datos'
import { IcoCandado, IcoCheck, IcoFlecha, IcoGarantia, IcoUbicacion } from './iconos'

/** Luces del hero en los azules del logo: veladas, para que el vidrio respire. */
const ORBES: Orbe[] = [
  { clase: '-top-40 -left-32 size-[520px] bg-[#7fb5ff]/40 dark:bg-[#0a6cf0]/25', duracion: 30, variante: 1 },
  { clase: '-top-24 right-[4%] size-[420px] bg-[#b6d6ff]/50 dark:bg-[#0050c8]/25', duracion: 36, variante: 2 },
  { clase: 'bottom-[-22%] left-[30%] size-[460px] bg-[#9cc8ff]/35 dark:bg-[#1e88ff]/15', duracion: 27, variante: 3 },
]

const DATOS = [
  { titulo: '5 frentes', texto: 'con un mismo equipo técnico', Icono: IcoCheck },
  { titulo: 'Anticipo del 50 %', texto: 'y el saldo al terminar', Icono: IcoCandado },
  { titulo: 'Garantía por escrito', texto: 'en cada servicio', Icono: IcoGarantia },
]

/** Etapas ya cumplidas en la orden de muestra (las 3 primeras) y la actual. */
const ACTUAL = 3

/** Inclina la tarjeta hacia el cursor (máx. 7°) y la suelta al salir. */
function inclinar(e: PointerEvent<HTMLDivElement>) {
  if (e.pointerType !== 'mouse') return
  const el = e.currentTarget
  const r = el.getBoundingClientRect()
  const x = (e.clientX - r.left) / r.width - 0.5
  const y = (e.clientY - r.top) / r.height - 0.5
  el.style.setProperty('--ry', `${(x * 14).toFixed(2)}deg`)
  el.style.setProperty('--rx', `${(-y * 10).toFixed(2)}deg`)
}
function soltar(e: PointerEvent<HTMLDivElement>) {
  e.currentTarget.style.setProperty('--ry', '0deg')
  e.currentTarget.style.setProperty('--rx', '0deg')
}

export function Hero() {
  return (
    <section id="presentacion" className="relative overflow-hidden">
      <Orbes orbes={ORBES} />

      <div className="relative mx-auto grid max-w-[1200px] items-center gap-14 px-5 py-14 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14 lg:py-24">
        <div>
          <p
            className="vidrio anim-entrada m-0 inline-flex items-center gap-2 rounded-full border border-[var(--rvr-glass-borde)] py-1.5 pr-4 pl-1.5 text-[13px] font-semibold text-fg-muted"
            style={varsCss({ '--retraso': '60ms' })}
          >
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-white">
              <IcoUbicacion width="14" height="14" />
            </span>
            Medellín y Área Metropolitana
          </p>

          <h1 className="mt-6 mb-0 text-[38px] leading-[1.06] font-extrabold tracking-[-1.6px] text-fg text-balance sm:text-[52px] lg:text-[58px]">
            <TextoAnimado texto="Toda la tecnología de su empresa" retraso={140} paso={60} />{' '}
            <span className="text-primary">
              <TextoAnimado texto="en manos de un solo equipo" retraso={480} paso={60} />
            </span>
          </h1>

          <p
            className="anim-entrada mt-6 mb-0 max-w-[560px] text-[17px] leading-[1.65] text-fg-muted text-pretty"
            style={varsCss({ '--retraso': '860ms' })}
          >
            Mantenimiento de computadores e impresoras, servidores, redes, cámaras de
            seguridad y alarmas. Y cada orden la sigue usted en línea, desde su portal.
          </p>

          <div className="anim-entrada mt-8 flex flex-wrap gap-3" style={varsCss({ '--retraso': '980ms' })}>
            <a
              href="#cotizador"
              className="pintura-boton pintura-primaria inline-flex h-[52px] items-center gap-2 rounded-[16px] px-6 text-[15px] font-semibold text-on-primary"
            >
              Arme su cotización
              <IcoFlecha width="16" height="16" />
            </a>
            <a
              href="#servicios"
              className="pintura-boton pintura-secundaria inline-flex h-[52px] items-center gap-2 rounded-[16px] border border-border-base px-6 text-[15px] font-semibold text-fg"
            >
              Ver servicios
            </a>
          </div>

          <ul className="escalonado m-0 mt-10 grid max-w-[600px] list-none grid-cols-1 gap-3 p-0 sm:grid-cols-3">
            {DATOS.map(({ titulo, texto, Icono }) => (
              <li
                key={titulo}
                className="vidrio reflejo anim-entrada flex items-center gap-3 rounded-[18px] border border-[var(--rvr-glass-borde)] px-3.5 py-3 sm:flex-col sm:items-start sm:gap-2"
              >
                <span className="flex size-8 flex-none items-center justify-center rounded-[10px] bg-primary-soft text-primary-on-soft">
                  <Icono width="16" height="16" />
                </span>
                <span>
                  <span className="block text-[14.5px] leading-tight font-bold text-fg">{titulo}</span>
                  <span className="block text-[12.5px] text-fg-subtle">{texto}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Muestra de una orden en el portal del cliente */}
        <div className="inclinable relative mx-auto w-full max-w-[500px] lg:mx-0" onPointerMove={inclinar} onPointerLeave={soltar}>
          <div
            className="vidrio reflejo anim-entrada anim-mecer relative rounded-[28px] border border-[var(--rvr-glass-borde)] p-5 sm:p-6"
            style={varsCss({ '--retraso': '560ms' })}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-semibold text-fg-subtle">Su portal · ejemplo de una orden</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--rvr-estado-en-proceso-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rvr-estado-en-proceso-fg)]">
                <span aria-hidden="true" className="anim-pulso size-1.5 rounded-full bg-[var(--rvr-estado-en-proceso)]" />
                En proceso
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3.5">
              <span className="flex size-12 flex-none items-center justify-center rounded-[15px] bg-ink text-[13px] font-bold text-white">OS</span>
              <span className="min-w-0">
                <span className="block text-[17px] font-bold tracking-[-0.3px] text-fg">Kit de videovigilancia</span>
                <span className="block text-[13px] text-fg-subtle">OS-2026-0150 · Bodega, Itagüí</span>
              </span>
            </div>

            {/* Recorrido: puntos cumplidos en azul, el actual late. */}
            <ol className="m-0 mt-5 grid list-none grid-cols-6 gap-1.5 p-0" aria-label="Etapas de la orden">
              {ETAPAS.map((etapa, i) => (
                <li key={etapa.nombre} className="flex flex-col items-center gap-1.5">
                  <span
                    className={
                      i < ACTUAL
                        ? 'h-1.5 w-full rounded-full bg-primary'
                        : i === ACTUAL
                          ? 'anim-pulso h-1.5 w-full rounded-full bg-[var(--rvr-azul-vivo)]'
                          : 'h-1.5 w-full rounded-full bg-[var(--rvr-track)]'
                    }
                  />
                  <span className={i <= ACTUAL ? 'text-[11.5px] font-semibold text-fg' : 'text-[11.5px] text-fg-faint'}>{etapa.nombre}</span>
                </li>
              ))}
            </ol>

            <ul className="escalonado m-0 mt-5 flex list-none flex-col gap-2 p-0">
              {[
                ['Visita', 'Jueves · 8:00 a 10:00', 'Técnico asignado'],
                ['Anticipo 50 %', '$ 825.000', 'Aprobado'],
                ['Saldo', '$ 825.000', 'Al terminar'],
              ].map(([t, v, e], i) => (
                <li key={t} className="anim-entrada flex items-center justify-between gap-3 rounded-[16px] bg-surface-muted px-3.5 py-3">
                  <span>
                    <span className="block text-[12.5px] text-fg-subtle">{t}</span>
                    <span className="block text-[14.5px] font-semibold text-fg tabular-nums">{v}</span>
                  </span>
                  <span
                    className={
                      i === 1
                        ? 'inline-flex items-center gap-1 rounded-full bg-[var(--rvr-estado-completada-soft)] px-2.5 py-1 text-[12px] font-semibold text-[var(--rvr-estado-completada-fg)]'
                        : 'rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary-on-soft'
                    }
                  >
                    {i === 1 && <IcoCheck width="12" height="12" />}
                    {e}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Aviso flotante */}
          <div
            className="vidrio-denso anim-entrada absolute -top-14 -right-2 hidden items-center gap-3 rounded-[18px] border border-[var(--rvr-glass-borde)] px-3.5 py-2.5 sm:flex lg:-right-8"
            style={varsCss({ '--retraso': '1300ms' })}
          >
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-primary text-white">
              <IcoCheck width="16" height="16" />
            </span>
            <span>
              <span className="block text-[13px] font-bold text-fg">Visita confirmada</span>
              <span className="block text-[12px] text-fg-subtle">Ahora · Portal RvR</span>
            </span>
          </div>

          <div
            className="vidrio-denso anim-entrada absolute -bottom-6 -left-3 hidden items-center gap-3 rounded-[18px] border border-[var(--rvr-glass-borde)] px-3.5 py-2.5 sm:flex lg:-left-10"
            style={varsCss({ '--retraso': '1500ms' })}
          >
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-ink text-white">
              <IcoGarantia width="16" height="16" />
            </span>
            <span>
              <span className="block text-[13px] font-bold text-fg">Garantía de 1 año</span>
              <span className="block text-[12px] text-fg-subtle">Desde el día de la entrega</span>
            </span>
          </div>

          <div className="mt-10 text-center lg:hidden">
            <Link to={ROUTES.login} className="text-[13.5px] font-semibold text-link">
              Ingresar a mi portal →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
