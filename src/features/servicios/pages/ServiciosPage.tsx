import { useCallback } from 'react'
import { ESTADO_SERVICIO_META, TRANSICIONES_SERVICIO } from '@shared/domain/estados'
import { IconDescargar, IconMas } from '@shared/components/icons'
import { SelectorEstado } from '@shared/components/data'
import {
  Alert,
  Button,
  Card,
  Chip,
  PageHeader,
  SearchInput,
  Spinner,
  StatCard,
  StatGrid,
  Tabs,
} from '@shared/components/ui'
import { useCambioEstado } from '@shared/hooks/useCambioEstado'
import { useListaParams } from '@shared/hooks/useListaParams'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearDecimal, formatearMoneda } from '@shared/lib/format'
import { serviciosService } from '../api'
import { CATEGORIA_LABEL, TABS_SERVICIO, type TabServicio } from '../types'

const ETIQUETAS: Record<TabServicio, string> = {
  todos: 'Todos',
  soporte: 'Soporte',
  infraestructura: 'Infraestructura',
  seguridad: 'Seguridad',
  borradores: 'Borradores',
}

const cargar = serviciosService.listar.bind(serviciosService)

export default function ServiciosPage() {
  const { tab, q, params, setTab, setQ } = useListaParams<TabServicio>(
    'todos',
    TABS_SERVICIO,
  )
  const { datos, cargando, error } = useRecurso(cargar, params)

  const guardar = useCallback(
    (id: number, estado: Parameters<typeof serviciosService.cambiarEstado>[1]) =>
      serviciosService.cambiarEstado(id, estado),
    [],
  )
  const { estadoDe, cambiar } = useCambioEstado(guardar, ESTADO_SERVICIO_META)

  if (error) {
    return (
      <div className="p-7">
        <Alert tone="danger" title={error} description="Inténtalo de nuevo en un momento." />
      </div>
    )
  }

  const resumen = datos?.resumen

  return (
    <div className="flex flex-col gap-4 px-7 py-6">
      <PageHeader
        titulo="Servicios"
        descripcion="Catálogo de servicios que se pueden cotizar y asignar a una orden"
        acciones={
          <>
            <Button variant="secondary" leadingIcon={<IconDescargar />}>
              Exportar catálogo
            </Button>
            <Button leadingIcon={<IconMas />}>Nuevo servicio</Button>
          </>
        }
      />

      {resumen && (
        <StatGrid>
          <StatCard
            etiqueta="Servicios publicados"
            valor={String(resumen.publicados)}
            detalle={`${resumen.borradores} en borrador`}
            glifo="◆"
            tono="primary"
          />
          <StatCard
            etiqueta="Más solicitado"
            valor={String(resumen.masSolicitado.ordenes)}
            detalle={resumen.masSolicitado.nombre}
            glifo="◈"
            tono="info"
          />
          <StatCard
            etiqueta="Ingreso del mes"
            valor={formatearMoneda(resumen.ingresoMes)}
            detalle="+9 % vs. agosto"
            glifo="✓"
            tono="success"
          />
          <StatCard
            etiqueta="Duración promedio"
            valor={`${formatearDecimal(resumen.duracionPromedio)} h`}
            detalle="Por visita en sitio"
            glifo="◷"
            tono="cyan"
          />
        </StatGrid>
      )}

      <Card className="gap-4 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            etiqueta="Filtrar servicios por categoría"
            valor={tab}
            onChange={setTab}
            opciones={TABS_SERVICIO.map((valor) => ({
              valor,
              label: ETIQUETAS[valor],
              conteo: datos?.conteos[valor],
            }))}
          />
          <SearchInput
            valor={q}
            onChange={setQ}
            placeholder="Buscar servicio"
            className="ml-auto w-full max-w-[240px]"
          />
        </div>

        {cargando && !datos ? (
          <div className="flex justify-center py-16 text-fg-subtle">
            <Spinner className="size-5" />
          </div>
        ) : datos && datos.items.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-16 text-center">
            <p className="m-0 text-[14px] font-semibold text-fg">Ningún servicio coincide</p>
            <p className="m-0 text-[12.5px] text-fg-muted">
              Cambia de categoría o ajusta la búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {datos?.items.map((servicio) => {
              const actual = estadoDe(servicio.id, servicio.estado)
              return (
                <Card
                  key={servicio.id}
                  className="gap-2.5 border-border-base px-[17px] py-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <Chip>{CATEGORIA_LABEL[servicio.categoria]}</Chip>
                    <SelectorEstado
                      valor={actual}
                      meta={ESTADO_SERVICIO_META}
                      transiciones={TRANSICIONES_SERVICIO[actual]}
                      registro={servicio.nombre}
                      onCambiar={(destino) =>
                        cambiar(servicio.id, destino, actual, servicio.nombre)
                      }
                    />
                  </div>

                  <h3 className="m-0 text-[13.5px] font-bold tracking-[-0.2px] text-fg">
                    {servicio.nombre}
                  </h3>
                  <p className="m-0 flex-1 text-[11.5px] leading-[1.5] text-fg-muted">
                    {servicio.descripcion}
                  </p>

                  <div className="flex items-end justify-between gap-2 border-t border-border-base pt-2.5">
                    <div>
                      <div className="text-[15px] font-bold tracking-[-0.4px] text-fg">
                        {formatearMoneda(servicio.precio)}
                      </div>
                      <div className="text-[11px] text-fg-subtle">{servicio.unidad}</div>
                    </div>
                    <div className="text-right text-[11px] text-fg-subtle">
                      <div>{servicio.ordenes} órdenes</div>
                      <div>{servicio.diasGarantia} días de garantía</div>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
