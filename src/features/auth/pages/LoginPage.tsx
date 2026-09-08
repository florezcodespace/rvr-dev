import { ThemeToggle } from '@shared/components/theme/ThemeToggle'
import { Logo } from '@shared/components/ui'
import { BrandPanel } from '../components/BrandPanel'
import { DemoCredentials } from '../components/DemoCredentials'
import { LoginForm } from '../components/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh bg-bg text-fg">
      <BrandPanel />

      <main className="relative flex flex-1 items-center justify-center px-6 py-12 sm:px-12 lg:px-18">
        <ThemeToggle className="absolute top-6 right-6" />

        <div className="flex w-full max-w-[404px] flex-col gap-[26px]">
          {/* En móvil el panel de marca se oculta: el logo mantiene la identidad. */}
          <Logo className="lg:hidden" />

          <header>
            <div className="mb-2.5 text-[11px] font-semibold tracking-[0.1em] text-primary-on-soft uppercase">
              Gestión de acceso
            </div>
            <h2 className="m-0 mb-2 text-[27px] font-bold tracking-[-0.7px]">
              Iniciar sesión
            </h2>
            <p className="m-0 text-[13.5px] leading-[1.55] text-fg-muted">
              Ingresa con las credenciales asignadas por el administrador del portal.
            </p>
          </header>

          <LoginForm />

          <DemoCredentials />

          <p className="m-0 text-center text-[11px] text-fg-subtle">
            ¿Problemas para ingresar? Contacta al administrador ·{' '}
            <a href="mailto:soporte@rvrtec.co" className="text-link hover:underline">
              soporte@rvrtec.co
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
