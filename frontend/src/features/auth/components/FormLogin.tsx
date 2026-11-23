import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { CuentasDemo } from '@app/demo/CuentasDemo'
import { ROUTES } from '@app/routes/paths'
import { Alert, Button, Checkbox, Input } from '@shared/components/ui'
import { InputContrasena } from '@shared/components/form/InputContrasena'
import { ErrorApi } from '@shared/lib/api'
import { STORAGE_KEYS, storage } from '@shared/lib/storage'
import { varsCss } from '@shared/lib/varsCss'
import { useAuth } from '../hooks/useAuth'

const esquema = z.object({
  usuario: z.string().trim().min(1, 'Ingresa tu usuario o correo'),
  contrasena: z.string().min(1, 'Ingresa tu contraseña'),
  recordarme: z.boolean(),
})
type Valores = z.infer<typeof esquema>

/** HU_13 · Iniciar sesión con nombre de usuario o correo y contraseña (cuerpo del formulario). */
export function FormLogin() {
  const { login, aviso } = useAuth()
  const [error, setError] = useState<{ titulo: string; detalle?: string } | null>(null)
  const recordado = storage.get<string>(STORAGE_KEYS.rememberedEmail, '')

  const { register, handleSubmit, formState, setValue } = useForm<Valores>({
    resolver: zodResolver(esquema),
    defaultValues: { usuario: recordado, contrasena: '', recordarme: Boolean(recordado) },
  })

  const enviar = async (v: Valores) => {
    setError(null)
    try {
      await login(v.usuario, v.contrasena, v.recordarme)
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
    <div className="flex flex-col gap-4">
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
        <InputContrasena
          className="anim-entrada"
          style={varsCss({ '--retraso': '130ms' })}
          label="Contraseña"
          autoComplete="current-password"
          placeholder="••••••••••"
          error={formState.errors.contrasena?.message}
          labelAction={
            <Link to={ROUTES.recuperar} className="text-[12px] font-semibold text-link hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          }
          {...register('contrasena')}
        />
        <Checkbox className="anim-entrada" style={varsCss({ '--retraso': '190ms' })} label="Recordarme en este equipo" {...register('recordarme')} />
        <Button type="submit" size="lg" fullWidth liquido loading={formState.isSubmitting} className="anim-entrada" style={varsCss({ '--retraso': '250ms' })}>
          {formState.isSubmitting ? 'Verificando…' : 'Iniciar sesión'}
        </Button>
        {error && <Alert tone="danger" title={error.titulo} description={error.detalle} />}
      </form>
    </div>
  )
}
