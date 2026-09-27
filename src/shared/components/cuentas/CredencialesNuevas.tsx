import { useState } from 'react'
import { Alert, Button, Modal } from '@shared/components/ui'

export interface Credenciales {
  nombre: string
  correo: string
  contrasena: string
}

/**
 * Muestra una sola vez el acceso de una cuenta recién creada o restablecida.
 * En la base solo queda el hash (CA_07_03): al cerrar este diálogo la
 * contraseña ya no se puede volver a ver. La persona la cambia desde su perfil.
 */
export function CredencialesNuevas({
  credenciales,
  onCerrar,
  titulo = 'Cuenta creada',
}: {
  credenciales: Credenciales | null
  onCerrar: () => void
  /** "Cuenta creada" al invitar; "Contraseña restablecida" al restablecer. */
  titulo?: string
}) {
  const [copiado, setCopiado] = useState(false)

  const copiar = async () => {
    if (!credenciales) return
    try {
      await navigator.clipboard.writeText(
        `Portal RvR\nCorreo: ${credenciales.correo}\nContraseña temporal: ${credenciales.contrasena}`,
      )
      setCopiado(true)
    } catch {
      setCopiado(false)
    }
  }

  const cerrar = () => {
    setCopiado(false)
    onCerrar()
  }

  return (
    <Modal
      abierto={credenciales !== null}
      onCerrar={cerrar}
      titulo={titulo}
      descripcion={credenciales ? `Entrégale estos datos a ${credenciales.nombre}.` : undefined}
      pie={
        <>
          <Button type="button" variant="secondary" onClick={() => void copiar()}>
            {copiado ? 'Copiado' : 'Copiar datos'}
          </Button>
          <Button type="button" onClick={cerrar}>
            Listo
          </Button>
        </>
      }
    >
      {credenciales && (
        <div className="flex flex-col gap-4">
          <dl className="m-0 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2.5 rounded-[11px] border border-border-base bg-surface-muted px-4 py-3.5 text-[13px]">
            <dt className="text-fg-subtle">Correo</dt>
            <dd className="m-0 font-mono text-fg">{credenciales.correo}</dd>
            <dt className="text-fg-subtle">Contraseña</dt>
            <dd className="m-0 font-mono text-[14px] font-semibold tracking-[0.5px] text-fg">
              {credenciales.contrasena}
            </dd>
          </dl>
          <Alert
            tone="warning"
            title="Solo se muestra esta vez"
            description="Cópiala antes de cerrar. Si se pierde, restablécela desde el detalle del usuario o con «¿Olvidaste tu contraseña?»."
          />
        </div>
      )}
    </Modal>
  )
}
