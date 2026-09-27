import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Orbes, Particulas, type Orbe } from '@shared/components/decor'
import { Logo, TextoAnimado } from '@shared/components/ui'
import { varsCss } from '@shared/lib/varsCss'

const BENEFICIOS = [
  'Mantenimiento preventivo, redes, CCTV y servidores',
  'Seguimiento de órdenes en tiempo real',
  'Acceso por roles y permisos con historial',
]

/**
 * Orbes del panel. Van en constante y no en línea para que el JSX quede legible
 * y para que los tiempos se vean de un vistazo: ninguno comparte duración con
 * otro, así el conjunto nunca vuelve a la misma composición.
 */
const ORBES: Orbe[] = [
  { clase: '-top-24 -right-32 size-[420px] bg-[#4f46e5]/60 dark:bg-[#3730a3]/45', duracion: 28, variante: 1 },
  { clase: 'right-10 -bottom-36 size-[300px] bg-[#7c3aed]/45 dark:bg-[#5b21b6]/40', duracion: 34, variante: 2 },
  { clase: 'top-[36%] -left-32 size-[340px] bg-[#818cf8]/35 dark:bg-[#4338ca]/35', duracion: 31, variante: 3 },
  { clase: 'top-[8%] left-[28%] size-[220px] bg-[#38bdf8]/25 dark:bg-[#0ea5e9]/20', duracion: 25, variante: 2 },
  { clase: 'bottom-[26%] left-[6%] size-[260px] bg-[#a78bfa]/30 dark:bg-[#6d28d9]/30', duracion: 37, variante: 1 },
  { clase: 'top-[58%] right-[14%] size-[190px] bg-[#c4b5fd]/25 dark:bg-[#4c1d95]/35', duracion: 23, variante: 3 },
]

/** Panel izquierdo del login: marca, propuesta de valor y sello de seguridad. */
export function BrandPanel() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden bg-[#3730a3] p-14 lg:flex lg:w-[41.4%] lg:flex-none dark:border-r dark:border-border-base dark:bg-surface"
      aria-label="Portal RvR Tecnologías"
    >
      <Orbes orbes={ORBES} />
      <Particulas cantidad={22} semilla={21} opacidadMaxima={0.45} />

      {/* Lavado de luz desde la esquina superior: sin él, el morado se lee como
          un rectángulo plano por mucho orbe que tenga detrás. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,rgb(255_255_255/0.12),transparent_60%)]"
      />

      {/* La marca es la salida al sitio público: es donde la gente la busca. */}
      <Link to={ROUTES.inicio} className="anim-entrada relative w-fit rounded-[12px]">
        <Logo variant="onBrand" />
      </Link>

      <div className="relative flex flex-col gap-[26px]">
        <h1
          className="m-0 max-w-[420px] text-[40px] leading-[1.14] font-bold tracking-[-1.2px] text-white text-pretty dark:text-fg"
        >
          <TextoAnimado texto="Toda la operación técnica en un solo lugar." retraso={120} paso={70} />
        </h1>

        <p
          className="anim-entrada m-0 max-w-[400px] text-[14.5px] leading-[1.65] text-[#c7d2fe] text-pretty dark:text-fg-subtle"
          style={varsCss({ '--retraso': '150ms' })}
        >
          Clientes, técnicos, cotizaciones, órdenes de servicio y pagos —
          centralizados, trazables y auditables.
        </p>

        <ul className="mt-1.5 flex list-none flex-col gap-[13px] p-0">
          {BENEFICIOS.map((beneficio, indice) => (
            <li
              key={beneficio}
              className="anim-entrada flex items-center gap-[11px] text-[13px] font-medium text-[#e0e7ff] dark:text-fg-muted"
              style={varsCss({ '--retraso': `${220 + indice * 60}ms` })}
            >
              <span
                aria-hidden="true"
                className="flex size-5 flex-none items-center justify-center rounded-[6px] bg-white/15 text-[11px] text-white dark:bg-primary/25 dark:text-primary-on-soft"
              >
                ✓
              </span>
              {beneficio}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-2 text-[11.5px] font-medium text-[#a5b4fc] dark:text-fg-subtle">
        <span aria-hidden="true" className="anim-latido size-[7px] rounded-full bg-success" />
        Conexión cifrada · Acceso por roles y permisos
      </div>
    </aside>
  )
}
