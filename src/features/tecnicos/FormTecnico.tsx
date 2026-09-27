import { z } from 'zod'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { tecnicosService, type CuentaMovil, type Tecnico, type TecnicoDetalle } from './api'

const opcional = (max: number) => z.string().trim().max(max).transform((v) => v || null)
const esquema = z.object({
  documento: z.string().trim().min(5, 'Mínimo 5 caracteres').max(20).regex(/^[0-9A-Za-z.-]+$/, 'Solo números, letras, puntos y guiones'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
  especialidad: opcional(100),
  telefono: z.string().trim().max(20).refine((v) => !v || /^[0-9+\s()-]{7,20}$/.test(v), 'Teléfono no válido').transform((v) => v || null),
  correo: z.string().trim().toLowerCase().max(100).refine((v) => !v || /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v), 'Correo no válido').transform((v) => v || null),
  crearCuenta: z.boolean().optional(),
})

/** HU_22 Registrar técnico · HU_25 Editar técnico */
export function FormTecnico({ abierto, tecnico, onCerrar, onGuardado }: {
  abierto: boolean
  tecnico: Tecnico | null
  onCerrar: () => void
  onGuardado: (t: TecnicoDetalle, cuenta: CuentaMovil | null) => void
}) {
  return (
    <FormularioModal
      key={tecnico?.id ?? 'nuevo'}
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={tecnico ? `Editar a ${tecnico.nombre}` : 'Registrar técnico'}
      descripcion={tecnico ? undefined : 'Queda activo y disponible para agendarle franjas y visitas.'}
      textoGuardar={tecnico ? 'Guardar cambios' : 'Registrar técnico'}
      campos={[
        { nombre: 'documento', label: 'Documento de identidad', obligatorio: true, max: 20, valorInicial: tecnico?.documento },
        { nombre: 'especialidad', label: 'Especialidad', max: 100, valorInicial: tecnico?.especialidad, placeholder: 'Redes, CCTV, servidores…' },
        { nombre: 'nombres', label: 'Nombres', obligatorio: true, max: 100, valorInicial: tecnico?.nombres },
        { nombre: 'apellidos', label: 'Apellidos', obligatorio: true, max: 100, valorInicial: tecnico?.apellidos },
        { nombre: 'telefono', label: 'Teléfono', tipo: 'tel', max: 20, valorInicial: tecnico?.telefono },
        { nombre: 'correo', label: 'Correo', tipo: 'correo', max: 100, valorInicial: tecnico?.correo },
        ...(tecnico ? [] : [{
          nombre: 'crearCuenta', label: 'Crear su cuenta para la aplicación móvil', tipo: 'booleano' as const, ancho: 'completo' as const, valorInicial: 'si',
          ayuda: 'Con rol Técnico: consulta sus órdenes asignadas y registra visitas y reporte técnico desde el celular. Requiere el correo.',
        }]),
      ]}
      schema={esquema}
      onGuardar={async (v) => {
        if (tecnico) onGuardado(await tecnicosService.editar(tecnico.id, v), null)
        else {
          const r = await tecnicosService.registrar(v)
          onGuardado(r.tecnico, r.cuenta)
        }
      }}
    />
  )
}
