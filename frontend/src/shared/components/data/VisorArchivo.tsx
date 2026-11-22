import { useEffect, useState } from 'react'
import { IconDescargar } from '@shared/components/icons'

/**
 * [Feedback 12] Muestra una imagen o un PDF que llega como data URL.
 * El PDF se pasa a un blob: los navegadores no abren data URL de PDF en un iframe.
 */
export function VisorArchivo({ datos, tipo, nombre }: { datos: string; tipo: string; nombre: string }) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let creada: string | null = null
    let activo = true
    fetch(datos)
      .then((r) => r.blob())
      .then((b) => {
        if (!activo) return
        creada = URL.createObjectURL(b)
        setUrl(creada)
      })
      .catch(() => setUrl(null))
    return () => {
      activo = false
      if (creada) URL.revokeObjectURL(creada)
    }
  }, [datos])

  return (
    <div className="flex h-full min-h-[320px] flex-col overflow-hidden rounded-[14px] border border-border-base bg-surface-muted">
      <div className="flex items-center justify-between gap-3 border-b border-border-base bg-surface px-3 py-2">
        <span className="min-w-0 truncate text-[12px] font-semibold text-fg">{nombre}</span>
        {url && (
          <a href={url} download={nombre} className="inline-flex flex-none items-center gap-1 text-[12px] font-semibold text-link hover:underline">
            <IconDescargar width={13} height={13} /> Descargar
          </a>
        )}
      </div>
      <div className="flex flex-1 items-center justify-center p-2">
        {tipo === 'application/pdf'
          ? url && <iframe title={nombre} src={url} className="h-[460px] w-full rounded-[14px] border-0 bg-white" />
          : <img src={datos} alt={`Comprobante ${nombre}`} className="max-h-[460px] max-w-full rounded-[14px] object-contain" />}
      </div>
    </div>
  )
}
