import { Link } from 'react-router-dom'
import { IconCarrito } from '@shared/components/icons'
import { useCarrito } from '@shared/hooks/useCarrito'
import { formatearMoneda } from '@shared/lib/format'
import { CifraViva, IconoCategoria } from './kit'

/** Isla flotante con lo elegido en el catálogo y el paso siguiente. */
export function BarraSolicitud({ destino, texto }: { destino: string; texto: string }) {
  const { unidades, items, estimado } = useCarrito()
  if (!unidades) return null
  return (
    <div className="sticky bottom-24 z-20 mt-2 lg:bottom-5">
      <div className="anim-entrada mx-auto flex max-w-[820px] flex-wrap items-center gap-3 rounded-[24px] bg-[#0f1a2e]/92 p-2.5 pl-3 text-white shadow-[0_24px_60px_-20px_rgb(10_40_100/0.7)] ring-1 ring-white/10 backdrop-blur-xl sm:flex-nowrap">
        <span className="relative flex size-11 flex-none items-center justify-center rounded-[14px] bg-primary">
          <IconCarrito />
          <span key={unidades} className="portal-pop absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-white text-[11px] font-bold text-ink">{unidades}</span>
        </span>
        <div className="hidden -space-x-2 sm:flex">
          {items.slice(0, 4).map((i) => <IconoCategoria key={i.servicioId} categoria={i.categoria} tamano={30} className="ring-2 ring-[#0f1a2e]" />)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-bold">{unidades} servicio{unidades === 1 ? '' : 's'} en tu solicitud</div>
          <div className="truncate text-[12.5px] text-[#9fb6d6]">Referencia <b className="font-semibold text-white"><CifraViva valor={estimado} formato={formatearMoneda} duracion={400} /></b> · {items.map((i) => i.nombre).join(', ')}</div>
        </div>
        <Link to={destino} className="pintura-boton boton-liquido inline-flex h-11 w-full items-center justify-center rounded-[16px] px-5 text-[14px] font-semibold sm:w-auto">
          {texto} →
        </Link>
      </div>
    </div>
  )
}
