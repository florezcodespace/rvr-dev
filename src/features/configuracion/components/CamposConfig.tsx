import { useId, type ReactNode } from 'react'
import { Toggle } from '@shared/components/ui'

export function CampoTexto({
  etiqueta,
  valor,
  onChange,
  ayuda,
  tipo = 'text',
}: {
  etiqueta: string
  valor: string | number
  onChange: (valor: string) => void
  ayuda?: string
  tipo?: 'text' | 'email' | 'number'
}) {
  const id = useId()
  return (
    <div className="flex min-w-0 flex-col">
      <label htmlFor={id} className="mb-1.5 text-[12px] font-semibold text-fg">
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-[9px] border border-border-strong bg-surface px-3 text-[13px] text-fg outline-none transition-[box-shadow,border-color] focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)]"
      />
      {ayuda && <p className="mt-[5px] mb-0 text-[11px] text-fg-subtle">{ayuda}</p>}
    </div>
  )
}

export function FilaToggle({
  titulo,
  descripcion,
  activo,
  onChange,
}: {
  titulo: string
  descripcion: string
  activo: boolean
  onChange: (valor: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-t border-border-base py-3 first:border-t-0 first:pt-0">
      <div className="min-w-0">
        <div className="text-[12.5px] font-semibold text-fg">{titulo}</div>
        <p className="m-0 mt-0.5 text-[11.5px] leading-[1.5] text-fg-muted">
          {descripcion}
        </p>
      </div>
      <Toggle activo={activo} onChange={onChange} etiqueta={titulo} />
    </div>
  )
}

export function Rejilla({
  columnas = 2,
  children,
}: {
  columnas?: 2 | 3
  children: ReactNode
}) {
  return (
    <div
      className={
        columnas === 3
          ? 'grid grid-cols-1 gap-3.5 sm:grid-cols-3'
          : 'grid grid-cols-1 gap-3.5 sm:grid-cols-2'
      }
    >
      {children}
    </div>
  )
}
