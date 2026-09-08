/** Forma común de todos los catálogos de estado del portal. */
export interface EstadoMeta {
  label: string
  /** Etiqueta corta para ejes de gráficos y columnas angostas. */
  labelCorto: string
  /** Glifo del badge; acompaña al texto, nunca lo reemplaza. */
  glifo: string
  /** Color pleno para barras y puntos. */
  color: string
  /** Clases del badge (fondo suave + texto). */
  badge: string
}

/** Mapa de transiciones permitidas: de qué estado se puede pasar a cuáles. */
export type Transiciones<E extends string> = Record<E, readonly E[]>
