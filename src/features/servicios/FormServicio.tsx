import { z } from 'zod'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { CATEGORIAS_SERVICIO } from '@shared/domain/estados'
import { serviciosService, type Servicio, type ServicioDetalle } from './api'

const esquema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es obligatorio').max(100),
  categoria: z.string().min(1, 'Selecciona la categoría'),
  // CA_15_04 · numérico y mayor que cero
  precioBase: z.coerce.number({ error: 'Escribe un número' }).positive('El precio base debe ser mayor que cero').max(99_999_999),
  descripcion: z.string().trim().max(2000).transform((v) => v || null),
})

/** HU_15 Registrar servicio · HU_18 Editar servicio */
export function FormServicio({ abierto, servicio, onCerrar, onGuardado }: {
  abierto: boolean
  servicio: Servicio | null
  onCerrar: () => void
  onGuardado: (s: ServicioDetalle) => void
}) {
  return (
    <FormularioModal
      key={servicio?.id ?? 'nuevo'}
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={servicio ? `Editar ${servicio.nombre}` : 'Registrar servicio'}
      descripcion={servicio ? 'El precio nuevo no cambia las cotizaciones ya registradas: cada una conserva el precio con que se emitió.' : 'Queda activo y visible en el catálogo público.'}
      textoGuardar={servicio ? 'Guardar cambios' : 'Registrar servicio'}
      campos={[
        { nombre: 'nombre', label: 'Nombre del servicio', obligatorio: true, max: 100, ancho: 'completo', valorInicial: servicio?.nombre },
        {
          nombre: 'categoria', label: 'Categoría', tipo: 'select', obligatorio: true, valorInicial: servicio?.categoria ?? '',
          opciones: [{ valor: '', label: 'Selecciona…' }, ...CATEGORIAS_SERVICIO.map((c) => ({ valor: c, label: c }))],
        },
        { nombre: 'precioBase', label: 'Precio base (COP)', tipo: 'numero', obligatorio: true, valorInicial: servicio ? String(servicio.precioBase) : '', placeholder: '120000' },
        { nombre: 'descripcion', label: 'Descripción', tipo: 'area', ancho: 'completo', max: 2000, valorInicial: servicio?.descripcion },
      ]}
      schema={esquema}
      onGuardar={async (v) => onGuardado(servicio ? await serviciosService.editar(servicio.id, v) : await serviciosService.registrar(v))}
    />
  )
}
