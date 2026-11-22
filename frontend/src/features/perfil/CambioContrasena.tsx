import { z } from 'zod'
import { authService, reglaContrasena } from '@features/auth'
import { FormularioModal } from '@shared/components/form/FormularioModal'

const esquema = z
  .object({ actual: z.string().min(1, 'Escribe tu contraseña actual'), nueva: reglaContrasena, confirmacion: z.string() })
  .refine((d) => d.nueva === d.confirmacion, { message: 'Las contraseñas no coinciden', path: ['confirmacion'] })

/** CA_77_04 · Cambiar la contraseña exigiendo la actual (personal y clientes). */
export function CambioContrasena({ abierto, onCerrar, onHecho }: { abierto: boolean; onCerrar: () => void; onHecho: () => void }) {
  return (
    <FormularioModal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Cambiar contraseña"
      descripcion="8+ caracteres, con mayúscula, minúscula y número."
      textoGuardar="Cambiar contraseña"
      ancho="sm"
      campos={[
        { nombre: 'actual', label: 'Contraseña actual', tipo: 'contrasena', obligatorio: true, ancho: 'completo', autoComplete: 'current-password' },
        { nombre: 'nueva', label: 'Contraseña nueva', tipo: 'contrasena', obligatorio: true, autoComplete: 'new-password' },
        { nombre: 'confirmacion', label: 'Confirmar', tipo: 'contrasena', obligatorio: true, autoComplete: 'new-password' },
      ]}
      schema={esquema}
      onGuardar={async (v) => {
        await authService.cambiarContrasena(v.actual, v.nueva, v.confirmacion)
        onHecho()
      }}
    />
  )
}
