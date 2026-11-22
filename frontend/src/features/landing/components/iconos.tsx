import type { SVGProps } from 'react'

/**
 * Iconos de la landing. El mockup usaba Font Awesome; aquí se dibujan con el
 * mismo trazo 1.5 sobre viewBox 24 que el resto del portal, para no cargar una
 * fuente de iconos entera desde un CDN por nueve símbolos.
 */
function Icono({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
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

export const IcoMantenimiento = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <rect x="2.5" y="4" width="19" height="12" rx="2" />
    <line x1="8" y1="20" x2="16" y2="20" />
    <line x1="12" y1="16" x2="12" y2="20" />
  </Icono>
)

export const IcoServidores = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <rect x="3" y="3.5" width="18" height="7" rx="2" />
    <rect x="3" y="13.5" width="18" height="7" rx="2" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
    <line x1="7" y1="17" x2="7.01" y2="17" />
  </Icono>
)

export const IcoRedes = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <rect x="9" y="2.5" width="6" height="5" rx="1.5" />
    <rect x="2" y="16.5" width="6" height="5" rx="1.5" />
    <rect x="16" y="16.5" width="6" height="5" rx="1.5" />
    <path d="M12 7.5v4M5 16.5v-2.5h14v2.5M12 11.5v2.5" />
  </Icono>
)

export const IcoCctv = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M3 7.5l14-3.5 1.6 5.4-14 3.5z" />
    <path d="M6 12.4V17a2 2 0 002 2h3" />
    <circle cx="18" cy="17" r="2.5" />
  </Icono>
)

export const IcoAlarma = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M12 3l7.5 3v5.5c0 4.3-3 8.2-7.5 9.5-4.5-1.3-7.5-5.2-7.5-9.5V6z" />
    <path d="M9.5 12l1.8 1.8 3.4-3.6" />
  </Icono>
)

export const IcoRayo = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M13 2.5L5 13.5h6l-1 8 8-11h-6z" />
  </Icono>
)

export const IcoGarantia = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M12 2.5l8 3v6c0 4.6-3.3 8.8-8 10-4.7-1.2-8-5.4-8-10v-6z" />
    <path d="M9 11.8l2 2 4.2-4.3" />
  </Icono>
)

export const IcoDiagnostico = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.2" y1="15.2" x2="21" y2="21" />
    <path d="M7.5 10.5h1.8l1.2-2.2 1.4 4 1-1.8h1.6" />
  </Icono>
)

export const IcoPersona = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <circle cx="12" cy="8" r="3.6" />
    <path d="M4.5 20.5c0-3.9 3.4-6.2 7.5-6.2s7.5 2.3 7.5 6.2" />
  </Icono>
)

export const IcoLupa = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <line x1="15.2" y1="15.2" x2="21" y2="21" />
  </Icono>
)

/** Documento con una cifra: la cotización por escrito. */
export const IcoCotizar = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M14 2.5H6.5A2 2 0 0 0 4.5 4.5v15a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2.5 14,8 19.5,8" />
    <line x1="8.5" y1="13" x2="15.5" y2="13" />
    <line x1="8.5" y1="17" x2="13" y2="17" />
  </Icono>
)

export const IcoUbicacion = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M12 21s7-5.7 7-10.5A7 7 0 005 10.5C5 15.3 12 21 12 21z" />
    <circle cx="12" cy="10.5" r="2.6" />
  </Icono>
)

export const IcoTelefono = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M6.5 3.5h3l1.5 4-2 1.4a12 12 0 006.1 6.1l1.4-2 4 1.5v3a2 2 0 01-2.2 2A16.5 16.5 0 014.5 5.7 2 2 0 016.5 3.5z" />
  </Icono>
)

export const IcoCorreo = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
    <path d="M3 7l9 6 9-6" />
  </Icono>
)

export const IcoCandado = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <rect x="4.5" y="10" width="15" height="10.5" rx="2.5" />
    <path d="M8 10V7.5a4 4 0 018 0V10" />
  </Icono>
)

export const IcoFlecha = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <line x1="4" y1="12" x2="19" y2="12" />
    <path d="M13.5 6.5L20 12l-6.5 5.5" />
  </Icono>
)

export const IcoCheck = (p: SVGProps<SVGSVGElement>) => (
  <Icono {...p}>
    <path d="M4.5 12.5l5 5 10-11" />
  </Icono>
)
