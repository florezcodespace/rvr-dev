import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Alert, Button, Input } from '@shared/components/ui'
import { mensajeDe } from '@shared/lib/api'
import { PaginaAcceso } from '../components/PaginaAcceso'
import { authService } from '../api/authService'

/** HU_72 · Solicitar recuperación de contraseña. */
export default function RecuperarPage() {
  const [correo, setCorreo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const [respuesta, setRespuesta] = useState<{ mensaje: string; enlaceDesarrollo?: string } | null>(null)

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(correo.trim())) {
      setError('Escribe el correo con el que te registraste.')
      return
    }
    setError(null)
    setEnviando(true)
    try {
      setRespuesta(await authService.recuperar(correo.trim()))
    } catch (fallo) {
      setError(mensajeDe(fallo))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <PaginaAcceso
      eyebrow="Gestión de acceso"
      titulo="Recupera tu contraseña"
      descripcion="Te enviaremos un enlace de un solo uso para crear una contraseña nueva."
      pie={<Link to={ROUTES.login} className="font-semibold text-link underline underline-offset-2">Volver a iniciar sesión</Link>}
    >
      {respuesta ? (
        <div className="flex flex-col gap-3">
          {/* CA_72_04 / CA_72_05 · el mismo mensaje exista o no el correo */}
          <Alert tone="success" title="Revisa tu correo" description={respuesta.mensaje} />
          {respuesta.enlaceDesarrollo && (
            <Alert
              tone="info"
              title="Modo desarrollo (sin servidor de correo)"
              description={<>La API no tiene SMTP configurado, así que el enlace se muestra aquí: <Link className="font-semibold text-link underline" to={respuesta.enlaceDesarrollo.replace(/^https?:\/\/[^/]+/, '')}>restablecer contraseña</Link>.</>}
            />
          )}
        </div>
      ) : (
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <Input label="Correo registrado" type="email" autoComplete="email" value={correo} onChange={(e) => setCorreo(e.target.value)} error={error ?? undefined} />
          <Button type="submit" size="lg" fullWidth loading={enviando}>{enviando ? 'Enviando…' : 'Enviar enlace'}</Button>
        </form>
      )}
    </PaginaAcceso>
  )
}
