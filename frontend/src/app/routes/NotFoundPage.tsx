import { Link } from 'react-router-dom'
import { ROUTES } from './paths'

/**
 * Error 404. [Diseño] Con la foto del valle y las salidas reales (inicio,
 * portal, catálogo): una página perdida también es parte de la marca.
 */
export function NotFoundPage() {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col justify-center gap-4 px-6 py-16 sm:px-12">
        <p className="m-0 text-[13px] font-medium text-fg-subtle">Error 404</p>
        <h1 className="m-0 max-w-[14ch] font-[family-name:var(--font-display)] text-[44px] leading-[1.05] font-light tracking-[-0.022em] text-fg">
          Esta página no existe
        </h1>
        <p className="m-0 max-w-[46ch] text-[15px] text-fg-muted">
          Puede que el enlace esté incompleto o que la página haya cambiado de lugar.
          Desde aquí puede volver a lo que buscaba.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-3">
          <Link
            to={ROUTES.inicio}
            className="inline-flex h-11 items-center rounded-[10px] bg-primary px-5 text-[14px] font-medium text-on-primary transition-colors hover:bg-primary-hover"
          >
            Ir al inicio
          </Link>
          <Link to={ROUTES.login} className="text-[14px] font-medium text-link underline-offset-4 hover:underline">
            Ingresar al portal
          </Link>
          <Link to={ROUTES.catalogo} className="text-[14px] font-medium text-link underline-offset-4 hover:underline">
            Ver el catálogo
          </Link>
        </div>
      </div>
      <figure className="relative m-0 hidden lg:block">
        <img
          src="/landing/rvr-metrocable.webp"
          alt="Cabinas del Metrocable sobre las casas de la Comuna 1 de Medellín"
          className="absolute inset-0 size-full object-cover"
          width={1280}
          height={852}
        />
        <figcaption className="absolute right-3 bottom-2 rounded-[4px] bg-ink/80 px-2 py-0.5 text-[12px] text-[#c9d3dd]">
          Medellín · foto: JoranL, CC BY-SA 4.0
        </figcaption>
      </figure>
    </div>
  )
}
