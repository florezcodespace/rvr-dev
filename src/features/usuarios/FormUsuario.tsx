import { useEffect, useState } from 'react'
import { z } from 'zod'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { usuariosService, type Usuario, type UsuarioDetalle } from './api'

const esquema = z.object({
  nombreUsuario: z.string().trim().toLowerCase().min(3, 'Mínimo 3 caracteres').max(50).regex(/^[a-z0-9._-]+$/, 'Sin espacios: letras, números, punto o guion'),
  correo: z.string().trim().toLowerCase().email('El correo no tiene un formato válido').max(100),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
  telefono: z.string().trim().max(20).refine((v) => !v || /^[0-9+\s()-]{7,20}$/.test(v), 'Teléfono no válido').transform((v) => v || null),
  rolId: z.coerce.number({ error: 'Selecciona un rol' }).int().positive('Selecciona un rol'),
})

/** HU_07 Registrar usuario · HU_10 Editar usuario */
export function FormUsuario({
  abierto,
  usuario,
  onCerrar,
  onRegistrado,
  onEditado,
}: {
  abierto: boolean
  usuario: Usuario | null
  onCerrar: () => void
  onRegistrado: (r: { usuario: UsuarioDetalle; contrasenaTemporal: string }) => void
  onEditado: (u: UsuarioDetalle) => void
}) {
  const [roles, setRoles] = useState<{ id: number; nombre: string; estado: string }[]>([])
  useEffect(() => {
    if (abierto) usuariosService.roles().then(setRoles).catch(() => undefined)
  }, [abierto])

  // CA_05_03 / CA_07_04 · solo roles activos (el actual se conserva aunque esté inactivo)
  const opciones = roles.filter((r) => r.estado === 'activo' || r.id === usuario?.rol.id)

  return (
    <FormularioModal
      key={`${usuario?.id ?? 'nuevo'}-${roles.length}`}
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={usuario ? `Editar a ${usuario.nombre}` : 'Registrar usuario'}
      descripcion={usuario ? undefined : 'La cuenta queda activa con una contraseña temporal que se muestra una sola vez.'}
      textoGuardar={usuario ? 'Guardar cambios' : 'Registrar usuario'}
      campos={[
        { nombre: 'nombres', label: 'Nombres', obligatorio: true, max: 100, valorInicial: usuario?.nombres },
        { nombre: 'apellidos', label: 'Apellidos', obligatorio: true, max: 100, valorInicial: usuario?.apellidos },
        { nombre: 'nombreUsuario', label: 'Nombre de usuario', obligatorio: true, max: 50, valorInicial: usuario?.nombreUsuario, placeholder: 'ej. mrios', autoComplete: 'off' },
        { nombre: 'correo', label: 'Correo', tipo: 'correo', obligatorio: true, max: 100, valorInicial: usuario?.correo },
        { nombre: 'telefono', label: 'Teléfono', tipo: 'tel', max: 20, valorInicial: usuario?.telefono },
        {
          nombre: 'rolId', label: 'Rol', tipo: 'select', obligatorio: true, valorInicial: usuario ? String(usuario.rol.id) : '',
          opciones: [{ valor: '', label: 'Selecciona…' }, ...opciones.map((r) => ({ valor: String(r.id), label: r.nombre + (r.estado !== 'activo' ? ' (inactivo)' : '') }))],
        },
      ]}
      schema={esquema}
      onGuardar={async (v) => {
        if (usuario) onEditado(await usuariosService.editar(usuario.id, v))
        else onRegistrado(await usuariosService.registrar(v))
      }}
    />
  )
}
