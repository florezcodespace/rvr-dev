import { Outlet } from 'react-router-dom'
import { PaletaBusqueda, usePaletaBusqueda } from '@features/busqueda'
import { BarraInferior } from './components/BarraInferior'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'
import { useSidebar } from './useSidebar'

/**
 * Shell de las vistas privadas. Tres cortes de navegación:
 *   xl (1280+)  panel completo, plegable a 76 px y recordado entre sesiones
 *   md–xl       panel plegado (no cabe el completo)
 *   < md        barra inferior de cuatro destinos
 */
export function DashboardLayout() {
  const sidebar = useSidebar()
  const paleta = usePaletaBusqueda()

  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <Sidebar
        className="hidden md:flex"
        colapsado={sidebar.colapsado}
        puedeAlternar={sidebar.puedeAlternar}
        onAlternar={sidebar.alternar}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onBuscar={paleta.abrir} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
        <BarraInferior />
      </div>

      <PaletaBusqueda abierta={paleta.abierta} onCerrar={paleta.cerrar} />
    </div>
  )
}
