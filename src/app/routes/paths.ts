/** Rutas del portal, centralizadas para no repetir strings. */
export const ROUTES = {
  // Público
  inicio: '/',
  catalogo: '/catalogo',
  login: '/login',
  registro: '/registro',
  recuperar: '/recuperar',
  restablecer: '/restablecer',
  // Portal administrativo
  panel: '/panel',
  roles: '/roles',
  rolNuevo: '/roles/nuevo',
  permisos: '/permisos',
  usuarios: '/usuarios',
  accesos: '/accesos',
  servicios: '/servicios',
  tecnicos: '/tecnicos',
  horarios: '/horarios',
  clientes: '/clientes',
  cotizaciones: '/cotizaciones',
  cotizacionNueva: '/cotizaciones/nueva',
  ordenes: '/ordenes',
  ordenNueva: '/ordenes/nueva',
  agenda: '/agenda',
  ventas: '/ventas',
  abonos: '/abonos',
  reportes: '/reportes',
  indicadores: '/indicadores',
  perfil: '/perfil',
  // Portal del cliente
  portal: '/portal',
  portalCatalogo: '/portal/catalogo',
  portalSolicitar: '/portal/solicitar',
  portalCotizaciones: '/portal/cotizaciones',
  portalOrdenes: '/portal/ordenes',
  portalPerfil: '/portal/perfil',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]

/** Rutas de detalle: llevan el id del registro. */
export const DETALLE = {
  rol: (id: number) => `${ROUTES.roles}/${id}`,
  rolEditar: (id: number) => `${ROUTES.roles}/${id}/editar`,
  permiso: (id: number) => `${ROUTES.permisos}/${id}`,
  usuario: (id: number) => `${ROUTES.usuarios}/${id}`,
  servicio: (id: number) => `${ROUTES.servicios}/${id}`,
  tecnico: (id: number) => `${ROUTES.tecnicos}/${id}`,
  cliente: (id: number) => `${ROUTES.clientes}/${id}`,
  cotizacion: (id: number) => `${ROUTES.cotizaciones}/${id}`,
  cotizacionEditar: (id: number) => `${ROUTES.cotizaciones}/${id}/editar`,
  orden: (id: number) => `${ROUTES.ordenes}/${id}`,
  venta: (id: number) => `${ROUTES.ventas}/${id}`,
  portalCotizacion: (id: number) => `${ROUTES.portalCotizaciones}/${id}`,
  portalOrden: (id: number) => `${ROUTES.portalOrdenes}/${id}`,
} as const
