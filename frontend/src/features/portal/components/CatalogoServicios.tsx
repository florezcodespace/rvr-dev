import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { IconBuscar, IconCheck, IconEscudo, IconMas, IconReloj } from '@shared/components/icons'
import { Alert, Skeleton } from '@shared/components/ui'
import type { CategoriaServicio } from '@shared/domain/estados'
import { useCarrito } from '@shared/hooks/useCarrito'
import { useRecurso } from '@shared/hooks/useRecurso'
import { cn } from '@shared/lib/cn'
import { formatearDuracion, formatearGarantia, formatearMoneda } from '@shared/lib/format'
import { varsCss } from '@shared/lib/varsCss'
import { portalService } from '../api'
import { CATEGORIA_VISUAL } from './kit'

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * HU_21 · Catálogo de servicios activos (CA_21_01), con nombre, categoría,
 * descripción y precio base (CA_21_02), búsqueda y filtro por categoría
 * (CA_21_03) y selección de servicios para la solicitud (CA_21_04).
 * La categoría puede llegar en la URL (?categoria=Redes) desde el inicio.
 */
export function CatalogoServicios() {
  const cargar = useCallback(() => portalService.catalogo({}), [])
  const { datos, error } = useRecurso(cargar, 0)
  const { agregar, items } = useCarrito()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [recien, setRecien] = useState<number | null>(null)
  const categoria = params.get('categoria') ?? 'todas'
  const elegirCategoria = (c: string) => {
    const p = new URLSearchParams(params)
    if (c === 'todas') p.delete('categoria')
    else p.set('categoria', c)
    setParams(p, { replace: true })
  }

  const visibles = useMemo(
    () => (datos?.items ?? []).filter((s) => (categoria === 'todas' || s.categoria === categoria) && (!q || normalizar(`${s.nombre} ${s.descripcion} ${s.categoria}`).includes(normalizar(q)))),
    [datos, q, categoria],
  )

  if (error) return <Alert tone="danger" title="No pudimos cargar el catálogo" description={error} />

  const opciones = [{ valor: 'todas', label: 'Todos', conteo: datos?.items.length }, ...(datos?.categorias ?? []).map((c) => ({ valor: c, label: CATEGORIA_VISUAL[c]?.corto ?? c, conteo: datos?.items.filter((s) => s.categoria === c).length }))]

  return (
    <div className="flex flex-col gap-5">
      {/* Buscador + categorías */}
      <div className="vidrio anim-entrada flex flex-col gap-4 rounded-[26px] border border-[var(--rvr-glass-borde)] p-4 sm:p-5">
        <div className="relative">
          <IconBuscar width="20" height="20" className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-fg-faint" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="¿Qué necesitas? Ej. cámaras, formateo, red wifi…" aria-label="Buscar servicio"
            className="h-14 w-full rounded-[18px] border border-border-base bg-[var(--rvr-surface-raised)] pr-4 pl-12 text-[15px] text-fg outline-none transition-shadow placeholder:text-fg-faint focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_4px_var(--rvr-ring)]" />
        </div>
        <div role="tablist" aria-label="Categoría" className="flex flex-wrap gap-2">
          {opciones.map((o) => {
            const activa = categoria === o.valor
            return (
              <button key={o.valor} type="button" role="tab" aria-selected={activa} onClick={() => elegirCategoria(o.valor)}
                className={cn('flex flex-none cursor-pointer items-center gap-2 rounded-full px-3.5 py-2 text-[13.5px] font-semibold transition-all duration-200',
                  activa ? 'bg-primary text-white shadow-[0_8px_18px_-8px_var(--rvr-halo-primary)]' : 'bg-surface-muted text-fg-muted hover:bg-primary-soft hover:text-fg')}>
                {o.label}
                {o.conteo !== undefined && <span className={cn('rounded-full px-1.5 text-[12px]', activa ? 'bg-white/20' : 'bg-surface text-fg-subtle')}>{o.conteo}</span>}
              </button>
            )
          })}
        </div>
      </div>

      {!datos && <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-60 w-full rounded-[24px]" />)}</div>}
      {datos && visibles.length === 0 && (
        <div className="vidrio rounded-[24px] border border-[var(--rvr-glass-borde)] p-10 text-center">
          <p className="m-0 text-[16px] font-bold text-fg">{q ? `No encontramos «${q}»` : 'Sin servicios en esta categoría'}</p>
          <p className="m-0 mt-1 text-[13.5px] text-fg-muted">Prueba con otra palabra o mira todas las categorías.</p>
          <button type="button" onClick={() => { setQ(''); elegirCategoria('todas') }} className="mt-3 font-semibold text-link">Ver todos los servicios</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {visibles.map((s, i) => {
          const enCarrito = items.find((it) => it.servicioId === s.id)
          const visual = CATEGORIA_VISUAL[s.categoria as CategoriaServicio]
          return (
            <article key={s.id}
              className={cn('bg-surface-raised shadow-[var(--rvr-shadow-sm)] anim-entrada relative flex flex-col gap-4 rounded-[24px] border p-5',
                enCarrito ? 'border-[var(--rvr-ring-border)] ring-2 ring-primary/30' : 'border-[var(--rvr-glass-borde)]',
                recien === s.id && 'portal-pop')}
              style={varsCss({ '--retraso': `${Math.min(i, 8) * 45}ms` })}>
              <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-semibold text-fg-subtle">{visual?.corto ?? s.categoria}</span>
                {enCarrito && <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary-on-soft"><IconCheck width="13" height="13" /> {enCarrito.cantidad} en tu solicitud</span>}
              </div>
              <div className="flex-1">
                <h3 className="m-0 text-[17px] leading-snug font-bold tracking-[-0.3px] text-fg">{s.nombre}</h3>
                <p className="m-0 mt-1.5 text-[13.5px] leading-[1.6] text-fg-muted">{s.descripcion}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-[12.5px]">
                <span title="Tiempo aproximado que tarda el técnico" className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 font-medium text-fg-muted">
                  <IconReloj width="13" height="13" /> {formatearDuracion(s.duracionMin)}
                </span>
                <span title="Cuenta desde que se finaliza el servicio" className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1 font-medium text-fg-muted">
                  <IconEscudo width="13" height="13" /> Garantía {formatearGarantia(s.diasGarantia)}
                </span>
              </div>
              <div className="flex items-end justify-between gap-3 border-t border-border-base pt-4">
                <div>
                  <div className="text-[12px] font-semibold text-fg-subtle">Desde</div>
                  <div className="font-display text-[22px] leading-tight font-extrabold whitespace-nowrap text-fg">{formatearMoneda(s.precioBase)}</div>
                </div>
                <button type="button"
                  onClick={() => {
                    agregar({ servicioId: s.id, nombre: s.nombre, categoria: s.categoria, precioBase: s.precioBase })
                    setRecien(s.id)
                    window.setTimeout(() => setRecien((r) => (r === s.id ? null : r)), 400)
                  }}
                  className={cn('pintura-boton inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-[14px] px-4 text-[14px] font-semibold',
                    enCarrito ? 'pintura-secundaria border border-border-base text-fg' : 'boton-liquido')}>
                  <IconMas width="16" height="16" /> {enCarrito ? 'Otro más' : 'Agregar'}
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
