import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { IconCheck } from '@shared/components/icons'
import { Alert, Button, Input } from '@shared/components/ui'
import { Select } from '@shared/components/form/Campos'
import { InputContrasena } from '@shared/components/form/InputContrasena'
import { TIPOS_DOCUMENTO, errorDocumento, limpiarDocumento } from '@shared/domain/documentos'
import { ErrorApi } from '@shared/lib/api'
import { authService } from '../api/authService'
import { reglaContrasena } from '../pages/reglas'

const esquema = z
  .object({
    tipoDocumento: z.string().min(1, 'Selecciona el tipo de documento'),
    documento: z.string().trim().transform(limpiarDocumento),
    nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
    apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
    telefono: z.string().trim().regex(/^[0-9+\s()-]{7,20}$/, 'Escribe un teléfono válido'),
    direccion: z.string().trim().min(5, 'Escribe la dirección').max(150),
    correo: z.string().trim().toLowerCase().email('El correo no tiene un formato válido').max(100),
    contrasena: reglaContrasena,
    confirmacion: z.string(),
  })
  .refine((d) => d.contrasena === d.confirmacion, { message: 'Las contraseñas no coinciden', path: ['confirmacion'] })
  .superRefine((d, ctx) => {
    const error = errorDocumento(d.tipoDocumento, d.documento)
    if (error) ctx.addIssue({ code: 'custom', path: ['documento'], message: error })
  })
type Entrada = z.input<typeof esquema>
type Valores = z.output<typeof esquema>

/** HU_75 · Registrarme en el portal (cuerpo del formulario). */
export function FormRegistro({ onIrALogin }: { onIrALogin: () => void }) {
  const [listo, setListo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { register, handleSubmit, formState, setError: marcar } = useForm<Entrada, unknown, Valores>({ resolver: zodResolver(esquema), defaultValues: { tipoDocumento: 'CC' } })
  const e = formState.errors

  const enviar = async (v: Valores) => {
    setError(null)
    try {
      const r = await authService.registrar(v)
      setListo(r.mensaje)
    } catch (fallo) {
      if (fallo instanceof ErrorApi) {
        for (const [campo, mensaje] of Object.entries(fallo.campos)) marcar(campo as keyof Entrada, { message: mensaje })
        if (Object.keys(fallo.campos).length) return
        if (fallo.codigo === 'CORREO_EN_USO') marcar('correo', { message: fallo.message })
        else if (fallo.codigo === 'DOCUMENTO_EN_USO') marcar('documento', { message: fallo.message })
        else setError(fallo.message)
      } else setError('No pudimos conectar con el servidor.')
    }
  }

  if (listo) {
    return (
      <div className="anim-entrada flex flex-col items-start gap-4">
        <span className="flex size-14 items-center justify-center rounded-[18px] bg-[var(--rvr-estado-completada-soft)] text-[var(--rvr-estado-completada-fg)]">
          <IconCheck width="26" height="26" strokeWidth={2.2} />
        </span>
        <h2 className="m-0 text-[26px] font-extrabold tracking-[-0.8px] text-fg">¡Tu cuenta está lista!</h2>
        <p className="m-0 text-[14.5px] leading-[1.6] text-fg-muted">{listo}</p>
        <Button size="lg" fullWidth liquido onClick={onIrALogin}>Iniciar sesión</Button>
      </div>
    )
  }

  return (
    <div>
      <form noValidate onSubmit={handleSubmit(enviar)} className="grid grid-cols-1 gap-x-3.5 gap-y-3 sm:grid-cols-2">
        {/* [Feedback 5] Identificación → nombre → contacto → ubicación → acceso */}
        <Select label="Tipo de documento" error={e.tipoDocumento?.message} {...register('tipoDocumento')}>
          {TIPOS_DOCUMENTO.map((t) => <option key={t.valor} value={t.valor}>{t.label}</option>)}
        </Select>
        <Input label="Número de documento" autoComplete="off" error={e.documento?.message} {...register('documento')} />
        <Input label="Nombres" autoComplete="given-name" error={e.nombres?.message} {...register('nombres')} />
        <Input label="Apellidos" autoComplete="family-name" error={e.apellidos?.message} {...register('apellidos')} />
        <Input label="Correo" type="email" autoComplete="email" error={e.correo?.message} {...register('correo')} />
        <Input label="Teléfono" type="tel" autoComplete="tel" error={e.telefono?.message} {...register('telefono')} />
        <Input className="sm:col-span-2" label="Dirección" autoComplete="street-address" error={e.direccion?.message} {...register('direccion')} />
        <InputContrasena label="Contraseña" autoComplete="new-password" error={e.contrasena?.message}
          hint="8+ caracteres, mayúscula, minúscula y número." {...register('contrasena')} />
        <InputContrasena label="Confirmar contraseña" autoComplete="new-password" error={e.confirmacion?.message} {...register('confirmacion')} />
        {error && <Alert className="sm:col-span-2" tone="danger" title="No pudimos crear la cuenta" description={error} />}
        <Button className="sm:col-span-2" type="submit" size="lg" fullWidth liquido loading={formState.isSubmitting}>
          {formState.isSubmitting ? 'Creando tu cuenta…' : 'Crear mi cuenta'}
        </Button>
      </form>
    </div>
  )
}
