import { useCallback, useState } from 'react'
import { z } from 'zod'
import { camposEmpresa, validarEmpresa } from '@shared/domain/empresa'
import { useAuth } from '@features/auth'
import { CambioContrasena } from '@features/perfil'
import { IconCandado } from '@shared/components/icons'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { SelectorTema } from '@shared/components/theme/SelectorTema'
import { Alert, Avatar, Button, SkeletonKpis } from '@shared/components/ui'
import { useRecurso } from '@shared/hooks/useRecurso'
import { useToast } from '@shared/hooks/useToast'
import { portalService } from '../api'
import { EncabezadoPortal } from '../components/EncabezadoPortal'
import { PanelTinta, TituloBloque } from '../components/kit'

const esquema = z.object({
  ...camposEmpresa,
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios').max(100),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios').max(100),
  telefono: z.string().trim().regex(/^[0-9+\s()-]{7,20}$/, 'Escribe un teléfono válido'),
  direccion: z.string().trim().min(5, 'Escribe la dirección').max(150),
  correo: z.string().trim().toLowerCase().email('Correo no válido').max(100),
}).superRefine(validarEmpresa)

/**
 * HU_76 · Consultar mis datos (solo lectura, sin la contraseña: CA_76_02) ·
 * HU_77 · Actualizar mis datos (el documento no se edita: CA_77_02) y cambiar
 * la contraseña exigiendo la actual (CA_77_04).
 */
