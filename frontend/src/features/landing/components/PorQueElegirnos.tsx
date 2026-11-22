import type { ComponentType, SVGProps } from 'react'
import { IcoCandado, IcoDiagnostico, IcoGarantia, IcoPersona } from './iconos'
import { IconoApp, Revelable, TituloSeccion } from './Seccion'

const MOTIVOS: { titulo: string; texto: string; icono: ComponentType<SVGProps<SVGSVGElement>>; tono: 'azul' | 'tinta' }[] = [
  { titulo: 'Un solo responsable', texto: 'La misma empresa para computadores, red, servidores, cámaras y alarmas: nada de cinco proveedores.', icono: IcoPersona, tono: 'azul' },
  { titulo: 'Diagnóstico antes del precio', texto: 'Un técnico valora lo que necesita y le envía la cotización detallada antes de empezar.', icono: IcoDiagnostico, tono: 'tinta' },
  { titulo: 'Garantía por escrito', texto: 'Cada servicio trae sus días de garantía, y la puede reclamar desde el portal.', icono: IcoGarantia, tono: 'azul' },
  { titulo: 'Pagos claros', texto: 'Anticipo del 50 % y saldo al terminar, con comprobantes revisados y a la vista.', icono: IcoCandado, tono: 'tinta' },
]

export function PorQueElegirnos() {
  return (
    <section id="nosotros" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <TituloSeccion
          antetitulo="Por qué RvR"
          titulo="Tecnología resuelta,"
          destacado="por escrito y a la vista."
          descripcion="Trato cercano, compromisos claros y cada paso registrado: así trabajamos con empresas y hogares de Medellín y el Área Metropolitana."
        />

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {MOTIVOS.map((m, i) => {
            const Icono = m.icono
            return (
              <Revelable key={m.titulo} retraso={i * 90} className="h-full">
                <div className="vidrio tarjeta-viva reflejo flex h-full flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-6">
                  <IconoApp tono={m.tono}>
                    <Icono width="22" height="22" />
                  </IconoApp>
                  <h3 className="m-0 text-[18px] font-bold tracking-[-0.3px] text-fg">{m.titulo}</h3>
                  <p className="m-0 text-[14.5px] leading-[1.6] text-fg-muted">{m.texto}</p>
                </div>
              </Revelable>
            )
          })}
        </div>
      </div>
    </section>
  )
}
