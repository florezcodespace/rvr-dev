import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { DETALLE } from '@app/routes/paths'
import { EstadoBadge, Listado, type Columna } from '@shared/components/data'
import { AreaTexto } from '@shared/components/form/Campos'
import { ResumenGarantia } from '@shared/components/garantia/ResumenGarantia'
import { Alert, Button, Modal, SearchInput, Spinner, Tabs } from '@shared/components/ui'
import { ESTADO_RECLAMO_META, GARANTIA_VENCIDA_META, GARANTIA_VIGENTE_META } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { formatearFecha } from '@shared/lib/format'
import { garantiasService, type Garantia, type GarantiaDetalle } from '../api'

const cargar = garantiasService.listar.bind(garantiasService)

/**
 * [Feedback 13] Garantías de las órdenes finalizadas y reclamos de los
 * clientes. Al aprobar un reclamo se abre una orden de garantía sin costo.
 */
export default function GarantiasPage() {
  const f = useFiltros(['estado'] as const)
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [params, setParams] = useSearchParams()
  const abiertoId = Number(params.get('id')) || null
  const abrir = (id: number | null) => {
    const sig = new URLSearchParams(params)
    if (id) sig.set('id', String(id))
    else sig.delete('id')
    setParams(sig, { replace: true })
  }

  const columnas: Columna<Garantia>[] = [
    {
      clave: 'orden', titulo: 'Orden y cliente',
      render: (g) => (
        <div className="min-w-0">
          <span className="font-mono font-semibold text-fg">{g.orden.codigo}</span>
          <div className="truncate text-[12px] text-fg-subtle">{g.cliente?.nombre ?? '—'}</div>
        </div>
      ),
    },
    { clave: 'servicios', titulo: 'Servicios', recortar: true, render: (g) => g.servicios || '—' },
    {
      clave: 'vence', titulo: 'Vence', ancho: '150px',
      render: (g) => (
        <div>
          <div className="font-mono text-[13px] text-fg">{formatearFecha(g.fechaFin)}</div>
          <div className="text-[12px] text-fg-subtle">{g.vigente ? `quedan ${g.diasRestantes} día(s)` : 'vencida'}</div>
        </div>
      ),
    },
    {
      clave: 'estado', titulo: 'Estado', ancho: '200px',
      render: (g) => (
        <div className="flex flex-wrap gap-1.5">
          <EstadoBadge meta={g.vigente ? GARANTIA_VIGENTE_META : GARANTIA_VENCIDA_META} />
          {g.reclamoEstado && <EstadoBadge meta={ESTADO_RECLAMO_META[g.reclamoEstado]} />}
        </div>
      ),
    },
  ]

  const c = datos?.conteos
  return (
    <>
      <Listado
        eyebrow="Venta – Órdenes"
        titulo="Garantías"
        descripcion="Cada orden finalizada queda con la garantía del servicio que más días tenga. Aquí se atienden los reclamos de los clientes."
        barra={
          <>
            <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Orden, cliente o servicio…" className="w-full max-w-[260px]" />
            <Tabs etiqueta="Estado" valor={f.valores.estado || 'todos'} onChange={(v) => f.set('estado', v === 'todos' ? '' : v)}
              opciones={[
                { valor: 'todos', label: 'Todas', conteo: c?.todos },
                { valor: 'reclamo', label: 'Reclamos por atender', conteo: c?.reclamo },
                { valor: 'vigente', label: 'Vigentes', conteo: c?.vigente },
                { valor: 'vencida', label: 'Vencidas', conteo: c?.vencida },
              ]} />
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(g) => g.id}
        cargando={cargando}
        error={error}
        onAbrir={(g) => abrir(g.id)}
        vacio={{ titulo: 'No hay garantías aquí', descripcion: 'Las garantías aparecen cuando una orden se finaliza.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
      />
      {abiertoId && <DetalleGarantia id={abiertoId} onCerrar={() => abrir(null)} onHecho={recargar} />}
    </>
  )
}

function DetalleGarantia({ id, onCerrar, onHecho }: { id: number; onCerrar: () => void; onHecho: () => void }) {
  const { mostrar } = useToast()
  const [g, setG] = useState<GarantiaDetalle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modo, setModo] = useState<'ver' | 'aprobar' | 'rechazar'>('ver')
  const [respuesta, setRespuesta] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true
    garantiasService.detalle(id).then((x) => activo && setG(x)).catch((e) => activo && setError(mensajeDe(e)))
    return () => { activo = false }
  }, [id])

  const pendiente = g?.historialReclamos.find((r) => r.estado === 'pendiente')

  const responder = async () => {
    if (!pendiente) return
    if (modo === 'rechazar' && respuesta.trim().length < 5) return setError('Escribe la respuesta para el cliente.')
    setEnviando(true)
    setError(null)
    try {
      if (modo === 'aprobar') {
        const r = await garantiasService.aprobarReclamo(pendiente.id, respuesta.trim() || null)
        mostrar({ tono: 'exito', mensaje: `Reclamo aprobado: se abrió la orden de garantía ${r.codigo}` })
      } else {
        await garantiasService.rechazarReclamo(pendiente.id, respuesta.trim())
        mostrar({ tono: 'exito', mensaje: 'Reclamo respondido. El cliente recibió la respuesta.' })
      }
      onHecho()
      onCerrar()
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto onCerrar={onCerrar} ancho="lg"
      titulo={g ? `Garantía de ${g.orden.codigo}` : 'Garantía'}
      descripcion={g ? `${g.cliente?.nombre ?? ''} · ${g.servicios}` : undefined}
      pie={pendiente ? (
        modo === 'ver' ? (
          <>
            <Button variant="secondary" onClick={() => setModo('rechazar')}>No aprobar…</Button>
            <Button onClick={() => setModo('aprobar')}>Aprobar reclamo…</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => { setModo('ver'); setError(null) }}>Volver</Button>
            <Button variant={modo === 'rechazar' ? 'danger' : 'primary'} loading={enviando} onClick={() => void responder()}>
              {modo === 'aprobar' ? 'Aprobar y abrir orden de garantía' : 'Enviar respuesta'}
            </Button>
          </>
        )
      ) : <Button variant="secondary" onClick={onCerrar}>Cerrar</Button>}>
      {!g && !error && <div className="grid place-items-center py-12"><Spinner /></div>}
      {g && (
        <div className="flex flex-col gap-4">
          <ResumenGarantia g={g} enlaceOrden={DETALLE.orden} />
          <Link to={DETALLE.orden(g.orden.id)} className="text-[13px] font-semibold text-link hover:underline">Ver la orden original {g.orden.codigo} →</Link>
          {g.historialReclamos.length === 0 && <p className="m-0 text-[13px] text-fg-muted">El cliente no ha hecho reclamos sobre esta garantía.</p>}
          {modo === 'aprobar' && (
            <>
              <Alert tone="info" title="Se abre una orden de garantía sin costo"
                description="Tendrá los mismos servicios de la orden original, en $0 y en proceso, lista para agendar la visita. No genera venta." />
              <AreaTexto label="Mensaje para el cliente (opcional)" value={respuesta} rows={2} maxLength={255} onChange={(e) => setRespuesta(e.target.value)}
                placeholder="Ej. Te contactaremos para agendar la revisión." />
            </>
          )}
          {modo === 'rechazar' && (
            <AreaTexto label="Respuesta para el cliente" value={respuesta} rows={3} maxLength={255} onChange={(e) => setRespuesta(e.target.value)}
              placeholder="Ej. La falla se debe a un daño externo que no cubre la garantía." />
          )}
          {error && <Alert tone="danger" title="No se pudo completar" description={error} />}
        </div>
      )}
      {!g && error && <Alert tone="danger" title="No pudimos cargar la garantía" description={error} />}
    </Modal>
  )
}
