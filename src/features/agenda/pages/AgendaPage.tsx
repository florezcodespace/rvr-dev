import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE } from '@app/routes/paths'
import { DataTable, EstadoBadge, type Columna } from '@shared/components/data'
import { Datos } from '@shared/components/detalle'
import { AreaTexto, FiltroSelect, Select } from '@shared/components/form/Campos'
import { IconMas } from '@shared/components/icons'
import { Alert, Button, Card, Input, Modal, PageHeader, Spinner, Tabs } from '@shared/components/ui'
import { ESTADO_VISITA_META, ESTADOS_VISITA, type EstadoVisita } from '@shared/domain/estados'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { cn } from '@shared/lib/cn'
import {
  DIAS_CORTOS, aISO, deISO, etiquetaDia, etiquetaMes, fechaDe, horaDe, hoyISO, lunesDe, primeroDelMes, sumarDias, ultimoDelMes,
} from '@shared/lib/fechas'
import { formatearFechaHora } from '@shared/lib/format'
import { agendaService, type FranjaLibre, type OrdenAgendable, type Visita } from '../api'

type Vista = 'mes' | 'semana' | 'lista'

const COLOR: Record<EstadoVisita, string> = {
  pendiente: 'border-[var(--rvr-estado-programada)] bg-[var(--rvr-estado-programada-soft)] text-[var(--rvr-estado-programada-fg)]',
  cumplida: 'border-[var(--rvr-estado-completada)] bg-[var(--rvr-estado-completada-soft)] text-[var(--rvr-estado-completada-fg)]',
  reprogramada: 'border-[var(--rvr-estado-reprogramada)] bg-[var(--rvr-estado-reprogramada-soft)] text-[var(--rvr-estado-reprogramada-fg)] line-through',
  cancelada: 'border-[var(--rvr-estado-cancelada)] bg-[var(--rvr-estado-cancelada-soft)] text-[var(--rvr-estado-cancelada-fg)] line-through',
}

/**
 * Agendamiento: HU_52 Calendario de visitas con filtro por técnico, fechas o
 * estado (CA_52_02) y el estado visible (CA_52_03) · HU_51 Agendar ·
 * HU_53 Reprogramar o reasignar · HU_54 Cambiar estado de la visita.
 */
