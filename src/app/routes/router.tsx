import { Suspense, type ReactNode } from 'react'
import { createBrowserRouter } from 'react-router-dom'
import { DashboardLayout } from '@app/layouts/DashboardLayout'
import { PortalLayout } from '@app/layouts/PortalLayout'
import { LoginPage, RecuperarPage, RegistroPage, RestablecerPage } from '@features/auth'
import { NotFoundPage } from './NotFoundPage'
import { ConPermiso, ProtectedRoute } from './ProtectedRoute'
import { PublicOnlyRoute } from './PublicOnlyRoute'
import { ROUTES } from './paths'
import { CargandoPagina } from './CargandoPagina'

import {
  LandingPage,
  AgendaPage,
  ClienteDetallePage,
  ClientesPage,
  CotizacionDetallePage,
  CotizacionesPage,
  CotizacionFormPage,
  HorariosPage,
  NuevaOrdenPage,
  OrdenDetallePage,
  OrdenesPage,
  PerfilPage,
  PermisoDetallePage,
  PermisosPage,
  CatalogoPublicoPage,
  MiCotizacionPage,
  MiOrdenPage,
  MiPerfilPage,
  MisCotizacionesPage,
  MisOrdenesPage,
  PortalCatalogoPage,
  PortalInicioPage,
  SolicitarPage,
  RolDetallePage,
  RolesPage,
  RolFormPage,
  ServicioDetallePage,
  ServiciosPage,
  EstadisticasPage,
  IndicadoresPage,
  ReportesPage,
  TecnicoDetallePage,
  TecnicosPage,
  AccesosPage,
  UsuarioDetallePage,
  UsuariosPage,
  AbonosPage,
  VentaDetallePage,
  VentasPage,
} from './paginas'

/** Cada pantalla exige alguno de los permisos de su caso de uso (RNF-021). */
const p = (permisos: string[], el: ReactNode) => <ConPermiso permisos={permisos}>{s(el)}</ConPermiso>
const s = (el: ReactNode) => <Suspense fallback={<CargandoPagina />}>{el}</Suspense>

