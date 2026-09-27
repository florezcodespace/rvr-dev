export interface ResultadoBusqueda {
  /** Único en toda la paleta. */
  clave: string
  tipo: string
  titulo: string
  subtitulo: string
  meta?: string
  ruta: string
}

export interface GrupoResultados {
  tipo: string
  label: string
  items: ResultadoBusqueda[]
}

export const COLOR_TIPO: Record<string, string> = {
  'Ir a': 'var(--rvr-fg-subtle)',
  Orden: 'var(--rvr-estado-nueva)',
  Cotización: 'var(--rvr-estado-pendiente)',
  Cliente: 'var(--rvr-estado-programada)',
  Técnico: 'var(--rvr-estado-en-proceso)',
  Servicio: 'var(--rvr-estado-aprobada)',
  Usuario: 'var(--rvr-estado-reprogramada)',
}
