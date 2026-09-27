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
    <div className="flex min-h-dvh bg-bg text-fg">
      <BrandPanel />
      <main className="relative flex flex-1 items-center justify-center px-6 py-16 sm:px-12 lg:px-18">
        <Link
          to={ROUTES.inicio}
          className="absolute top-6 left-6 inline-flex items-center gap-2 rounded-[9px] px-2.5 py-1.5 text-[12.5px] font-medium text-fg-muted transition-colors hover:bg-surface-muted hover:text-fg lg:top-8 lg:left-8"
        >
          <IconVolver />
          Volver al inicio
        </Link>
        <div className="flex w-full flex-col gap-[26px]" style={{ maxWidth: ancho }}>
          <Logo className="lg:hidden" />
          <header className="anim-entrada">
            <div className="mb-2.5 text-[11px] font-semibold tracking-[0.1em] text-primary-on-soft uppercase">{eyebrow}</div>
            <h1 className="m-0 mb-2 text-[27px] font-bold tracking-[-0.7px]">
              <TextoAnimado texto={titulo} retraso={120} />
            </h1>
            <p className="m-0 text-[13.5px] leading-[1.55] text-fg-muted">{descripcion}</p>
          </header>
          {children}
          {pie && <div className="text-center text-[12.5px] text-fg-muted">{pie}</div>}
        </div>
      </main>
    </div>
  )
}