export const router = createBrowserRouter([
  // ------------------------------------------------------------ público
  {
    path: ROUTES.inicio,
    element: (
      <Suspense fallback={null}>
        <LandingPage />
      </Suspense>
    ),
  },
  { path: ROUTES.catalogo, element: s(<CatalogoPublicoPage />) },
  { path: ROUTES.restablecer, element: <RestablecerPage /> },
  {
    element: <PublicOnlyRoute />,
    children: [
      { path: ROUTES.login, element: <LoginPage /> },
      { path: ROUTES.registro, element: <RegistroPage /> },
      { path: ROUTES.recuperar, element: <RecuperarPage /> },
    ],
  },
  // ------------------------------------------------ portal administrativo
  {
    element: <ProtectedRoute tipo="administrativo" />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          // Dashboard
          {
            path: ROUTES.panel,
            element: p(['estadisticas.consultar'], <EstadisticasPage />),
          },
          {
            path: ROUTES.indicadores,
            element: p(['indicadores.servicios_ordenes', 'indicadores.mas_solicitados'], <IndicadoresPage />),
          },
          {
            path: ROUTES.reportes,
            element: p(['reportes.ordenes', 'reportes.tecnicos'], <ReportesPage />),
          },
          // Configuración
          {
            path: ROUTES.roles,
            element: p(['roles.listar', 'roles.buscar'], <RolesPage />),
          },
          {
            path: ROUTES.rolNuevo,
            element: p(['roles.registrar'], <RolFormPage />),
          },
          {
            path: `${ROUTES.roles}/:id`,
            element: p(['roles.ver_detalle'], <RolDetallePage />),
          },
          {
            path: `${ROUTES.roles}/:id/editar`,
            element: p(['roles.editar'], <RolFormPage />),
          },
          {
            path: ROUTES.permisos,
            element: p(['permisos.listar', 'permisos.buscar'], <PermisosPage />),
          },
          {
            path: `${ROUTES.permisos}/:id`,
            element: p(['permisos.ver_detalle'], <PermisoDetallePage />),
          },
          // Usuarios
          {
            path: ROUTES.usuarios,
            element: p(['usuarios.listar', 'usuarios.buscar'], <UsuariosPage />),
          },
          {
            path: `${ROUTES.usuarios}/:id`,
            element: p(['usuarios.ver_detalle'], <UsuarioDetallePage />),
          },
          {
            path: ROUTES.accesos,
            element: p(['accesos.consultar'], <AccesosPage />),
          },
          // Servicios
          {
            path: ROUTES.servicios,
            element: p(['servicios.listar', 'servicios.buscar'], <ServiciosPage />),
          },
          {
            path: `${ROUTES.servicios}/:id`,
            element: p(['servicios.ver_detalle'], <ServicioDetallePage />),
          },
          {
            path: ROUTES.tecnicos,
            element: p(['tecnicos.listar', 'tecnicos.buscar'], <TecnicosPage />),
          },
          {
            path: `${ROUTES.tecnicos}/:id`,
            element: p(['tecnicos.ver_detalle'], <TecnicoDetallePage />),
          },
          {
            path: ROUTES.horarios,
            element: p(['disponibilidad.consultar'], <HorariosPage />),
          },
          // Venta – Órdenes
          {
            path: ROUTES.clientes,
            element: p(['clientes.listar', 'clientes.buscar'], <ClientesPage />),
          },
          {
            path: `${ROUTES.clientes}/:id`,
            element: p(['clientes.ver_detalle'], <ClienteDetallePage />),
          },
          {
            path: ROUTES.cotizaciones,
            element: p(['cotizaciones.listar', 'cotizaciones.buscar'], <CotizacionesPage />),
          },
          {
            path: ROUTES.cotizacionNueva,
            element: p(['cotizaciones.registrar'], <CotizacionFormPage />),
          },
          {
            path: `${ROUTES.cotizaciones}/:id`,
            element: p(['cotizaciones.ver_detalle'], <CotizacionDetallePage />),
          },
          {
            path: `${ROUTES.cotizaciones}/:id/editar`,
            element: p(['cotizaciones.editar'], <CotizacionFormPage />),
          },
          {
            path: ROUTES.ordenes,
            element: p(['ordenes.listar', 'ordenes.buscar'], <OrdenesPage />),
          },
          {
            path: ROUTES.ordenNueva,
            element: p(['ordenes.registrar'], <NuevaOrdenPage />),
          },
          {
            path: `${ROUTES.ordenes}/:id`,
            element: p(['ordenes.ver_detalle'], <OrdenDetallePage />),
          },
          {
            path: ROUTES.agenda,
            element: p(['agenda.consultar'], <AgendaPage />),
          },
          {
            path: ROUTES.ventas,
            element: p(['ventas.consultar_estado'], <VentasPage />),
          },
          {
            path: `${ROUTES.ventas}/:id`,
            element: p(['ventas.consultar_estado'], <VentaDetallePage />),
          },
          {
            path: ROUTES.abonos,
            element: p(['abonos.listar'], <AbonosPage />),
          },
          // Autogestión
          { path: ROUTES.perfil, element: s(<PerfilPage />) },
        ],
      },
    ],
  },
  // ---------------------------------------------------- portal del cliente
  {
    element: <ProtectedRoute tipo="cliente" />,
    children: [
      {
        element: <PortalLayout />,
        children: [
          { path: ROUTES.portal, element: s(<PortalInicioPage />) },
          { path: ROUTES.portalCatalogo, element: s(<PortalCatalogoPage />) },
          {
            path: ROUTES.portalSolicitar,
            element: p(['portal.solicitar_servicios'], <SolicitarPage />),
          },
          {
            path: ROUTES.portalCotizaciones,
            element: p(['portal.consultar_cotizaciones'], <MisCotizacionesPage />),
          },
          {
            path: `${ROUTES.portalCotizaciones}/:id`,
            element: p(['portal.consultar_cotizaciones'], <MiCotizacionPage />),
          },
          {
            path: ROUTES.portalOrdenes,
            element: p(['portal.consultar_ordenes'], <MisOrdenesPage />),
          },
          {
            path: `${ROUTES.portalOrdenes}/:id`,
            element: p(['portal.consultar_ordenes'], <MiOrdenPage />),
          },
          {
            path: ROUTES.portalPerfil,
            element: p(['portal.consultar_perfil'], <MiPerfilPage />),
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
