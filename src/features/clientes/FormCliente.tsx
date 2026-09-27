import { z } from 'zod'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { clientesService, type Cliente, type ClienteDetalle } from './api'

const esquema = z.object({
  documento: z.string().trim().min(5, 'Mínimo 5 caracteres').max(20).regex(/^[0-9A-Za-z.-]+$/, 'Solo números, letras, puntos y guiones'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
  telefono: z.string().trim().max(20).refine((v) => !v || /^[0-9+\s()-]{7,20}$/.test(v), 'Teléfono no válido').transform((v) => v || null),
  correo: z.string().trim().toLowerCase().max(100).refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Correo no válido').transform((v) => v || null),
  direccion: z.string().trim().max(150).transform((v) => v || null),
})

/** HU_31 Registrar cliente · HU_34 Editar cliente */
export function FormCliente({ abierto, cliente, onCerrar, onGuardado }: {
  abierto: boolean
  cliente: Cliente | null
  onCerrar: () => void
  onGuardado: (c: ClienteDetalle) => void
}) {
  return (
    <FormularioModal
      key={cliente?.id ?? 'nuevo'}
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={cliente ? `Editar a ${cliente.nombre}` : 'Registrar cliente'}
      descripcion={cliente ? undefined : 'Queda activo con la fecha de registro de hoy. Si luego se registra en el portal con este documento, su cuenta se vincula a este registro.'}
      textoGuardar={cliente ? 'Guardar cambios' : 'Registrar cliente'}
      campos={[
        { nombre: 'documento', label: 'Documento de identidad', obligatorio: true, max: 20, valorInicial: cliente?.documento },
        { nombre: 'telefono', label: 'Teléfono', tipo: 'tel', max: 20, valorInicial: cliente?.telefono },
        { nombre: 'nombres', label: 'Nombres', obligatorio: true, max: 100, valorInicial: cliente?.nombres },
        { nombre: 'apellidos', label: 'Apellidos', obligatorio: true, max: 100, valorInicial: cliente?.apellidos },
        { nombre: 'correo', label: 'Correo', tipo: 'correo', max: 100, valorInicial: cliente?.correo },
        { nombre: 'direccion', label: 'Dirección', max: 150, valorInicial: cliente?.direccion },
      ]}
      schema={esquema}
      onGuardar={async (v) => onGuardado(cliente ? await clientesService.editar(cliente.id, v) : await clientesService.registrar(v))}
    />
  )
}
