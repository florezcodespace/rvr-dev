import { Link } from 'react-router-dom'
import { IconCarrito } from '@shared/components/icons'
import { Button } from '@shared/components/ui'
import { useCarrito } from '@shared/hooks/useCarrito'
import { formatearMoneda } from '@shared/lib/format'

/** Barra flotante con lo elegido en el catálogo y el paso siguiente. */
export function BarraSolicitud({ destino, texto }: { destino: string; texto: string }) {
  const { unidades, items, estimado } = useCarrito()
  if (!unidades) return null
  return (
    <div className="sticky bottom-20 z-20 mt-2 lg:bottom-4">
      <div className="mx-auto flex max-w-[760px] flex-wrap items-center gap-3 rounded-[16px] border border-border-base bg-surface/95 px-4 py-3 shadow-[var(--rvr-shadow-lg)] backdrop-blur">
        <span className="flex size-9 items-center justify-center rounded-[10px] bg-primary-soft text-primary-on-soft"><IconCarrito /></span>
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-fg">{unidades} servicio(s) en tu solicitud</div>
          <div className="truncate text-[12px] text-fg-subtle">{items.map((i) => i.nombre).join(', ')} · referencia {formatearMoneda(estimado)}</div>
        </div>
        <Link to={destino}><Button>{texto}</Button></Link>
      </div>
    </div>
  )
}
