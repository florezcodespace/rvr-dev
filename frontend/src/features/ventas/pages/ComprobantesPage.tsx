import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { DETALLE } from '@app/routes/paths'
import { EstadoBadge, Listado, VisorArchivo, type Columna } from '@shared/components/data'
import { Datos } from '@shared/components/detalle'
import { AreaTexto } from '@shared/components/form/Campos'
import { Alert, Button, Modal, SearchInput, Spinner, Tabs } from '@shared/components/ui'
import { ESTADO_COMPROBANTE_META, etiquetaReferencia } from '@shared/domain/estados'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { mensajeDe } from '@shared/lib/api'
import { formatearFechaHora, formatearMoneda } from '@shared/lib/format'
import { ventasService, type Comprobante } from '../api'

const cargar = ventasService.comprobantes.bind(ventasService)

/**
 * [Feedback 12] Comprobantes de pago por aprobar.
 * El cliente los sube desde el portal; aquí se ven al lado de los datos de la
 * venta y se aprueban (se registra el abono) o se rechazan con el motivo.
 */
export default function ComprobantesPage() {
  const f = useFiltros(['estado'] as const, { estado: 'pendiente' })
  const { datos, cargando, error, recargar } = useRecurso(cargar, f.params)
  const [params, setParams] = useSearchParams()
  const abiertoId = Number(params.get('id')) || null
  const abrir = (id: number | null) => {
    const sig = new URLSearchParams(params)
    if (id) sig.set('id', String(id))
    else sig.delete('id')
    setParams(sig, { replace: true })
  }

  const columnas: Columna<Comprobante>[] = [
    { clave: 'fecha', titulo: 'Enviado', ancho: '160px', render: (c) => <span className="font-mono whitespace-nowrap text-[12px] text-fg">{formatearFechaHora(c.fechaEnvio)}</span> },
    {
      clave: 'orden', titulo: 'Orden y cliente',
      render: (c) => (
        <div className="min-w-0">
          <span className="font-mono font-semibold text-fg">{c.orden.codigo}</span>
          <div className="truncate text-[12px] text-fg-subtle">{c.cliente?.nombre ?? '—'}</div>
        </div>
      ),
    },
    { clave: 'metodo', titulo: 'Método', ancho: '120px', render: (c) => c.metodo },
    { clave: 'referencia', titulo: 'Referencia', ancho: '130px', recortar: true, render: (c) => c.referencia || '—' },
    { clave: 'monto', titulo: 'Monto', ancho: '120px', alinear: 'right', render: (c) => <span className="font-mono whitespace-nowrap font-semibold text-fg">{formatearMoneda(c.monto)}</span> },
    { clave: 'estado', titulo: 'Estado', ancho: '130px', render: (c) => <EstadoBadge meta={ESTADO_COMPROBANTE_META[c.estado]} /> },
  ]

  const c = datos?.conteos
  return (
    <>
      <Listado
        eyebrow="Venta – Órdenes"
        titulo="Comprobantes de pago"
        descripcion="Pagos que los clientes reportan desde el portal. El saldo solo baja cuando apruebas el comprobante."
        barra={
          <>
            <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Orden, cliente o referencia…" className="w-full max-w-[260px]" />
            <Tabs etiqueta="Estado" valor={f.valores.estado || 'pendiente'} onChange={(v) => f.set('estado', v)}
              opciones={[
                { valor: 'pendiente', label: 'Por revisar', conteo: c?.pendiente },
                { valor: 'aprobado', label: 'Aprobados', conteo: c?.aprobado },
                { valor: 'rechazado', label: 'Rechazados', conteo: c?.rechazado },
                { valor: 'todos', label: 'Todos', conteo: c?.todos },
              ]} />
          </>
        }
        columnas={columnas}
        filas={datos?.items ?? []}
        claveFila={(x) => x.id}
        cargando={cargando}
        error={error}
        onAbrir={(x) => abrir(x.id)}
        vacio={{ titulo: 'No hay comprobantes aquí', descripcion: f.valores.estado === 'pendiente' || !f.valores.estado ? 'No hay pagos esperando revisión.' : 'Prueba con otro estado o búsqueda.' }}
        pagina={datos ?? undefined}
        onPagina={f.setPagina}
      />
      {abiertoId && <RevisarComprobante id={abiertoId} onCerrar={() => abrir(null)} onHecho={recargar} />}
    </>
  )
}

