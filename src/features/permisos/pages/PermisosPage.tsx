import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { partirDescripcion } from '@shared/lib/permisos'
import { DETALLE } from '@app/routes/paths'
import { AccionesFila, CambioActivo, Listado, type Columna } from '@shared/components/data'
import { FiltroSelect } from '@shared/components/form/Campos'
import { IconEditar, IconMas, IconVer } from '@shared/components/icons'
import { Button, SearchInput, Tabs } from '@shared/components/ui'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { permisosService, type Modulo, type Permiso } from '../api'
import { FormPermiso } from '../FormPermiso'

const cargar = permisosService.listar.bind(permisosService)

/** HU_68 Listar · HU_67 Buscar · HU_70 Cambiar estado · HU_66 / HU_69 */
export default function PermisosPage() {
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const f = useFiltros(['estado', 'modulo'] as const)
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [form, setForm] = useState<{ abierto: boolean; permiso: Permiso | null }>({ abierto: false, permiso: null })

  useEffect(() => {
    permisosService.modulos().then(setModulos).catch(() => undefined)
  }, [])

  const columnas: Columna<Permiso>[] = [
    {
      clave: 'nombre',
      titulo: 'Permiso',
      render: (p) => {
        const { hu, texto } = partirDescripcion(p.descripcion || p.nombre)
        return (
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg">{texto}</div>
            <div className="truncate font-mono text-[11px] text-fg-subtle">{p.clave}{hu && ` · ${hu}`}</div>
          </div>
        )
      },
    },
    { clave: 'modulo', titulo: 'Módulo', ancho: '190px', render: (p) => p.moduloNombre },
    { clave: 'roles', titulo: 'Roles', ancho: '90px', alinear: 'right', render: (p) => <span className="font-mono whitespace-nowrap text-fg">{p.roles}</span> },
    {
      clave: 'estado', titulo: 'Estado', ancho: '130px',
      render: (p) => (
        <CambioActivo estado={p.estado} registro={`El permiso ${p.clave}`} puede={tiene('permisos.cambiar_estado')}
          onCambiar={(e) => permisosService.cambiarEstado(p.id, e)} onHecho={recargar} />
      ),
    },
    {
      clave: 'acciones', titulo: '', ancho: '92px', alinear: 'right',
      render: (p) => (
        <AccionesFila acciones={[
          ...(tiene('permisos.ver_detalle') ? [{ clave: 'ver', etiqueta: `Ver ${p.clave}`, icono: <IconVer />, a: DETALLE.permiso(p.id) }] : []),
          ...(tiene('permisos.editar') ? [{ clave: 'editar', etiqueta: `Editar ${p.clave}`, icono: <IconEditar />, onClick: () => setForm({ abierto: true, permiso: p }) }] : []),
        ]} />
      ),
    },
  ]

  const c = datos?.conteos
  return (
    <>
      <Listado
        eyebrow="Configuración"
        titulo="Permisos"
        descripcion="Catálogo de acciones que se pueden otorgar a los roles, por módulo."
        acciones={tiene('permisos.registrar') && <Button leadingIcon={<IconMas />} onClick={() => setForm({ abierto: true, permiso: null })}>Registrar permiso</Button>}
        barra={
          <>
            {tiene('permisos.buscar') && <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Buscar por nombre, módulo o descripción…" className="w-full max-w-[320px]" />}
            <Tabs etiqueta="Estado" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
              opciones={[{ valor: 'todos', label: 'Todos', conteo: c?.todos }, { valor: 'activo', label: 'Activos', conteo: c?.activo }, { valor: 'inactivo', label: 'Inactivos', conteo: c?.inactivo }]} />
            <FiltroSelect etiqueta="Módulo" valor={f.valores.modulo} onChange={(v) => f.set('modulo', v)} opciones={modulos.map((m) => ({ valor: m.clave, label: m.nombre }))} />
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(p) => p.id}
        cargando={cargando}
        error={error}
        onAbrir={tiene('permisos.ver_detalle') ? (p) => navigate(DETALLE.permiso(p.id)) : undefined}
        vacio={{ titulo: 'No se encontraron permisos', descripcion: 'Prueba con otro término o quita los filtros.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
      />
      <FormPermiso
        abierto={form.abierto}
        permiso={form.permiso}
        onCerrar={() => setForm({ abierto: false, permiso: null })}
        onGuardado={(p) => {
          mostrar({ tono: 'exito', mensaje: form.permiso ? `Permiso ${p.clave} actualizado` : `Permiso ${p.clave} registrado` })
          recargar()
        }}
      />
    </>
  )
}
