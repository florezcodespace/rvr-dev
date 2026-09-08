import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, Button, Checkbox, Input } from '@shared/components/ui'
import { PENDIENTE_BACKEND } from '@shared/lib/pendiente'
import { STORAGE_KEYS, storage } from '@shared/lib/storage'
import { useLogin } from '../hooks/useLogin'
import { loginSchema, type LoginFormValues } from '../schemas/loginSchema'

export function LoginForm() {
  const [verContrasena, setVerContrasena] = useState(false)
  const { enviar, error, enviando, limpiarError } = useLogin()

  const correoRecordado = storage.get<string>(STORAGE_KEYS.rememberedEmail, '')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    defaultValues: {
      correo: correoRecordado,
      contrasena: '',
      recordarme: Boolean(correoRecordado),
    },
  })

  return (
    <form
      noValidate
      onSubmit={handleSubmit(enviar)}
      onChange={limpiarError}
      className="flex flex-col gap-4"
    >
      <Input
        label="Correo corporativo"
        type="email"
        autoComplete="username"
        placeholder="nombre.apellido@rvrtec.co"
        error={errors.correo?.message}
        {...register('correo')}
      />

      <Input
        label="Contraseña"
        type={verContrasena ? 'text' : 'password'}
        autoComplete="current-password"
        placeholder="••••••••••••"
        error={errors.contrasena?.message}
        labelAction={
          <span
            title={PENDIENTE_BACKEND}
            className="text-[12px] font-semibold text-fg-faint"
          >
            ¿Olvidaste tu contraseña?
          </span>
        }
        trailing={
          <button
            type="button"
            onClick={() => setVerContrasena((v) => !v)}
            aria-pressed={verContrasena}
            className="cursor-pointer text-[11.5px] font-semibold tracking-[0.02em] text-link"
          >
            {verContrasena ? 'OCULTAR' : 'MOSTRAR'}
          </button>
        }
        {...register('contrasena')}
      />

      <Checkbox label="Recordarme en este equipo" {...register('recordarme')} />

      <Button type="submit" size="lg" fullWidth loading={enviando}>
        {enviando ? 'Verificando…' : 'Iniciar sesión'}
      </Button>

      {error && <Alert tone="danger" title={error.title} description={error.description} />}
    </form>
  )
}
