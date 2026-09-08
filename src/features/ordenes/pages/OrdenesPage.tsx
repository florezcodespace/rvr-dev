import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { ESTADO_ORDEN_META } from '@shared/domain/estadoOrden'
import { IconDescargar, IconMas } from '@shared/components/icons'
import { Alert, Button, Card, Spinner } from '@shared/components/ui'
import { useCambioEstado } from '@shared/hooks/useCambioEstado'
import { useToast } from '@shared/hooks/useToast'
import { formatearNumero } from '@shared/lib/format'
import { PENDIENTE_BACKEND } from '@shared/lib/pendiente'
import { FiltrosOrdenes } from '../components/FiltrosOrdenes'
import { PieTabla } from '../components/PieTabla'
import { TablaOrdenes } from '../components/TablaOrdenes'
import { useFiltrosOrdenes } from '../hooks/useFiltrosOrdenes'
import { useListadoOrdenes } from '../hooks/useListadoOrdenes'
import { useSeleccion } from '../hooks/useSeleccion'
import { ordenesService } from '../api'

export default function OrdenesPage() {
  const navigate = useNavigate()
  const { filtros, actualizar, limpiar, activos } = useFiltrosOrdenes()
  const { datos, cargando, error } = useListadoOrdenes(filtros)

  const { mostrar } = useToast()
  const guardarEstado = useCallback(
    (id: number, estado: Parameters<typeof ordenesService.cambiarEstado>[1]) =>
      ordenesService.cambiarEstado(id, estado),
    [],
  )
  const { estadoDe, cambiar } = useCambioEstado(guardarEstado, ESTADO_ORDEN_META)

  const items = datos?.items ?? []
  const { seleccion, cantidad, alternar, alternarTodas, todasVisiblesSeleccionadas } =
    useSeleccion(items.map((o) => o.id))

  if (error) {
    return (
      <div className="p-7">
        <Alert
          tone="danger"
          title={error}
          description="Actualiza la página o inténtalo en unos minutos."
        />
      </div>
    )
  }

  if (!datos) {
    return (
      <div className="flex h-full items-center justify-center text-fg-subtle">
        <Spinner className="size-6" />
      </div>
    )
  }

  const totalPaginas = Math.max(Math.ceil(datos.total / datos.porPagina), 1)
  const desde = datos.total === 0 ? 0 : (datos.pagina - 1) * datos.porPagina + 1
  const hasta = Math.min(datos.pagina * datos.porPagina, datos.total)

  return (
    <div className="flex h-full flex-col gap-4 px-7 py-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="m-0 mb-[5px] text-[23px] font-bold tracking-[-0.6px] text-fg">
            Órdenes de servicio
          </h1>
          <p className="m-0 text-[13px] text-fg-muted">
            {formatearNumero(datos.totalGeneral)} órdenes registradas ·{' '}
            {datos.activas} activas · datos de{' '}
            <span className="font-mono text-[12px] font-medium text-primary-on-soft">
              ordenes_servicio
            </span>
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button
              variant="secondary"
              disabled
              title={PENDIENTE_BACKEND}
              leadingIcon={<IconDescargar />}
            >
            Exportar
          </Button>
          <Button leadingIcon={<IconMas />} onClick={() => navigate(ROUTES.ordenNueva)}>
            Nueva orden
          </Button>
        </div>
      </div>

      <FiltrosOrdenes
        filtros={filtros}
        clientes={datos.clientes}
        tecnicos={datos.tecnicos}
        activos={activos}
        onCambiar={actualizar}
        onLimpiar={limpiar}
      />

      <Card className="min-h-0 flex-1 overflow-hidden">
        <TablaOrdenes
          ordenes={items}
          seleccion={seleccion}
          todasSeleccionadas={todasVisiblesSeleccionadas}
          onAlternar={alternar}
          onAlternarTodas={alternarTodas}
          cargando={cargando}
          tecnicos={datos.tecnicos}
          estadoDe={estadoDe}
          onCambiarEstado={(orden, destino, actual) =>
            cambiar(orden.id, destino, actual, orden.codigo)
          }
          onAsignarTecnico={(orden, tecnicoId) => {
            const anterior = orden.tecnicoId
            const nombre =
              datos.tecnicos.find((t) => t.id === tecnicoId)?.nombre ?? 'Sin asignar'
            orden.tecnicoId = tecnicoId
            orden.tecnicoNombre = tecnicoId === null ? null : nombre
            void ordenesService.asignarTecnico(orden.id, tecnicoId).then(() =>
              mostrar({
                tono: 'exito',
                mensaje: `${orden.codigo} → ${nombre}`,
                deshacer: () => {
                  orden.tecnicoId = anterior
                  orden.tecnicoNombre =
                    datos.tecnicos.find((t) => t.id === anterior)?.nombre ?? null
                  void ordenesService.asignarTecnico(orden.id, anterior)
                },
              }),
            )
          }}
        />

        <PieTabla
          seleccionadas={cantidad}
          desde={desde}
          hasta={hasta}
          total={datos.total}
          pagina={datos.pagina}
          totalPaginas={totalPaginas}
          onPagina={(pagina) => actualizar({ pagina })}
          onAccionMasiva={() => undefined}
        />
      </Card>
    </div>
  )
}
