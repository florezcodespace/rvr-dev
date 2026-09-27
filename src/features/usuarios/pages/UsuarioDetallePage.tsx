import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { CredencialesNuevas, type Credenciales } from '@shared/components/cuentas/CredencialesNuevas'
import { CambioActivo, EstadoBadge } from '@shared/components/data'
import { Bloque, Datos, SinDatos, Volver } from '@shared/components/detalle'
import { ConfirmarAccion } from '@shared/components/form/ConfirmarAccion'
import { ESTADO_REGISTRO_META, RESULTADO_ACCESO_META } from '@shared/domain/estados'
import { Alert, Avatar, Button, PageHeader, SkeletonKpis } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { formatearFechaHora } from '@shared/lib/format'
import { partirDescripcion } from '@shared/lib/permisos'
import { usuariosService } from '../api'
import { FormUsuario } from '../FormUsuario'

/** HU_12 · Detalle del usuario (solo lectura) con los permisos de su rol (CA_12_02). */
export default function UsuarioDetallePage() {
  const id = Number(useParams().id)
  const { tiene, usuario: yo } = useAuth()
  const { mostrar } = useToast()
  const [editando, setEditando] = useState(false)
  const [restablecer, setRestablecer] = useState(false)
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null)
  const cargar = useCallback((uid: number) => usuariosService.detalle(uid), [])
  const { datos: u, error, recargar } = useRecurso(cargar, id)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar el usuario" description={error} /></div>
  if (!u) return <div className="p-7"><SkeletonKpis /></div>

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.usuarios} texto="Volver a usuarios" />
      <PageHeader
        eyebrow="Configuración · Detalle del usuario"
        titulo={u.nombre}
        descripcion={`@${u.nombreUsuario} · ${u.rol.nombre}`}
        acciones={
          <>
            <CambioActivo estado={u.estado} registro={`La cuenta de ${u.nombre}`} puede={tiene('usuarios.cambiar_estado') && u.id !== yo?.id}
              onCambiar={(e) => usuariosService.cambiarEstado(u.id, e)} onHecho={recargar} />
            {tiene('usuarios.editar') && (
              <>
                <Button variant="secondary" onClick={() => setRestablecer(true)}>Restablecer contraseña</Button>
                <Button onClick={() => setEditando(true)}>Editar usuario</Button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="flex flex-col gap-3.5">
          <Bloque titulo="Datos de la cuenta">
            <div className="flex items-center gap-3">
              <Avatar nombre={u.nombre} tamano="lg" />
              <div>
                <div className="text-[14px] font-semibold text-fg">{u.nombre}</div>
                <EstadoBadge meta={ESTADO_REGISTRO_META[u.estado]} />
              </div>
            </div>
            <Datos columnas={1} items={[
              { label: 'Nombre de usuario', valor: <code className="font-mono">{u.nombreUsuario}</code> },
              { label: 'Correo', valor: u.correo },
              { label: 'Nombres', valor: u.nombres },
              { label: 'Apellidos', valor: u.apellidos },
              { label: 'Teléfono', valor: u.telefono || '—' },
              {
                label: 'Rol',
                valor: tiene('roles.ver_detalle') ? <Link to={DETALLE.rol(u.rol.id)} className="text-link hover:underline">{u.rol.nombre}</Link> : u.rol.nombre,
              },
              {
                label: 'Vinculada a',
                valor: u.vinculo
                  ? u.vinculo.tipo === 'cliente'
                    ? <Link to={DETALLE.cliente(u.vinculo.id)} className="text-link hover:underline">Registro de cliente</Link>
                    : <Link to={DETALLE.tecnico(u.vinculo.id)} className="text-link hover:underline">Ficha de técnico (app móvil)</Link>
                  : 'Personal de RvR',
              },
            ]} />
          </Bloque>
          <Bloque titulo="Últimos accesos">
            {u.ultimosAccesos.length === 0 ? <SinDatos texto="Esta cuenta aún no ha ingresado." /> : (
              <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                {u.ultimosAccesos.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 text-[12.5px]">
                    <span className="text-fg-muted">{formatearFechaHora(a.fecha)} · {a.canal === 'movil' ? 'Móvil' : 'Web'}</span>
                    <EstadoBadge meta={RESULTADO_ACCESO_META[a.resultado]} />
                  </li>
                ))}
              </ul>
            )}
          </Bloque>
        </div>
        <Bloque titulo={`Permisos del rol ${u.rol.nombre}`} subtitulo="Lo que esta cuenta puede hacer">
          {u.permisosPorModulo.length === 0 ? <SinDatos texto="El rol no tiene permisos activos." /> : (
            <div className="flex flex-col gap-3.5">
              {u.permisosPorModulo.map((g) => (
                <section key={g.modulo}>
                  <h3 className="m-0 mb-1.5 text-[12.5px] font-bold text-fg">{g.nombre}</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {g.permisos.map((p) => (
                      <span key={p.id} title={`${p.modulo}.${p.nombre}`} className="rounded-[7px] border border-border-base bg-surface-muted px-2 py-1 text-[11.5px] text-fg-muted">
                        {partirDescripcion(p.descripcion || p.nombre).texto}
                      </span>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </Bloque>
      </div>

      <FormUsuario abierto={editando} usuario={u} onCerrar={() => setEditando(false)} onRegistrado={() => undefined}
        onEditado={(x) => { mostrar({ tono: 'exito', mensaje: `Datos de ${x.nombre} actualizados` }); recargar() }} />
      <ConfirmarAccion
        abierto={restablecer}
        titulo="Restablecer contraseña"
        descripcion={`Se genera una contraseña temporal para ${u.nombre} y se cierran sus sesiones abiertas.`}
        textoConfirmar="Generar contraseña temporal"
        onCerrar={() => setRestablecer(false)}
        onConfirmar={async () => {
          const r = await usuariosService.restablecer(u.id)
          setCredenciales({ nombre: u.nombre, correo: u.correo, contrasena: r.contrasenaTemporal })
        }}
      />
      <CredencialesNuevas titulo="Contraseña restablecida" credenciales={credenciales} onCerrar={() => setCredenciales(null)} />
    </div>
  )
}
