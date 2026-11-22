import { ROUTES } from '@app/routes/paths'
import { BarraSolicitud } from '../components/BarraSolicitud'
import { CatalogoServicios } from '../components/CatalogoServicios'
import { EncabezadoPortal } from '../components/EncabezadoPortal'

/** HU_21 / HU_78 · Catálogo dentro del portal, para armar la solicitud. */
export default function PortalCatalogoPage() {
  return (
    <div className="flex flex-col gap-5">
      <EncabezadoPortal eyebrow="Catálogo" titulo="Servicios de RvR Tecnologías" descripcion="Agrega los servicios que necesitas y envía tu solicitud: te respondemos con la cotización." />
      <CatalogoServicios />
      <BarraSolicitud destino={ROUTES.portalSolicitar} texto="Revisar y enviar solicitud" />
    </div>
  )
}
