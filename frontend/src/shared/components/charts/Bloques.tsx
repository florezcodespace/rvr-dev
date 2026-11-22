import { varsCss } from '@shared/lib/varsCss'

/**
 * Fila de bloques: cada bloque vale una unidad y los vacíos dejan ver cuánto
 * falta. Se puede contar, cosa que una barra continua no permite.
 */
export function Bloques({
  total,
  llenos,
  color,
  alto = 10,
  retrasoBase = 0,
  paso = 16,
}: {
  total: number
  llenos: number
  color: string
  alto?: number
  retrasoBase?: number
  paso?: number
}) {
  return (
    <div className="flex gap-[3px]" aria-hidden="true">
      {Array.from({ length: total }, (_, indice) => (
        <div
          key={indice}
          className="anim-barra flex-1 rounded-[2px]"
          style={{
            ...varsCss({ '--retraso': `${retrasoBase + indice * paso}ms` }),
            height: `${alto}px`,
            background:
              indice < llenos
                ? `linear-gradient(180deg, ${color}, color-mix(in srgb, ${color} 78%, #000))`
                : 'var(--rvr-track)',
          }}
        />
      ))}
    </div>
  )
}
