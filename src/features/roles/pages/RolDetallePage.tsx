import { useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { CambioActivo, EstadoBadge } from '@shared/components/data'
import { Bloque, Datos, SinDatos, Volver } from '@shared/components/detalle'
import { ESTADO_REGISTRO_META } from '@shared/domain/estados'
import { Alert, Button, PageHeader, SkeletonKpis } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { partirDescripcion, rolesService } from '../api'

/** HU_06 · Ver detalle del rol (solo lectura, CA_06_04), permisos por módulo (CA_06_02). */
export default function RolDetallePage() {
  const id = Number(useParams().id)
  const { tiene } = useAuth()
  const cargar = useCallback((rid: number) => rolesService.detalle(rid), [])
  const { datos: rol, error, recargar } = useRecurso(cargar, id)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar el rol" description={error} /></div>
  if (!rol) return <div className="p-7"><SkeletonKpis /></div>

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.roles} texto="Volver a roles" />
      <PageHeader
        eyebrow="Configuración · Detalle del rol"
        titulo={rol.nombre}
        descripcion={rol.descripcion || 'Sin descripción'}
        acciones={
          <>
            <CambioActivo estado={rol.estado} registro={`El rol ${rol.nombre}`} puede={tiene('roles.cambiar_estado')}
              onCambiar={(e) => rolesService.cambiarEstado(rol.id, e)} onHecho={recargar} />
            {tiene('roles.editar') && <Link to={DETALLE.rolEditar(rol.id)}><Button>Editar rol y permisos</Button></Link>}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <div className="flex flex-col gap-3.5">
          <Bloque titulo="Datos del rol">
            <Datos
              columnas={1}
              items={[
                { label: 'Nombre', valor: rol.nombre },
                { label: 'Descripción', valor: rol.descripcion || '—' },
                { label: 'Estado', valor: <EstadoBadge meta={ESTADO_REGISTRO_META[rol.estado]} /> },
                { label: 'Permisos', valor: `${rol.permisos} permiso(s) en ${rol.porModulo.length} módulo(s)` },
                { label: 'Usuarios', valor: `${rol.usuariosActivos} activo(s) de ${rol.usuarios}` },
              ]}
            />
          </Bloque>
          <Bloque titulo="Usuarios con este rol" subtitulo={rol.listaUsuarios.length ? undefined : 'Nadie lo tiene asignado'}>
            {rol.listaUsuarios.length === 0 ? (
              <SinDatos texto="Ningún usuario tiene este rol." />
            ) : (
              <ul className="m-0 flex list-none flex-col gap-1 p-0">
                {rol.listaUsuarios.map((u) => (
                  <li key={u.id} className="flex items-center justify-between gap-3 rounded-[9px] px-2 py-1.5 hover:bg-surface-muted">
                    {tiene('usuarios.ver_detalle') ? (
                      <Link to={DETALLE.usuario(u.id)} className="min-w-0 truncate text-[13px] font-semibold text-link hover:underline">{u.nombre}</Link>
                    ) : (
                      <span className="min-w-0 truncate text-[13px] font-semibold text-fg">{u.nombre}</span>
                    )}
                    <EstadoBadge meta={ESTADO_REGISTRO_META[u.estado]} />
                  </li>
                ))}
              </ul>
            )}
          </Bloque>
        </div>

        <Bloque titulo="Permisos que otorga" subtitulo="Organizados por módulo">
          {rol.porModulo.length === 0 ? (
            <SinDatos texto="Este rol no tiene permisos." />
          ) : (
            <div className="flex flex-col gap-4">
              {rol.porModulo.map((g) => (
                <section key={g.modulo}>
                  <h3 className="m-0 mb-2 flex items-baseline gap-2 text-[13px] font-bold text-fg">
                    {g.nombre}
                    <span className="text-[11px] font-medium text-fg-subtle">{g.proceso}</span>
                  </h3>
                  <ul className="m-0 grid list-none grid-cols-1 gap-1.5 p-0 sm:grid-cols-2">
                    {g.permisos.map((p) => {
                      const { hu, texto } = partirDescripcion(p.descripcion || p.nombre)
                      return (
                        <li key={p.id} className="flex items-start gap-2 rounded-[9px] border border-border-base px-3 py-2">
                          <span aria-hidden="true" className="mt-0.5 text-success-fg">✓</span>
                          <span className="min-w-0">
                            <span className="block text-[12.5px] font-semibold text-fg">{texto}</span>
                            <span className="block font-mono text-[10.5px] text-fg-subtle">{p.modulo}.{p.nombre}{hu && ` · ${hu}`}</span>
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Bloque>
      </div>
    </div>
  )
}
