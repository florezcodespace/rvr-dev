import { useEffect, useState } from 'react'
import { z } from 'zod'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { Alert } from '@shared/components/ui'
import { ErrorApi } from '@shared/lib/api'
import { permisosService, type Modulo, type Permiso } from './api'

const esquema = z.object({
  nombre: z.string().trim().toLowerCase().min(1, 'El nombre es obligatorio').max(50).regex(/^[a-z0-9_]+$/, 'Minúsculas, números y guion bajo (ej. ver_detalle)'),
  modulo: z.string().min(1, 'Selecciona el módulo'),
  descripcion: z.string().trim().max(255).transform((v) => v || null),
})

/** HU_66 Registrar permiso · HU_69 Editar permiso (con la advertencia de CA_69_03). */
export function FormPermiso({
  abierto,
  permiso,
  onCerrar,
  onGuardado,
}: {
  abierto: boolean
  permiso: Permiso | null
  onCerrar: () => void
  onGuardado: (p: Permiso) => void
}) {
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [advertencia, setAdvertencia] = useState<string | null>(null)

  useEffect(() => {
    if (abierto && modulos.length === 0) permisosService.modulos().then(setModulos).catch(() => undefined)
  }, [abierto, modulos.length])

  const cerrar = () => {
    setAdvertencia(null)
    onCerrar()
  }

  return (
    <FormularioModal
      key={`${permiso?.id ?? 'nuevo'}-${modulos.length}`}
      abierto={abierto}
      onCerrar={cerrar}
      titulo={permiso ? `Editar permiso ${permiso.clave}` : 'Registrar permiso'}
      descripcion="El sistema reconoce cada permiso por su módulo y su nombre (módulo.nombre)."
      textoGuardar={advertencia ? 'Guardar de todos modos' : permiso ? 'Guardar cambios' : 'Registrar permiso'}
      antes={advertencia && <Alert tone="warning" title="Este permiso está en uso" description={advertencia} />}
      campos={[
        { nombre: 'nombre', label: 'Nombre (acción)', obligatorio: true, max: 50, placeholder: 'ej. exportar', valorInicial: permiso?.nombre, ayuda: 'Minúsculas y guion bajo.' },
        {
          nombre: 'modulo', label: 'Módulo', tipo: 'select', obligatorio: true, valorInicial: permiso?.modulo ?? '',
          opciones: [{ valor: '', label: 'Selecciona…' }, ...modulos.map((m) => ({ valor: m.clave, label: `${m.nombre} · ${m.proceso}` }))],
        },
        { nombre: 'descripcion', label: 'Descripción (qué autoriza)', tipo: 'area', ancho: 'completo', max: 255, valorInicial: permiso?.descripcion },
      ]}
      schema={esquema}
      onGuardar={async (v) => {
        try {
          const r = permiso
            ? await permisosService.editar(permiso.id, { ...v, confirmar: advertencia !== null })
            : await permisosService.registrar(v)
          setAdvertencia(null)
          onGuardado(r)
        } catch (e) {
          // CA_69_03 · si está asignado a roles activos, se advierte antes de guardar
          if (e instanceof ErrorApi && e.codigo === 'CONFIRMAR_CAMBIO') {
            setAdvertencia(e.message)
            throw new Error('Confirma el cambio con el botón «Guardar de todos modos».')
          }
          throw e
        }
      }}
    />
  )
}
