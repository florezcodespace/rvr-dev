import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'

/**
 * Titular que entra palabra por palabra, desde abajo y bajo una máscara.
 *
 * Se divide por palabras y no por letras a propósito: por letras el lector de
 * pantalla lee deletreado y el texto se vuelve inseleccionable. Aquí cada
 * palabra sigue siendo una palabra y el bloque conserva su texto accesible.
 */
export function TextoAnimado({
  texto,
  className,
  retraso = 0,
  paso = 55,
}: {
  texto: string
  className?: string
  /** Milisegundos antes de la primera palabra. */
  retraso?: number
  /** Milisegundos entre palabras. */
  paso?: number
}) {
  const palabras = texto.split(' ')

  return (
    <span className={cn('inline', className)}>
      {palabras.map((palabra, indice) => (
        <span
          key={`${palabra}-${indice}`}
          className="inline-block overflow-hidden align-bottom"
        >
          <span
            className="anim-subir inline-block"
            style={varsCss({ '--retraso': `${retraso + indice * paso}ms` })}
          >
            {palabra}
            {indice < palabras.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </span>
  )
}