export default function AgendaPage() {
  const { tiene } = useAuth()
  const [params, setParams] = useSearchParams()
  // En el celular el mes no cabe: se abre en lista
  const [vista, setVista] = useState<Vista>(() => (window.matchMedia('(max-width: 639px)').matches ? 'lista' : 'mes'))
  const [ancla, setAncla] = useState(hoyISO())
  const [tecnico, setTecnico] = useState('')
  const [estado, setEstado] = useState('')
  const [tecnicos, setTecnicos] = useState<{ id: number; nombre: string }[]>([])
  const [elegida, setElegida] = useState<Visita | null>(null)
  const [agendando, setAgendando] = useState<number | null | 'nuevo'>(() => (params.get('agendar') ? Number(params.get('agendar')) : null))

  useEffect(() => { agendaService.tecnicos().then(setTecnicos).catch(() => undefined) }, [])
  // Desde el detalle de la orden: /agenda?agendar=ID abre el formulario con esa orden
  useEffect(() => {
    if (params.has('agendar')) {
      params.delete('agendar')
      setParams(params, { replace: true })
    }
  }, [params, setParams])

  const rango = useMemo(() => {
    if (vista === 'semana') return { desde: lunesDe(ancla), hasta: sumarDias(lunesDe(ancla), 6) }
    const inicio = lunesDe(primeroDelMes(ancla))
    return { desde: inicio, hasta: sumarDias(lunesDe(ultimoDelMes(ancla)), 6) }
  }, [vista, ancla])
  const consulta = useMemo(() => ({ ...rango, tecnico, estado }), [rango, tecnico, estado])
  const cargar = useCallback((p: typeof consulta) => agendaService.calendario(p), [])
  const { datos: visitas, cargando, error, recargar } = useRecurso(cargar, consulta)

  const porDia = useMemo(() => {
    const m = new Map<string, Visita[]>()
    for (const v of visitas ?? []) {
      const d = fechaDe(v.fechaProgramada)
      m.set(d, [...(m.get(d) ?? []), v])
    }
    return m
  }, [visitas])

  const mover = (paso: number) => setAncla((a) => {
    if (vista === 'semana') return sumarDias(a, 7 * paso)
    const d = deISO(primeroDelMes(a))
    d.setMonth(d.getMonth() + paso)
    return aISO(d)
  })

  const titulo = vista === 'semana' ? `${etiquetaDia(rango.desde)} – ${etiquetaDia(rango.hasta)}` : etiquetaMes(ancla)
  const dias = Array.from({ length: Math.round((deISO(rango.hasta).getTime() - deISO(rango.desde).getTime()) / 86_400_000) + 1 }, (_, i) => sumarDias(rango.desde, i))

  const columnas: Columna<Visita>[] = [
    { clave: 'fecha', titulo: 'Fecha y hora', ancho: '170px', render: (v) => <span className="font-mono whitespace-nowrap text-[12px] text-fg">{formatearFechaHora(v.fechaProgramada)}</span> },
    { clave: 'orden', titulo: 'Orden', ancho: '130px', render: (v) => <Link to={DETALLE.orden(v.orden.id)} className="font-mono whitespace-nowrap text-link hover:underline">{v.orden.codigo}</Link> },
    { clave: 'cliente', titulo: 'Cliente y dirección', render: (v) => <div className="min-w-0"><div className="truncate text-fg">{v.cliente}</div><div className="truncate text-[11px] text-fg-subtle">{v.direccion}</div></div> },
    { clave: 'tecnico', titulo: 'Técnico', ancho: '160px', render: (v) => v.tecnico.nombre },
    { clave: 'estado', titulo: 'Estado', ancho: '150px', render: (v) => <EstadoBadge meta={v.enCurso ? { ...ESTADO_VISITA_META.pendiente, label: 'En curso', glifo: '◐' } : ESTADO_VISITA_META[v.estado]} /> },
  ]

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <PageHeader
        eyebrow="Venta – Órdenes"
        titulo="Agendamiento"
        descripcion="Calendario de visitas técnicas. Al agendar se ocupa la franja del técnico; al reprogramar o cancelar, se libera."
        acciones={tiene('agenda.agendar') && <Button leadingIcon={<IconMas />} onClick={() => setAgendando('nuevo')}>Agendar visita</Button>}
      />

      <Card className="gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => mover(-1)} aria-label="Anterior">←</Button>
            <Button variant="secondary" size="sm" onClick={() => setAncla(hoyISO())}>Hoy</Button>
            <Button variant="secondary" size="sm" onClick={() => mover(1)} aria-label="Siguiente">→</Button>
          </div>
          <span className="text-[15px] font-bold text-fg">{titulo}</span>
          {cargando && <Spinner />}
          <span className="flex-1" />
          <Tabs etiqueta="Vista" valor={vista} onChange={setVista} opciones={[{ valor: 'mes', label: 'Mes' }, { valor: 'semana', label: 'Semana' }, { valor: 'lista', label: 'Lista' }]} />
          <FiltroSelect etiqueta="Técnico" valor={tecnico} onChange={setTecnico} opciones={tecnicos.map((t) => ({ valor: String(t.id), label: t.nombre }))} />
          <FiltroSelect etiqueta="Estado" valor={estado} onChange={setEstado} opciones={ESTADOS_VISITA.map((e) => ({ valor: e, label: ESTADO_VISITA_META[e].label }))} />
        </div>
      </Card>

      {error && <Alert tone="danger" title="No pudimos cargar la agenda" description={error} />}

      {vista === 'lista' ? (
        <Card className="flex min-h-[360px] flex-col overflow-hidden p-0">
          <DataTable columnas={columnas} filas={visitas ?? []} claveFila={(v) => v.id} cargando={cargando} onAbrir={setElegida}
            vacio={{ titulo: 'Sin visitas', descripcion: 'No hay visitas en este período con esos filtros.' }} />
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <div className="grid min-w-[840px] grid-cols-7">
            {DIAS_CORTOS.map((d) => (
              <div key={d} className="border-b border-border-base bg-bg px-2 py-2 text-center text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase">{d}</div>
            ))}
            {dias.map((d) => {
              const fuera = vista === 'mes' && d.slice(0, 7) !== ancla.slice(0, 7)
              const lista = porDia.get(d) ?? []
              return (
                <div key={d} className={cn('flex flex-col gap-1 border-r border-b border-border-base p-1.5', vista === 'mes' ? 'min-h-[112px]' : 'min-h-[360px]', fuera && 'bg-surface-muted/50')}>
                  <div className={cn('mb-0.5 text-right text-[11.5px] font-semibold', d === hoyISO() ? 'text-primary-on-soft' : fuera ? 'text-fg-faint' : 'text-fg-muted')}>
                    {d === hoyISO() ? <span className="rounded-full bg-primary px-1.5 text-on-primary">{Number(d.slice(8))}</span> : Number(d.slice(8))}
                  </div>
                  {lista.slice(0, vista === 'mes' ? 4 : 30).map((v) => (
                    <button key={v.id} type="button" onClick={() => setElegida(v)}
                      className={cn('cursor-pointer truncate rounded-[6px] border-l-[3px] px-1.5 py-0.5 text-left text-[10.5px] leading-tight font-semibold', COLOR[v.estado])}
                      title={`${horaDe(v.fechaProgramada)} · ${v.orden.codigo} · ${v.tecnico.nombre} · ${ESTADO_VISITA_META[v.estado].label}`}>
                      {horaDe(v.fechaProgramada)} {v.orden.codigo.replace(/^OS-\d{4}-/, 'OS-')}
                      {vista === 'semana' && <span className="block truncate font-medium">{v.tecnico.nombre} · {v.cliente}</span>}
                      {v.enCurso && ' ◐'}
                    </button>
                  ))}
                  {vista === 'mes' && lista.length > 4 && (
                    <button type="button" className="cursor-pointer text-left text-[10.5px] font-semibold text-link" onClick={() => { setVista('semana'); setAncla(d) }}>+{lista.length - 4} más</button>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      <DetalleVisita visita={elegida} onCerrar={() => setElegida(null)} onHecho={() => { setElegida(null); recargar() }} />
      {agendando !== null && <FormAgendar ordenInicial={typeof agendando === 'number' ? agendando : null} abierto={agendando !== null} onCerrar={() => setAgendando(null)} onHecho={() => { setAgendando(null); recargar() }} />}
    </div>
  )
}

/** Elegir fecha y franja libre (CA_51_02 / CA_53_02). */
function SelectorFranja({ valor, onElegir, excluirTecnico }: { valor: FranjaLibre | null; onElegir: (f: FranjaLibre | null) => void; excluirTecnico?: number }) {
  const [fecha, setFecha] = useState(sumarDias(hoyISO(), 1))
  const [especialidad, setEspecialidad] = useState('')
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const clave = `${fecha}|${especialidad}`
  const [resultado, setResultado] = useState<{ clave: string; libres: FranjaLibre[] } | null>(null)
  // Mientras llega la consulta de la fecha nueva se muestra «cargando»
  const libres = resultado?.clave === clave ? resultado.libres : null

  useEffect(() => { agendaService.especialidades().then(setEspecialidades).catch(() => undefined) }, [])
  useEffect(() => {
    let activo = true
    const k = `${fecha}|${especialidad}`
    agendaService.libres({ fecha, especialidad })
      .then((l) => activo && setResultado({ clave: k, libres: l }))
      .catch(() => activo && setResultado({ clave: k, libres: [] }))
    return () => { activo = false }
  }, [fecha, especialidad])

  const porTecnico = useMemo(() => {
    const m = new Map<string, FranjaLibre[]>()
    for (const f of libres ?? []) m.set(`${f.tecnico}|${f.especialidad}`, [...(m.get(`${f.tecnico}|${f.especialidad}`) ?? []), f])
    return [...m]
  }, [libres])

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input label="Fecha de la visita" type="date" value={fecha} min={hoyISO()} onChange={(e) => { setFecha(e.target.value); onElegir(null) }} />
        <Select label="Especialidad" value={especialidad} onChange={(e) => { setEspecialidad(e.target.value); onElegir(null) }}>
          <option value="">Todas</option>
          {especialidades.map((e) => <option key={e} value={e}>{e}</option>)}
        </Select>
      </div>
      <div className="text-[12.5px] font-semibold text-fg">Técnicos activos con franja disponible</div>
      {!libres && <div className="flex justify-center py-4"><Spinner /></div>}
      {libres?.length === 0 && <p className="m-0 rounded-[10px] border border-dashed border-border-strong p-4 text-center text-[12.5px] text-fg-muted">No hay franjas disponibles ese día. Prueba otra fecha o registra disponibilidad en Horarios técnicos.</p>}
      <div className="flex max-h-[260px] flex-col gap-2 overflow-y-auto">
        {porTecnico.map(([claveT, franjas]) => {
          const [nombre, esp] = claveT.split('|')
          return (
            <div key={claveT} className="rounded-[10px] border border-border-base p-2.5">
              <div className="mb-1.5 text-[12.5px] font-semibold text-fg">{nombre} <span className="font-normal text-fg-subtle">· {esp || 'Sin especialidad'}</span>
                {excluirTecnico === franjas[0]?.tecnicoId && <span className="ml-1 text-[11px] text-fg-subtle">(técnico actual)</span>}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {franjas.map((f) => (
                  <button key={f.id} type="button" onClick={() => onElegir(f)} aria-pressed={valor?.id === f.id}
                    className={cn('cursor-pointer rounded-[8px] border px-2.5 py-1 font-mono text-[12px] font-semibold transition-colors',
                      valor?.id === f.id ? 'border-[var(--rvr-ring-border)] bg-primary text-on-primary' : 'border-border-base bg-surface hover:bg-surface-muted')}>
                    {f.horaInicio}–{f.horaFin}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** HU_51 · Agendar visita: orden, técnico disponible, fecha y hora. */
function FormAgendar({ abierto, ordenInicial, onCerrar, onHecho }: { abierto: boolean; ordenInicial: number | null; onCerrar: () => void; onHecho: () => void }) {
  const { mostrar } = useToast()
  const [ordenes, setOrdenes] = useState<OrdenAgendable[]>([])
  // Se monta al abrirse, así que el estado arranca limpio cada vez
  const [orden, setOrden] = useState(ordenInicial ? String(ordenInicial) : '')
  const [franja, setFranja] = useState<FranjaLibre | null>(null)
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { agendaService.ordenes().then(setOrdenes).catch(() => undefined) }, [])

  const guardar = async () => {
    if (!orden) return setError('Selecciona la orden.')
    if (!franja) return setError('Selecciona la franja del técnico.')
    setGuardando(true)
    setError(null)
    try {
      const v = await agendaService.agendar({ ordenId: Number(orden), disponibilidadId: franja.id, notas: notas.trim() || null })
      mostrar({ tono: 'exito', mensaje: `Visita de ${v.orden.codigo} agendada con ${v.tecnico.nombre}` })
      onHecho()
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setGuardando(false)
    }
  }

  const elegida = ordenes.find((o) => String(o.id) === orden)
  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Agendar visita técnica" descripcion="Solo se ofrecen técnicos activos con la franja disponible." ancho="lg"
      pie={<><Button variant="secondary" onClick={onCerrar}>Cancelar</Button><Button loading={guardando} onClick={() => void guardar()}>Agendar visita</Button></>}>
      <div className="flex flex-col gap-4">
        <Select label="Orden de servicio" value={orden} onChange={(e) => setOrden(e.target.value)}
          ayuda={elegida ? `${elegida.cliente ?? ''} · ${elegida.direccion ?? ''}${elegida.visitasPendientes ? ` · ya tiene ${elegida.visitasPendientes} visita(s) pendiente(s)` : ''}` : undefined}>
          <option value="">Selecciona…</option>
          {ordenes.map((o) => <option key={o.id} value={o.id}>{o.codigo} · {o.cliente ?? 'Sin cliente'}</option>)}
        </Select>
        <SelectorFranja valor={franja} onElegir={setFranja} />
        <AreaTexto label="Notas para el técnico (opcional)" value={notas} rows={2} maxLength={1000} onChange={(e) => setNotas(e.target.value)} />
        {error && <Alert tone="danger" title="No se agendó" description={error} />}
      </div>
    </Modal>
  )
}

/** Detalle de la visita con HU_53 reprogramar/reasignar y HU_54 cambiar estado. */
function DetalleVisita({ visita, onCerrar, onHecho }: { visita: Visita | null; onCerrar: () => void; onHecho: () => void }) {
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const [modo, setModo] = useState<'ver' | 'reprogramar' | 'cumplida' | 'cancelada'>('ver')
  const [franja, setFranja] = useState<FranjaLibre | null>(null)
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [previa, setPrevia] = useState<Visita | null>(null)
  if (visita !== previa) {
    setPrevia(visita)
    setModo('ver')
    setFranja(null)
    setNotas('')
    setError(null)
  }
  if (!visita) return null
  const pendiente = visita.estado === 'pendiente'

  const guardar = async () => {
    setGuardando(true)
    setError(null)
    try {
      if (modo === 'reprogramar') {
        if (!franja) throw new Error('Selecciona la nueva franja.')
        const v = await agendaService.reprogramar(visita.id, { disponibilidadId: franja.id, notas: notas.trim() || null })
        mostrar({ tono: 'exito', mensaje: v.tecnico.id !== visita.tecnico.id ? `Visita reasignada a ${v.tecnico.nombre}` : 'Visita reprogramada' })
      } else if (modo === 'cumplida' || modo === 'cancelada') {
        await agendaService.cambiarEstado(visita.id, modo, notas.trim() || null)
        mostrar({ tono: 'exito', mensaje: `Visita ${modo}${modo === 'cancelada' ? ': la franja quedó libre' : ''}` })
      }
      onHecho()
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} ancho={modo === 'reprogramar' ? 'lg' : 'md'}
      titulo={modo === 'reprogramar' ? 'Reprogramar o reasignar visita' : modo === 'ver' ? `Visita de ${visita.orden.codigo}` : modo === 'cumplida' ? 'Marcar visita como cumplida' : 'Cancelar visita'}
      descripcion={`${formatearFechaHora(visita.fechaProgramada)} · ${visita.tecnico.nombre}`}
      pie={modo === 'ver' ? (
        <>
          <Link to={DETALLE.orden(visita.orden.id)}><Button variant="secondary">Ver la orden</Button></Link>
          {pendiente && tiene('agenda.cambiar_estado') && <Button variant="secondary" onClick={() => setModo('cancelada')}>Cancelar visita</Button>}
          {pendiente && tiene('agenda.cambiar_estado') && <Button variant="secondary" onClick={() => setModo('cumplida')}>Marcar cumplida</Button>}
          {pendiente && !visita.inicio && tiene('agenda.reprogramar') && <Button onClick={() => setModo('reprogramar')}>Reprogramar</Button>}
        </>
      ) : (
        <>
          <Button variant="secondary" onClick={() => setModo('ver')}>Volver</Button>
          <Button variant={modo === 'cancelada' ? 'danger' : 'primary'} loading={guardando} onClick={() => void guardar()}>
            {modo === 'reprogramar' ? 'Guardar nueva fecha' : modo === 'cumplida' ? 'Marcar cumplida' : 'Cancelar visita'}
          </Button>
        </>
      )}>
      <div className="flex flex-col gap-3.5">
        {modo === 'ver' && (
          <>
            <EstadoBadge meta={visita.enCurso ? { ...ESTADO_VISITA_META.pendiente, label: 'En curso', glifo: '◐' } : ESTADO_VISITA_META[visita.estado]} />
            <Datos items={[
              { label: 'Orden', valor: <span className="font-mono">{visita.orden.codigo}</span> },
              { label: 'Técnico', valor: visita.tecnico.nombre },
              { label: 'Cliente', valor: visita.cliente || '—' },
              { label: 'Teléfono', valor: visita.telefono || '—' },
              { label: 'Dirección', valor: visita.direccion || '—' },
              { label: 'Horario', valor: `${horaDe(visita.fechaProgramada)}${visita.horaFin ? ` – ${visita.horaFin}` : ''}` },
              { label: 'Inicio real', valor: visita.inicio ? formatearFechaHora(visita.inicio) : '—' },
              { label: 'Fin real', valor: visita.fin ? formatearFechaHora(visita.fin) : '—' },
            ]} />
            {visita.notas && <p className="m-0 rounded-[10px] bg-surface-muted px-3 py-2 text-[12.5px] text-fg-muted">{visita.notas}</p>}
          </>
        )}
        {modo === 'reprogramar' && (
          <>
            <Alert tone="info" title="La visita actual se conserva como «reprogramada»" description="Su franja se libera y se ocupa la nueva. Puedes elegir otro técnico para reasignarla." />
            <SelectorFranja valor={franja} onElegir={setFranja} excluirTecnico={visita.tecnico.id} />
            <AreaTexto label="Motivo del cambio (opcional)" value={notas} rows={2} maxLength={1000} onChange={(e) => setNotas(e.target.value)} />
          </>
        )}
        {(modo === 'cumplida' || modo === 'cancelada') && (
          <AreaTexto label="Notas sobre lo ocurrido (opcional)" value={notas} rows={3} maxLength={1000} onChange={(e) => setNotas(e.target.value)} />
        )}
        {error && <Alert tone="danger" title="No se guardó" description={error} />}
      </div>
    </Modal>
  )
}
