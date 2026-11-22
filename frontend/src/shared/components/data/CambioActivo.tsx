import { useState } from 'react'
import { ConfirmarAccion } from '@shared/components/form/ConfirmarAccion'
import { ESTADO_REGISTRO_META, TRANSICIONES_REGISTRO, type EstadoRegistro } from '@shared/domain/estados'
import { useToast } from '@shared/hooks/useToast'
import { ErrorApi, mensajeDe } from '@shared/lib/api'
import { EstadoBadge } from './EstadoBadge'
import { SelectorEstado } from './SelectorEstado'

/**
 * Cambio de estado activo / inactivo en un clic (HU «Cambiar estado …»).
 *
 * Inactivar pide confirmación. Si la API advierte algo (CONFIRMAR_CAMBIO:
 * visitas pendientes, órdenes en curso…) se muestra su mensaje y se reenvía con
 * `confirmar`. Si la regla lo impide (rol con usuarios, permiso en uso), el
 * motivo sale en el aviso. Al terminar, mensaje de confirmación.
 */
export function CambioActivo({
  estado,
  registro,
  puede,
  onCambiar,
  onHecho,
}: {
  estado: EstadoRegistro
  registro: string
  puede: boolean
  onCambiar: (estado: EstadoRegistro, confirmar?: boolean) => Promise<unknown>
  onHecho?: () => void
}) {
  const { mostrar } = useToast()
  const [destino, setDestino] = useState<EstadoRegistro | null>(null)
  const [advertencia, setAdvertencia] = useState<string | null>(null)

  if (!puede) return <EstadoBadge meta={ESTADO_REGISTRO_META[estado]} />

  const aplicar = async (nuevo: EstadoRegistro, confirmar?: boolean) => {
    try {
      await onCambiar(nuevo, confirmar)
      mostrar({ tono: 'exito', mensaje: `${registro} quedó ${ESTADO_REGISTRO_META[nuevo].label.toLowerCase()}` })
      onHecho?.()
    } catch (error) {
      if (error instanceof ErrorApi && error.codigo === 'CONFIRMAR_CAMBIO') {
        setDestino(nuevo)
        setAdvertencia(error.message)
        return
      }
      mostrar({ tono: 'error', mensaje: mensajeDe(error) })
    }
  }

  return (
    <>
      <SelectorEstado
        valor={estado}
        meta={ESTADO_REGISTRO_META}
        transiciones={TRANSICIONES_REGISTRO[estado]}
        registro={registro}
        onCambiar={(nuevo) => {
          if (nuevo === 'inactivo') {
            setAdvertencia(null)
            setDestino(nuevo)
          } else void aplicar(nuevo)
        }}
      />
      <ConfirmarAccion
        abierto={destino !== null}
        titulo={advertencia ? 'Antes de continuar' : `¿Inactivar ${registro}?`}
        descripcion={advertencia ?? 'No se elimina: conserva su historial y se puede volver a activar cuando quieras.'}
        textoConfirmar={advertencia ? 'Sí, inactivar de todos modos' : 'Inactivar'}
        tono="danger"
        onCerrar={() => { setDestino(null); setAdvertencia(null) }}
        onConfirmar={async () => {
          const nuevo = destino!
          const conConfirmacion = advertencia !== null
          try {
            await onCambiar(nuevo, conConfirmacion || undefined)
            mostrar({ tono: 'exito', mensaje: `${registro} quedó inactivo` })
            onHecho?.()
          } catch (error) {
            if (error instanceof ErrorApi && error.codigo === 'CONFIRMAR_CAMBIO') {
              setAdvertencia(error.message)
              throw new Error('Revisa la advertencia y confirma de nuevo.')
            }
            throw error
          }
        }}
      />
    </>
  )
}
