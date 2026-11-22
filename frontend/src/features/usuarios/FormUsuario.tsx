import { useEffect, useState } from 'react'
import { z } from 'zod'
import { clientesService } from '@features/clientes/api'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { TIPOS_DOCUMENTO, errorDocumento, limpiarDocumento } from '@shared/domain/documentos'
import { usuariosService, type Usuario, type UsuarioDetalle } from './api'

const base = z.object({
  rolId: z.coerce.number({ error: 'Selecciona un rol' }).int().positive('Selecciona un rol'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
  nombreUsuario: z.string().trim().toLowerCase().min(3, 'Mínimo 3 caracteres').max(50).regex(/^[a-z0-9._-]+$/, 'Sin espacios: letras, números, punto o guion'),
  correo: z.string().trim().toLowerCase().email('El correo no tiene un formato válido').max(100),
  telefono: z.string().trim().max(20).refine((v) => !v || /^[0-9+\s()-]{7,20}$/.test(v), 'Teléfono no válido').transform((v) => v || null),
  tipoDocumento: z.string().optional(),
  documento: z.string().optional(),
  direccion: z.string().trim().max(150).optional(),
})

/** Con rol Cliente, los datos de la ficha de cliente son obligatorios. */
const esquemaPara = (rolClienteId: number | undefined) =>
  base
    .superRefine((d, ctx) => {
      if (d.rolId !== rolClienteId || d.documento === undefined) return
      const error = errorDocumento(d.tipoDocumento ?? '', d.documento)
      if (error) ctx.addIssue({ code: 'custom', path: ['documento'], message: error })
    })
    .transform(({ tipoDocumento, documento, direccion, ...d }) => ({
      ...d,
      cliente: d.rolId === rolClienteId && documento !== undefined
        ? { tipoDocumento: tipoDocumento ?? 'CC', documento: limpiarDocumento(documento), direccion: direccion?.trim() || null }
        : undefined,
    }))

/**
 * HU_07 Registrar usuario · HU_10 Editar usuario.
 *
 * [Feedback 7] Si el rol es Cliente, pide también los datos de la ficha del
 * cliente: el usuario queda registrado como cliente (o se vincula al cliente
 * que el administrador ya tenía con ese documento).
 */
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
  onRegistrado: (r: { usuario: UsuarioDetalle; contrasenaTemporal: string; clienteVinculado: boolean }) => void
  onEditado: (u: UsuarioDetalle) => void
}) {
  const [roles, setRoles] = useState<{ id: number; nombre: string; estado: string }[]>([])
  useEffect(() => {
    if (abierto) usuariosService.roles().then(setRoles).catch(() => undefined)
  }, [abierto])

  // CA_05_03 / CA_07_04 · solo roles activos (el actual se conserva aunque esté inactivo)
  const opciones = roles.filter((r) => r.estado === 'activo' || r.id === usuario?.rol.id)
  const rolClienteId = roles.find((r) => r.nombre === 'Cliente')?.id
  // Solo al registrar: al editar, la ficha del cliente se cambia desde Clientes
  const esCliente = (v: Record<string, string>) => !usuario && rolClienteId !== undefined && v.rolId === String(rolClienteId)
  const excepto = usuario?.id ?? 0

  return (
    <FormularioModal
      key={`${usuario?.id ?? 'nuevo'}-${roles.length}`}
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={usuario ? `Editar a ${usuario.nombre}` : 'Registrar usuario'}
      descripcion={usuario ? undefined : 'La cuenta queda activa con una contraseña temporal que se muestra una sola vez. Con rol Cliente, también queda registrado en Clientes.'}
      textoGuardar={usuario ? 'Guardar cambios' : 'Registrar usuario'}
      campos={[
        {
          nombre: 'rolId', label: 'Rol', info: 'Define qué módulos y botones ve. Si eliges Cliente, se crea o vincula su ficha de cliente.', tipo: 'select', obligatorio: true, ancho: 'completo', valorInicial: usuario ? String(usuario.rol.id) : '',
          opciones: [{ valor: '', label: 'Selecciona…' }, ...opciones.map((r) => ({ valor: String(r.id), label: r.nombre + (r.estado !== 'activo' ? ' (inactivo)' : '') }))],
        },
        {
          nombre: 'tipoDocumento', label: 'Tipo de documento', info: 'CC cédula, CE extranjería, TI tarjeta de identidad, NIT empresa, PP pasaporte, PEP permiso especial.', tipo: 'select', obligatorio: true, valorInicial: 'CC', visibleSi: esCliente,
          opciones: TIPOS_DOCUMENTO.map((t) => ({ valor: t.valor, label: t.label })),
        },
        {
          nombre: 'documento', label: 'Número de documento', obligatorio: true, max: 20, autoComplete: 'off', visibleSi: esCliente,
          validarAlSalir: async (valor, v) => {
            const formato = errorDocumento(v.tipoDocumento ?? 'CC', valor)
            if (formato) return { error: formato }
            const r = await clientesService.disponible('documento', valor)
            if (r.disponible) return null
            if (r.cliente!.conCuenta) return { error: `${r.cliente!.nombre} ya tiene cuenta en el portal.` }
            return { aviso: `Ya está en Clientes: la cuenta se vinculará a la ficha de ${r.cliente!.nombre}.` }
          },
        },
        { nombre: 'nombres', label: 'Nombres', obligatorio: true, max: 100, valorInicial: usuario?.nombres },
        { nombre: 'apellidos', label: 'Apellidos', obligatorio: true, max: 100, valorInicial: usuario?.apellidos },
        {
          nombre: 'correo', label: 'Correo', tipo: 'correo', obligatorio: true, max: 100, valorInicial: usuario?.correo,
          validarAlSalir: async (valor) => {
            const r = await usuariosService.disponible('correo', valor, excepto)
            return r.disponible ? null : { error: 'Ese correo ya está en uso por otra cuenta.' }
          },
        },
        {
          nombre: 'nombreUsuario', label: 'Nombre de usuario', info: 'Con este nombre (o el correo) la persona inicia sesión. No se repite.', obligatorio: true, max: 50, valorInicial: usuario?.nombreUsuario, placeholder: 'ej. mrios', autoComplete: 'off',
          validarAlSalir: async (valor) => {
            const r = await usuariosService.disponible('nombreUsuario', valor, excepto)
            return r.disponible ? null : { error: 'Ese nombre de usuario ya está en uso.' }
          },
        },
        { nombre: 'telefono', label: 'Teléfono', tipo: 'tel', max: 20, valorInicial: usuario?.telefono },
        { nombre: 'direccion', label: 'Dirección', max: 150, ancho: 'completo', visibleSi: esCliente },
      ]}
      schema={esquemaPara(rolClienteId)}
      onGuardar={async (v) => {
        if (usuario) onEditado(await usuariosService.editar(usuario.id, v))
        else onRegistrado(await usuariosService.registrar(v))
      }}
    />
  )
}
