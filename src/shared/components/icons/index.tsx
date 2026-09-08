import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

/** Set de iconos del portal: trazo 1.5, viewBox 16, heredan currentColor. */
function Icon({ children, ...props }: IconProps) {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconDashboard = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="2" width="5.5" height="5.5" rx="1.2" />
    <rect x="8.5" y="2" width="5.5" height="5.5" rx="1.2" />
    <rect x="2" y="8.5" width="5.5" height="5.5" rx="1.2" />
    <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1.2" />
  </Icon>
)

export const IconOrdenes = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="2" width="10" height="12" rx="2" />
    <line x1="5.5" y1="6" x2="10.5" y2="6" />
    <line x1="5.5" y1="9.5" x2="9" y2="9.5" />
  </Icon>
)

export const IconCotizaciones = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="2" width="10" height="12" rx="2" />
    <circle cx="8" cy="6" r="1.6" />
    <line x1="5.5" y1="10.5" x2="10.5" y2="10.5" />
  </Icon>
)

export const IconTecnicos = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="6" r="3.2" />
    <line x1="8.4" y1="8.4" x2="13.4" y2="13.4" />
  </Icon>
)

export const IconClientes = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="6" cy="5.5" r="2.4" />
    <circle cx="11.6" cy="6.6" r="1.7" />
    <path d="M2 13.6c0-2.3 1.8-3.7 4-3.7s4 1.4 4 3.7" />
  </Icon>
)

export const IconServicios = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 2l5.5 3v6L8 14l-5.5-3V5z" />
  </Icon>
)

export const IconPagos = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2" y="4" width="12" height="8.5" rx="2" />
    <line x1="2" y1="7.2" x2="14" y2="7.2" />
  </Icon>
)

export const IconUsuarios = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="5" r="2.6" />
    <path d="M3 14c0-2.8 2.2-4.4 5-4.4s5 1.6 5 4.4" />
  </Icon>
)

export const IconReportes = (p: IconProps) => (
  <Icon {...p}>
    <line x1="3" y1="13" x2="13" y2="13" />
    <rect x="4" y="8" width="2.6" height="4" />
    <rect x="9" y="4.5" width="2.6" height="7.5" />
  </Icon>
)

export const IconConfiguracion = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="2.2" />
    <line x1="8" y1="1.6" x2="8" y2="3.4" />
    <line x1="8" y1="12.6" x2="8" y2="14.4" />
    <line x1="1.6" y1="8" x2="3.4" y2="8" />
    <line x1="12.6" y1="8" x2="14.4" y2="8" />
  </Icon>
)

export const IconBuscar = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <line x1="10.4" y1="10.4" x2="14" y2="14" />
  </Icon>
)

export const IconCampana = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 7a4 4 0 018 0c0 3 1.2 4 1.2 4H2.8S4 10 4 7z" />
    <line x1="6.6" y1="13.4" x2="9.4" y2="13.4" />
  </Icon>
)

export const IconMas = (p: IconProps) => (
  <Icon {...p}>
    <line x1="8" y1="3.5" x2="8" y2="12.5" />
    <line x1="3.5" y1="8" x2="12.5" y2="8" />
  </Icon>
)

export const IconDescargar = (p: IconProps) => (
  <Icon {...p}>
    <line x1="8" y1="2.5" x2="8" y2="10" />
    <path d="M5 7.2L8 10.2l3-3" />
    <line x1="3" y1="13" x2="13" y2="13" />
  </Icon>
)

export const IconSalir = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6.5 2.5H4a1.5 1.5 0 00-1.5 1.5v8A1.5 1.5 0 004 13.5h2.5" />
    <path d="M10 5.5L12.5 8 10 10.5" />
    <line x1="12.5" y1="8" x2="6.5" y2="8" />
  </Icon>
)
