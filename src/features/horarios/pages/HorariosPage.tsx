import { useCallback, useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { useAuth } from '@features/auth'
import { EstadoBadge } from '@shared/components/data'
import { AreaTexto, FiltroSelect } from '@shared/components/form/Campos'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { IconMas } from '@shared/components/icons'
import { Alert, Button, Card, Modal, PageHeader, Skeleton } from '@shared/components/ui'
import { ESTADO_FRANJA_META, ESTADOS_FRANJA, type EstadoFranja } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { cn } from '@shared/lib/cn'
import { etiquetaDia, hoyISO, lunesDe, sumarDias } from '@shared/lib/fechas'
import { horariosService, type Franja, type OpcionTecnico } from '../api'

const COLOR: Record<EstadoFranja, string> = {
  disponible: 'border-[var(--rvr-estado-completada)] bg-[var(--rvr-estado-completada-soft)] text-[var(--rvr-estado-completada-fg)]',
  ocupada: 'border-[var(--rvr-estado-programada)] bg-[var(--rvr-estado-programada-soft)] text-[var(--rvr-estado-programada-fg)]',
  bloqueada: 'border-[var(--rvr-estado-cancelada)] bg-[var(--rvr-estado-cancelada-soft)] text-[var(--rvr-estado-cancelada-fg)]',
}

const esquemaFranja = z
  .object({
    tecnicoId: z.coerce.number({ error: 'Selecciona el técnico' }).int().positive('Selecciona el técnico'),
    fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Selecciona la fecha'),
    horaInicio: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de inicio'),
    horaFin: z.string().regex(/^\d{2}:\d{2}$/, 'Hora de fin'),
    repetirHasta: z.string().transform((v) => v || null),
    incluirSabados: z.boolean(),
  })
  // CA_28_02 · la hora de fin después de la de inicio
  .refine((d) => d.horaFin > d.horaInicio, { message: 'La hora de fin debe ser posterior a la de inicio', path: ['horaFin'] })

/**
 * Gestión de Horarios Técnicos: HU_28 Registrar disponibilidad, HU_29
 * Consultar por técnico y rango de fechas (CA_29_01) con el estado de cada
 * franja a la vista (CA_29_02), HU_30 Cambiar estado de franja.
 */
export default function HorariosPage() {
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const f = useFiltros(['tecnico', 'especialidad', 'estado', 'semana'] as const)
  const semana = f.valores.semana || lunesDe(hoyISO())
  const params = useMemo(
    () => ({ tecnico: f.valores.tecnico, especialidad: f.valores.especialidad, estado: f.valores.estado, desde: semana, hasta: sumarDias(semana, 6) }),
    [f.valores.tecnico, f.valores.especialidad, f.valores.estado, semana],
  )
  const cargar = useCallback((p: typeof params) => horariosService.consultar(p), [])
  const { datos: franjas, cargando, error, recargar } = useRecurso(cargar, params)
  const [tecnicos, setTecnicos] = useState<OpcionTecnico[]>([])
  const [especialidades, setEspecialidades] = useState<string[]>([])
  const [registrando, setRegistrando] = useState(false)
  const [elegida, setElegida] = useState<Franja | null>(null)

  useEffect(() => {
    horariosService.tecnicos().then(setTecnicos).catch(() => undefined)
    horariosService.especialidades().then(setEspecialidades).catch(() => undefined)
  }, [])

  const dias = Array.from({ length: 7 }, (_, i) => sumarDias(semana, i))
  const filas = useMemo(() => {
    const lista = tecnicos.filter((t) => t.estado === 'activo' || franjas?.some((x) => x.tecnicoId === t.id))
      .filter((t) => !f.valores.tecnico || String(t.id) === f.valores.tecnico)
      .filter((t) => !f.valores.especialidad || t.especialidad === f.valores.especialidad)
    return lista.map((t) => ({ tecnico: t, porDia: dias.map((d) => (franjas ?? []).filter((x) => x.tecnicoId === t.id && x.fecha === d)) }))
  }, [tecnicos, franjas, dias, f.valores.tecnico, f.valores.especialidad])

  const conteo = (e: EstadoFranja) => (franjas ?? []).filter((x) => x.estado === e).length

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <PageHeader
        eyebrow="Servicios"
        titulo="Horarios técnicos"
        descripcion="Franjas de disponibilidad de cada técnico. Al agendar una visita la franja pasa a ocupada; al cancelarla se libera."
        acciones={tiene('disponibilidad.registrar') && <Button leadingIcon={<IconMas />} onClick={() => setRegistrando(true)}>Registrar disponibilidad</Button>}
      />

      <Card className="gap-3 p-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => f.set('semana', sumarDias(semana, -7))} aria-label="Semana anterior">←</Button>
            <Button variant="secondary" size="sm" onClick={() => f.set('semana', '')}>Esta semana</Button>
            <Button variant="secondary" size="sm" onClick={() => f.set('semana', sumarDias(semana, 7))} aria-label="Semana siguiente">→</Button>
          </div>
          <span className="text-[13px] font-semibold text-fg">{etiquetaDia(semana)} – {etiquetaDia(sumarDias(semana, 6))}</span>
          <span className="flex-1" />
          <FiltroSelect etiqueta="Técnico" valor={f.valores.tecnico} onChange={(v) => f.set('tecnico', v)} opciones={tecnicos.map((t) => ({ valor: String(t.id), label: t.nombre }))} />
          <FiltroSelect etiqueta="Especialidad" valor={f.valores.especialidad} onChange={(v) => f.set('especialidad', v)} opciones={especialidades.map((e) => ({ valor: e, label: e }))} todos="Todas" />
          <FiltroSelect etiqueta="Estado" valor={f.valores.estado} onChange={(v) => f.set('estado', v)} opciones={ESTADOS_FRANJA.map((e) => ({ valor: e, label: ESTADO_FRANJA_META[e].label }))} />
        </div>
        <div className="flex flex-wrap gap-2 text-[11.5px]">
          {ESTADOS_FRANJA.map((e) => (
            <span key={e} className={cn('rounded-[7px] border px-2 py-0.5 font-semibold', COLOR[e])}>
              {ESTADO_FRANJA_META[e].glifo} {ESTADO_FRANJA_META[e].label}: {conteo(e)}
            </span>
          ))}
        </div>
      </Card>

      {error && <Alert tone="danger" title="No pudimos cargar los horarios" description={error} />}

      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 w-[190px] border-b border-border-base bg-bg px-4 py-2.5 text-[10.5px] font-bold tracking-[0.07em] text-fg-subtle uppercase">Técnico</th>
              {dias.map((d) => (
                <th key={d} scope="col" className={cn('border-b border-border-base bg-bg px-2 py-2.5 text-[11px] font-bold text-fg-subtle', d === hoyISO() && 'text-primary-on-soft')}>
                  {etiquetaDia(d)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={cn(cargando && 'opacity-60')}>
            {filas.map(({ tecnico, porDia }) => (
              <tr key={tecnico.id} className="border-b border-border-base align-top">
                <th scope="row" className="sticky left-0 z-10 bg-surface px-4 py-3 text-left">
                  <div className="text-[13px] font-semibold text-fg">{tecnico.nombre}</div>
                  <div className="text-[11px] font-normal text-fg-subtle">{tecnico.especialidad ?? '—'}{tecnico.estado !== 'activo' && ' · inactivo'}</div>
                </th>
                {porDia.map((lista, i) => (
                  <td key={dias[i]} className="px-1.5 py-2">
                    <div className="flex flex-col gap-1">
                      {lista.map((x) => (
                        <button
                          key={x.id}
                          type="button"
                          disabled={!tiene('disponibilidad.cambiar_estado')}
                          onClick={() => setElegida(x)}
                          title={x.estado === 'bloqueada' ? x.motivo : x.visita ? `Orden ${x.visita.codigoOrden}` : ESTADO_FRANJA_META[x.estado].label}
                          className={cn('cursor-pointer rounded-[7px] border-l-[3px] px-2 py-1 text-left text-[11px] leading-tight font-semibold transition-transform hover:-translate-y-px disabled:cursor-default', COLOR[x.estado])}
                        >
                          {x.horaInicio}–{x.horaFin}
                          {x.visita && <span className="block truncate font-mono text-[10px] font-medium">{x.visita.codigoOrden}</span>}
                          {x.estado === 'bloqueada' && x.motivo && <span className="block truncate text-[10px] font-medium">{x.motivo}</span>}
                        </button>
                      ))}
                      {lista.length === 0 && <span className="px-2 py-1 text-[11px] text-fg-faint">—</span>}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            {!franjas && cargando && (
              <tr><td colSpan={8} className="p-4"><Skeleton className="h-24 w-full" /></td></tr>
            )}
            {franjas && filas.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-12 text-center text-[13px] text-fg-muted">No hay técnicos que coincidan con los filtros.</td></tr>
            )}
          </tbody>
        </table>
      </Card>

      <FormularioModal
        key={`franja-${tecnicos.length}`}
        abierto={registrando}
        onCerrar={() => setRegistrando(false)}
        titulo="Registrar disponibilidad"
        descripcion="La franja queda disponible para agendar. Puedes repetirla en los días hábiles hasta una fecha."
        textoGuardar="Registrar franja"
        campos={[
          {
            nombre: 'tecnicoId', label: 'Técnico', tipo: 'select', obligatorio: true, ancho: 'completo', valorInicial: f.valores.tecnico,
            opciones: [{ valor: '', label: 'Selecciona…' }, ...tecnicos.filter((t) => t.estado === 'activo').map((t) => ({ valor: String(t.id), label: `${t.nombre}${t.especialidad ? ` · ${t.especialidad}` : ''}` }))],
          },
          { nombre: 'fecha', label: 'Fecha', tipo: 'fecha', obligatorio: true, valorInicial: hoyISO() },
          { nombre: 'repetirHasta', label: 'Repetir hasta (opcional)', tipo: 'fecha' },
          { nombre: 'horaInicio', label: 'Hora de inicio', tipo: 'hora', obligatorio: true, valorInicial: '08:00' },
          { nombre: 'horaFin', label: 'Hora de fin', tipo: 'hora', obligatorio: true, valorInicial: '10:00' },
          { nombre: 'incluirSabados', label: 'Incluir sábados al repetir', tipo: 'booleano', ancho: 'completo' },
        ]}
        schema={esquemaFranja}
        onGuardar={async (v) => {
          const r = await horariosService.registrar(v)
          mostrar({
            tono: 'exito',
            mensaje: r.cruzadas.length
              ? `${r.creadas} franja(s) registrada(s); ${r.cruzadas.length} día(s) omitido(s) por cruce`
              : `${r.creadas} franja(s) registrada(s) como disponibles`,
          })
          recargar()
        }}
      />

      <CambioFranja franja={elegida} onCerrar={() => setElegida(null)} onHecho={() => { setElegida(null); recargar() }} />
    </div>
  )
}

/** HU_30 · Cambiar el estado de una franja (disponible, ocupada, bloqueada). */
function CambioFranja({ franja, onCerrar, onHecho }: { franja: Franja | null; onCerrar: () => void; onHecho: () => void }) {
  const { mostrar } = useToast()
  const [estado, setEstado] = useState<EstadoFranja>('disponible')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [previa, setPrevia] = useState<Franja | null>(null)

  if (franja !== previa) {
    setPrevia(franja)
    if (franja) {
      setEstado(franja.estado)
      setMotivo(franja.motivo)
      setError(null)
    }
  }

  const guardar = async () => {
    if (!franja) return
    setGuardando(true)
    setError(null)
    try {
      await horariosService.cambiarEstado(franja.id, estado, motivo.trim() || null)
      mostrar({ tono: 'exito', mensaje: `Franja ${franja.horaInicio}–${franja.horaFin} de ${franja.tecnico}: ${ESTADO_FRANJA_META[estado].label.toLowerCase()}` })
      onHecho()
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal
      abierto={franja !== null}
      onCerrar={onCerrar}
      titulo="Cambiar estado de la franja"
      descripcion={franja ? `${franja.tecnico} · ${etiquetaDia(franja.fecha)} · ${franja.horaInicio}–${franja.horaFin}` : undefined}
      ancho="sm"
      pie={
        <>
          <Button variant="secondary" onClick={onCerrar}>Cancelar</Button>
          <Button loading={guardando} onClick={() => void guardar()}>Guardar</Button>
        </>
      }
    >
      {franja && (
        <div className="flex flex-col gap-3.5">
          {franja.visita && (
            <Alert tone="info" title={`Visita agendada: orden ${franja.visita.codigoOrden}`} description="Para liberar esta franja, reprograma o cancela la visita desde Agendamiento." />
          )}
          <fieldset className="m-0 flex flex-col gap-2 border-0 p-0">
            <legend className="mb-1.5 text-[12.5px] font-semibold text-fg">Estado</legend>
            {ESTADOS_FRANJA.map((e) => (
              <label key={e} className={cn('flex cursor-pointer items-center gap-2.5 rounded-[10px] border px-3 py-2.5', estado === e ? 'border-[var(--rvr-ring-border)] bg-primary-soft' : 'border-border-base')}>
                <input type="radio" name="estado-franja" value={e} checked={estado === e} onChange={() => setEstado(e)} className="accent-[var(--rvr-primary)]" />
                <EstadoBadge meta={ESTADO_FRANJA_META[e]} />
              </label>
            ))}
          </fieldset>
          {estado !== 'disponible' && (
            <AreaTexto label={estado === 'bloqueada' ? 'Motivo del bloqueo (obligatorio)' : 'Motivo (opcional)'} value={motivo} maxLength={255}
              onChange={(e) => setMotivo(e.target.value)} placeholder="Permiso, incapacidad, capacitación…" rows={2} />
          )}
          {error && <Alert tone="danger" title="No se guardó" description={error} />}
        </div>
      )}
    </Modal>
  )
}
