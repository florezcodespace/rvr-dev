import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { ROUTES } from '@app/routes/paths'
import { IconDescargar, IconMas } from '@shared/components/icons'
import { Alert, Button, Spinner } from '@shared/components/ui'
import { formatearFechaLarga, nombreLegible, saludo } from '@shared/lib/format'
import { ActividadOperativa } from '../components/ActividadOperativa'
import { KpiCard } from '../components/KpiCard'
import { ServiciosMasSolicitados } from '../components/ServiciosMasSolicitados'
import { TendenciaCard } from '../components/TendenciaCard'
import { useResumenDashboard } from '../hooks/useResumenDashboard'

export default function DashboardPage() {
  const { usuario } = useAuth()
  const { datos, cargando, error } = useResumenDashboard()
  const navigate = useNavigate()

  const primerNombre = nombreLegible(usuario?.nombreUsuario).split(' ')[0] ?? ''

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center text-fg-subtle">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (error || !datos) {
    return (
      <div className="p-7">
        <Alert
          tone="danger"
          title={error ?? 'No pudimos cargar el resumen'}
          description="Actualiza la página o inténtalo en unos minutos."
        />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 px-7 py-[26px]">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-[7px] text-[11px] font-semibold tracking-[0.1em] text-fg-subtle uppercase">
            {formatearFechaLarga(datos.fecha)}
          </div>
          <h1 className="m-0 mb-[5px] text-[25px] font-bold tracking-[-0.7px] text-fg">
            {saludo()}, {primerNombre}
          </h1>
          <p className="m-0 text-[13px] text-fg-muted">
            Hoy hay{' '}
            <strong className="font-semibold text-fg">
              {datos.serviciosAgendadosHoy} servicios agendados
            </strong>{' '}
            y {datos.ordenesPorAprobar} órdenes esperando aprobación.
          </p>
        </div>

        <div className="flex gap-2.5">
          <Button variant="secondary" leadingIcon={<IconDescargar />}>
            Exportar reporte
          </Button>
          <Button leadingIcon={<IconMas />} onClick={() => navigate(ROUTES.ordenNueva)}>
            Nueva orden
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {datos.kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1.35fr_1fr]">
        <TendenciaCard
          tendencia={datos.tendencia}
          porEstado={datos.ordenesPorEstado}
        />

        <div className="flex min-h-0 flex-col gap-3.5">
          <ServiciosMasSolicitados datos={datos.serviciosMasSolicitados} />
          <ActividadOperativa eventos={datos.actividad} />
        </div>
      </div>
    </div>
  )
}
