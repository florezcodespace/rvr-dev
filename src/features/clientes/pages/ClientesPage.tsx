import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE } from '@app/routes/paths'
import { AccionesFila, CambioActivo, Listado, type Columna } from '@shared/components/data'
import { FiltroSelect } from '@shared/components/form/Campos'
import { IconEditar, IconMas, IconVer } from '@shared/components/icons'
import { Avatar, Button, SearchInput, StatCard, StatGrid, Tabs } from '@shared/components/ui'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { formatearFecha } from '@shared/lib/format'
import { clientesService, type Cliente } from '../api'
import { FormCliente } from '../FormCliente'

const cargar = clientesService.listar.bind(clientesService)

/** HU_33 Listar · HU_32 Buscar · HU_83 Cambiar estado · HU_31 / HU_34 */
export default function ClientesPage() {
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const f = useFiltros(['estado', 'orden'] as const, { orden: 'fecha' })
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [form, setForm] = useState<{ abierto: boolean; cliente: Cliente | null }>({ abierto: false, cliente: null })

  const columnas: Columna<Cliente>[] = [
    {
      clave: 'cliente', titulo: 'Cliente',
      render: (c) => (
        <div className="flex items-center gap-2.5">
          <Avatar nombre={c.nombre} tamano="sm" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg">{c.nombres} {c.apellidos}</div>
            <div className="truncate font-mono text-[11px] text-fg-subtle">{c.documento}</div>
          </div>
        </div>
      ),
    },
    { clave: 'telefono', titulo: 'Teléfono', ancho: '120px', render: (c) => c.telefono || '—' },
    { clave: 'direccion', titulo: 'Dirección', recortar: true, render: (c) => c.direccion || '—' },
    { clave: 'registro', titulo: 'Registro', ancho: '104px', render: (c) => formatearFecha(c.fechaRegistro) },
    { clave: 'portal', titulo: 'Portal', ancho: '90px', render: (c) => (c.tieneCuenta ? <span className="text-success-fg">● Cuenta</span> : <span className="text-fg-faint">—</span>) },
    {
      clave: 'estado', titulo: 'Estado', ancho: '130px',
      render: (c) => <CambioActivo estado={c.estado} registro={c.nombre} puede={tiene('clientes.cambiar_estado')} onCambiar={(e, conf) => clientesService.cambiarEstado(c.id, e, conf)} onHecho={recargar} />,
    },
    {
      clave: 'acciones', titulo: '', ancho: '92px', alinear: 'right',
      render: (c) => (
        <AccionesFila acciones={[
          ...(tiene('clientes.ver_detalle') ? [{ clave: 'ver', etiqueta: `Ver a ${c.nombre}`, icono: <IconVer />, a: DETALLE.cliente(c.id) }] : []),
          ...(tiene('clientes.editar') ? [{ clave: 'editar', etiqueta: `Editar a ${c.nombre}`, icono: <IconEditar />, onClick: () => setForm({ abierto: true, cliente: c }) }] : []),
        ]} />
      ),
    },
  ]

  const c = datos?.conteos
  return (
    <>
      <Listado
        eyebrow="Venta – Órdenes"
        titulo="Clientes"
        descripcion="Historial centralizado: ya no se vuelven a pedir los datos ni se pierden en el cuaderno."
        acciones={tiene('clientes.registrar') && <Button leadingIcon={<IconMas />} onClick={() => setForm({ abierto: true, cliente: null })}>Registrar cliente</Button>}
        indicadores={c && (
          <StatGrid>
            <StatCard etiqueta="Clientes activos" valor={String(c.activo)} detalle={`${c.todos} registrados en total`} glifo="●" tono="success" />
            <StatCard etiqueta="Con cuenta en el portal" valor={String(c.con_cuenta)} detalle="Solicitan y aprueban en línea" glifo="◆" tono="primary" />
            <StatCard etiqueta="Nuevos este mes" valor={String(c.nuevos_mes)} detalle="Registrados desde el día 1" glifo="✦" tono="info" />
            <StatCard etiqueta="Inactivos" valor={String(c.inactivo)} detalle="Conservan su historial" glifo="○" tono="warning" />
          </StatGrid>
        )}
        barra={
          <>
            {tiene('clientes.buscar') && <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Nombre, documento o teléfono…" className="w-full max-w-[300px]" />}
            <Tabs etiqueta="Estado" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
              opciones={[{ valor: 'todos', label: 'Todos', conteo: c?.todos }, { valor: 'activo', label: 'Activos', conteo: c?.activo }, { valor: 'inactivo', label: 'Inactivos', conteo: c?.inactivo }]} />
            <FiltroSelect etiqueta="Ordenar por" valor={f.valores.orden === 'fecha' ? '' : f.valores.orden} onChange={(v) => f.set('orden', v || 'fecha')}
              opciones={[{ valor: 'nombre', label: 'Nombre' }]} todos="Fecha de registro" />
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(x) => x.id}
        cargando={cargando}
        error={error}
        onAbrir={tiene('clientes.ver_detalle') ? (x) => navigate(DETALLE.cliente(x.id)) : undefined}
        vacio={{ titulo: 'No se encontraron clientes', descripcion: 'Prueba con otro término o quita los filtros.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
      />
      <FormCliente abierto={form.abierto} cliente={form.cliente} onCerrar={() => setForm({ abierto: false, cliente: null })}
        onGuardado={(x) => { mostrar({ tono: 'exito', mensaje: form.cliente ? `Datos de ${x.nombre} actualizados` : `${x.nombre} registrado` }); recargar() }} />
    </>
  )
}
