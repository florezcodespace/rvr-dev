import type { ComponentType, SVGProps } from 'react'
import {
  IconClientes,
  IconConfiguracion,
  IconCotizaciones,
  IconDashboard,
  IconOrdenes,
  IconPagos,
  IconReportes,
  IconServicios,
  IconTecnicos,
  IconUsuarios,
} from '@shared/components/icons'
import { ROUTES } from '@app/routes/paths'

export interface NavItem {
  label: string
  to: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
  /** Contador opcional; más adelante vendrá del backend. */
  badge?: { valor: number; tono: 'primary' | 'warning' }
}

export interface NavGroup {
  titulo: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    titulo: 'Operación',
    items: [
      { label: 'Dashboard', to: ROUTES.dashboard, icon: IconDashboard },
      {
        label: 'Órdenes',
        to: ROUTES.ordenes,
        icon: IconOrdenes,
        badge: { valor: 6, tono: 'primary' },
      },
      {
        label: 'Cotizaciones',
        to: ROUTES.cotizaciones,
        icon: IconCotizaciones,
      },
      { label: 'Técnicos', to: ROUTES.tecnicos, icon: IconTecnicos },
    ],
  },
  {
    titulo: 'Gestión',
    items: [
      { label: 'Clientes', to: ROUTES.clientes, icon: IconClientes },
      { label: 'Servicios', to: ROUTES.servicios, icon: IconServicios },
      {
        label: 'Pagos',
        to: ROUTES.pagos,
        icon: IconPagos,
        badge: { valor: 24, tono: 'warning' },
      },
    ],
  },
  {
    titulo: 'Sistema',
    items: [
      { label: 'Usuarios', to: ROUTES.usuarios, icon: IconUsuarios },
      { label: 'Reportes', to: ROUTES.reportes, icon: IconReportes },
      {
        label: 'Configuración',
        to: ROUTES.configuracion,
        icon: IconConfiguracion,
      },
    ],
  },
]
