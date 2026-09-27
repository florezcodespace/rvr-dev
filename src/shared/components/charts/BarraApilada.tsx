import { varsCss } from '@shared/lib/varsCss'

export interface SegmentoBarra {
  clave: string
  label: string
  valor: number
  color: string
}

/**
 * Reparto de un total en una sola barra. Los valores no van dentro de los
 * segmentos —sobre amarillo o cian no habría contraste suficiente—: van en la
 * leyenda que acompaña a la barra.
 */
export function BarraApilada({
  segmentos,
  alto = 30,
  descripcion,
  retrasoBase = 200,
  paso = 95,
}: {
  segmentos: SegmentoBarra[]
  alto?: number
  descripcion: string
  retrasoBase?: number
  paso?: number
}) {
  const total = segmentos.reduce((suma, s) => suma + s.valor, 0) || 1

  return (
    <div
      role="img"
      aria-label={`${descripcion}. ${segmentos
        .map((s) => `${s.label}: ${s.valor}`)
        .join('; ')}.`}
      className="flex gap-[3px]"
      style={{ height: `${alto}px` }}
    >
      {segmentos
        .filter((segmento) => segmento.valor > 0)
        .map((segmento, indice) => (
          <div
            key={segmento.clave}
            className="anim-barra rounded-[5px]"
            title={`${segmento.label}: ${segmento.valor} (${Math.round(
              (segmento.valor / total) * 100,
            )} %)`}
            style={{
              ...varsCss({ '--retraso': `${retrasoBase + indice * paso}ms` }),
              flex: segmento.valor,
              background: `linear-gradient(180deg, ${segmento.color}, color-mix(in srgb, ${segmento.color} 80%, #000))`,
            }}
          />
        ))}
    </div>
  )
}
