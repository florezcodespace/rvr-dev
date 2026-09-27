import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { partirDescripcion } from '@shared/lib/permisos'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { CambioActivo, EstadoBadge } from '@shared/components/data'
import { Bloque, Datos, SinDatos, Volver } from '@shared/components/detalle'
import { ESTADO_REGISTRO_META } from '@shared/domain/estados'
import { Alert, Button, PageHeader, SkeletonKpis } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { permisosService } from '../api'
import { FormPermiso } from '../FormPermiso'

/** HU_71 · Detalle del permiso con los roles que lo tienen (CA_71_02), solo lectura. */
export default function PermisoDetallePage() {
  const id = Number(useParams().id)
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const [editando, setEditando] = useState(false)
  const cargar = useCallback((pid: number) => permisosService.detalle(pid), [])
  const { datos: p, error, recargar } = useRecurso(cargar, id)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar el permiso" description={error} /></div>
  if (!p) return <div className="p-7"><SkeletonKpis /></div>
  const { hu, texto } = partirDescripcion(p.descripcion || p.nombre)

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.permisos} texto="Volver a permisos" />
      <PageHeader
        eyebrow="Configuración · Detalle del permiso"
        titulo={texto}
        descripcion={<code className="font-mono">{p.clave}</code>}
        acciones={
          <>
            <CambioActivo estado={p.estado} registro={`El permiso ${p.clave}`} puede={tiene('permisos.cambiar_estado')}
              onCambiar={(e) => permisosService.cambiarEstado(p.id, e)} onHecho={recargar} />
            {tiene('permisos.editar') && <Button onClick={() => setEditando(true)}>Editar permiso</Button>}
          </>
        }
      />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Bloque titulo="Datos del permiso">
          <Datos items={[
            { label: 'Nombre', valor: <code className="font-mono">{p.nombre}</code> },
            { label: 'Módulo', valor: p.moduloNombre },
            { label: 'Acción que autoriza', valor: texto },
            { label: 'Historia de usuario', valor: hu || '—' },
            { label: 'Estado', valor: <EstadoBadge meta={ESTADO_REGISTRO_META[p.estado]} /> },
            { label: 'Roles', valor: `${p.rolesActivos} activo(s) de ${p.roles}` },
          ]} />
        </Bloque>
        <Bloque titulo="Roles que lo tienen asignado">
          {p.listaRoles.length === 0 ? <SinDatos texto="Ningún rol tiene este permiso." /> : (
            <ul className="m-0 flex list-none flex-col gap-1 p-0">
              {p.listaRoles.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 rounded-[9px] px-2 py-1.5 hover:bg-surface-muted">
                  {tiene('roles.ver_detalle')
                    ? <Link to={DETALLE.rol(r.id)} className="text-[13px] font-semibold text-link hover:underline">{r.nombre}</Link>
                    : <span className="text-[13px] font-semibold text-fg">{r.nombre}</span>}
                  <span className="flex items-center gap-2 text-[11.5px] text-fg-subtle">
                    {r.usuariosActivos} usuario(s)
                    <EstadoBadge meta={ESTADO_REGISTRO_META[r.estado]} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Bloque>
      </div>
      <FormPermiso abierto={editando} permiso={p} onCerrar={() => setEditando(false)}
        onGuardado={(r) => { mostrar({ tono: 'exito', mensaje: `Permiso ${r.clave} actualizado` }); recargar() }} />
    </div>
  )
}
