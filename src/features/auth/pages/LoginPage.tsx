import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { CuentasDemo } from '@app/demo/CuentasDemo'
import { rutaInicial } from '@app/layouts/navigation'
import { ROUTES } from '@app/routes/paths'
import { Alert, Button, Checkbox, Input } from '@shared/components/ui'
import { hayCarrito } from '@shared/hooks/useCarrito'
import { ErrorApi } from '@shared/lib/api'
import { STORAGE_KEYS, storage } from '@shared/lib/storage'
import { varsCss } from '@shared/lib/varsCss'
import { PaginaAcceso } from '../components/PaginaAcceso'
import { useAuth } from '../hooks/useAuth'

const esquema = z.object({
  usuario: z.string().trim().min(1, 'Ingresa tu usuario o correo'),
  contrasena: z.string().min(1, 'Ingresa tu contraseña'),
  recordarme: z.boolean(),
})
type Valores = z.infer<typeof esquema>

/** HU_13 · Iniciar sesión con nombre de usuario o correo y contraseña. */
export default function LoginPage() {
  const { login, aviso } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [ver, setVer] = useState(false)
  const [error, setError] = useState<{ titulo: string; detalle?: string } | null>(null)
  const recordado = storage.get<string>(STORAGE_KEYS.rememberedEmail, '')

  const { register, handleSubmit, formState, setValue } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { usuario: recordado, contrasena: '', recordarme: Boolean(recordado) },
  })

  const enviar = async (v: Valores) => {
    setError(null)
    try {
      const cuenta = await login(v.usuario, v.contrasena, v.recordarme)
      const desde = (location.state as { from?: { pathname: string } } | null)?.from?.pathname
      // CA_13_03 · al panel según el rol
      if (cuenta.tipo === 'cliente') {
        navigate(hayCarrito() ? ROUTES.portalSolicitar : desde?.startsWith('/portal') ? desde : ROUTES.portal, { replace: true })
      } else {
        navigate(desde && !desde.startsWith('/portal') ? desde : rutaInicial(cuenta), { replace: true })
      }
    } catch (fallo) {
      if (fallo instanceof ErrorApi) {
        const restantes = fallo.extra.intentosRestantes
        setError({
          titulo: fallo.message,
          detalle:
            fallo.codigo === 'CREDENCIALES_INVALIDAS' && typeof restantes === 'number'
              ? restantes > 1
                ? `Te quedan ${restantes} intentos antes del bloqueo temporal.`
                : 'Te queda 1 intento antes del bloqueo temporal.'
              : fallo.codigo === 'CUENTA_BLOQUEADA'
                ? 'Si olvidaste tu contraseña, puedes recuperarla con tu correo.'
                : fallo.codigo === 'USAR_APP_MOVIL'
                  ? 'Descarga o abre la app móvil de RvR con esta misma cuenta.'
                  : undefined,
        })
      } else {
        setError({ titulo: 'No pudimos conectar con el servidor', detalle: 'Revisa tu conexión e inténtalo de nuevo.' })
      }
    }
  }

  return (
    <PaginaAcceso
      eyebrow="Gestión de acceso"
      titulo="Iniciar sesión"
      descripcion="Personal de RvR y clientes ingresan aquí con su usuario o correo."
      pie={
        <>
          ¿Eres cliente y aún no tienes cuenta?{' '}
          <Link to={ROUTES.registro} className="font-semibold text-link underline underline-offset-2">Regístrate en el portal</Link>
        </>
      }
    >
      {aviso && <Alert tone="warning" title="Sesión cerrada" description={aviso} />}
      <CuentasDemo
        onElegir={(usuario, clave) => {
          setValue('usuario', usuario, { shouldValidate: true })
          setValue('contrasena', clave, { shouldValidate: true })
          void handleSubmit(enviar)()
        }}
      />
      <form noValidate onSubmit={handleSubmit(enviar)} onChange={() => setError(null)} className="flex flex-col gap-4">
        <Input
          className="anim-entrada"
          style={varsCss({ '--retraso': '70ms' })}
          label="Usuario o correo"
          autoComplete="username"
          placeholder="usuario o nombre@correo.com"
          error={formState.errors.usuario?.message}
          {...register('usuario')}
        />
        <Input
          className="anim-entrada"
          style={varsCss({ '--retraso': '130ms' })}
          label="Contraseña"
          type={ver ? 'text' : 'password'}
          autoComplete="current-password"
          placeholder="••••••••••"
          error={formState.errors.contrasena?.message}
          labelAction={
            <Link to={ROUTES.recuperar} className="text-[12px] font-semibold text-link hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          }
          trailing={
            <button type="button" onClick={() => setVer((x) => !x)} aria-pressed={ver} className="cursor-pointer text-[11.5px] font-semibold tracking-[0.02em] text-link">
              {ver ? 'OCULTAR' : 'MOSTRAR'}
            </button>
          }
          {...register('contrasena')}
        />
        <Checkbox className="anim-entrada" style={varsCss({ '--retraso': '190ms' })} label="Recordarme en este equipo" {...register('recordarme')} />
        <Button type="submit" size="lg" fullWidth loading={formState.isSubmitting} className="anim-entrada" style={varsCss({ '--retraso': '250ms' })}>
          {formState.isSubmitting ? 'Verificando…' : 'Iniciar sesión'}
        </Button>
        {error && <Alert tone="danger" title={error.titulo} description={error.detalle} />}
      </form>
    </PaginaAcceso>
  )
}
