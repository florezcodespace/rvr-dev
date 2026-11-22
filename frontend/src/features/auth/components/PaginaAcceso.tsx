import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Logo, TextoAnimado } from '@shared/components/ui'
import { BrandPanel } from './BrandPanel'

function IconVolver() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="13" y1="8" x2="3.5" y2="8" />
      <polyline points="7.5,3.5 3,8 7.5,12.5" />
    </svg>
  )
}

/** Marco común de las pantallas de acceso: panel de marca + columna del formulario. */
export function PaginaAcceso({
  eyebrow,
  titulo,
  descripcion,
  children,
  pie,
  ancho = 404,
}: {
  eyebrow: string
  titulo: string
  descripcion: ReactNode
  children: ReactNode
  pie?: ReactNode
  ancho?: number
}) {
  return (
    <div className="flex min-h-dvh text-fg">
      <BrandPanel />
      <main className="relative flex flex-1 items-center justify-center px-6 py-16 sm:px-12 lg:px-18">
        <Link
          to={ROUTES.inicio}
          className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-[10px] px-2.5 py-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg lg:top-8 lg:left-8"
        >
          <IconVolver />
          Volver al inicio
        </Link>
        {/* [Diseño] El formulario va en una hoja de vidrio sobre las luces de fondo. */}
        <div className="vidrio anim-entrada flex w-full flex-col gap-[24px] rounded-[28px] border border-[var(--rvr-glass-borde)] p-7 sm:p-9" style={{ maxWidth: ancho + 72 }}>
          <Logo className="lg:hidden" />
          <header className="anim-entrada">
            <div className="mb-2.5 text-[13px] font-medium text-primary-on-soft">{eyebrow}</div>
            <h1 className="m-0 mb-2 text-[30px] leading-[1.12] font-bold tracking-[-0.9px]">
              <TextoAnimado texto={titulo} retraso={120} />
            </h1>
            <p className="m-0 text-[14px] leading-[1.55] text-fg-muted">{descripcion}</p>
          </header>
          {children}
          {pie && <div className="text-center text-[13px] text-fg-muted">{pie}</div>}
        </div>
      </main>
    </div>
  )
}
