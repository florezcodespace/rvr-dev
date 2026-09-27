import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE } from '@app/routes/paths'
import { CredencialesNuevas, type Credenciales } from '@shared/components/cuentas/CredencialesNuevas'
import { AccionesFila, CambioActivo, Listado, type Columna } from '@shared/components/data'
import { FiltroSelect } from '@shared/components/form/Campos'
import { IconEditar, IconMas, IconVer } from '@shared/components/icons'
import { Avatar, Button, SearchInput, Tabs } from '@shared/components/ui'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { tiempoRelativo } from '@shared/lib/format'
import { usuariosService, type Usuario } from '../api'
import { FormUsuario } from '../FormUsuario'

const cargar = usuariosService.listar.bind(usuariosService)

/** HU_09 Listar · HU_08 Buscar · HU_11 Cambiar estado · HU_07 / HU_10 */
export default function UsuariosPage() {
  const { tiene, usuario: yo } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const f = useFiltros(['estado', 'rol'] as const)
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [roles, setRoles] = useState<{ id: number; nombre: string }[]>([])
  const [form, setForm] = useState<{ abierto: boolean; usuario: Usuario | null }>({ abierto: false, usuario: null })
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null)

  useEffect(() => { usuariosService.roles().then(setRoles).catch(() => undefined) }, [])

  const columnas: Columna<Usuario>[] = [
    {
      clave: 'usuario', titulo: 'Usuario',
      render: (u) => (
        <div className="flex items-center gap-2.5">
          <Avatar nombre={u.nombre} tamano="sm" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg">{u.nombres} {u.apellidos}</div>
            <div className="truncate font-mono text-[11px] text-fg-subtle">@{u.nombreUsuario}</div>
          </div>
        </div>
      ),
    },
    { clave: 'correo', titulo: 'Correo', recortar: true, render: (u) => u.correo },
    {
      clave: 'rol', titulo: 'Rol', ancho: '150px',
      render: (u) => (
        <span className="text-fg">{u.rol.nombre}{u.vinculo && <span className="block text-[11px] text-fg-subtle">{u.vinculo.tipo === 'cliente' ? 'Cuenta de cliente' : 'App móvil'}</span>}</span>
      ),
    },
    { clave: 'acceso', titulo: 'Último ingreso', ancho: '130px', render: (u) => (u.ultimoAcceso ? tiempoRelativo(u.ultimoAcceso) : 'Nunca') },
    {
      clave: 'estado', titulo: 'Estado', ancho: '130px',
      render: (u) => (
        <CambioActivo estado={u.estado} registro={`La cuenta de ${u.nombre}`} puede={tiene('usuarios.cambiar_estado') && u.id !== yo?.id}
          onCambiar={(e) => usuariosService.cambiarEstado(u.id, e)} onHecho={recargar} />
      ),
    },
    {
      clave: 'acciones', titulo: '', ancho: '92px', alinear: 'right',
      render: (u) => (
        <AccionesFila acciones={[
          ...(tiene('usuarios.ver_detalle') ? [{ clave: 'ver', etiqueta: `Ver a ${u.nombre}`, icono: <IconVer />, a: DETALLE.usuario(u.id) }] : []),
          ...(tiene('usuarios.editar') ? [{ clave: 'editar', etiqueta: `Editar a ${u.nombre}`, icono: <IconEditar />, onClick: () => setForm({ abierto: true, usuario: u }) }] : []),
        ]} />
      ),
    },
  ]

  const c = datos?.conteos
  return (
    <>
      <Listado
        eyebrow="Configuración"
        titulo="Usuarios"
        descripcion="Cuentas de acceso del personal, de los técnicos (app móvil) y de los clientes del portal."
        acciones={tiene('usuarios.registrar') && <Button leadingIcon={<IconMas />} onClick={() => setForm({ abierto: true, usuario: null })}>Registrar usuario</Button>}
        barra={
          <>
            {tiene('usuarios.buscar') && <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Buscar por nombre, correo, usuario o rol…" className="w-full max-w-[320px]" />}
            <Tabs etiqueta="Estado" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
              opciones={[{ valor: 'todos', label: 'Todos', conteo: c?.todos }, { valor: 'activo', label: 'Activos', conteo: c?.activo }, { valor: 'inactivo', label: 'Inactivos', conteo: c?.inactivo }]} />
            <FiltroSelect etiqueta="Rol" valor={f.valores.rol} onChange={(v) => f.set('rol', v)} opciones={roles.map((r) => ({ valor: String(r.id), label: r.nombre }))} />
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(u) => u.id}
        cargando={cargando}
        error={error}
        onAbrir={tiene('usuarios.ver_detalle') ? (u) => navigate(DETALLE.usuario(u.id)) : undefined}
        vacio={{ titulo: 'No se encontraron usuarios', descripcion: 'Prueba con otro término o quita los filtros.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
      />
      <FormUsuario
        abierto={form.abierto}
        usuario={form.usuario}
        onCerrar={() => setForm({ abierto: false, usuario: null })}
        onRegistrado={(r) => {
          mostrar({ tono: 'exito', mensaje: `Usuario ${r.usuario.nombre} registrado` })
          setCredenciales({ nombre: r.usuario.nombre, correo: r.usuario.correo, contrasena: r.contrasenaTemporal })
          recargar()
        }}
        onEditado={(u) => { mostrar({ tono: 'exito', mensaje: `Datos de ${u.nombre} actualizados` }); recargar() }}
      />
      <CredencialesNuevas credenciales={credenciales} onCerrar={() => setCredenciales(null)} />
    </>
  )
}
