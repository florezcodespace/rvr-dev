import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { AccionesFila, CambioActivo, Listado, type Columna } from '@shared/components/data'
import { IconEditar, IconMas, IconVer } from '@shared/components/icons'
import { Button, SearchInput, Tabs } from '@shared/components/ui'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { rolesService, type Rol } from '../api'

const cargar = rolesService.listar.bind(rolesService)

/** HU_03 Listar roles · HU_02 Buscar · HU_05 Cambiar estado */
export default function RolesPage() {
  const { tiene } = useAuth()
  const navigate = useNavigate()
  const f = useFiltros(['estado'] as const)
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)

  const columnas: Columna<Rol>[] = [
    {
      clave: 'nombre',
      titulo: 'Rol',
      render: (r) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-fg">{r.nombre}</div>
          <div className="truncate text-[11.5px] text-fg-subtle">{r.descripcion || 'Sin descripción'}</div>
        </div>
      ),
    },
    { clave: 'permisos', titulo: 'Permisos', ancho: '110px', alinear: 'right', render: (r) => <span className="font-mono whitespace-nowrap text-fg">{r.permisos}</span> },
    { clave: 'usuarios', titulo: 'Usuarios', ancho: '130px', alinear: 'right', render: (r) => <span className="font-mono whitespace-nowrap text-fg">{r.usuariosActivos}<span className="text-fg-faint"> / {r.usuarios}</span></span> },
    {
      clave: 'estado',
      titulo: 'Estado',
      ancho: '130px',
      render: (r) => (
        <CambioActivo estado={r.estado} registro={`El rol ${r.nombre}`} puede={tiene('roles.cambiar_estado')}
          onCambiar={(e) => rolesService.cambiarEstado(r.id, e)} onHecho={recargar} />
      ),
    },
    {
      clave: 'acciones',
      titulo: '',
      ancho: '92px',
      alinear: 'right',
      render: (r) => (
        <AccionesFila
          acciones={[
            ...(tiene('roles.ver_detalle') ? [{ clave: 'ver', etiqueta: `Ver el rol ${r.nombre}`, icono: <IconVer />, a: DETALLE.rol(r.id) }] : []),
            ...(tiene('roles.editar') ? [{ clave: 'editar', etiqueta: `Editar el rol ${r.nombre}`, icono: <IconEditar />, a: DETALLE.rolEditar(r.id) }] : []),
          ]}
        />
      ),
    },
  ]

  const c = datos?.conteos
  return (
    <Listado
      eyebrow="Configuración"
      titulo="Roles"
      descripcion="Perfiles de acceso al sistema y los permisos que otorga cada uno."
      acciones={tiene('roles.registrar') && <Button leadingIcon={<IconMas />} onClick={() => navigate(ROUTES.rolNuevo)}>Registrar rol</Button>}
      barra={
        <>
          {tiene('roles.buscar') && (
            <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Buscar rol por nombre…" className="w-full max-w-[320px]" />
          )}
          <Tabs
            etiqueta="Filtrar por estado"
            valor={f.valores.estado || 'todos'}
            onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
            opciones={[
              { valor: 'todos', label: 'Todos', conteo: c?.todos },
              { valor: 'activo', label: 'Activos', conteo: c?.activo },
              { valor: 'inactivo', label: 'Inactivos', conteo: c?.inactivo },
            ]}
          />
        </>
      }
      columnas={columnas}
      filas={datos?.items ?? []}
      claveFila={(r) => r.id}
      cargando={cargando}
      error={error}
      onAbrir={tiene('roles.ver_detalle') ? (r) => navigate(DETALLE.rol(r.id)) : undefined}
      vacio={{ titulo: 'No se encontraron resultados', descripcion: 'Prueba con otro nombre o quita el filtro de estado.' }}
      pagina={datos ?? undefined}
      onPagina={f.setPagina}
    />
  )
}
