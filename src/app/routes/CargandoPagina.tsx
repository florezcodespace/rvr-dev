import { SkeletonKpis } from '@shared/components/ui'

/** Mientras se descarga el código del módulo que se abrió. */
export function CargandoPagina() {
  return (
    <div className="flex flex-col gap-4 p-1" role="status" aria-label="Cargando">
      <SkeletonKpis />
    </div>
  )
}
