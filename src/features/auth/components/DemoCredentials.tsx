import { CREDENCIALES_DEMO } from '../api'

/**
 * Ayuda temporal del modo mock: se elimina al conectar la API real.
 */
export function DemoCredentials() {
  return (
    <div className="rounded-[10px] border border-dashed border-border-strong bg-surface-muted px-3.5 py-3">
      <div className="mb-2 text-[10px] font-bold tracking-[0.11em] text-fg-faint uppercase">
        Credenciales de prueba (modo mock)
      </div>
      <ul className="flex list-none flex-col gap-1.5 p-0">
        {CREDENCIALES_DEMO.map((credencial) => (
          <li key={credencial.correo} className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] text-fg-muted">
              {credencial.correo}
            </span>
            <span className="font-mono text-[11px] text-fg-faint">
              {credencial.contrasena}
            </span>
            <span className="ml-auto text-[10.5px] font-semibold text-primary-on-soft">
              {credencial.rol}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
