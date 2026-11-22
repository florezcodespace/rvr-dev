import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Orbes, type Orbe } from '@shared/components/decor'
import { IconCheck } from '@shared/components/icons'
import { Logo, TextoAnimado } from '@shared/components/ui'
import { varsCss } from '@shared/lib/varsCss'

const BENEFICIOS = [
  ['Un solo equipo', 'Computadores, redes, servidores, cámaras y alarmas'],
  ['Todo a la vista', 'Cada orden con su técnico, su visita y su pago'],
  ['Acceso seguro', 'Roles y permisos, con registro de ingresos'],
] as const

/** Luces del panel en los azules del logo: se mueven despacio detrás del vidrio. */
const ORBES: Orbe[] = [
  { clase: '-top-28 -right-24 size-[440px] bg-[#0a6cf0]/55', duracion: 28, variante: 1 },
  { clase: '-bottom-32 right-8 size-[320px] bg-[#1e88ff]/35', duracion: 34, variante: 2 },
  { clase: 'top-[38%] -left-28 size-[340px] bg-[#0050c8]/45', duracion: 31, variante: 3 },
  { clase: 'top-[10%] left-[30%] size-[200px] bg-[#8ec5ff]/20', duracion: 25, variante: 2 },
]

/**
 * Panel izquierdo del login: azul tinta del logo con luces azules en
 * movimiento y tarjetas de vidrio oscuro. Sin fotos ni degradados.
 */
export function BrandPanel() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden bg-ink p-12 lg:flex lg:w-[42%] lg:flex-none xl:p-14"
      aria-label="Portal RvR Tecnologías"
    >
      <Orbes orbes={ORBES} />

      <Link to={ROUTES.inicio} className="anim-entrada relative w-fit rounded-[14px]">
        <Logo variant="onBrand" />
      </Link>

      <div className="relative flex flex-col gap-7">
        <h1 className="m-0 max-w-[440px] text-[42px] leading-[1.1] font-bold tracking-[-1.4px] text-white text-balance">
          <TextoAnimado texto="Toda la operación técnica en un solo lugar." retraso={120} paso={70} />
        </h1>
        <p
          className="anim-entrada m-0 max-w-[400px] text-[15px] leading-[1.6] text-[#c6d4e8]"
          style={varsCss({ '--retraso': '260ms' })}
        >
          Cotizaciones, órdenes de servicio, visitas, pagos y garantías: claros para el
          equipo de RvR y para cada cliente.
        </p>

        <ul className="m-0 flex max-w-[440px] list-none flex-col gap-2.5 p-0">
          {BENEFICIOS.map(([titulo, texto], indice) => (
            <li
              key={titulo}
              className="vidrio-oscuro anim-entrada flex items-center gap-3.5 rounded-[18px] px-4 py-3.5"
              style={varsCss({ '--retraso': `${340 + indice * 90}ms` })}
            >
              <span className="flex size-9 flex-none items-center justify-center rounded-[12px] bg-[#0a6cf0] text-white shadow-[0_8px_18px_-8px_rgb(10_108_240/0.9)]">
                <IconCheck width="16" height="16" strokeWidth={2.2} />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] font-semibold text-white">{titulo}</span>
                <span className="block text-[13px] text-[#c6d4e8]">{texto}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-2 text-[12.5px] font-medium text-[#8ec5ff]">
        <span aria-hidden="true" className="anim-latido size-[7px] rounded-full bg-[#22c55e]" />
        Conexión cifrada · Medellín y Área Metropolitana
      </div>
    </aside>
  )
}
