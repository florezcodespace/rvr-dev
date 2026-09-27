import { useState } from 'react'
import { ConfirmarAccion } from '@shared/components/form/ConfirmarAccion'
import { MODO_DEMO } from '@shared/lib/api'
import { cn } from '@shared/lib/cn'
import { reiniciarDatosDemo } from './estado'

/**
 * Marca de la versión de demostración en la barra superior, con la opción de
 * volver a los datos de fábrica (útil después de probar altas y cambios).
 */
export function InsigniaDemo({ className = 'inline-flex' }: { className?: string }) {
  const [abierto, setAbierto] = useState(false)
  if (!MODO_DEMO) return null
  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        title="Versión de demostración: los datos viven en este navegador. Clic para reiniciarlos."
        className={cn(
          'h-[30px] flex-none cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[var(--rvr-ring-border)] bg-primary-soft px-3 text-[11.5px] font-semibold text-primary-on-soft transition-colors hover:bg-surface',
          className,
        )}
      >
        <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
        Demo
      </button>
      <ConfirmarAccion
        abierto={abierto}
        titulo="¿Reiniciar los datos de demostración?"
        descripcion="Se borran los cambios hechos en este navegador (altas, ediciones, cotizaciones, abonos…) y se vuelven a cargar los datos de prueba originales."
        textoConfirmar="Reiniciar datos"
        tono="danger"
        onCerrar={() => setAbierto(false)}
        onConfirmar={async () => {
          await reiniciarDatosDemo()
        }}
      />
    </>
  )
}
