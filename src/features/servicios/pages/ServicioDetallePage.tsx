import { useCallback, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { ROUTES } from '@app/routes/paths'
import { CambioActivo, EstadoBadge } from '@shared/components/data'
import { Bloque, Datos, Volver } from '@shared/components/detalle'
import { ESTADO_REGISTRO_META } from '@shared/domain/estados'
import { Alert, Button, PageHeader, SkeletonKpis, StatCard, StatGrid } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { formatearMoneda } from '@shared/lib/format'
import { serviciosService } from '../api'
import { FormServicio } from '../FormServicio'

/** HU_20 · Detalle del servicio (solo lectura, CA_20_03). */
export default function ServicioDetallePage() {
  const id = Number(useParams().id)
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const [editando, setEditando] = useState(false)
  const cargar = useCallback((sid: number) => serviciosService.detalle(sid), [])
  const { datos: s, error, recargar } = useRecurso(cargar, id)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar el servicio" description={error} /></div>
  if (!s) return <div className="p-7"><SkeletonKpis /></div>

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.servicios} texto="Volver al catálogo" />
      <PageHeader
        eyebrow={`Servicios · ${s.categoria}`}
        titulo={s.nombre}
        descripcion={formatearMoneda(s.precioBase)}
        acciones={
          <>
            <CambioActivo estado={s.estado} registro={s.nombre} puede={tiene('servicios.cambiar_estado')} onCambiar={(e) => serviciosService.cambiarEstado(s.id, e)} onHecho={recargar} />
            {tiene('servicios.editar') && <Button onClick={() => setEditando(true)}>Editar servicio</Button>}
          </>
        }
      />
      <StatGrid>
        <StatCard etiqueta="Cotizaciones" valor={String(s.uso.cotizaciones)} detalle="En las que aparece" glifo="✦" tono="primary" />
        <StatCard etiqueta="Unidades cotizadas" valor={String(s.uso.unidades)} detalle="Suma de cantidades" glifo="◆" tono="info" />
        <StatCard etiqueta="Órdenes" valor={String(s.uso.ordenes)} detalle="Órdenes que lo incluyen" glifo="▣" tono="cyan" />
        <StatCard etiqueta="Valor en órdenes" valor={formatearMoneda(s.uso.ingresos)} detalle="Al precio congelado de cada cotización" glifo="$" tono="success" />
      </StatGrid>
      <Bloque titulo="Datos del servicio">
        <Datos items={[
          { label: 'Nombre', valor: s.nombre },
          { label: 'Categoría', valor: s.categoria },
          { label: 'Precio base', valor: formatearMoneda(s.precioBase) },
          { label: 'Estado', valor: <EstadoBadge meta={ESTADO_REGISTRO_META[s.estado]} /> },
        ]} />
        <div>
          <div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Descripción</div>
          <p className="m-0 mt-1 text-[13.5px] leading-[1.6] text-fg">{s.descripcion || '—'}</p>
        </div>
      </Bloque>
      <FormServicio abierto={editando} servicio={s} onCerrar={() => setEditando(false)} onGuardado={(x) => { mostrar({ tono: 'exito', mensaje: `${x.nombre} actualizado` }); recargar() }} />
    </div>
  )
}
