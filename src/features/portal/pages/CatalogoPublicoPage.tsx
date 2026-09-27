import { Link } from 'react-router-dom'
import { useAuth } from '@features/auth'
import { ROUTES } from '@app/routes/paths'
import { IconoMarca } from '@shared/components/marca/IconoMarca'
import { Button } from '@shared/components/ui'
import { BarraSolicitud } from '../components/BarraSolicitud'
import { CatalogoServicios } from '../components/CatalogoServicios'

/**
 * HU_21 · Catálogo público: sin iniciar sesión (CA_21_01). Se pueden elegir
 * servicios; para enviar la solicitud se pide registrarse o ingresar (CA_21_04).
 * Se ve bien en celular y escritorio (CA_21_05).
 */
export default function CatalogoPublicoPage() {
  const { usuario } = useAuth()
  const esCliente = usuario?.tipo === 'cliente'

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="superficie-superior sticky top-0 z-30 border-b border-border-base">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center gap-3 px-4 sm:px-6">
          <Link to={ROUTES.inicio} className="flex items-center gap-2.5">
            <IconoMarca tamano={34} radio="27%" alt="" />
            <span className="hidden leading-tight sm:block">
              <span className="block text-[14px] font-bold text-fg">RvR Tecnologías</span>
              <span className="block text-[10.5px] text-fg-subtle">Soluciones a su alcance</span>
            </span>
          </Link>
          <nav className="ml-auto flex items-center gap-2">
            <Link to={ROUTES.inicio} className="hidden rounded-[9px] px-3 py-2 text-[13px] font-semibold text-fg-muted hover:bg-surface-muted sm:block">Inicio</Link>
            {usuario ? (
              <Link to={esCliente ? ROUTES.portal : ROUTES.panel}><Button size="sm">{esCliente ? 'Mi portal' : 'Ir al panel'}</Button></Link>
            ) : (
              <>
                <Link to={ROUTES.login}><Button size="sm" variant="secondary">Iniciar sesión</Button></Link>
                <Link to={ROUTES.registro}><Button size="sm">Registrarme</Button></Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="mb-6">
          <div className="mb-2 text-[11px] font-semibold tracking-[0.1em] text-primary-on-soft uppercase">Catálogo de servicios</div>
          <h1 className="m-0 text-[30px] leading-tight font-bold tracking-[-0.8px] text-fg">¿Qué necesita su empresa o su hogar?</h1>
          <p className="m-0 mt-2 max-w-[640px] text-[14px] text-fg-muted">
            Elija los servicios, cuéntenos el problema y le enviamos la cotización a su portal. Los precios son de referencia: el valor final va en la cotización.
          </p>
        </div>
        <CatalogoServicios />
        <BarraSolicitud destino={esCliente ? ROUTES.portalSolicitar : ROUTES.login} texto={esCliente ? 'Continuar con la solicitud' : 'Ingresar para enviar'} />
        {!usuario && (
          <p className="mt-6 text-center text-[13px] text-fg-muted">
            ¿Aún no tiene cuenta? <Link to={ROUTES.registro} className="font-semibold text-link underline underline-offset-2">Regístrese</Link>: lo que elija aquí se conserva.
          </p>
        )}
      </main>
    </div>
  )
}
