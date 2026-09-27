import type { ComponentType, SVGProps } from 'react'
import type { Cuenta } from '@features/auth'
import {
  IconAbono, IconCalendario, IconClientes, IconCotizaciones, IconDashboard, IconEscudo, IconHistorial,
  IconIndicadores, IconLlave, IconOrdenes, IconReloj, IconReportes, IconServicios, IconTecnicos, IconUsuarios, IconVenta,
} from '@shared/components/icons'
import { ROUTES } from '@app/routes/paths'

export interface NavItem {
  label: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Se muestra si el rol tiene alguno de estos permisos (RNF-021). */
  permisos: string[]
}

export interface NavGroup {
  titulo: string
  items: NavItem[]
}

/**
 * Menú del portal administrativo, agrupado por los procesos de la ficha
 * técnica. Cada ítem aparece solo si el rol tiene alguno de sus permisos: el
 * menú se arma con los permisos que el administrador asigna en Roles.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    titulo: 'Dashboard',
    items: [
      { label: 'Estadísticas', to: ROUTES.panel, icon: IconDashboard, permisos: ['estadisticas.consultar'] },
      { label: 'Indicadores', to: ROUTES.indicadores, icon: IconIndicadores, permisos: ['indicadores.servicios_ordenes', 'indicadores.mas_solicitados'] },
      { label: 'Reportes', to: ROUTES.reportes, icon: IconReportes, permisos: ['reportes.ordenes', 'reportes.tecnicos'] },
    ],
  },
  {
    titulo: 'Venta – Órdenes',
    items: [
      { label: 'Cotizaciones', to: ROUTES.cotizaciones, icon: IconCotizaciones, permisos: ['cotizaciones.listar', 'cotizaciones.buscar'] },
      { label: 'Órdenes de servicio', to: ROUTES.ordenes, icon: IconOrdenes, permisos: ['ordenes.listar', 'ordenes.buscar'] },
      { label: 'Agendamiento', to: ROUTES.agenda, icon: IconCalendario, permisos: ['agenda.consultar'] },
      { label: 'Clientes', to: ROUTES.clientes, icon: IconClientes, permisos: ['clientes.listar', 'clientes.buscar'] },
      { label: 'Ventas', to: ROUTES.ventas, icon: IconVenta, permisos: ['ventas.consultar_estado'] },
      { label: 'Abonos', to: ROUTES.abonos, icon: IconAbono, permisos: ['abonos.listar'] },
    ],
  },
  {
    titulo: 'Servicios',
    items: [
      { label: 'Catálogo de servicios', to: ROUTES.servicios, icon: IconServicios, permisos: ['servicios.listar', 'servicios.buscar'] },
      { label: 'Técnicos', to: ROUTES.tecnicos, icon: IconTecnicos, permisos: ['tecnicos.listar', 'tecnicos.buscar'] },
      { label: 'Horarios técnicos', to: ROUTES.horarios, icon: IconReloj, permisos: ['disponibilidad.consultar'] },
    ],
  },
  {
    titulo: 'Configuración',
    items: [
      { label: 'Usuarios', to: ROUTES.usuarios, icon: IconUsuarios, permisos: ['usuarios.listar', 'usuarios.buscar'] },
      { label: 'Roles', to: ROUTES.roles, icon: IconEscudo, permisos: ['roles.listar', 'roles.buscar'] },
      { label: 'Permisos', to: ROUTES.permisos, icon: IconLlave, permisos: ['permisos.listar', 'permisos.buscar'] },
      { label: 'Registro de accesos', to: ROUTES.accesos, icon: IconHistorial, permisos: ['accesos.consultar'] },
    ],
  },
]

/** El menú filtrado con los permisos de la cuenta. */
export function menuDe(cuenta: Cuenta | null): NavGroup[] {
  if (!cuenta) return []
  const propios = new Set(cuenta.permisos)
  return NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((i) => i.permisos.some((p) => propios.has(p))) })).filter(
    (g) => g.items.length > 0,
  )
}

/**
 * CA_13_03 · A dónde entra cada cuenta según su rol: el cliente a su portal y
 * el personal al primer módulo que su rol puede ver.
 */
export function rutaInicial(cuenta: Cuenta | null): string {
  if (!cuenta) return ROUTES.login
  if (cuenta.tipo === 'cliente') return ROUTES.portal
  return menuDe(cuenta)[0]?.items[0]?.to ?? ROUTES.perfil
}
