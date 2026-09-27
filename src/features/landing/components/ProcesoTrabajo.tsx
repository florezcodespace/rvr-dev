import type { ComponentType, SVGProps } from 'react'
import { Revelable, TituloSeccion } from './Seccion'
import { IcoCotizar, IcoGarantia, IcoLupa, IcoMantenimiento } from './iconos'

interface Paso {
  titulo: string
  descripcion: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
}

const PASOS: Paso[] = [
  {
    titulo: 'Diagnóstico',
    descripcion:
      'Revisamos el equipo o la red en sitio y encontramos la causa real del problema, no el síntoma.',
    icono: IcoLupa,
  },
  {
    titulo: 'Cotización',
    descripcion:
      'Le enviamos por escrito el alcance y el valor en menos de 24 horas hábiles. Usted decide.',
    icono: IcoCotizar,
  },
  {
    titulo: 'Ejecución',
    descripcion:
      'Un técnico asignado atiende su caso de principio a fin, en la fecha acordada con usted.',
    icono: IcoMantenimiento,
  },
  {
    titulo: 'Garantía',
    descripcion:
      'El servicio cierra con informe técnico y garantía formal, y queda registrado en su historial.',
    icono: IcoGarantia,
  },
]

export function ProcesoTrabajo() {
  return (
    <section
      id="proceso"
      className="border-y border-border-base bg-surface-muted/40 py-16 sm:py-20"
    >
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <TituloSeccion
          antetitulo="Cómo trabajamos"
          titulo="Cuatro pasos, sin sorpresas"
          descripcion="El mismo procedimiento para un computador o para el cableado de una sede completa: usted siempre sabe en qué punto va su servicio."
        />

        <ol
          className="relative mt-11 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        >
          {/* Hilo que une los cuatro pasos. Solo en escritorio: apilados, una
              línea horizontal no une nada. */}
          <span
            aria-hidden="true"
            className="absolute top-[26px] right-[12%] left-[12%] hidden h-px bg-[linear-gradient(to_right,transparent,var(--rvr-border-strong),transparent)] lg:block"
          />

          {PASOS.map((paso, indice) => {
            const Icono = paso.icono
            return (
              <li key={paso.titulo} className="relative">
                <Revelable retraso={indice * 90} className="flex flex-col items-center text-center">
                  <span className="relative flex size-[52px] flex-none items-center justify-center rounded-full border border-border-base bg-surface text-primary-on-soft shadow-[var(--rvr-shadow-card)]">
                    <Icono width="21" height="21" />
                    <span className="marca-degradada absolute -right-1 -bottom-1 flex size-[22px] items-center justify-center rounded-full text-[11px] font-bold text-on-primary">
                      {indice + 1}
                    </span>
                  </span>
                  <h3 className="mt-4 mb-0 font-[family-name:var(--font-display)] text-[16.5px] font-bold tracking-[-0.3px] text-fg">
                    {paso.titulo}
                  </h3>
                  <p className="mx-auto mt-2 mb-0 max-w-[260px] text-[13px] leading-[1.6] text-fg-muted text-pretty">
                    {paso.descripcion}
                  </p>
                </Revelable>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
