import { useState } from 'react'
import { z } from 'zod'
import { authService, useAuth } from '@features/auth'
import { Bloque, Datos } from '@shared/components/detalle'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { SelectorTema } from '@shared/components/theme/SelectorTema'
import { Avatar, Button, PageHeader } from '@shared/components/ui'
import { useToast } from '@shared/hooks/useToast'
import { CambioContrasena } from './CambioContrasena'

const esquema = z.object({
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
  correo: z.string().trim().toLowerCase().email('Correo no válido').max(100),
  telefono: z.string().trim().max(20).refine((v) => !v || /^[0-9+\s()-]{7,20}$/.test(v), 'Teléfono no válido').transform((v) => v || null),
})

/** Mi perfil del personal: mis datos, mi contraseña y el tema de la interfaz. */
export default function PerfilPage() {
  const { usuario, actualizarUsuario } = useAuth()
  const { mostrar } = useToast()
  const [editando, setEditando] = useState(false)
  const [clave, setClave] = useState(false)
  if (!usuario) return null

  const modulos = [...new Set(usuario.permisos.map((p) => p.split('.')[0]))]

  return (
    <div className="flex flex-col gap-4 px-4 py-6 sm:px-7">
      <PageHeader
        eyebrow="Mi cuenta"
        titulo={usuario.nombre}
        descripcion={`${usuario.rol.nombre} · ${usuario.correo}`}
        acciones={
          <>
            <Button variant="secondary" onClick={() => setClave(true)}>Cambiar contraseña</Button>
            <Button onClick={() => setEditando(true)}>Editar mis datos</Button>
          </>
        }
      />
      <div className="grid grid-cols-1 gap-3.5 lg:grid-cols-2">
        <Bloque titulo="Mis datos">
          <div className="flex items-center gap-3">
            <Avatar nombre={usuario.nombre} tamano="lg" />
            <div>
              <div className="text-[14px] font-semibold text-fg">{usuario.nombre}</div>
              <div className="font-mono whitespace-nowrap text-[12px] text-fg-subtle">@{usuario.nombreUsuario}</div>
            </div>
          </div>
          <Datos columnas={1} items={[
            { label: 'Correo', valor: usuario.correo },
            { label: 'Teléfono', valor: usuario.telefono || '—' },
            { label: 'Rol', valor: usuario.rol.nombre },
            { label: 'Módulos a los que tiene acceso', valor: `${modulos.length} módulo(s), ${usuario.permisos.length} permiso(s)` },
          ]} />
        </Bloque>
        <div className="flex flex-col gap-3.5">
          <Bloque titulo="Apariencia" subtitulo="Solo en este navegador">
            <SelectorTema />
          </Bloque>
          <Bloque titulo="Lo que puedo hacer" subtitulo="Permisos de mi rol">
            <div className="flex max-h-[260px] flex-wrap gap-1.5 overflow-y-auto">
              {usuario.permisos.map((p) => (
                <span key={p} className="rounded-[7px] border border-border-base bg-surface-muted px-2 py-0.5 font-mono text-[11px] text-fg-muted">{p}</span>
              ))}
            </div>
            <p className="m-0 text-[11.5px] text-fg-subtle">Los asigna el administrador en Configuración → Roles.</p>
          </Bloque>
        </div>
      </div>

      <FormularioModal
        abierto={editando}
        onCerrar={() => setEditando(false)}
        titulo="Editar mis datos"
        campos={[
          { nombre: 'nombres', label: 'Nombres', obligatorio: true, valorInicial: usuario.nombres, max: 100 },
          { nombre: 'apellidos', label: 'Apellidos', obligatorio: true, valorInicial: usuario.apellidos, max: 100 },
          { nombre: 'correo', label: 'Correo', tipo: 'correo', obligatorio: true, valorInicial: usuario.correo, max: 100 },
          { nombre: 'telefono', label: 'Teléfono', tipo: 'tel', valorInicial: usuario.telefono, max: 20 },
        ]}
        schema={esquema}
        onGuardar={async (v) => {
          actualizarUsuario(await authService.actualizarPerfil(v))
          mostrar({ tono: 'exito', mensaje: 'Tus datos quedaron actualizados' })
        }}
      />
      <CambioContrasena abierto={clave} onCerrar={() => setClave(false)} onHecho={() => mostrar({ tono: 'exito', mensaje: 'Contraseña actualizada' })} />
    </div>
  )
}
