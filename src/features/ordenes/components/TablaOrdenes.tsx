import { ESTADO_ORDEN_META, TRANSICIONES_ORDEN } from '@shared/domain/estadoOrden'
import type { EstadoOrden } from '@shared/domain/estadoOrden'
import { SelectorEstado } from '@shared/components/data'
import { cn } from '@shared/lib/cn'
import { SelectorTecnico } from './SelectorTecnico'
import type { OpcionFiltro, OrdenResumen } from '../types'

/**
 * Las columnas de texto llevan un minimo real: con `1.25fr` a secas el navegador
 * las reducia a 0 px cuando la tabla no cabia (<=1024 px), y el nombre del
 * cliente y el diagnostico desaparecian dejando solo el encabezado. Con el piso
 * la tabla desborda y el contenedor la deja desplazar en horizontal.
 *
 * La columna de tecnico va en ancho fijo: su contenido es un boton con nombre
 * variable, y como `fr` la rejilla se resolvia distinto en cada fila y el
 * encabezado dejaba de cuadrar con los datos.
 *
 * ANCHO_MINIMO = 822 px de columnas + 84 px de gaps + 32 px de padding lateral.
 */
const ANCHO_MINIMO = 'min-w-[938px]'

const COLUMNAS = cn(
  'grid grid-cols-[38px_86px_minmax(104px,1.25fr)_118px_96px_104px_minmax(128px,1.5fr)_148px]',
  'items-center gap-3 px-4',
  ANCHO_MINIMO,
)

const FECHA = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

/** 12/08 09:00 — el formato del mockup, con día y mes siempre en dos dígitos. */
function fechaHoraCorta(iso: string): string {
  const d = new Date(iso)
  const dos = (n: number) => String(n).padStart(2, '0')
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)} ${dos(d.getHours())}:${dos(d.getMinutes())}`
}

function Casilla({
  marcada,
  etiqueta,
  onChange,
}: {
  marcada: boolean
  etiqueta: string
  onChange: () => void
}) {
  return (
    <input
      type="checkbox"
      checked={marcada}
      onChange={onChange}
      aria-label={etiqueta}
      className={cn(
        'size-[15px] cursor-pointer appearance-none rounded-[4px] border-[1.5px] border-border-strong bg-surface',
        'checked:border-primary checked:bg-primary',
        'checked:bg-[url("data:image/svg+xml;utf8,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20viewBox%3D%270%200%2016%2016%27%20fill%3D%27none%27%20stroke%3D%27white%27%20stroke-width%3D%272.6%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27M3.5%208.5l3%203%206-6%27%2F%3E%3C%2Fsvg%3E")] checked:bg-[length:12px] checked:bg-center checked:bg-no-repeat',
      )}
    />
  )
}

interface Props {
  ordenes: OrdenResumen[]
  seleccion: Set<number>
  todasSeleccionadas: boolean
  onAlternar: (id: number) => void
  onAlternarTodas: () => void
  cargando: boolean
  tecnicos: OpcionFiltro[]
  /** Estado a pintar (puede venir de un cambio optimista). */
  estadoDe: (id: number, base: EstadoOrden) => EstadoOrden
  onCambiarEstado: (orden: OrdenResumen, destino: EstadoOrden, actual: EstadoOrden) => void
  onAsignarTecnico: (orden: OrdenResumen, tecnicoId: number | null) => void
}

export function TablaOrdenes({
  ordenes,
  seleccion,
  todasSeleccionadas,
  onAlternar,
  onAlternarTodas,
  cargando,
  tecnicos,
  estadoDe,
  onCambiarEstado,
  onAsignarTecnico,
}: Props) {
  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <div
        className={cn(
          COLUMNAS,
          'sticky top-0 z-10 border-b border-border-base bg-bg py-[11px] text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase',
        )}
      >
        <Casilla
          marcada={todasSeleccionadas}
          etiqueta="Seleccionar todas las órdenes de esta página"
          onChange={onAlternarTodas}
        />
        <span>ID</span>
        <span>Cliente</span>
        <span>Técnico</span>
        <span>Solicitud</span>
        <span>Programada</span>
        <span>Diagnóstico inicial</span>
        <span>Estado</span>
      </div>

      <div
        className={cn(
          ANCHO_MINIMO,
          'transition-opacity',
          cargando && 'pointer-events-none opacity-50',
        )}
      >
        {ordenes.length === 0 && !cargando && (
          <div className="flex flex-col items-center gap-1.5 px-4 py-16 text-center">
            <p className="m-0 text-[14px] font-semibold text-fg">
              Ninguna orden coincide con los filtros
            </p>
            <p className="m-0 text-[12.5px] text-fg-muted">
              Prueba con otro rango de fechas o limpia los filtros activos.
            </p>
          </div>
        )}

        {ordenes.map((orden) => {
          const marcada = seleccion.has(orden.id)
          return (
            <div
              key={orden.id}
              className={cn(
                COLUMNAS,
                'border-b border-border-base py-[13px] transition-colors',
                marcada ? 'bg-primary-soft' : 'hover:bg-bg',
              )}
            >
              <Casilla
                marcada={marcada}
                etiqueta={`Seleccionar la orden ${orden.codigo}`}
                onChange={() => onAlternar(orden.id)}
              />

              <span className="font-mono text-[12px] font-medium text-primary-on-soft">
                {orden.codigo}
              </span>

              <span className="truncate text-[12.5px] font-semibold text-fg">
                {orden.clienteNombre}
              </span>

              <SelectorTecnico
                tecnicoNombre={orden.tecnicoNombre}
                tecnicos={tecnicos}
                registro={orden.codigo}
                onAsignar={(tecnicoId) => onAsignarTecnico(orden, tecnicoId)}
              />

              <span className="text-[12px] text-fg-muted">
                {FECHA.format(new Date(orden.fechaSolicitud))}
              </span>

              <span
                className={cn(
                  'text-[12px]',
                  orden.fechaProgramada ? 'text-fg-muted' : 'text-fg-faint',
                )}
              >
                {orden.fechaProgramada ? fechaHoraCorta(orden.fechaProgramada) : '—'}
              </span>

              <span
                className="truncate text-[12px] text-fg-muted"
                title={orden.descripcionProblema}
              >
                {orden.descripcionProblema}
              </span>

              <SelectorEstado
                valor={estadoDe(orden.id, orden.estado)}
                meta={ESTADO_ORDEN_META}
                transiciones={TRANSICIONES_ORDEN[estadoDe(orden.id, orden.estado)]}
                registro={orden.codigo}
                onCambiar={(destino) =>
                  onCambiarEstado(orden, destino, estadoDe(orden.id, orden.estado))
                }
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
