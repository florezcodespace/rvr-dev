import type { ReactNode } from 'react'
import { cn } from '@shared/lib/cn'
import type { OpcionPago } from './reglas'

/** Icono y nombre de cada opción de pago. */
const Sello = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cn('grid size-10 flex-none place-items-center rounded-full border border-border-base bg-surface text-fg', className)}>{children}</span>
)

const Trazo = ({ children }: { children: ReactNode }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
)

export const ICONOS: Record<OpcionPago, ReactNode> = {
  nequi: <Sello><span className="text-[13px] font-extrabold tracking-tight">N</span></Sello>,
  daviplata: <Sello><span className="text-[13px] font-extrabold tracking-tight">D</span></Sello>,
  pse: <Sello><span className="text-[11px] font-extrabold italic tracking-tight">pse</span></Sello>,
  credito: <Sello><Trazo><rect x="2.5" y="4.5" width="15" height="11" rx="2" /><path d="M2.5 8h15M5.5 12.5h3" /></Trazo></Sello>,
  debito: <Sello><Trazo><rect x="2.5" y="4.5" width="15" height="11" rx="2" /><path d="M5.5 8.5h3M10.5 8.5h4M5.5 12h9" /></Trazo></Sello>,
  transferencia: <Sello><Trazo><path d="M3 8h14L10 3.5 3 8zM4.5 8v6M8 8v6M12 8v6M15.5 8v6M3 16.5h14" /></Trazo></Sello>,
  efectivo: <Sello><Trazo><rect x="2.5" y="5.5" width="15" height="9" rx="1.5" /><circle cx="10" cy="10" r="2" /><path d="M5 8v4M15 8v4" /></Trazo></Sello>,
}

export const NOMBRE_OPCION: Record<OpcionPago, string> = {
  nequi: 'Nequi',
  pse: 'Transferencia con PSE',
  credito: 'Nueva tarjeta de crédito',
  debito: 'Nueva tarjeta de débito',
  daviplata: 'Daviplata',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo',
}
