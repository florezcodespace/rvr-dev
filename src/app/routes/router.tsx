import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '@app/layouts/DashboardLayout'
import { LoginPage } from '@features/auth'
import { DashboardPage } from '@features/dashboard'
import { ClientesPage } from '@features/clientes'
import { ConfiguracionPage } from '@features/configuracion'
import { CotizacionesPage } from '@features/cotizaciones'
import { NuevaOrdenPage, OrdenesPage } from '@features/ordenes'
import { PagosPage } from '@features/pagos'
import { ReportesPage } from '@features/reportes'
import { ServiciosPage } from '@features/servicios'
import { TecnicosPage } from '@features/tecnicos'
import { UsuariosPage } from '@features/usuarios'
import { NotFoundPage } from './NotFoundPage'
import { ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { ROUTES } from './paths'

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [{ path: ROUTES.login, element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          { path: ROUTES.dashboard, element: <DashboardPage /> },
          { path: ROUTES.ordenes, element: <OrdenesPage /> },
          { path: ROUTES.ordenNueva, element: <NuevaOrdenPage /> },
          { path: ROUTES.cotizaciones, element: <CotizacionesPage /> },
          { path: ROUTES.clientes, element: <ClientesPage /> },
          { path: ROUTES.pagos, element: <PagosPage /> },
          { path: ROUTES.tecnicos, element: <TecnicosPage /> },
          { path: ROUTES.servicios, element: <ServiciosPage /> },
          { path: ROUTES.usuarios, element: <UsuariosPage /> },
          { path: ROUTES.reportes, element: <ReportesPage /> },
          { path: ROUTES.configuracion, element: <ConfiguracionPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
