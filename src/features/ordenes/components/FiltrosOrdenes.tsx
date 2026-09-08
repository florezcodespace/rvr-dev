import { useEffect, useState } from 'react'
import { ESTADOS_ORDEN, ESTADO_ORDEN_META } from '@shared/domain/estadoOrden'
import type { EstadoOrden } from '@shared/domain/estadoOrden'
import { IconBuscar } from '@shared/components/icons'
import { Card, Dropdown } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'
import type { FiltrosOrdenes as Filtros, OpcionFiltro } from '../types'

interface Props {
  filtros: Filtros
  clientes: OpcionFiltro[]
  tecnicos: OpcionFiltro[]
  activos: number
  onCambiar: (cambios: Partial<Filtros>) => void
  onLimpiar: () => void
}

function etiquetaRango(desde: string | null, hasta: string | null): string {
  if (!desde && !hasta) return 'Fecha: cualquiera'
  if (desde && hasta) return `${desde} → ${hasta}`
  return desde ? `Desde ${desde}` : `Hasta ${hasta}`
}

export function FiltrosOrdenes({
  filtros,
  clientes,
  tecnicos,
  activos,
  onCambiar,
  onLimpiar,
}: Props) {
  const [texto, setTexto] = useState(filtros.busqueda)
  const [busquedaPrevia, setBusquedaPrevia] = useState(filtros.busqueda)

  // Si la URL cambia por fuera (botón atrás, "Limpiar"), el input se sincroniza
  // durante el render, sin efecto de por medio.
  if (filtros.busqueda !== busquedaPrevia) {
    setBusquedaPrevia(filtros.busqueda)
    setTexto(filtros.busqueda)
  }

  // La búsqueda escribe en la URL con retardo para no consultar en cada tecla.
  useEffect(() => {
    if (texto === filtros.busqueda) return
    const id = setTimeout(() => onCambiar({ busqueda: texto }), 300)
    return () => clearTimeout(id)
  }, [texto, filtros.busqueda, onCambiar])

  const alternarEstado = (estado: EstadoOrden) => {
    const siguiente = filtros.estados.includes(estado)
      ? filtros.estados.filter((e) => e !== estado)
      : [...filtros.estados, estado]
    onCambiar({ estados: siguiente })
  }

  const nombreCliente = clientes.find((c) => c.id === filtros.clienteId)?.nombre
  const nombreTecnico = tecnicos.find((t) => t.id === filtros.tecnicoId)?.nombre

  return (
    <Card className="flex-row flex-wrap items-center gap-2.5 px-[15px] py-[13px]">
      <div className="flex h-9 w-[262px] items-center gap-2 rounded-[9px] border border-border-strong bg-surface px-[11px] focus-within:ring-focus">
        <IconBuscar width="14" height="14" className="flex-none text-fg-faint" />
        <input
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar por ID, cliente o diagnóstico"
          aria-label="Buscar órdenes"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-fg outline-none placeholder:text-fg-faint"
        />
      </div>

      <Dropdown
        activo={filtros.estados.length > 0}
        etiqueta={
          filtros.estados.length === 0
            ? 'Estado: todos'
            : filtros.estados.length === 1
              ? `Estado: ${ESTADO_ORDEN_META[filtros.estados[0]!].label}`
              : `Estado: ${filtros.estados.length} seleccionados`
        }
      >
        {() => (
          <ul className="flex list-none flex-col p-0">
            {ESTADOS_ORDEN.map((estado) => {
              const marcado = filtros.estados.includes(estado)
              return (
                <li key={estado}>
                  <button
                    type="button"
                    onClick={() => alternarEstado(estado)}
                    className="flex w-full cursor-pointer items-center gap-2.5 rounded-[7px] px-2 py-[7px] text-left text-[12.5px] text-fg hover:bg-surface-muted"
                  >
                    <span
                      className={cn(
                        'flex size-[15px] flex-none items-center justify-center rounded-[4px] border text-[10px] font-bold text-white',
                        marcado
                          ? 'border-primary bg-primary'
                          : 'border-border-strong bg-surface',
                      )}
                    >
                      {marcado ? '✓' : ''}
                    </span>
                    <span
                      aria-hidden="true"
                      className="size-2 flex-none rounded-full"
                      style={{ background: ESTADO_ORDEN_META[estado].color }}
                    />
                    {ESTADO_ORDEN_META[estado].label}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Dropdown>

      <Dropdown
        activo={filtros.clienteId !== null}
        etiqueta={`Cliente: ${nombreCliente ?? 'Todos'}`}
      >
        {(cerrar) => (
          <ul className="flex max-h-64 list-none flex-col overflow-y-auto p-0">
            {[{ id: 0, nombre: 'Todos' }, ...clientes].map((cliente) => (
              <li key={cliente.id}>
                <button
                  type="button"
                  onClick={() => {
                    onCambiar({ clienteId: cliente.id === 0 ? null : cliente.id })
                    cerrar()
                  }}
                  className="w-full cursor-pointer rounded-[7px] px-2 py-[7px] text-left text-[12.5px] text-fg hover:bg-surface-muted"
                >
                  {cliente.nombre}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dropdown>

      <Dropdown
        activo={filtros.tecnicoId !== null}
        etiqueta={`Técnico: ${nombreTecnico ?? 'Todos'}`}
      >
        {(cerrar) => (
          <ul className="flex list-none flex-col p-0">
            {[{ id: 0, nombre: 'Todos' }, ...tecnicos].map((tecnico) => (
              <li key={tecnico.id}>
                <button
                  type="button"
                  onClick={() => {
                    onCambiar({ tecnicoId: tecnico.id === 0 ? null : tecnico.id })
                    cerrar()
                  }}
                  className="w-full cursor-pointer rounded-[7px] px-2 py-[7px] text-left text-[12.5px] text-fg hover:bg-surface-muted"
                >
                  {tecnico.nombre}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Dropdown>

      <Dropdown
        activo={Boolean(filtros.desde || filtros.hasta)}
        etiqueta={etiquetaRango(filtros.desde, filtros.hasta)}
      >
        {() => (
          <div className="flex flex-col gap-2 p-1">
            <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-fg-muted">
              Desde
              <input
                type="date"
                value={filtros.desde ?? ''}
                onChange={(e) => onCambiar({ desde: e.target.value || null })}
                className="h-9 rounded-[8px] border border-border-strong bg-surface px-2.5 text-[12.5px] text-fg outline-none focus:ring-focus"
              />
            </label>
            <label className="flex flex-col gap-1 text-[11.5px] font-semibold text-fg-muted">
              Hasta
              <input
                type="date"
                value={filtros.hasta ?? ''}
                onChange={(e) => onCambiar({ hasta: e.target.value || null })}
                className="h-9 rounded-[8px] border border-border-strong bg-surface px-2.5 text-[12.5px] text-fg outline-none focus:ring-focus"
              />
            </label>
          </div>
        )}
      </Dropdown>

      <div className="ml-auto flex items-center gap-2.5">
        <span className="text-[11.5px] text-fg-subtle">
          {activos === 0
            ? 'Sin filtros'
            : `${activos} ${activos === 1 ? 'filtro activo' : 'filtros activos'}`}
        </span>
        {activos > 0 && (
          <button
            type="button"
            onClick={onLimpiar}
            className="cursor-pointer text-[12px] font-semibold text-link hover:underline"
          >
            Limpiar
          </button>
        )}
      </div>
    </Card>
  )
}
