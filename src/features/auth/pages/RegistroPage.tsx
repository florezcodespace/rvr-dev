import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { z } from 'zod'
import { ROUTES } from '@app/routes/paths'
import { Alert, Button, Input } from '@shared/components/ui'
import { ErrorApi } from '@shared/lib/api'
import { PaginaAcceso } from '../components/PaginaAcceso'
import { authService } from '../api/authService'
import { reglaContrasena } from './reglas'

const esquema = z
  .object({
    documento: z.string().trim().min(5, 'El documento debe tener al menos 5 caracteres').max(20).regex(/^[0-9A-Za-z.-]+$/, 'Solo números, letras, puntos y guiones'),
    nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
    apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
    telefono: z.string().trim().regex(/^[0-9+\s()-]{7,20}$/, 'Escribe un teléfono válido'),
    direccion: z.string().trim().min(5, 'Escribe la dirección').max(150),
    correo: z.string().trim().toLowerCase().email('El correo no tiene un formato válido').max(100),
    contrasena: reglaContrasena,
    confirmacion: z.string(),
  })
  .refine((d) => d.contrasena === d.confirmacion, { message: 'Las contraseñas no coinciden', path: ['confirmacion'] })
type Valores = z.infer<typeof esquema>

/** HU_75 · Registrarme en el portal. */
export default function RegistroPage() {
  const [listo, setListo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState, setError: marcar } = useForm<Valores>({ resolver: zodResolver(esquema) })
  const e = formState.errors

  const enviar = async (v: Valores) => {
    setError(null)
    try {
      const r = await authService.registrar(v)
      setListo(r.mensaje)
    } catch (fallo) {
      if (fallo instanceof ErrorApi) {
        for (const [campo, mensaje] of Object.entries(fallo.campos)) marcar(campo as keyof Valores, { message: mensaje })
        if (fallo.codigo === 'CORREO_EN_USO') marcar('correo', { message: fallo.message })
        else if (fallo.codigo === 'DOCUMENTO_EN_USO') marcar('documento', { message: fallo.message })
        else setError(fallo.message)
      } else setError('No pudimos conectar con el servidor.')
    }
  }

  if (listo) {
    return (
      <PaginaAcceso eyebrow="Registro" titulo="¡Tu cuenta está lista!" descripcion={listo}>
        <Link to={ROUTES.login}><Button size="lg" fullWidth>Iniciar sesión</Button></Link>
      </PaginaAcceso>
    )
  }

  return (
    <PaginaAcceso
      eyebrow="Portal del cliente"
      titulo="Crea tu cuenta"
      descripcion="Solicita servicios, recibe y aprueba cotizaciones y sigue tus órdenes sin escribir por WhatsApp."
      ancho={560}
      pie={<>¿Ya tienes cuenta? <Link to={ROUTES.login} className="font-semibold text-link underline underline-offset-2">Inicia sesión</Link></>}
    >
      <form noValidate onSubmit={handleSubmit(enviar)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="Documento de identidad" inputMode="numeric" autoComplete="off" error={e.documento?.message}
          hint="Si RvR ya te había registrado, tu cuenta se vincula a tu historial." {...register('documento')} />
        <Input label="Nombres" autoComplete="given-name" error={e.nombres?.message} {...register('nombres')} />
        <Input label="Apellidos" autoComplete="family-name" error={e.apellidos?.message} {...register('apellidos')} />
        <Input label="Teléfono" type="tel" autoComplete="tel" error={e.telefono?.message} {...register('telefono')} />
        <Input label="Correo" type="email" autoComplete="email" error={e.correo?.message} {...register('correo')} />
        <Input className="sm:col-span-2" label="Dirección" autoComplete="street-address" error={e.direccion?.message} {...register('direccion')} />
        <Input label="Contraseña" type="password" autoComplete="new-password" error={e.contrasena?.message}
          hint="8+ caracteres, con mayúscula, minúscula y número." {...register('contrasena')} />
        <Input label="Confirmar contraseña" type="password" autoComplete="new-password" error={e.confirmacion?.message} {...register('confirmacion')} />
        {error && <Alert className="sm:col-span-2" tone="danger" title="No pudimos crear la cuenta" description={error} />}
        <Button className="sm:col-span-2" type="submit" size="lg" fullWidth loading={formState.isSubmitting}>
          {formState.isSubmitting ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
        </Button>
      </form>
    </PaginaAcceso>
  )
}
