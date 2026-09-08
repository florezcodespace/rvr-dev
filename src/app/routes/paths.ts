/** Rutas del portal, centralizadas para no repetir strings. */
export const ROUTES = {
  login: '/login',
  dashboard: '/',
  ordenes: '/ordenes',
  ordenNueva: '/ordenes/nueva',
  cotizaciones: '/cotizaciones',
  tecnicos: '/tecnicos',
  clientes: '/clientes',
  servicios: '/servicios',
  pagos: '/pagos',
  usuarios: '/usuarios',
  reportes: '/reportes',
  configuracion: '/configuracion',
} as const

export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]
