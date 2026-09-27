import type { ComponentType, SVGProps } from 'react'
import { Revelable, TituloSeccion } from './Seccion'
import {
  IcoAlarma,
  IcoCctv,
  IcoMantenimiento,
  IcoRedes,
  IcoServidores,
} from './iconos'

interface Modulo {
  titulo: string
  descripcion: string
  icono: ComponentType<SVGProps<SVGSVGElement>>
}

const MODULOS: Modulo[] = [
  {
    titulo: 'Mantenimiento preventivo y correctivo',
    descripcion:
      'Computadores de escritorio, portátiles e impresoras, con revisión técnica programada.',
    icono: IcoMantenimiento,
  },
  {
    titulo: 'Servidores y almacenamiento',
    descripcion:
      'Manejo, montaje y configuración de servidores dedicados para su operación.',
    icono: IcoServidores,
  },
  {
    titulo: 'Redes IP y cableado estructurado',
    descripcion:
      'Instalación, cableado y configuración de redes de datos punto a punto.',
    icono: IcoRedes,
  },
  {
    titulo: 'Cámaras de seguridad (CCTV)',
    descripcion: 'Sistemas de videovigilancia y monitoreo para negocios y hogares.',
    icono: IcoCctv,
  },
  {
    titulo: 'Sistemas de alarmas',
    descripcion:
      'Instalación y configuración de seguridad electrónica a la medida.',
    icono: IcoAlarma,
  },
]

export function ModulosServicios() {
  return (
    <section id="portafolio" className="py-16 sm:py-20">
      <div className="mx-auto max-w-[1200px] px-5 sm:px-8">
        <TituloSeccion
          antetitulo="Portafolio"
          titulo="Módulos y servicios"
          descripcion="Cinco frentes técnicos cubiertos por un mismo equipo, con la misma exigencia de calidad."
        />

        <div
          role="list"
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MODULOS.map((modulo, indice) => {
            const Icono = modulo.icono
            return (
              <Revelable
                key={modulo.titulo}
                rol="listitem"
                retraso={indice * 70}
                className="tarjeta tarjeta-viva filo-hover flex h-full flex-col gap-3.5 rounded-[16px] border border-border-base bg-surface p-5 sm:p-6"
              >
                <span className="marca-degradada flex size-11 flex-none items-center justify-center rounded-[13px] text-on-primary shadow-[0_10px_22px_-10px_var(--rvr-primary)]">
                  <Icono width="20" height="20" />
                </span>
                <h3 className="m-0 font-[family-name:var(--font-display)] text-[16.5px] leading-[1.3] font-bold tracking-[-0.3px] text-fg text-balance">
                  {modulo.titulo}
                </h3>
                <p className="m-0 text-[13.5px] leading-[1.6] text-fg-muted text-pretty">
                  {modulo.descripcion}
                </p>
              </Revelable>
            )
          })}

          <Revelable
            rol="listitem"
            retraso={MODULOS.length * 70}
            className="flex h-full flex-col justify-center gap-2.5 rounded-[16px] border border-dashed border-border-strong bg-surface-muted/50 p-5 sm:p-6"
          >
            <h3 className="m-0 text-[13.5px] font-bold text-fg">
              Qué no atendemos por ahora
            </h3>
            <p className="m-0 text-[13px] leading-[1.6] text-fg-muted text-pretty">
              No ofrecemos soporte técnico para teléfonos celulares ni tablets.
              Consúltenos por cualquiera de los servicios de esta lista.
            </p>
          </Revelable>
        </div>
      </div>
    </section>
  )
}
