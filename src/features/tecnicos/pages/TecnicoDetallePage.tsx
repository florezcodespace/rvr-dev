import { useCallback, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE, ROUTES } from '@app/routes/paths'
import { CredencialesNuevas, type Credenciales } from '@shared/components/cuentas/CredencialesNuevas'
import { CambioActivo, DataTable, EstadoBadge, type Columna } from '@shared/components/data'
import { Bloque, Datos, Volver } from '@shared/components/detalle'
import { ESTADO_REGISTRO_META, ESTADO_VISITA_META } from '@shared/domain/estados'
import { Alert, Avatar, Button, Card, PageHeader, SkeletonKpis, StatCard, StatGrid } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { formatearFechaHora } from '@shared/lib/format'
import { tecnicosService, type TecnicoDetalle } from '../api'
import { FormTecnico } from '../FormTecnico'

type Visita = TecnicoDetalle['visitas'][number]

/** HU_27 · Detalle del técnico con su historial de agendamientos (CA_27_02). */
export default function TecnicoDetallePage() {
  const id = Number(useParams().id)
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const [editando, setEditando] = useState(false)
  const [credenciales, setCredenciales] = useState<Credenciales | null>(null)
  const cargar = useCallback((tid: number) => tecnicosService.detalle(tid), [])
  const { datos: t, error, recargar } = useRecurso(cargar, id)

  if (error) return <div className="p-7"><Alert tone="danger" title="No pudimos cargar el técnico" description={error} /></div>
  if (!t) return <div className="p-7"><SkeletonKpis /></div>

  const columnas: Columna<Visita>[] = [
    { clave: 'fecha', titulo: 'Fecha programada', ancho: '170px', render: (v) => <span className="font-mono whitespace-nowrap text-[12px] text-fg">{v.fechaProgramada && formatearFechaHora(v.fechaProgramada)}</span> },
    { clave: 'orden', titulo: 'Orden', ancho: '130px', render: (v) => <Link to={DETALLE.orden(v.ordenId)} className="font-mono whitespace-nowrap text-link hover:underline">{v.codigoOrden}</Link> },
    { clave: 'cliente', titulo: 'Cliente', recortar: true, render: (v) => v.cliente },
    { clave: 'estado', titulo: 'Estado', ancho: '150px', render: (v) => <EstadoBadge meta={ESTADO_VISITA_META[v.estado]} /> },
    { clave: 'notas', titulo: 'Notas', recortar: true, render: (v) => v.notas || '—' },
  ]

  const crearCuenta = async () => {
    try {
      const r = await tecnicosService.crearCuenta(t.id)
      setCredenciales({ nombre: t.nombre, correo: r.cuenta.correo, contrasena: r.cuenta.contrasenaTemporal })
      recargar()
    } catch (e) {
      mostrar({ tono: 'error', mensaje: mensajeDe(e) })
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <Volver a={ROUTES.tecnicos} texto="Volver a técnicos" />
      <PageHeader
        eyebrow="Servicios · Detalle del técnico"
        titulo={t.nombre}
        descripcion={t.especialidad || 'Sin especialidad registrada'}
        acciones={
          <>
            <CambioActivo estado={t.estado} registro={t.nombre} puede={tiene('tecnicos.cambiar_estado')} onCambiar={(e, c) => tecnicosService.cambiarEstado(t.id, e, c)} onHecho={recargar} />
            {tiene('disponibilidad.consultar') && <Link to={`${ROUTES.horarios}?tecnico=${t.id}`}><Button variant="secondary">Ver horarios</Button></Link>}
            {tiene('tecnicos.editar') && !t.cuentaMovil && <Button variant="secondary" onClick={() => void crearCuenta()}>Crear cuenta móvil</Button>}
            {tiene('tecnicos.editar') && <Button onClick={() => setEditando(true)}>Editar técnico</Button>}
          </>
        }
      />
      <StatGrid>
        <StatCard etiqueta="Visitas cumplidas" valor={String(t.visitasCumplidas)} detalle="Historial completo" glifo="✓" tono="success" />
        <StatCard etiqueta="Visitas pendientes" valor={String(t.visitasPendientes)} detalle="Por atender" glifo="◷" tono="cyan" />
        <StatCard etiqueta="Franjas libres" valor={String(t.franjasProximas.disponibles)} detalle="Próximos 14 días" glifo="●" tono="primary" />
        <StatCard etiqueta="Franjas bloqueadas" valor={String(t.franjasProximas.bloqueadas)} detalle="Permisos o ausencias" glifo="⊘" tono="warning" />
      </StatGrid>
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-[340px_minmax(0,1fr)]">
        <Bloque titulo="Datos del técnico">
          <div className="flex items-center gap-3">
            <Avatar nombre={t.nombre} tamano="lg" />
            <EstadoBadge meta={ESTADO_REGISTRO_META[t.estado]} />
          </div>
          <Datos columnas={1} items={[
            { label: 'Documento', valor: <span className="font-mono">{t.documento}</span> },
            { label: 'Nombres', valor: t.nombres },
            { label: 'Apellidos', valor: t.apellidos },
            { label: 'Especialidad', valor: t.especialidad || '—' },
            { label: 'Teléfono', valor: t.telefono || '—' },
            { label: 'Correo', valor: t.correo || '—' },
            {
              label: 'Aplicación móvil',
              valor: t.cuentaMovil
                ? tiene('usuarios.ver_detalle') ? <Link to={DETALLE.usuario(t.cuentaMovil.usuarioId)} className="text-link hover:underline">Cuenta {t.cuentaMovil.estado}</Link> : `Cuenta ${t.cuentaMovil.estado}`
                : 'Sin cuenta',
            },
          ]} />
        </Bloque>
        <Card className="flex min-h-[320px] flex-col overflow-hidden p-0">
          <div className="border-b border-border-base px-5 py-3.5">
            <div className="text-[14px] font-bold text-fg">Historial de agendamientos</div>
            <div className="text-[12px] text-fg-subtle">{t.visitas.length} visita(s) asignada(s)</div>
          </div>
          <DataTable columnas={columnas} filas={t.visitas} claveFila={(v) => v.id} vacio={{ titulo: 'Sin visitas', descripcion: 'Aún no tiene visitas agendadas.' }} />
        </Card>
      </div>
      <FormTecnico abierto={editando} tecnico={t} onCerrar={() => setEditando(false)} onGuardado={(x) => { mostrar({ tono: 'exito', mensaje: `Datos de ${x.nombre} actualizados` }); recargar() }} />
      <CredencialesNuevas titulo="Cuenta de la app móvil creada" credenciales={credenciales} onCerrar={() => setCredenciales(null)} />
    </div>
  )
}
