import { Outlet } from 'react-router-dom'
import { Sidebar } from './components/Sidebar'
import { Topbar } from './components/Topbar'

/** Shell de las vistas privadas: sidebar fijo + topbar + contenido. */
export function DashboardLayout() {
  return (
    <div className="flex h-dvh overflow-hidden bg-bg text-fg">
      <Sidebar className="hidden lg:flex" />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
