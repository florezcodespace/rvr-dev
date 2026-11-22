import type { CSSProperties } from 'react'

/**
 * Variables CSS (--retraso, --arco) para el prop `style`.
 * React las escribe tal cual, pero CSSProperties no admite claves libres:
 * este helper concentra la conversión en un solo sitio.
 */
export const varsCss = (vars: Record<string, string | number>): CSSProperties =>
  vars as CSSProperties
