import { useCallback } from 'react'
import { ESTADO_TECNICO_META } from '@shared/domain/estados'
import { IconDescargar, IconMas } from '@shared/components/icons'
import {
  Alert,
  Button,
  Card,
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
import { formatearDecimal } from '@shared/lib/format'
import { tecnicosService } from '../api'
import { TarjetaTecnico } from '../components/TarjetaTecnico'
import { TABS_TECNICO, type TabTecnico } from '../types'

const ETIQUETAS: Record<TabTecnico, string> = {
  todos: 'Todos',
  disponibles: 'Disponibles',
  en_ruta: 'En ruta o en sitio',
  fuera_turno: 'Fuera de turno',
}

const cargar = tecnicosService.listar.bind(tecnicosService)

export default function TecnicosPage() {
  const { tab, q, params, setTab, setQ } = useListaParams<TabTecnico>('todos', TABS_TECNICO)
  const { datos, cargando, error } = useRecurso(cargar, params)

  const guardar = useCallback(
    (id: number, estado: Parameters<typeof tecnicosService.cambiarEstado>[1]) =>
      tecnicosService.cambiarEstado(id, estado),
    [],
  )
  const { estadoDe, cambiar } = useCambioEstado(guardar, ESTADO_TECNICO_META)

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
        titulo="Técnicos"
        descripcion={
          resumen
            ? `${resumen.disponibles} de ${resumen.activos} técnicos disponibles para las órdenes de hoy`
            : 'Cargando…'
        }
        acciones={
          <>
            <Button variant="secondary" leadingIcon={<IconDescargar />}>
              Ver agenda
            </Button>
            <Button leadingIcon={<IconMas />}>Agregar técnico</Button>
          </>
        }
      />

      {resumen && (
        <StatGrid>
          <StatCard
            etiqueta="Disponibles ahora"
            valor={String(resumen.disponibles)}
            valorSecundario={` / ${resumen.activos}`}
            detalle="Según horarios_tecnicos de hoy"
            glifo="✓"
            tono="success"
          />
          <StatCard
            etiqueta="En ruta o en sitio"
            valor={String(resumen.enRuta)}
            detalle="Con orden asignada"
            glifo="→"
            tono="primary"
          />
          <StatCard
            etiqueta="Órdenes asignadas hoy"
            valor={String(resumen.ordenesHoy)}
            detalle={`Promedio de ${formatearDecimal(resumen.promedioPorTecnico)} por técnico`}
            glifo="◆"
            tono="info"
          />
          <StatCard
            etiqueta="Cumplimiento SLA"
            valor={`${resumen.cumplimientoSla} %`}
            detalle="Meta del mes: 95 %"
            glifo="◈"
            tono="warning"
          />
        </StatGrid>
      )}

      <Card className="gap-4 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <Tabs
            etiqueta="Filtrar técnicos por disponibilidad"
            valor={tab}
            onChange={setTab}
            opciones={TABS_TECNICO.map((valor) => ({
              valor,
              label: ETIQUETAS[valor],
              conteo: datos?.conteos[valor],
            }))}
          />
          <SearchInput
            valor={q}
            onChange={setQ}
            placeholder="Buscar por nombre, zona o habilidad"
            className="ml-auto w-full max-w-[280px]"
          />
        </div>

        {cargando && !datos ? (
          <div className="flex justify-center py-16 text-fg-subtle">
            <Spinner className="size-5" />
          </div>
        ) : datos && datos.items.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 py-16 text-center">
            <p className="m-0 text-[14px] font-semibold text-fg">Ningún técnico coincide</p>
            <p className="m-0 text-[12.5px] text-fg-muted">
              Cambia de pestaña o ajusta la búsqueda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {datos?.items.map((tecnico) => {
              const actual = estadoDe(tecnico.id, tecnico.estado)
              return (
                <TarjetaTecnico
                  key={tecnico.id}
                  tecnico={tecnico}
                  estado={actual}
                  onCambiarEstado={(destino) =>
                    cambiar(tecnico.id, destino, actual, tecnico.nombre)
                  }
                />
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
