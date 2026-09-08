import { useEffect, useRef, useState } from 'react'
import { IconBuscar } from '@shared/components/icons'
import { cn } from '@shared/lib/cn'

/**
 * Búsqueda con retardo y atajo "/" para enfocar sin tocar el mouse.
 * El valor sube ya "debounced" para no consultar en cada tecla.
 */
export function SearchInput({
  valor,
  onChange,
  placeholder,
  className,
  atajo = true,
}: {
  valor: string
  onChange: (valor: string) => void
  placeholder: string
  className?: string
  atajo?: boolean
}) {
  const [texto, setTexto] = useState(valor)
  const [valorPrevio, setValorPrevio] = useState(valor)
  const input = useRef<HTMLInputElement>(null)

  // Si el valor cambia por fuera (limpiar filtros, botón atrás) se sincroniza en render.
  if (valor !== valorPrevio) {
    setValorPrevio(valor)
    setTexto(valor)
  }

  useEffect(() => {
    if (texto === valor) return
    const id = setTimeout(() => onChange(texto), 300)
    return () => clearTimeout(id)
  }, [texto, valor, onChange])

  useEffect(() => {
    if (!atajo) return
    const onKeyDown = (evento: KeyboardEvent) => {
      const activo = document.activeElement
      const escribiendo =
        activo instanceof HTMLInputElement ||
        activo instanceof HTMLTextAreaElement ||
        (activo as HTMLElement | null)?.isContentEditable
      if (evento.key === '/' && !escribiendo) {
        evento.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [atajo])

  return (
    <div
      className={cn(
        'flex h-9 items-center gap-2 rounded-[9px] border border-border-strong bg-surface px-[11px] focus-within:ring-focus',
        className,
      )}
    >
      <IconBuscar width="14" height="14" className="flex-none text-fg-faint" />
      <input
        ref={input}
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 bg-transparent text-[12.5px] text-fg outline-none placeholder:text-fg-faint"
      />
      {atajo && !texto && (
        <kbd className="hidden rounded-[5px] border border-border-base bg-bg px-[5px] py-px font-mono text-[10px] text-fg-faint sm:block">
          /
        </kbd>
      )}
    </div>
  )
}
