import { z } from 'zod'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { TIPOS_DOCUMENTO, errorDocumento, limpiarDocumento } from '@shared/domain/documentos'
import { clientesService, type AccesoNuevo, type Cliente, type ClienteDetalle } from './api'

const esquema = z
  .object({
    tipoDocumento: z.string().min(1, 'Selecciona el tipo de documento'),
    documento: z.string().trim().transform(limpiarDocumento),
    nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
    apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
    correo: z.string().trim().toLowerCase().max(100).refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Correo no válido').transform((v) => v || null),
    telefono: z.string().trim().max(20).refine((v) => !v || /^[0-9+\s()-]{7,20}$/.test(v), 'Teléfono no válido').transform((v) => v || null),
    direccion: z.string().trim().max(150).transform((v) => v || null),
    crearAcceso: z.boolean().optional(),
  })
  .superRefine((d, ctx) => {
    const error = errorDocumento(d.tipoDocumento, d.documento)
    if (error) ctx.addIssue({ code: 'custom', path: ['documento'], message: error })
    if (d.crearAcceso && !d.correo) ctx.addIssue({ code: 'custom', path: ['correo'], message: 'Para darle acceso al portal, el correo es obligatorio.' })
  })

/**
 * HU_31 Registrar cliente · HU_34 Editar cliente.
 *
 * [Feedback 5] Orden de los datos: identificación → nombre → contacto → ubicación.
 * El documento y el correo se revisan al salir del campo para avisar de un
 * repetido antes de enviar.
 */
export function FormCliente({ abierto, cliente, onCerrar, onGuardado }: {
  abierto: boolean
  cliente: Cliente | null
  onCerrar: () => void
  onGuardado: (c: ClienteDetalle, acceso?: AccesoNuevo | null) => void
}) {
  const excepto = cliente?.id ?? 0
  return (
    <FormularioModal
      key={cliente?.id ?? 'nuevo'}
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={cliente ? `Editar a ${cliente.nombre}` : 'Registrar cliente'}
      descripcion={cliente ? undefined : 'Queda activo con la fecha de registro de hoy. Si luego se registra en el portal con este documento, su cuenta se vincula a este registro.'}
      textoGuardar={cliente ? 'Guardar cambios' : 'Registrar cliente'}
      campos={[
        {
          nombre: 'tipoDocumento', label: 'Tipo de documento', info: 'CC cédula, CE extranjería, TI tarjeta de identidad, NIT empresa (con dígito de verificación), PP pasaporte, PEP permiso especial.', tipo: 'select', obligatorio: true, valorInicial: cliente?.tipoDocumento ?? 'CC',
          opciones: TIPOS_DOCUMENTO.map((t) => ({ valor: t.valor, label: t.label })),
        },
        {
          nombre: 'documento', label: 'Número de documento', info: 'Sin puntos ni espacios. Al salir del campo revisamos si ya está registrado.', obligatorio: true, max: 20, valorInicial: cliente?.documento, autoComplete: 'off',
          validarAlSalir: async (valor, v) => {
            const formato = errorDocumento(v.tipoDocumento ?? 'CC', valor)
            if (formato) return { error: formato }
            const r = await clientesService.disponible('documento', valor, excepto)
            return r.disponible ? null : { error: `Ya está registrado: ${r.cliente!.nombre}.` }
          },
        },
        { nombre: 'nombres', label: 'Nombres', obligatorio: true, max: 100, valorInicial: cliente?.nombres },
        { nombre: 'apellidos', label: 'Apellidos', obligatorio: true, max: 100, valorInicial: cliente?.apellidos },
        {
          nombre: 'correo', label: 'Correo', info: 'Debe ser único: con él el cliente puede entrar al portal.', tipo: 'correo', max: 100, valorInicial: cliente?.correo,
          obligatorio: cliente?.tieneCuenta,
          validarAlSalir: async (valor) => {
            const r = await clientesService.disponible('correo', valor, excepto)
            return r.disponible ? null : { error: `Ese correo ya es de ${r.cliente!.nombre}.` }
          },
        },
        { nombre: 'telefono', label: 'Teléfono', tipo: 'tel', max: 20, valorInicial: cliente?.telefono },
        { nombre: 'direccion', label: 'Dirección', max: 150, ancho: 'completo', valorInicial: cliente?.direccion },
        ...(cliente ? [] : [{
          nombre: 'crearAcceso', label: 'Crear también su cuenta del portal', info: 'El cliente podrá solicitar servicios, aprobar cotizaciones y seguir sus órdenes en línea.', tipo: 'booleano' as const, ancho: 'completo' as const,
          ayuda: 'Podrá entrar con su correo y una contraseña temporal que verás al guardar, para pedir servicios y aprobar cotizaciones.',
        }]),
      ]}
      schema={esquema}
      onGuardar={async (v) => {
        if (cliente) onGuardado(await clientesService.editar(cliente.id, v))
        else {
          const r = await clientesService.registrar(v)
          onGuardado(r, r.acceso)
        }
      }}
    />
  )
}
