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
import { tecnicosService, type Tecnico } from '../api'
import { FormTecnico } from '../FormTecnico'

const cargar = tecnicosService.listar.bind(tecnicosService)

/** HU_24 Listar · HU_23 Buscar · HU_26 Cambiar estado · HU_22 / HU_25 */
export default function TecnicosPage() {
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const navigate = useNavigate()
  const f = useFiltros(['estado', 'especialidad'] as const)
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [form, setForm] = useState<{ abierto: boolean; tecnico: Tecnico | null }>({ abierto: false, tecnico: null })
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null)

  useEffect(() => { tecnicosService.especialidades().then(setEspecialidades).catch(() => undefined) }, [datos])

  const columnas: Columna<Tecnico>[] = [
    {
      clave: 'tecnico', titulo: 'Técnico',
      render: (t) => (
        <div className="flex items-center gap-2.5">
          <Avatar nombre={t.nombre} tamano="sm" />
          <div className="min-w-0">
            <div className="truncate font-semibold text-fg">{t.nombres} {t.apellidos}</div>
            <div className="truncate font-mono text-[11px] text-fg-subtle">{t.documento}</div>
          </div>
        </div>
      ),
    },
    { clave: 'especialidad', titulo: 'Especialidad', recortar: true, render: (t) => t.especialidad || '—' },
    { clave: 'telefono', titulo: 'Teléfono', ancho: '130px', render: (t) => t.telefono || '—' },
    { clave: 'visitas', titulo: 'Visitas pend.', ancho: '110px', alinear: 'right', render: (t) => <span className="font-mono whitespace-nowrap text-fg">{t.visitasPendientes}</span> },
    { clave: 'app', titulo: 'App móvil', ancho: '100px', render: (t) => (t.cuentaMovil ? <span className="text-success-fg">● Con cuenta</span> : <span className="text-fg-faint">Sin cuenta</span>) },
    {
      clave: 'estado', titulo: 'Estado', ancho: '130px',
      render: (t) => <CambioActivo estado={t.estado} registro={t.nombre} puede={tiene('tecnicos.cambiar_estado')} onCambiar={(e, c) => tecnicosService.cambiarEstado(t.id, e, c)} onHecho={recargar} />,
    },
    {
      clave: 'acciones', titulo: '', ancho: '92px', alinear: 'right',
      render: (t) => (
        <AccionesFila acciones={[
          ...(tiene('tecnicos.ver_detalle') ? [{ clave: 'ver', etiqueta: `Ver a ${t.nombre}`, icono: <IconVer />, a: DETALLE.tecnico(t.id) }] : []),
          ...(tiene('tecnicos.editar') ? [{ clave: 'editar', etiqueta: `Editar a ${t.nombre}`, icono: <IconEditar />, onClick: () => setForm({ abierto: true, tecnico: t }) }] : []),
        ]} />
      ),
    },
  ]

  const c = datos?.conteos
  return (
    <>
      <Listado
        eyebrow="Servicios"
        titulo="Técnicos"
        descripcion="Personal que presta los servicios. Trabajan desde la aplicación móvil; aquí se administran."
        acciones={tiene('tecnicos.registrar') && <Button leadingIcon={<IconMas />} onClick={() => setForm({ abierto: true, tecnico: null })}>Registrar técnico</Button>}
        barra={
          <>
            {tiene('tecnicos.buscar') && <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Nombre, documento o especialidad…" className="w-full max-w-[300px]" />}
            <Tabs etiqueta="Estado" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
              opciones={[{ valor: 'todos', label: 'Todos', conteo: c?.todos }, { valor: 'activo', label: 'Activos', conteo: c?.activo }, { valor: 'inactivo', label: 'Inactivos', conteo: c?.inactivo }]} />
            <FiltroSelect etiqueta="Especialidad" valor={f.valores.especialidad} onChange={(v) => f.set('especialidad', v)} opciones={especialidades.map((e) => ({ valor: e, label: e }))} todos="Todas" />
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(t) => t.id}
        cargando={cargando}
        error={error}
        onAbrir={tiene('tecnicos.ver_detalle') ? (t) => navigate(DETALLE.tecnico(t.id)) : undefined}
        vacio={{ titulo: 'No se encontraron técnicos', descripcion: 'Prueba con otro término o quita los filtros.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
      />
      <FormTecnico abierto={form.abierto} tecnico={form.tecnico} onCerrar={() => setForm({ abierto: false, tecnico: null })}
        onGuardado={(t, cuenta) => {
          mostrar({ tono: 'exito', mensaje: form.tecnico ? `Datos de ${t.nombre} actualizados` : `${t.nombre} registrado` })
          if (cuenta) setCredenciales({ nombre: t.nombre, correo: cuenta.correo, contrasena: cuenta.contrasenaTemporal })
          recargar()
        }} />
      <CredencialesNuevas titulo="Cuenta de la app móvil creada" credenciales={credenciales} onCerrar={() => setCredenciales(null)} />
    </>
  )
}
