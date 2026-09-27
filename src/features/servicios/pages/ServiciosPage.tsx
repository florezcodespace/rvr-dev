import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE } from '@app/routes/paths'
import { AccionesFila, CambioActivo, Listado, type Columna } from '@shared/components/data'
import { FiltroSelect } from '@shared/components/form/Campos'
import { CATEGORIAS_SERVICIO } from '@shared/domain/estados'
import { IconEditar, IconMas, IconVer } from '@shared/components/icons'
import { Button, SearchInput, Tabs } from '@shared/components/ui'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { formatearMoneda } from '@shared/lib/format'
import { serviciosService, type Servicio } from '../api'
import { FormServicio } from '../FormServicio'

const cargar = serviciosService.listar.bind(serviciosService)

/** HU_17 Listar · HU_16 Buscar · HU_19 Cambiar estado · HU_15 / HU_18 */
export default function ServiciosPage() {
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const f = useFiltros(['estado', 'categoria'] as const)
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [form, setForm] = useState<{ abierto: boolean; servicio: Servicio | null }>({ abierto: false, servicio: null })

  const columnas: Columna<Servicio>[] = [
    {
      clave: 'nombre', titulo: 'Servicio', recortar: true,
      render: (s) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-fg">{s.nombre}</div>
          <div className="truncate text-[11.5px] text-fg-subtle">{s.descripcion || 'Sin descripción'}</div>
        </div>
      ),
    },
    { clave: 'categoria', titulo: 'Categoría', ancho: '170px', render: (s) => s.categoria },
    { clave: 'precio', titulo: 'Precio base', ancho: '130px', alinear: 'right', render: (s) => <span className="font-mono whitespace-nowrap text-fg">{formatearMoneda(s.precioBase)}</span> },
    { clave: 'veces', titulo: 'Cotizado', ancho: '100px', alinear: 'right', render: (s) => <span className="font-mono">{s.vecesCotizado ?? 0}</span> },
    {
      clave: 'estado', titulo: 'Estado', ancho: '130px',
      render: (s) => <CambioActivo estado={s.estado} registro={s.nombre} puede={tiene('servicios.cambiar_estado')} onCambiar={(e) => serviciosService.cambiarEstado(s.id, e)} onHecho={recargar} />,
    },
    {
      clave: 'acciones', titulo: '', ancho: '92px', alinear: 'right',
      render: (s) => (
        <AccionesFila acciones={[
          ...(tiene('servicios.ver_detalle') ? [{ clave: 'ver', etiqueta: `Ver ${s.nombre}`, icono: <IconVer />, a: DETALLE.servicio(s.id) }] : []),
          ...(tiene('servicios.editar') ? [{ clave: 'editar', etiqueta: `Editar ${s.nombre}`, icono: <IconEditar />, onClick: () => setForm({ abierto: true, servicio: s }) }] : []),
        ]} />
      ),
    },
  ]

  const c = datos?.conteos
  return (
    <>
      <Listado
        eyebrow="Servicios"
        titulo="Catálogo de servicios"
        descripcion="La oferta de RvR Tecnologías con su categoría y su precio base. Los activos se ven en el catálogo público."
        acciones={tiene('servicios.registrar') && <Button leadingIcon={<IconMas />} onClick={() => setForm({ abierto: true, servicio: null })}>Registrar servicio</Button>}
        barra={
          <>
            {tiene('servicios.buscar') && <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Buscar por nombre, categoría o descripción…" className="w-full max-w-[320px]" />}
            <Tabs etiqueta="Estado" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
              opciones={[{ valor: 'todos', label: 'Todos', conteo: c?.todos }, { valor: 'activo', label: 'Activos', conteo: c?.activo }, { valor: 'inactivo', label: 'Inactivos', conteo: c?.inactivo }]} />
            <FiltroSelect etiqueta="Categoría" valor={f.valores.categoria} onChange={(v) => f.set('categoria', v)} opciones={CATEGORIAS_SERVICIO.map((x) => ({ valor: x, label: x }))} todos="Todas" />
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(s) => s.id}
        cargando={cargando}
        error={error}
        onAbrir={tiene('servicios.ver_detalle') ? (s) => navigate(DETALLE.servicio(s.id)) : undefined}
        vacio={{ titulo: 'No se encontraron servicios', descripcion: 'Prueba con otro término o quita los filtros.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
      />
      <FormServicio abierto={form.abierto} servicio={form.servicio} onCerrar={() => setForm({ abierto: false, servicio: null })}
        onGuardado={(s) => { mostrar({ tono: 'exito', mensaje: form.servicio ? `${s.nombre} actualizado` : `${s.nombre} registrado` }); recargar() }} />
    </>
  )
}