export default function MiPerfilPage() {
  const { actualizarUsuario } = useAuth()
  const { mostrar } = useToast()
  const cargar = useCallback(() => Promise.all([portalService.perfil(), portalService.resumen()]), [])
  const { datos, error, recargar } = useRecurso(cargar, 0)
  const [editando, setEditando] = useState(false)
  const [clave, setClave] = useState(false)

  if (error) return <Alert tone="danger" title="No pudimos cargar tu perfil" description={error} />
  if (!datos) return <SkeletonKpis />
  const [p, r] = datos
  const nombre = `${p.nombres} ${p.apellidos}`.trim()
  const ordenes = r.ordenes_activas + r.ordenes_finalizadas

  const contacto = [
    { label: 'Teléfono', valor: p.telefono, href: p.telefono ? `tel:${p.telefono.replace(/\s/g, '')}` : undefined, icono: <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" /> },
    { label: 'Correo', valor: p.correo, href: p.correo ? `mailto:${p.correo}` : undefined, icono: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></> },
    { label: 'Dirección de servicio', valor: p.direccion, icono: <><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <EncabezadoPortal eyebrow="Tu cuenta" titulo="Mi perfil" descripcion="Los datos con los que RvR Tecnologías te contacta y te visita." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        {/* ---------- Carné de cliente ---------- */}
        <PanelTinta className="flex flex-col p-6 sm:p-7" intensidad={0.45}>
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-semibold tracking-[0.18em] text-[#8ec5ff] uppercase">Cliente RvR</span>
            <IconoMarca tamano={36} radio="28%" alt="" />
          </div>
          <div className="mt-8 flex items-center gap-4">
            <Avatar nombre={nombre} className="!size-[72px] !rounded-[22px] !text-[24px] ring-4 ring-white/15" />
            <div className="min-w-0">
              <div className="text-[24px] leading-tight font-extrabold tracking-[-0.6px] text-white">{p.razonSocial || nombre}</div>
              <div className="mt-1 font-mono text-[14px] text-[#c6d4e8]">{p.modalidad === 'empresarial' ? `NIT ${p.nitEmpresa} · Contacto: ${nombre}` : `Personal · ${p.tipoDocumento} ${p.documento}`}</div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2">
            {[
              { v: new Date(p.fechaRegistro).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }).replace('.', ''), t: 'Cliente desde' },
              { v: String(ordenes), t: ordenes === 1 ? 'Orden' : 'Órdenes' },
              { v: p.estado === 'activo' ? 'Activa' : p.estado, t: 'Cuenta' },
            ].map((d) => (
              <div key={d.t} className="vidrio-oscuro rounded-[16px] px-3 py-3">
                <div className="truncate text-[15px] font-bold text-white capitalize">{d.v}</div>
                <div className="text-[11.5px] text-[#9fb6d6]">{d.t}</div>
              </div>
            ))}
          </div>
        </PanelTinta>

        {/* ---------- Contacto ---------- */}
        <section className="vidrio flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5 sm:p-6">
          <TituloBloque titulo="Cómo te contactamos" accion={<Button size="sm" liquido onClick={() => setEditando(true)}>Actualizar datos</Button>} />
          <ul className="m-0 flex list-none flex-col gap-2.5 p-0">
            {contacto.map((c) => (
              <li key={c.label} className="flex items-center gap-3.5 rounded-[18px] bg-surface-muted p-3.5">
                <span className="flex size-10 flex-none items-center justify-center rounded-[12px] bg-primary text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{c.icono}</svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] text-fg-subtle">{c.label}</span>
                  {c.href ? <a href={c.href} className="block truncate text-[14.5px] font-semibold text-fg hover:text-link">{c.valor}</a> : <span className="block text-[14.5px] font-semibold text-fg">{c.valor || '—'}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="m-0 text-[12.5px] text-fg-subtle">El documento de identidad no se puede cambiar. Si hay un error, escríbenos.</p>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="vidrio flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5 sm:p-6">
          <TituloBloque icono={IconCandado} titulo="Seguridad" />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] bg-surface-muted p-4">
            <span>
              <span className="block text-[14px] font-semibold text-fg">Contraseña</span>
              <span className="block text-[13px] text-fg-muted">Para cambiarla te pedimos la actual.</span>
            </span>
            <Button variant="secondary" onClick={() => setClave(true)}>Cambiar contraseña</Button>
          </div>
        </section>
        <section className="vidrio flex flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-5 sm:p-6">
          <TituloBloque titulo="Apariencia" accion={<span className="text-[12.5px] text-fg-subtle">Solo en este navegador</span>} />
          <SelectorTema />
        </section>
      </div>

      <FormularioModal
        key={JSON.stringify(p)}
        abierto={editando}
        onCerrar={() => setEditando(false)}
        titulo="Actualizar mis datos"
        descripcion="El titular elegido se aplicará a las próximas cotizaciones. Los nombres y apellidos identifican a la persona de contacto."
        campos={[
          { nombre: 'modalidad', label: 'Tipo de cuenta', tipo: 'select', valorInicial: p.modalidad,
            opciones: [{ valor: 'personal', label: 'Personal' }, { valor: 'empresarial', label: 'Empresarial' }] },
          { nombre: 'razonSocial', label: 'Razón social', valorInicial: p.razonSocial, max: 180, obligatorio: true, visibleSi: (v) => v.modalidad === 'empresarial' },
          { nombre: 'nitEmpresa', label: 'NIT de la empresa', valorInicial: p.nitEmpresa, max: 11, obligatorio: true, visibleSi: (v) => v.modalidad === 'empresarial' },
          { nombre: 'documento', label: 'Documento de identidad', valorInicial: p.documento, soloLectura: true, ancho: 'completo' },
          { nombre: 'nombres', label: 'Nombres', obligatorio: true, valorInicial: p.nombres, max: 100 },
          { nombre: 'apellidos', label: 'Apellidos', obligatorio: true, valorInicial: p.apellidos, max: 100 },
          { nombre: 'telefono', label: 'Teléfono', tipo: 'tel', obligatorio: true, valorInicial: p.telefono, max: 20 },
          { nombre: 'correo', label: 'Correo', tipo: 'correo', obligatorio: true, valorInicial: p.correo, max: 100 },
          { nombre: 'direccion', label: 'Dirección', obligatorio: true, valorInicial: p.direccion, max: 150, ancho: 'completo' },
        ]}
        schema={esquema}
        onGuardar={async (v) => {
          const res = await portalService.actualizarPerfil(v)
          actualizarUsuario(res.cuenta)
          mostrar({ tono: 'exito', mensaje: 'Tus datos quedaron actualizados' })
          recargar()
        }}
      />
      <CambioContrasena abierto={clave} onCerrar={() => setClave(false)} onHecho={() => mostrar({ tono: 'exito', mensaje: 'Contraseña actualizada' })} />
    </div>
  )
}
