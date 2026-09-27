import { useCallback, useState } from 'react'
import { z } from 'zod'
import { useAuth } from '@features/auth'
import { CambioContrasena } from '@features/perfil'
import { Bloque, Datos } from '@shared/components/detalle'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { SelectorTema } from '@shared/components/theme/SelectorTema'
import { Alert, Button, SkeletonKpis } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { formatearFecha } from '@shared/lib/format'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'

const esquema = z.object({
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
  telefono: z.string().trim().regex(/^[0-9+\s()-]{7,20}$/, 'Escribe un teléfono válido'),
  direccion: z.string().trim().min(5, 'Escribe la dirección').max(150),
  correo: z.string().trim().toLowerCase().email('Correo no válido').max(100),
})

/**
 * HU_76 · Consultar mis datos (solo lectura, sin la contraseña: CA_76_02) ·
 * HU_77 · Actualizar mis datos (el documento no se edita: CA_77_02) y cambiar
 * la contraseña exigiendo la actual (CA_77_04).
 */
export default function MiPerfilPage() {
  const { actualizarUsuario } = useAuth()
  const { mostrar } = useToast()
  const cargar = useCallback(() => portalService.perfil(), [])
  const { datos: p, error, recargar } = useRecurso(cargar, 0)
  const [editando, setEditando] = useState(false)
  const [clave, setClave] = useState(false)

  if (error) return <Alert tone="danger" title="No pudimos cargar tu perfil" description={error} />
  if (!p) return <SkeletonKpis />

  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPortal
        eyebrow="Autogestión de la cuenta"
        titulo="Mi perfil"
        descripcion="Los datos con los que RvR Tecnologías te contacta y te visita."
        acciones={
          <>
            <Button variant="secondary" onClick={() => setClave(true)}>Cambiar contraseña</Button>
            <Button onClick={() => setEditando(true)}>Actualizar mis datos</Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Bloque titulo="Mis datos">
          <Datos items={[
            { label: 'Documento de identidad', valor: <span className="font-mono">{p.documento}</span> },
            { label: 'Cliente desde', valor: formatearFecha(p.fechaRegistro) },
            { label: 'Nombres', valor: p.nombres },
            { label: 'Apellidos', valor: p.apellidos },
            { label: 'Teléfono', valor: p.telefono || '—' },
            { label: 'Correo', valor: p.correo || '—' },
            { label: 'Dirección', valor: p.direccion || '—' },
          ]} />
        </Bloque>
        <Bloque titulo="Apariencia" subtitulo="Solo en este navegador"><SelectorTema /></Bloque>
      </div>

      <FormularioModal
        key={`${p.id}-${p.correo}-${p.telefono}`}
        abierto={editando}
        onCerrar={() => setEditando(false)}
        titulo="Actualizar mis datos"
        descripcion="El documento de identidad no se puede cambiar."
        campos={[
          { nombre: 'documento', label: 'Documento de identidad', valorInicial: p.documento, soloLectura: true, ancho: 'completo' },
          { nombre: 'nombres', label: 'Nombres', obligatorio: true, valorInicial: p.nombres, max: 100 },
          { nombre: 'apellidos', label: 'Apellidos', obligatorio: true, valorInicial: p.apellidos, max: 100 },
          { nombre: 'telefono', label: 'Teléfono', tipo: 'tel', obligatorio: true, valorInicial: p.telefono, max: 20 },
          { nombre: 'correo', label: 'Correo', tipo: 'correo', obligatorio: true, valorInicial: p.correo, max: 100 },
          { nombre: 'direccion', label: 'Dirección', obligatorio: true, valorInicial: p.direccion, max: 150, ancho: 'completo' },
        ]}
        schema={esquema}
        onGuardar={async (v) => {
          const r = await portalService.actualizarPerfil(v)
          actualizarUsuario(r.cuenta)
          mostrar({ tono: 'exito', mensaje: 'Tus datos quedaron actualizados' })
          recargar()
        }}
      />
      <CambioContrasena abierto={clave} onCerrar={() => setClave(false)} onHecho={() => mostrar({ tono: 'exito', mensaje: 'Contraseña actualizada' })} />
    </div>
  )
}
