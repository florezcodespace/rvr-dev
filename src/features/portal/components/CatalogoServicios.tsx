import { useCallback, useMemo, useState } from 'react'
import { IconBuscar, IconCheck, IconMas } from '@shared/components/icons'
import { Alert, Button, Card, Skeleton, Tabs } from '@shared/components/ui'
import { useCarrito } from '@shared/hooks/useCarrito'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearMoneda } from '@shared/lib/format'
import { portalService } from '../api'

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * HU_21 · Catálogo de servicios activos (CA_21_01), con nombre, categoría,
 * descripción y precio base (CA_21_02), búsqueda y filtro por categoría
 * (CA_21_03) y selección de servicios para la solicitud (CA_21_04).
 */
export function CatalogoServicios() {
  const cargar = useCallback(() => portalService.catalogo({}), [])
  const { datos, error } = useRecurso(cargar, 0)
  const { agregar, tiene } = useCarrito()
  const [q, setQ] = useState('')
  const [categoria, setCategoria] = useState('todas')

  const visibles = useMemo(
    () => (datos?.items ?? []).filter((s) => (categoria === 'todas' || s.categoria === categoria) && (!q || normalizar(`${s.nombre} ${s.descripcion} ${s.categoria}`).includes(normalizar(q)))),
    [datos, q, categoria],
  )

  if (error) return <Alert tone="danger" title="No pudimos cargar el catálogo" description={error} />

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative w-full lg:max-w-[340px]">
          <IconBuscar className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar servicio…" aria-label="Buscar servicio"
            className="h-11 w-full rounded-[10px] border border-border-strong bg-surface pr-3.5 pl-10 text-[13.5px] text-fg outline-none focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)]" />
        </div>
        <Tabs etiqueta="Categoría" valor={categoria} onChange={setCategoria}
          opciones={[{ valor: 'todas', label: 'Todas' }, ...(datos?.categorias ?? []).map((c) => ({ valor: c, label: c, conteo: datos?.items.filter((s) => s.categoria === c).length }))]} />
      </div>

      {!datos && <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-48 w-full rounded-[16px]" />)}</div>}
      {datos && visibles.length === 0 && <p className="m-0 rounded-[14px] border border-dashed border-border-strong p-10 text-center text-[13.5px] text-fg-muted">No hay servicios que coincidan con tu búsqueda.</p>}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {visibles.map((s) => {
          const elegido = tiene(s.id)
          return (
            <Card key={s.id} viva className="flex flex-col gap-3 p-5">
              <span className="w-fit rounded-[7px] bg-primary-soft px-2 py-0.5 text-[10.5px] font-bold tracking-[0.05em] text-primary-on-soft uppercase">{s.categoria}</span>
              <h3 className="m-0 text-[16px] leading-snug font-bold tracking-[-0.2px] text-fg">{s.nombre}</h3>
              <p className="m-0 flex-1 text-[13px] leading-[1.55] text-fg-muted">{s.descripcion}</p>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="text-[10.5px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Desde</div>
                  <div className="font-mono whitespace-nowrap text-[17px] font-bold text-fg">{formatearMoneda(s.precioBase)}</div>
                </div>
                <Button variant={elegido ? 'secondary' : 'primary'} size="sm" leadingIcon={elegido ? <IconCheck /> : <IconMas />}
                  onClick={() => agregar({ servicioId: s.id, nombre: s.nombre, categoria: s.categoria, precioBase: s.precioBase })}>
                  {elegido ? 'Agregar otro' : 'Agregar'}
                </Button>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
