/**
 * Módulos definidos en el sistema (CA_66_03: el módulo de un permiso se
 * selecciona de esta lista). La clave es la que se guarda en `permiso.modulo`.
 * Van en el orden de los procesos de la ficha técnica.
 */
export interface Modulo {
  clave: string
  nombre: string
  proceso: string
}

export const MODULOS: Modulo[] = [
  { clave: 'roles', nombre: 'Roles', proceso: 'Configuración' },
  { clave: 'permisos', nombre: 'Permisos', proceso: 'Configuración' },
  { clave: 'usuarios', nombre: 'Usuarios', proceso: 'Usuarios' },
  { clave: 'accesos', nombre: 'Registro de accesos', proceso: 'Usuarios' },
  { clave: 'servicios', nombre: 'Servicios', proceso: 'Servicios' },
  { clave: 'tecnicos', nombre: 'Técnicos', proceso: 'Servicios' },
  { clave: 'disponibilidad', nombre: 'Horarios técnicos', proceso: 'Servicios' },
  { clave: 'clientes', nombre: 'Clientes', proceso: 'Venta – Órdenes' },
  { clave: 'cotizaciones', nombre: 'Cotizaciones', proceso: 'Venta – Órdenes' },
  { clave: 'ordenes', nombre: 'Órdenes de servicio', proceso: 'Venta – Órdenes' },
  { clave: 'agenda', nombre: 'Agendamiento', proceso: 'Venta – Órdenes' },
  { clave: 'ventas', nombre: 'Ventas', proceso: 'Venta – Órdenes' },
  { clave: 'abonos', nombre: 'Abonos', proceso: 'Venta – Órdenes' },
  { clave: 'reportes', nombre: 'Reportes', proceso: 'Dashboard' },
  { clave: 'indicadores', nombre: 'Indicadores', proceso: 'Dashboard' },
  { clave: 'estadisticas', nombre: 'Estadísticas', proceso: 'Dashboard' },
  { clave: 'portal', nombre: 'Portal del cliente', proceso: 'Portal del cliente' },
  { clave: 'movil', nombre: 'Aplicación móvil', proceso: 'Móvil' },
]

export const CLAVES_MODULO = MODULOS.map((m) => m.clave) as [string, ...string[]]

export type TipoCuenta = 'administrativo' | 'cliente' | 'tecnico'

/**
 * A qué portal entra una cuenta, según sus permisos (CA_13_03: redirigir al
 * panel según el rol). No depende del nombre del rol: si el administrador crea
 * un rol nuevo con permisos del portal del cliente, esa cuenta entra allí.
 */
export function tipoDeCuenta(permisos: string[]): TipoCuenta {
  const administrativos = permisos.some((p) => !p.startsWith('portal.') && !p.startsWith('movil.'))
  if (administrativos) return 'administrativo'
  if (permisos.some((p) => p.startsWith('portal.'))) return 'cliente'
  if (permisos.some((p) => p.startsWith('movil.'))) return 'tecnico'
  return 'administrativo'
}
