import { useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { IconBuscar, IconX } from '@shared/components/icons'
import { cn } from '@shared/lib/cn'
import { CLASE_CAMPO } from './Campos'

export interface OpcionBuscador {
  valor: string
  titulo: string
  detalle?: string
  /** Texto extra por el que también se puede buscar (documento, teléfono…). */
  extra?: string
}

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * Campo con buscador para elegir un registro de una lista larga (combobox).
 * Filtra mientras se escribe por título, detalle y texto extra; se maneja con
 * las flechas, Enter y Escape.
 */
export function BuscadorOpciones({
  label,
  opciones,
  valor,
  onChange,
  placeholder = 'Escribe para buscar…',
  ayuda,
  error,
  vacio = 'No hay coincidencias.',
  maximo = 8,
}: {
  label: string
  opciones: OpcionBuscador[]
  valor: string
  onChange: (valor: string) => void
  placeholder?: string
  ayuda?: ReactNode
  error?: string
  vacio?: string
  maximo?: number
}) {
  const id = useId()
  const entrada = useRef<HTMLInputElement>(null)
  const [texto, setTexto] = useState('')
  const [abierto, setAbierto] = useState(false)
  const [activo, setActivo] = useState(0)
  const elegida = opciones.find((o) => o.valor === valor)

  const resultados = useMemo(() => {
    const t = normalizar(texto.trim())
    const lista = t
      ? opciones.filter((o) => t.split(/\s+/).every((p) => normalizar(`${o.titulo} ${o.detalle ?? ''} ${o.extra ?? ''}`).includes(p)))
      : opciones
    return lista.slice(0, maximo)
  }, [opciones, texto, maximo])

  const elegir = (o: OpcionBuscador) => {
    onChange(o.valor)
    setTexto('')
    setAbierto(false)
  }

  const teclas = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAbierto(true); setActivo((a) => Math.min(a + 1, resultados.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter' && abierto && resultados[activo]) { e.preventDefault(); elegir(resultados[activo]) }
    else if (e.key === 'Escape' && abierto) { e.stopPropagation(); setAbierto(false) }
  }

  return (
    <div className="flex flex-col">
      <label htmlFor={id} className="mb-1.5 text-[13px] font-semibold text-fg">{label}</label>

      {elegida && !abierto ? (
        <div className={cn('flex min-h-11 items-center justify-between gap-3 rounded-[10px] border bg-surface px-3.5 py-2', error ? 'border-danger' : 'border-border-strong')}>
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-fg">{elegida.titulo}</div>
            {elegida.detalle && <div className="truncate text-[12px] text-fg-subtle">{elegida.detalle}</div>}
          </div>
          <button
            type="button"
            onClick={() => { onChange(''); setAbierto(true); setTimeout(() => entrada.current?.focus(), 0) }}
            className="flex flex-none cursor-pointer items-center gap-1 rounded-[14px] border-0 bg-transparent px-2 py-1 text-[12px] font-semibold text-link hover:bg-surface-muted"
          >
            <IconX width={13} height={13} /> Cambiar
          </button>
        </div>
      ) : (
        <div className="relative flex items-center">
          <IconBuscar className="pointer-events-none absolute left-3.5 text-fg-faint" />
          <input
            ref={entrada}
            id={id}
            role="combobox"
            aria-expanded={abierto}
            aria-controls={`${id}-lista`}
            aria-autocomplete="list"
            aria-activedescendant={abierto && resultados[activo] ? `${id}-op-${activo}` : undefined}
            aria-invalid={error ? true : undefined}
            autoComplete="off"
            value={texto}
            placeholder={placeholder}
            onChange={(e) => { setTexto(e.target.value); setActivo(0); setAbierto(true) }}
            onFocus={() => setAbierto(true)}
            onBlur={() => setTimeout(() => setAbierto(false), 120)}
            onKeyDown={teclas}
            className={cn(CLASE_CAMPO, 'h-11 pl-10', error ? 'border-danger' : 'border-border-strong')}
          />
        </div>
      )}

      {abierto && (
        <ul id={`${id}-lista`} role="listbox" aria-label={label}
          className="m-0 mt-1.5 max-h-64 list-none overflow-auto rounded-[10px] border border-border-base bg-surface p-1">
          {resultados.length === 0 ? (
            <li className="px-3 py-2.5 text-[13px] text-fg-subtle">{vacio}</li>
          ) : resultados.map((o, i) => (
            <li
              key={o.valor}
              id={`${id}-op-${i}`}
              role="option"
              aria-selected={i === activo}
              onMouseDown={(e) => { e.preventDefault(); elegir(o) }}
              onMouseEnter={() => setActivo(i)}
              className={cn('cursor-pointer rounded-[14px] px-3 py-2', i === activo && 'bg-surface-muted')}
            >
              <div className="text-[13px] font-semibold text-fg">{o.titulo}</div>
              {o.detalle && <div className="text-[12px] text-fg-subtle">{o.detalle}</div>}
            </li>
          ))}
          {opciones.length > maximo && resultados.length === maximo && (
            <li className="px-3 py-1.5 text-[12px] text-fg-faint">Mostrando {maximo}. Escribe más para afinar la búsqueda.</li>
          )}
        </ul>
      )}

      {error ? <p className="mt-1.5 text-[12px] text-danger-fg">{error}</p>
        : ayuda ? <p className="mt-1.5 text-[12px] text-fg-subtle">{ayuda}</p> : null}
    </div>
  )
}
