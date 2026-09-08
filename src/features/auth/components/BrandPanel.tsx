import { Logo } from '@shared/components/ui'

const BENEFICIOS = [
  'Mantenimiento preventivo, redes, CCTV y servidores',
  'Seguimiento de órdenes en tiempo real',
  'Acceso por roles y permisos con historial',
]

/** Panel izquierdo del login: marca, propuesta de valor y sello de seguridad. */
export function BrandPanel() {
  return (
    <aside
      className="relative hidden flex-col justify-between overflow-hidden bg-[#3730a3] p-14 lg:flex lg:w-[41.4%] lg:flex-none dark:border-r dark:border-border-base dark:bg-surface"
      aria-label="Portal RvR Tecnologías"
    >
      {/* Blobs decorativos del mockup */}
      <div
        aria-hidden="true"
        className="absolute -top-[90px] -right-[120px] size-[380px] rounded-full bg-[#4f46e5] opacity-55 dark:bg-[#3730a3] dark:opacity-30"
      />
      <div
        aria-hidden="true"
        className="absolute right-[60px] -bottom-[140px] size-[260px] rounded-full bg-[#7c3aed] opacity-35 dark:bg-[#5b21b6] dark:opacity-25"
      />

      <div className="relative">
        <Logo variant="onBrand" />
      </div>

      <div className="relative flex flex-col gap-[26px]">
        <h1 className="m-0 max-w-[420px] text-[40px] leading-[1.14] font-bold tracking-[-1.2px] text-white text-pretty dark:text-fg">
          Toda la operación técnica en un solo lugar.
        </h1>

        <p className="m-0 max-w-[400px] text-[14.5px] leading-[1.65] text-[#c7d2fe] text-pretty dark:text-fg-subtle">
          Clientes, técnicos, cotizaciones, órdenes de servicio y pagos —
          centralizados, trazables y auditables.
        </p>

        <ul className="mt-1.5 flex list-none flex-col gap-[13px] p-0">
          {BENEFICIOS.map((beneficio) => (
            <li
              key={beneficio}
              className="flex items-center gap-[11px] text-[13px] font-medium text-[#e0e7ff] dark:text-fg-muted"
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
        <span
          aria-hidden="true"
          className="size-[7px] rounded-full bg-success"
        />
        Conexión cifrada · Sesión registrada en log_accesos
      </div>
    </aside>
  )
}
