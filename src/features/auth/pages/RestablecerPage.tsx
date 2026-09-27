import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { Alert, Button, Input, Spinner } from '@shared/components/ui'
import { ErrorApi, mensajeDe } from '@shared/lib/api'
import { PaginaAcceso } from '../components/PaginaAcceso'
import { authService } from '../api/authService'
import { reglaContrasena } from './reglas'

/** HU_73 · Restablecer mi contraseña con el enlace del correo. */
export default function RestablecerPage() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()
  const [estado, setEstado] = useState<'validando' | 'valido' | 'invalido' | 'listo'>('validando')
  const [correo, setCorreo] = useState('')
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [errores, setErrores] = useState<{ nueva?: string; confirmacion?: string; general?: string }>({})
  const [enviando, setEnviando] = useState(false)

  // CA_73_01 · el enlace debe estar vigente y sin usar
  useEffect(() => {
    let activo = true
    authService
      .validarEnlace(token)
      .then((r) => { if (activo) { setCorreo(r.correo); setEstado('valido') } })
      .catch(() => { if (activo) setEstado('invalido') })
    return () => { activo = false }
  }, [token])

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault()
    const regla = reglaContrasena.safeParse(nueva)
    const siguientes: typeof errores = {}
    if (!regla.success) siguientes.nueva = regla.error.issues[0]?.message
    // CA_73_02 · digitarla dos veces
    if (nueva !== confirmacion) siguientes.confirmacion = 'Las contraseñas no coinciden'
    setErrores(siguientes)
    if (Object.keys(siguientes).length) return
    setEnviando(true)
    try {
      await authService.restablecer(token, nueva, confirmacion)
      setEstado('listo')
      // CA_73_05 · al inicio de sesión
      setTimeout(() => navigate(ROUTES.login, { replace: true }), 2500)
    } catch (fallo) {
      if (fallo instanceof ErrorApi && fallo.codigo === 'ENLACE_INVALIDO') setEstado('invalido')
      else setErrores({ general: mensajeDe(fallo) })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <PaginaAcceso
      eyebrow="Gestión de acceso"
      titulo="Crea una contraseña nueva"
      descripcion={correo ? `Para la cuenta ${correo}.` : 'Usa el enlace que te llegó al correo.'}
      pie={<Link to={ROUTES.login} className="font-semibold text-link underline underline-offset-2">Volver a iniciar sesión</Link>}
    >
      {estado === 'validando' && <div className="flex justify-center py-6"><Spinner /></div>}
      {estado === 'invalido' && (
        <div className="flex flex-col gap-3">
          <Alert tone="danger" title="El enlace no es válido" description="Ya se usó o venció. Solicita uno nuevo." />
          <Link to={ROUTES.recuperar}><Button fullWidth>Solicitar otro enlace</Button></Link>
        </div>
      )}
      {estado === 'listo' && <Alert tone="success" title="Contraseña restablecida" description="Cerramos tus sesiones abiertas. Te llevamos al inicio de sesión…" />}
      {estado === 'valido' && (
        <form noValidate onSubmit={enviar} className="flex flex-col gap-4">
          <Input label="Contraseña nueva" type="password" autoComplete="new-password" value={nueva} onChange={(e) => setNueva(e.target.value)}
            error={errores.nueva} hint="8+ caracteres, con mayúscula, minúscula y número." />
          <Input label="Confirmar contraseña" type="password" autoComplete="new-password" value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} error={errores.confirmacion} />
          {errores.general && <Alert tone="danger" title="No se guardó" description={errores.general} />}
          <Button type="submit" size="lg" fullWidth loading={enviando}>{enviando ? 'Guardando…' : 'Guardar contraseña'}</Button>
        </form>
      )}
    </PaginaAcceso>
  )
}
