import type { ComponentType, SVGProps } from 'react'
import { formatearMoneda } from '@shared/lib/format'
import { CATALOGO, desdeCategoria } from '../datos'
import { IcoAlarma, IcoCctv, IcoMantenimiento, IcoRedes, IcoServidores } from './iconos'
import { IconoApp, Revelable, TituloSeccion } from './Seccion'

interface Frente {
  categoria: string
  titulo: string
  texto: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
}

const FRENTES: Frente[] = [
  { categoria: 'Mantenimiento', titulo: 'Computadores e impresoras', texto: 'Mantenimiento preventivo y correctivo, formateo y revisión técnica programada.', icono: IcoMantenimiento },
  { categoria: 'Servidores', titulo: 'Servidores', texto: 'Montaje, configuración, respaldos y mantenimiento de servidores para su operación.', icono: IcoServidores },
  { categoria: 'Redes', titulo: 'Redes y cableado', texto: 'Configuración de red IP, router, switch y Wi-Fi, y puntos de red certificados.', icono: IcoRedes },
  { categoria: 'Cámaras de seguridad', titulo: 'Cámaras de seguridad', texto: 'Instalación de cámaras y kits de videovigilancia con acceso desde el celular.', icono: IcoCctv },
  { categoria: 'Alarmas', titulo: 'Alarmas', texto: 'Panel, sensores de movimiento y apertura, sirena y mantenimiento del sistema.', icono: IcoAlarma },
]

/** Los cinco frentes, cada uno con sus servicios reales y su precio desde. */
export function Servicios() {
  return (
    <section id="servicios" className="py-20 sm:py-24">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <TituloSeccion
          antetitulo="Servicios"
          titulo="Cinco frentes técnicos,"
          destacado="un mismo equipo."
          descripcion="Lo que su empresa o su casa necesita en tecnología, resuelto por las mismas personas y con el mismo estándar de diagnóstico, ejecución y garantía."
        />

        <div role="list" className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FRENTES.map((frente, indice) => {
            const Icono = frente.icono
            const servicios = CATALOGO.filter((s) => s.categoria === frente.categoria)
            return (
              <Revelable
                key={frente.titulo}
                rol="listitem"
                retraso={indice * 80}
                className="h-full"
              >
                <div className="vidrio tarjeta-viva reflejo group flex h-full flex-col gap-4 rounded-[24px] border border-[var(--rvr-glass-borde)] p-6">
                <div className="flex items-start justify-between gap-3">
                  <IconoApp className="transition-transform duration-300 group-hover:scale-105 group-hover:-rotate-3">
                    <Icono width="22" height="22" />
                  </IconoApp>
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-[12.5px] font-semibold text-primary-on-soft">
                    Desde {formatearMoneda(desdeCategoria(frente.categoria))}
                  </span>
                </div>
                <div>
                  <h3 className="m-0 text-[19px] leading-[1.25] font-bold tracking-[-0.4px] text-fg">{frente.titulo}</h3>
                  <p className="m-0 mt-2 text-[14.5px] leading-[1.6] text-fg-muted">{frente.texto}</p>
                </div>
                <ul className="m-0 mt-auto flex list-none flex-col gap-1.5 border-t border-border-base p-0 pt-4">
                  {servicios.map((s) => (
                    <li key={s.id} className="flex items-baseline justify-between gap-3 text-[13.5px]">
                      <span className="text-fg-muted">{s.nombre}</span>
                    </li>
                  ))}
                </ul>
                </div>
              </Revelable>
            )
          })}

          <Revelable
            rol="listitem"
            retraso={FRENTES.length * 80}
            className="flex h-full flex-col justify-center gap-3 rounded-[24px] border border-dashed border-border-strong p-6"
          >
            <h3 className="m-0 text-[17px] font-bold text-fg">¿Y celulares o tablets?</h3>
            <p className="m-0 text-[14.5px] leading-[1.6] text-fg-muted text-pretty">
              Por ahora no ofrecemos soporte para teléfonos celulares ni tablets. Para todo lo
              demás de esta lista, estamos para ayudarle.
            </p>
          </Revelable>
        </div>
      </div>
    </section>
  )
}
