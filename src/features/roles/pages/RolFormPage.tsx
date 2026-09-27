import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { Volver } from '@shared/components/detalle'
import { AreaTexto } from '@shared/components/form/Campos'
import { IconBuscar } from '@shared/components/icons'
import { Alert, Button, Card, Input, PageHeader, Skeleton, Toggle } from '@shared/components/ui'
import { useToast } from '@shared/hooks/useToast'
import { ErrorApi, mensajeDe } from '@shared/lib/api'
import { cn } from '@shared/lib/cn'
import { partirDescripcion, rolesService, type GrupoPermisos, type RolDetalle } from '../api'

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/**
 * HU_01 Registrar rol · HU_04 Editar rol.
 *
 * Los permisos se eligen con interruptores agrupados por módulo, al estilo de
 * los permisos de un servidor de Discord: cada fila dice qué autoriza y a qué
 * historia de usuario corresponde; cada módulo tiene su interruptor de «todo».
 */
export default function RolFormPage() {
  const { id } = useParams()
  const edicion = id !== undefined
  const navigate = useNavigate()
  const { mostrar } = useToast()

  const [catalogo, setCatalogo] = useState<GrupoPermisos[] | null>(null)
  const [rol, setRol] = useState<RolDetalle | null>(null)
  const [nombre, setNombre] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set())
  const [filtro, setFiltro] = useState('')
  const [errores, setErrores] = useState<{ nombre?: string; permisos?: string; general?: string }>({})
  const [guardando, setGuardando] = useState(false)
  const [cargaError, setCargaError] = useState<string | null>(null)

  useEffect(() => {
    let activo = true
    Promise.all([rolesService.catalogo(), edicion ? rolesService.detalle(Number(id)) : Promise.resolve(null)])
      .then(([grupos, detalle]) => {
        if (!activo) return
        setCatalogo(grupos)
        if (detalle) {
          setRol(detalle)
          setNombre(detalle.nombre)
          setDescripcion(detalle.descripcion)
          setSeleccion(new Set(detalle.permisoIds))
        }
      })
      .catch((e) => activo && setCargaError(mensajeDe(e)))
    return () => { activo = false }
  }, [edicion, id])

  // CA_70_03 · los permisos inactivos no se ofrecen, salvo que el rol ya los tenga
  const grupos = useMemo(() => {
    if (!catalogo) return []
    const f = normalizar(filtro.trim())
    return catalogo
      .map((g) => ({
        ...g,
        permisos: g.permisos.filter(
          (p) => (p.estado === 'activo' || seleccion.has(p.id) && rol?.permisoIds.includes(p.id)) &&
            (!f || normalizar(`${g.nombre} ${g.proceso} ${p.nombre} ${p.descripcion}`).includes(f)),
        ),
      }))
      .filter((g) => g.permisos.length > 0)
  }, [catalogo, filtro, seleccion, rol])

  const alternar = (permisoId: number, activo: boolean) => {
    setErrores((e) => ({ ...e, permisos: undefined }))
    setSeleccion((s) => {
      const n = new Set(s)
      if (activo) n.add(permisoId)
      else n.delete(permisoId)
      return n
    })
  }

  const alternarGrupo = (g: GrupoPermisos, activo: boolean) => {
    setErrores((e) => ({ ...e, permisos: undefined }))
    setSeleccion((s) => {
      const n = new Set(s)
      for (const p of g.permisos) {
        if (activo) n.add(p.id)
        else n.delete(p.id)
      }
      return n
    })
  }

  const guardar = async () => {
    const siguientes: typeof errores = {}
    if (!nombre.trim()) siguientes.nombre = 'El nombre del rol es obligatorio'
    // CA_01_04 · al menos un permiso para registrarlo
    if (!edicion && seleccion.size === 0) siguientes.permisos = 'Asigna al menos un permiso al rol.'
    setErrores(siguientes)
    if (Object.keys(siguientes).length) return
    setGuardando(true)
    try {
      const datos = { nombre: nombre.trim(), descripcion: descripcion.trim() || null, permisos: [...seleccion] }
      const r = edicion ? await rolesService.editar(Number(id), datos) : await rolesService.registrar(datos)
      mostrar({ tono: 'exito', mensaje: edicion ? `Rol «${r.nombre}» actualizado` : `Rol «${r.nombre}» registrado` })
      navigate(DETALLE.rol(r.id))
    } catch (e) {
      if (e instanceof ErrorApi && e.codigo === 'NOMBRE_DUPLICADO') setErrores({ nombre: e.message })
      else if (e instanceof ErrorApi && ['SIN_PERMISOS', 'ROL_SIN_PERMISOS', 'AUTOBLOQUEO'].includes(e.codigo)) setErrores({ permisos: e.message })
      else setErrores({ general: mensajeDe(e) })
    } finally {
      setGuardando(false)
    }
  }

  if (cargaError) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar el rol" description={cargaError} /></div>

  const total = catalogo?.reduce((s, g) => s + g.permisos.filter((p) => p.estado === 'activo').length, 0) ?? 0

  return (
    <div className="flex flex-col gap-4 px-4 py-6 pb-28 sm:px-7">
      <Volver a={edicion && rol ? DETALLE.rol(rol.id) : ROUTES.roles} texto={edicion ? 'Volver al rol' : 'Volver a roles'} />
      <PageHeader
        eyebrow="Configuración · Roles"
        titulo={edicion ? `Editar rol${rol ? ` «${rol.nombre}»` : ''}` : 'Registrar rol'}
        descripcion="Define el nombre del perfil y activa los permisos que otorga."
      />

      {rol && rol.usuariosActivos > 0 && (
        <Alert tone="info" title={`${rol.usuariosActivos} usuario(s) activo(s) tienen este rol`}
          description="Los cambios de permisos aplican en su siguiente acción, sin cerrar su sesión. Un rol con usuarios activos no puede quedar sin permisos." />
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
        <Card className="h-fit gap-4 p-5 xl:sticky xl:top-4">
          <Input label="Nombre del rol" value={nombre} maxLength={50} onChange={(e) => { setNombre(e.target.value); setErrores((x) => ({ ...x, nombre: undefined })) }}
            error={errores.nombre} placeholder="Ej. Recepción" />
          <AreaTexto label="Descripción (opcional)" value={descripcion} maxLength={255} onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Qué hace quien tiene este rol" rows={3} />
          <div className="rounded-[11px] border border-border-base bg-surface-muted px-3.5 py-3">
            <div className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">Permisos activos</div>
            <div className="mt-1 text-[22px] font-bold text-fg">{seleccion.size}<span className="text-[13px] font-medium text-fg-subtle"> de {total}</span></div>
          </div>
          {errores.permisos && <Alert tone="danger" title="Revisa los permisos" description={errores.permisos} />}
          {errores.general && <Alert tone="danger" title="No se guardó" description={errores.general} />}
          <div className="flex gap-2.5">
            <Button variant="secondary" fullWidth onClick={() => navigate(-1)}>Cancelar</Button>
            <Button fullWidth loading={guardando} onClick={() => void guardar()}>{guardando ? 'Guardando…' : edicion ? 'Guardar cambios' : 'Registrar rol'}</Button>
          </div>
        </Card>

        <div className="flex flex-col gap-3.5">
          <div className="relative">
            <IconBuscar className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-fg-faint" />
            <input
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
              placeholder="Buscar permisos (ej. cotización, estado, móvil)…"
              aria-label="Buscar permisos"
              className="h-11 w-full rounded-[10px] border border-border-strong bg-surface pr-3.5 pl-10 text-[13.5px] text-fg outline-none focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)]"
            />
          </div>

          {!catalogo && [0, 1, 2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-[14px]" />)}

          {grupos.map((g) => {
            const activos = g.permisos.filter((p) => seleccion.has(p.id)).length
            const todos = activos === g.permisos.length
            return (
              <Card key={g.modulo} className="overflow-hidden p-0">
                <div className="flex items-center justify-between gap-3 border-b border-border-base bg-surface-muted/60 px-5 py-3.5">
                  <div className="min-w-0">
                    <div className="text-[10.5px] font-semibold tracking-[0.08em] text-fg-subtle uppercase">{g.proceso}</div>
                    <div className="text-[14.5px] font-bold text-fg">{g.nombre}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', activos ? 'bg-primary-soft text-primary-on-soft' : 'text-fg-subtle')}>
                      {activos}/{g.permisos.length}
                    </span>
                    <Toggle activo={todos} onChange={(v) => alternarGrupo(g, v)} etiqueta={`Todos los permisos de ${g.nombre}`} />
                  </div>
                </div>
                <ul className="m-0 list-none p-0">
                  {g.permisos.map((p) => {
                    const { hu, texto } = partirDescripcion(p.descripcion || p.nombre)
                    const marcado = seleccion.has(p.id)
                    return (
                      <li key={p.id} className="flex items-center justify-between gap-4 border-b border-border-base px-5 py-3.5 last:border-b-0">
                        <div className="min-w-0">
                          <div className={cn('text-[13.5px] font-semibold', marcado ? 'text-fg' : 'text-fg-muted')}>{texto}</div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-fg-subtle">
                            <code className="font-mono">{p.modulo}.{p.nombre}</code>
                            {hu && <span>· {hu}</span>}
                            {p.estado !== 'activo' && <span className="font-semibold text-warning-fg">· inactivo</span>}
                          </div>
                        </div>
                        <Toggle activo={marcado} onChange={(v) => alternar(p.id, v)} etiqueta={texto} />
                      </li>
                    )
                  })}
                </ul>
              </Card>
            )
          })}
          {catalogo && grupos.length === 0 && (
            <p className="m-0 rounded-[12px] border border-dashed border-border-strong p-8 text-center text-[13px] text-fg-muted">No hay permisos que coincidan con «{filtro}».</p>
          )}
        </div>
      </div>
    </div>
  )
}