function RevisarComprobante({ id, onCerrar, onHecho }: { id: number; onCerrar: () => void; onHecho: () => void }) {
  const { tiene } = useAuth()
  const { mostrar } = useToast()
  const [c, setC] = useState<Comprobante | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [rechazando, setRechazando] = useState(false)
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    let activo = true
    ventasService.comprobante(id).then((x) => activo && setC(x)).catch((e) => activo && setError(mensajeDe(e)))
    return () => { activo = false }
  }, [id])

  const puede = tiene('abonos.revisar_comprobantes') && c?.estado === 'pendiente'

  const aprobar = async () => {
    setEnviando(true)
    setError(null)
    try {
      const r = await ventasService.aprobarComprobante(id)
      mostrar({ tono: 'exito', mensaje: `Pago de ${formatearMoneda(r.monto)} aprobado y registrado como abono${r.ordenEnProceso ? '. La orden pasó a «En proceso»' : ''}` })
      onHecho()
      onCerrar()
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  const rechazar = async () => {
    if (motivo.trim().length < 5) return setError('Escribe el motivo del rechazo: le llega al cliente.')
    setEnviando(true)
    setError(null)
    try {
      await ventasService.rechazarComprobante(id, motivo.trim())
      mostrar({ tono: 'exito', mensaje: 'Comprobante rechazado. El cliente recibió el motivo.' })
      onHecho()
      onCerrar()
    } catch (e) {
      setError(mensajeDe(e))
    } finally {
      setEnviando(false)
    }
  }

  const saldoDespues = c ? Math.max(c.venta.saldo - c.monto, 0) : 0

  return (
    <Modal abierto onCerrar={onCerrar} ancho="xl" titulo={c ? `Comprobante de ${c.cliente?.nombre ?? 'cliente'}` : 'Comprobante'}
      descripcion={c ? `Orden ${c.orden.codigo} · enviado el ${formatearFechaHora(c.fechaEnvio)}` : undefined}
      pie={puede ? (
        rechazando ? (
          <>
            <Button variant="secondary" onClick={() => { setRechazando(false); setError(null) }}>Volver</Button>
            <Button variant="danger" loading={enviando} onClick={() => void rechazar()}>Rechazar comprobante</Button>
          </>
        ) : (
          <>
            <Button variant="secondary" onClick={() => setRechazando(true)}>Rechazar…</Button>
            <Button loading={enviando} onClick={() => void aprobar()}>Aprobar y registrar abono</Button>
          </>
        )
      ) : <Button variant="secondary" onClick={onCerrar}>Cerrar</Button>}>
      {!c && !error && <div className="grid place-items-center py-16"><Spinner /></div>}
      {c && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {c.archivo.datos ? <VisorArchivo datos={c.archivo.datos} tipo={c.archivo.tipo} nombre={c.archivo.nombre} /> : <div />}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[13px] font-semibold text-fg">Lo que reporta el cliente</span>
              <EstadoBadge meta={ESTADO_COMPROBANTE_META[c.estado]} />
            </div>
            <Datos columnas={1} items={[
              { label: 'Monto', valor: <span className="font-mono text-[16px] font-semibold">{formatearMoneda(c.monto)}</span> },
              { label: 'Método de pago', valor: c.metodo },
              ...c.detalle.map((d) => ({ label: d.etiqueta, valor: d.valor })),
              { label: etiquetaReferencia(c.metodo), valor: c.referencia || '—' },
              { label: 'Orden', valor: <Link to={DETALLE.orden(c.orden.id)} className="font-mono text-link hover:underline">{c.orden.codigo}</Link> },
            ]} />
            <div className="rounded-[14px] border border-border-base bg-surface-muted px-4 py-3 text-[13px]">
              <div className="mb-1.5 font-semibold text-fg">Cuenta de la orden</div>
              <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-1">
                <dt className="text-fg-muted">Valor total</dt><dd className="m-0 text-right font-mono">{formatearMoneda(c.venta.montoTotal)}</dd>
                <dt className="text-fg-muted">Pagado</dt><dd className="m-0 text-right font-mono">{formatearMoneda(c.venta.abonado)}</dd>
                <dt className="text-fg-muted">Saldo hoy</dt><dd className="m-0 text-right font-mono">{formatearMoneda(c.venta.saldo)}</dd>
                {c.estado === 'pendiente' && (
                  <><dt className="font-semibold text-fg">Saldo si apruebas</dt><dd className="m-0 text-right font-mono font-semibold">{formatearMoneda(saldoDespues)}</dd></>
                )}
              </dl>
            </div>
            {c.estado === 'pendiente' && c.monto > c.venta.saldo && (
              <Alert tone="warning" title="El monto supera el saldo" description="No se puede aprobar tal cual: recházalo y pídele al cliente que lo corrija." />
            )}
            {c.estado !== 'pendiente' && (
              <Alert tone={c.estado === 'aprobado' ? 'success' : 'danger'}
                title={c.estado === 'aprobado' ? 'Aprobado: quedó registrado como abono' : 'Rechazado'}
                description={`${c.revisor ? `Por ${c.revisor}` : ''}${c.fechaRevision ? ` el ${formatearFechaHora(c.fechaRevision)}` : ''}${c.motivoRechazo ? `. Motivo: ${c.motivoRechazo}` : ''}`} />
            )}
            {rechazando && (
              <AreaTexto label="Motivo del rechazo (le llega al cliente)" value={motivo} rows={3} maxLength={255}
                onChange={(e) => setMotivo(e.target.value)} placeholder="Ej. El valor de la imagen no coincide con el monto reportado." />
            )}
            {error && <Alert tone="danger" title="No se pudo completar" description={error} />}
          </div>
        </div>
      )}
      {!c && error && <Alert tone="danger" title="No pudimos cargar el comprobante" description={error} />}
    </Modal>
  )
}
