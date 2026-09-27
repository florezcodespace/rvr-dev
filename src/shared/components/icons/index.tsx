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

export const IconVer = (p: IconProps) => (
  <Icon {...p}>
    <path d="M1.5 8S3.8 3.8 8 3.8 14.5 8 14.5 8 12.2 12.2 8 12.2 1.5 8 1.5 8z" />
    <circle cx="8" cy="8" r="1.9" />
  </Icon>
)

export const IconEditar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M10.6 2.6a1.5 1.5 0 012.1 2.1L5.9 11.5l-2.8.7.7-2.8 6.8-6.8z" />
    <line x1="9.6" y1="3.6" x2="11.7" y2="5.7" />
  </Icon>
)

export const IconBorrar = (p: IconProps) => (
  <Icon {...p}>
    <line x1="2.8" y1="4.2" x2="13.2" y2="4.2" />
    <path d="M6 4.2V3a1 1 0 011-1h2a1 1 0 011 1v1.2" />
    <path d="M4.2 4.2l.6 8.1A1.2 1.2 0 006 13.4h4a1.2 1.2 0 001.2-1.1l.6-8.1" />
    <line x1="6.7" y1="6.6" x2="6.9" y2="11" />
    <line x1="9.3" y1="6.6" x2="9.1" y2="11" />
  </Icon>
)

export const IconLlave = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5.3" cy="10.7" r="2.6" />
    <path d="M7.2 8.8l5-5" />
    <line x1="10.4" y1="5.6" x2="11.9" y2="7.1" />
    <line x1="12.2" y1="3.8" x2="13.7" y2="5.3" />
  </Icon>
)

export const IconEscudo = (p: IconProps) => (
  <Icon {...p}>
    <path d="M8 1.8 13 3.6v4.1c0 3.2-2.1 5.4-5 6.5-2.9-1.1-5-3.3-5-6.5V3.6L8 1.8Z" />
    <path d="m5.8 8 1.6 1.6 2.9-3" />
  </Icon>
)

export const IconCandado = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="7" width="10" height="7" rx="1.8" />
    <path d="M5.3 7V5a2.7 2.7 0 0 1 5.4 0v2" />
  </Icon>
)

export const IconHistorial = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9" />
    <polyline points="2 2.6 2.4 4.9 4.7 4.5" />
    <polyline points="8 5 8 8 10 9.3" />
  </Icon>
)

export const IconReloj = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6" />
    <polyline points="8 4.6 8 8 10.4 9.4" />
  </Icon>
)

export const IconCalendario = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.2" y="3" width="11.6" height="11" rx="2" />
    <line x1="2.2" y1="6.6" x2="13.8" y2="6.6" />
    <line x1="5.3" y1="1.6" x2="5.3" y2="4.2" />
    <line x1="10.7" y1="1.6" x2="10.7" y2="4.2" />
  </Icon>
)

export const IconVenta = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 3.5h11v9h-11z" />
    <path d="M2.5 6.3h11" />
    <path d="M5 9.6h2.5" />
  </Icon>
)

export const IconAbono = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="8" cy="8" r="6" />
    <path d="M9.9 5.8c-.4-.6-1.1-.9-1.9-.9-1.1 0-1.9.6-1.9 1.4 0 1.9 3.9.9 3.9 2.9 0 .8-.9 1.5-2 1.5-.9 0-1.6-.4-2-1" />
    <line x1="8" y1="3.8" x2="8" y2="4.9" />
    <line x1="8" y1="10.8" x2="8" y2="12.2" />
  </Icon>
)

export const IconIndicadores = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2 13.5h12" />
    <path d="m2.8 10.5 3.2-3.3 2.6 2.2 4.6-5" />
    <polyline points="10.4 4.3 13.2 4.3 13.2 7.1" />
  </Icon>
)

export const IconCarrito = (p: IconProps) => (
  <Icon {...p}>
    <path d="M1.8 2.5h1.9l1.6 7.7h7.1l1.4-5.4H4.4" />
    <circle cx="6.3" cy="12.8" r="1" />
    <circle cx="11.4" cy="12.8" r="1" />
  </Icon>
)

export const IconInicio = (p: IconProps) => (
  <Icon {...p}>
    <path d="M2.5 7.2 8 2.5l5.5 4.7" />
    <path d="M4 6.2v7.3h8V6.2" />
    <path d="M6.6 13.5V10h2.8v3.5" />
  </Icon>
)

export const IconEnviar = (p: IconProps) => (
  <Icon {...p}>
    <path d="M14 2 7.2 8.8" />
    <path d="M14 2 9.7 14l-2.5-5.2L2 6.3 14 2Z" />
  </Icon>
)

export const IconCheck = (p: IconProps) => (
  <Icon {...p}>
    <path d="m3.2 8.4 3 3 6.6-6.8" />
  </Icon>
)

export const IconX = (p: IconProps) => (
  <Icon {...p}>
    <line x1="4" y1="4" x2="12" y2="12" />
    <line x1="12" y1="4" x2="4" y2="12" />
  </Icon>
)

export const IconPdf = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9.5 1.8H4.3A1.3 1.3 0 0 0 3 3.1v9.8a1.3 1.3 0 0 0 1.3 1.3h7.4a1.3 1.3 0 0 0 1.3-1.3V5.3L9.5 1.8Z" />
    <path d="M9.4 1.8v3.6H13" />
    <path d="M5.6 11.2V8.4h.9a.8.8 0 0 1 0 1.6h-.9" />
  </Icon>
)

export const IconExcel = (p: IconProps) => (
  <Icon {...p}>
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.6" />
    <line x1="2.5" y1="6.2" x2="13.5" y2="6.2" />
    <line x1="2.5" y1="9.8" x2="13.5" y2="9.8" />
    <line x1="6.3" y1="2.5" x2="6.3" y2="13.5" />
  </Icon>
)
