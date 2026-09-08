import { useCallback } from 'react'
import { ESTADO_CLIENTE_META, TRANSICIONES_CLIENTE } from '@shared/domain/estados'
import { IconDescargar, IconMas } from '@shared/components/icons'
import { DataTable, Pager, SelectorEstado } from '@shared/components/data'
import type { Columna } from '@shared/components/data'
import {
  Alert,
  Avatar,
  Button,
  Card,
  PageHeader,
  SearchInput,
  StatCard,
  StatGrid,
  Tabs,
} from '@shared/components/ui'
import { useCambioEstado } from '@shared/hooks/useCambioEstado'
import { useListaParams } from '@shared/hooks/useListaParams'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearMoneda, formatearNumero, tiempoRelativo } from '@shared/lib/format'
import { PENDIENTE_BACKEND } from '@shared/lib/pendiente'
import { textoPagina } from '@shared/lib/paginar'
import { clientesService } from '../api'
import { TABS_CLIENTE, type Cliente, type TabCliente } from '../types'

const ETIQUETAS: Record<TabCliente, string> = {
  todos: 'Todos',
  activos: 'Activos',
  con_saldo: 'Con saldo',
  inactivos: 'Inactivos',
}

const cargar = clientesService.listar.bind(clientesService)

export default function ClientesPage() {
  const { tab, q, params, setTab, setQ, setPagina } = useListaParams<TabCliente>(
    'todos',
    TABS_CLIENTE,
  )
  const { datos, cargando, error } = useRecurso(cargar, params)

  const guardar = useCallback(
    (id: number, estado: Parameters<typeof clientesService.cambiarEstado>[1]) =>
      clientesService.cambiarEstado(id, estado),
    [],
  )
  const { estadoDe, cambiar } = useCambioEstado(guardar, ESTADO_CLIENTE_META)

  if (error) {
    return (
      <div className="p-7">
        <Alert tone="danger" title={error} description="Inténtalo de nuevo en un momento." />
      </div>
    )
  }

  const resumen = datos?.resumen
  const lista = datos?.pagina

  const columnas: Columna<Cliente>[] = [
    {
      clave: 'cliente',
      titulo: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar nombre={c.nombre} tamano="sm" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg">{c.nombre}</div>
            <div className="truncate font-mono text-[11px] text-fg-subtle">
              {c.documento}
            </div>
          </div>
        </div>
      ),
    },
    { clave: 'sector', titulo: 'Sector', ancho: '128px', render: (c) => c.sector },
    {
      clave: 'ordenes',
      titulo: 'Órdenes',
      ancho: '86px',
      alinear: 'right',
      render: (c) => <span className="font-mono text-[12px] text-fg">{c.ordenes}</span>,
    },
    {
      clave: 'facturacion',
      titulo: 'Facturación',
      ancho: '132px',
      alinear: 'right',
      render: (c) => (
        <span className="font-mono text-[12px] text-fg">
          {formatearMoneda(c.facturacion)}
        </span>
      ),
    },
    {
      clave: 'estado',
      titulo: 'Estado',
      ancho: '140px',
      render: (c) => {
        const actual = estadoDe(c.id, c.estado)
        return (
          <SelectorEstado
            valor={actual}
            meta={ESTADO_CLIENTE_META}
            transiciones={TRANSICIONES_CLIENTE[actual]}
            registro={c.nombre}
            onCambiar={(destino) => cambiar(c.id, destino, actual, c.nombre)}
          />
        )
      },
    },
    {
      clave: 'ultima',
      titulo: 'Última orden',
      ancho: '124px',
      render: (c) => tiempoRelativo(`${c.ultimaOrden}T12:00:00`),
    },
  ]

  return (
    <div className="flex h-full flex-col gap-4 px-7 py-6">
      <PageHeader
        titulo="Clientes"
        descripcion={
          resumen
            ? `${formatearNumero(resumen.total)} clientes registrados · ${resumen.nuevosMes} nuevos este mes`
            : 'Cargando…'
        }
        acciones={
          <>
            <Button
              variant="secondary"
              disabled
              title={PENDIENTE_BACKEND}
              leadingIcon={<IconDescargar />}
            >
              Importar
            </Button>
            <Button disabled title={PENDIENTE_BACKEND} leadingIcon={<IconMas />}>
              Nuevo cliente
            </Button>
          </>
        }
      />

      {resumen && (
        <StatGrid>
          <StatCard
            etiqueta="Clientes activos"
            valor={formatearNumero(resumen.activos)}
            detalle={`${Math.round((resumen.activos / resumen.total) * 100)} % de la base total`}
            glifo="◆"
            tono="primary"
          />
          <StatCard
            etiqueta="Nuevos este mes"
            valor={String(resumen.nuevosMes)}
            detalle="+2 frente a agosto"
            glifo="✦"
            tono="success"
          />
          <StatCard
            etiqueta="Con saldo pendiente"
            valor={String(resumen.conSaldo)}
            detalle={`${formatearMoneda(resumen.valorSaldo)} por conciliar`}
            detalleDestacado
            glifo="⏱"
            tono="warning"
          />
          <StatCard
            etiqueta="Facturación acumulada"
            valor={formatearMoneda(resumen.facturacionAnual)}
            detalle="Año corrido 2026"
            glifo="◈"
            tono="info"
          />
        </StatGrid>
      )}

      <Card className="min-h-0 flex-1 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border-base px-4 py-3">
          <Tabs
            etiqueta="Filtrar clientes"
            valor={tab}
            onChange={setTab}
            opciones={TABS_CLIENTE.map((valor) => ({
              valor,
              label: ETIQUETAS[valor],
              conteo: datos?.conteos[valor],
            }))}
          />
          <SearchInput
            valor={q}
            onChange={setQ}
            placeholder="Buscar por nombre o NIT"
            className="ml-auto w-full max-w-[260px]"
          />
        </div>

        <DataTable
          columnas={columnas}
          filas={lista?.items ?? []}
          claveFila={(c) => c.id}
          cargando={cargando}
          vacio={{
            titulo: 'Ningún cliente coincide',
            descripcion: 'Cambia de pestaña o ajusta la búsqueda.',
          }}
        />

        {lista && (
          <Pager
            pagina={lista.pagina}
            totalPaginas={lista.totalPaginas}
            info={textoPagina(lista, 'clientes')}
            onPagina={setPagina}
          />
        )}
      </Card>
    </div>
  )
}
