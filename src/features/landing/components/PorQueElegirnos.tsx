import type { ComponentType, SVGProps } from 'react'
import { Revelable, TituloSeccion } from './Seccion'
import { IcoDiagnostico, IcoGarantia, IcoPersona, IcoRayo } from './iconos'

interface Razon {
  titulo: string
  descripcion: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
}

const RAZONES: Razon[] = [
  {
    titulo: 'Respuesta rápida',
    descripcion:
      'Atendemos solicitudes urgentes con tiempos de reacción cortos en Medellín y el Área Metropolitana.',
    icono: IcoRayo,
  },
  {
    titulo: 'Garantía por escrito',
    descripcion:
      'Cada servicio queda respaldado con garantía formal y documentación entregable.',
    icono: IcoGarantia,
  },
  {
    titulo: 'Diagnóstico certero',
    descripcion:
      'Identificamos la causa real del problema antes de proponer una solución.',
    icono: IcoDiagnostico,
  },
  {
    titulo: 'Atención personalizada',
    descripcion:
      'Un mismo técnico acompaña su caso de principio a fin, con comunicación directa.',
    icono: IcoPersona,
  },
]

export function PorQueElegirnos() {
  return (
    <section id="nosotros" className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <TituloSeccion
          antetitulo="Sobre nosotros"
          titulo="Por qué elegirnos"
          descripcion="Más de una década resolviendo la tecnología de empresas y hogares en Medellín, con trato cercano y compromisos claros."
        />

        <div role="list" className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {RAZONES.map((razon, indice) => {
            const Icono = razon.icono
            return (
              <Revelable
                key={razon.titulo}
                rol="listitem"
                retraso={indice * 80}
                className="tarjeta tarjeta-viva filo-hover flex h-full flex-col gap-3 rounded-[16px] border border-border-base bg-surface p-5 text-center sm:p-6"
              >
                <span className="mx-auto flex size-12 flex-none items-center justify-center rounded-full bg-[var(--rvr-primary-soft)] text-primary-on-soft ring-1 ring-[var(--rvr-primary)]/15">
                  <Icono width="21" height="21" />
                </span>
                <h3 className="m-0 font-[family-name:var(--font-display)] text-[16px] font-bold tracking-[-0.3px] text-fg">
                  {razon.titulo}
                </h3>
                <p className="m-0 text-[13px] leading-[1.6] text-fg-muted text-pretty">
                  {razon.descripcion}
                </p>
              </Revelable>
            )
          })}
        </div>
      </div>
    </section>
  )
}
