import { useState, type ReactNode } from 'react'
import { Alert, Button, Modal } from '@shared/components/ui'
import { mensajeDe } from '@shared/lib/api'
import { AreaTexto } from './Campos'

/**
 * Confirmación de una acción que importa (enviar, aprobar, anular, cambiar un
 * estado con consecuencias). Si la API la rechaza, el motivo queda a la vista.
 * Con `pedirMotivo`, pide un texto (motivo de rechazo, notas de la visita…).
 */
export function ConfirmarAccion({
  abierto,
  titulo,
  descripcion,
  detalle,
  textoConfirmar = 'Confirmar',
  tono = 'primary',
  pedirMotivo,
  motivoObligatorio = false,
  onCerrar,
  onConfirmar,
}: {
  abierto: boolean
  titulo: string
  descripcion?: string
  detalle?: ReactNode
  textoConfirmar?: string
  tono?: 'primary' | 'danger'
  /** Etiqueta del campo de texto opcional. */
  pedirMotivo?: string
  motivoObligatorio?: boolean
  onCerrar: () => void
  onConfirmar: (motivo: string) => Promise<void>
}) {
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [motivo, setMotivo] = useState('')

  const cerrar = () => {
    setError(null)
    setMotivo('')
    onCerrar()
  }

  const confirmar = async () => {
    if (pedirMotivo && motivoObligatorio && !motivo.trim()) {
      setError('Escribe el motivo para continuar.')
      return
    }
    setError(null)
    setEnviando(true)
    try {
      await onConfirmar(motivo.trim())
      cerrar()
    } catch (fallo) {
      setError(mensajeDe(fallo))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal
      abierto={abierto}
      onCerrar={cerrar}
      titulo={titulo}
      descripcion={descripcion}
      ancho="sm"
      pie={
        <>
          <Button type="button" variant="secondary" onClick={cerrar}>Cancelar</Button>
          <Button type="button" variant={tono === 'danger' ? 'danger' : 'primary'} loading={enviando} onClick={() => void confirmar()}>
            {enviando ? 'Guardando…' : textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {detalle}
        {pedirMotivo && (
          <AreaTexto
            label={pedirMotivo}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            maxLength={255}
            placeholder={motivoObligatorio ? 'Obligatorio' : 'Opcional'}
          />
        )}
        {error && <Alert tone="danger" title="No se pudo completar" description={error} />}
      </div>
    </Modal>
  )
}
