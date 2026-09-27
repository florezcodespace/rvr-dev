import { Bloques } from './Bloques'

const CELDAS = 20

/**
 * Medidor de avance en celdas. A diferencia de una barra de progreso, se puede
 * leer «17 de 20» de un vistazo sin depender de la longitud exacta.
 */
export function MedidorSegmentado({
  porcentaje,
  color = 'var(--rvr-estado-completada)',
  descripcion,
  alto = 12,
  retrasoBase = 260,
}: {
  porcentaje: number
  color?: string
  descripcion: string
  alto?: number
  retrasoBase?: number
}) {
  const acotado = Math.min(Math.max(porcentaje, 0), 100)
  const llenos = Math.round((acotado / 100) * CELDAS)

  return (
    <div
      role="img"
      aria-label={`${descripcion}: ${Math.round(acotado)} %`}
    >
      <Bloques
        total={CELDAS}
        llenos={llenos}
        color={color}
        alto={alto}
        retrasoBase={retrasoBase}
        paso={22}
      />
    </div>
  )
}
