import { useMemo } from 'react'
import { cn } from '@shared/lib/cn'
import { varsCss } from '@shared/lib/varsCss'

/**
 * Generador determinista (mulberry32).
 *
 * Las partículas no pueden salir de `Math.random()`: cambiarían de sitio en
 * cada render y, con la misma semilla, aquí siempre sale el mismo campo.
 */
function pseudoAzar(semilla: number): () => number {
  let estado = semilla >>> 0
  return () => {
    estado = (estado + 0x6d2b79f5) >>> 0
    let t = Math.imul(estado ^ (estado >>> 15), 1 | estado)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface Particula {
  izquierda: number
  base: number
  tamano: number
  duracion: number
  retraso: number
  recorrido: number
  deriva: number
  opacidad: number
}

/**
 * Campo de puntos que suben despacio y se apagan al llegar arriba.
 *
 * Es decoración pura: `aria-hidden`, sin puntero y con el contenedor recortando,
 * para que no toque ni el foco ni el desplazamiento de la página.
 */
export function Particulas({
  cantidad = 14,
  semilla = 7,
  className,
  /** Clases del punto: color y, si hace falta, su variante para el tema oscuro. */
  puntoClase = 'bg-white',
  /** Techo de opacidad. Sobre superficies claras conviene bajarlo. */
  opacidadMaxima = 0.5,
}: {
  cantidad?: number
  semilla?: number
  className?: string
  puntoClase?: string
  opacidadMaxima?: number
}) {
  const particulas = useMemo<Particula[]>(() => {
    const azar = pseudoAzar(semilla)
    return Array.from({ length: cantidad }, () => ({
      izquierda: azar() * 100,
      // Repartidas por todo el alto y no solo por la franja de abajo: agrupadas
      // al pie parecían un charco en vez de un campo.
      base: azar() * 92 - 6,
      tamano: 2 + Math.round(azar() * 4),
      duracion: 13 + azar() * 14,
      // Negativo: el campo arranca ya poblado en vez de llenarse poco a poco.
      retraso: -azar() * 22000,
      recorrido: 180 + azar() * 320,
      deriva: (azar() - 0.5) * 70,
      opacidad: opacidadMaxima * (0.35 + azar() * 0.65),
    }))
  }, [cantidad, semilla, opacidadMaxima])

  return (
    <div
      aria-hidden="true"
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
    >
      {particulas.map((p, indice) => (
        <span
          key={indice}
          className={cn('anim-particula absolute rounded-full', puntoClase)}
          style={{
            left: `${p.izquierda}%`,
            bottom: `${p.base}%`,
            width: p.tamano,
            height: p.tamano,
            ...varsCss({
              '--duracion': `${p.duracion}s`,
              '--retraso': `${p.retraso}ms`,
              '--recorrido': `${p.recorrido}px`,
              '--deriva': `${p.deriva}px`,
              '--opacidad': `${p.opacidad}`,
            }),
          }}
        />
      ))}
    </div>
  )
}
