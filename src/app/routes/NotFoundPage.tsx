import { Link } from 'react-router-dom'
import { ROUTES } from './paths'

export function NotFoundPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-bg px-6 text-center">
      <p className="m-0 font-mono text-[12px] tracking-[0.1em] text-fg-faint uppercase">
        Error 404
      </p>
      <h1 className="m-0 text-[27px] font-bold tracking-[-0.7px] text-fg">
        Esta página no existe
      </h1>
      <p className="m-0 text-[13.5px] text-fg-muted">
        Verifica la dirección o vuelve al inicio del portal.
      </p>
      <Link
        to={ROUTES.dashboard}
        className="mt-2 text-[13px] font-semibold text-link hover:underline"
      >
        Ir al dashboard
      </Link>
    </div>
  )
}
