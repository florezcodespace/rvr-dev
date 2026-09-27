import { MODO_DEMO } from '@shared/lib/api'
import { Spinner } from '@shared/components/ui'
import { useEstadoDemo } from './estado'

const CUENTAS = [
  { rol: 'Administrador', usuario: 'rvargas', clave: 'RvR2026*admin', detalle: 'Todos los módulos del portal' },
  { rol: 'Coordinador', usuario: 'lgomez', clave: 'RvR2026*coord', detalle: 'Operación, sin configuración' },
  { rol: 'Cliente', usuario: 'asuarez', clave: 'RvR2026*cliente', detalle: 'Portal del cliente' },
] as const

/**
 * Versión de demostración (Vercel): cuentas de prueba en un clic y el estado de
 * la base que corre en el navegador.
 */
export function CuentasDemo({ onElegir }: { onElegir: (usuario: string, clave: string) => void }) {
  const estado = useEstadoDemo()
  if (!MODO_DEMO) return null

  return (
    <section aria-label="Cuentas de demostración" className="flex flex-col gap-2.5 rounded-[12px] border border-dashed border-border-strong bg-surface-muted/60 p-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[11px] font-bold tracking-[0.08em] text-fg-subtle uppercase">Versión de demostración</span>
        <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-fg-muted" role="status">
          {estado === 'preparando' && <><Spinner /> Preparando la base de datos…</>}
          {estado === 'lista' && <><span className="size-2 rounded-full bg-success" aria-hidden="true" /> Base de datos lista</>}
          {estado === 'error' && <span className="text-danger-fg">No se pudo iniciar la base. Recarga la página.</span>}
        </span>
      </div>
      <p className="m-0 text-[12px] leading-[1.5] text-fg-muted">
        Elige una cuenta para entrar. Los datos son de prueba y se guardan solo en este navegador.
      </p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-3">
        {CUENTAS.map((c) => (
          <button
            key={c.usuario}
            type="button"
            onClick={() => onElegir(c.usuario, c.clave)}
            className="flex cursor-pointer flex-col items-start rounded-[10px] border border-border-base bg-surface px-3 py-2 text-left transition-colors hover:border-[var(--rvr-ring-border)] hover:bg-primary-soft focus-visible:ring-focus"
          >
            <span className="text-[12.5px] font-semibold text-fg">{c.rol}</span>
            <span className="font-mono text-[11px] text-fg-subtle">{c.usuario}</span>
          </button>
        ))}
      </div>
      <p className="m-0 text-[11px] text-fg-subtle">El técnico trabaja desde la app móvil: la web lo remite allá (cuenta <span className="font-mono">jmora</span> / RvR2026*tecnico).</p>
    </section>
  )
}
