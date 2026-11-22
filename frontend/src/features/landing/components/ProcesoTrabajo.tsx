import { ETAPAS } from '../datos'
import { Revelable, TituloSeccion } from './Seccion'

/**
 * Cómo trabajamos: las seis etapas reales de una orden, en una línea de tiempo
 * de tarjetas de vidrio. La línea que las une se dibuja al entrar en pantalla.
 */
export function ProcesoTrabajo() {
  return (
    <section id="proceso" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <TituloSeccion
          centrado
          antetitulo="Cómo trabajamos"
          titulo="Seis pasos,"
          destacado="sin sorpresas."
          descripcion="El mismo recorrido para un computador o para el cableado de una sede completa. Usted aprueba antes de pagar y paga la mitad antes de la visita."
        />

        <div className="relative mt-14">
          {/* Riel que une las etapas (escritorio) */}
          <div aria-hidden="true" className="absolute top-[27px] right-[8%] left-[8%] hidden h-[2px] overflow-hidden rounded-full bg-[var(--rvr-track)] lg:block">
            <Revelable className="h-full">
              <span className="block h-full origin-left bg-primary [animation:rvr-crecer-x_1.6s_cubic-bezier(0.22,1,0.36,1)_both] motion-reduce:animation-none" />
            </Revelable>
          </div>

          <ol className="relative m-0 grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-6 lg:gap-3">
            {ETAPAS.map((etapa, i) => (
              <Revelable key={etapa.nombre} retraso={i * 110} rol="listitem" className="h-full">
                <div className="flex h-full flex-col items-start gap-3 lg:items-center lg:text-center">
                  <span className="relative flex size-14 flex-none items-center justify-center rounded-[18px] bg-primary text-[20px] font-extrabold text-white shadow-[0_12px_24px_-10px_var(--rvr-halo-primary)]">
                    {i + 1}
                  </span>
                  <div className="vidrio tarjeta-viva reflejo flex h-full w-full flex-col gap-1.5 rounded-[20px] border border-[var(--rvr-glass-borde)] p-4">
                    <h3 className="m-0 text-[16px] font-bold text-fg">{etapa.nombre}</h3>
                    <p className="m-0 text-[13.5px] leading-[1.55] text-fg-muted">{etapa.texto}</p>
                  </div>
                </div>
              </Revelable>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
