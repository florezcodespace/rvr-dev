import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ESTADOS_ORDEN,
  ESTADO_ORDEN_META,
  TRANSICIONES_ORDEN,
} from '@shared/domain/estadoOrden'
import { EstadoBadge } from '@shared/components/data'
import { Button, Card, CardHeader, PageHeader, Spinner } from '@shared/components/ui'
import { useToast } from '@shared/hooks/useToast'
import { cn } from '@shared/lib/cn'
import { configuracionService } from '../api'
import { CampoTexto, FilaToggle, Rejilla } from '../components/CamposConfig'
import {
  SECCIONES_CONFIG,
  SECCION_LABEL,
  type Configuracion,
  type SeccionConfig,
} from '../types'

export default function ConfiguracionPage() {
  const [params, setParams] = useSearchParams()
  const seccionUrl = params.get('s') as SeccionConfig | null
  const seccion: SeccionConfig =
    seccionUrl && SECCIONES_CONFIG.includes(seccionUrl) ? seccionUrl : 'general'

  const [original, setOriginal] = useState<Configuracion | null>(null)
  const [borrador, setBorrador] = useState<Configuracion | null>(null)
  const [guardando, setGuardando] = useState(false)
  const { mostrar } = useToast()

  useEffect(() => {
    let activo = true
    configuracionService.obtener().then((config) => {
      if (!activo) return
      setOriginal(config)
      setBorrador(structuredClone(config))
    })
    return () => {
      activo = false
    }
  }, [])

  const sucio =
    original !== null &&
    borrador !== null &&
    JSON.stringify(original) !== JSON.stringify(borrador)

  const guardar = useCallback(async () => {
    if (!borrador || !sucio) return
    setGuardando(true)
    try {
      await configuracionService.guardar(borrador)
      setOriginal(structuredClone(borrador))
      mostrar({ tono: 'exito', mensaje: 'Configuración guardada' })
    } catch {
      mostrar({ tono: 'error', mensaje: 'No pudimos guardar la configuración' })
    } finally {
      setGuardando(false)
    }
  }, [borrador, sucio, mostrar])

  // Ctrl/⌘ + S guarda sin ir hasta el botón.
  useEffect(() => {
    const onKeyDown = (evento: KeyboardEvent) => {
      if (evento.key.toLowerCase() === 's' && (evento.metaKey || evento.ctrlKey)) {
        evento.preventDefault()
        void guardar()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [guardar])

  if (!borrador) {
    return (
      <div className="flex h-full items-center justify-center text-fg-subtle">
        <Spinner className="size-6" />
      </div>
    )
  }

  /** Aplica un cambio sobre una sección del borrador. */
  function editar<K extends keyof Configuracion>(
    clave: K,
    cambios: Partial<Configuracion[K]>,
  ) {
    setBorrador((previo) =>
      previo ? { ...previo, [clave]: { ...previo[clave], ...cambios } } : previo,
    )
  }

  const irA = (destino: SeccionConfig) => {
    const nuevos = new URLSearchParams()
    if (destino !== 'general') nuevos.set('s', destino)
    setParams(nuevos, { replace: true })
  }

  return (
    <div className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-[18px] px-7 pt-6">
        <PageHeader
          titulo="Configuración"
          descripcion="Ajustes generales del portal · los cambios aplican a toda la organización"
        />

        <div className="grid grid-cols-1 gap-[18px] lg:grid-cols-[212px_1fr]">
          <nav aria-label="Secciones de configuración" className="flex flex-col gap-1">
            {SECCIONES_CONFIG.map((valor) => (
              <button
                key={valor}
                type="button"
                aria-current={valor === seccion ? 'page' : undefined}
                onClick={() => irA(valor)}
                className={cn(
                  'cursor-pointer rounded-[9px] px-3 py-[9px] text-left text-[12.5px] transition-colors',
                  valor === seccion
                    ? 'bg-primary-soft font-semibold text-primary-on-soft'
                    : 'font-medium text-fg-muted hover:bg-surface-muted hover:text-fg',
                )}
              >
                {SECCION_LABEL[valor]}
              </button>
            ))}
          </nav>

          <div className="flex flex-col gap-3.5">
            {seccion === 'general' && (
              <>
                <Card className="gap-4 px-5 py-[18px]">
                  <CardHeader
                    titulo="Datos de la empresa"
                    subtitulo="Aparecen en cotizaciones, órdenes impresas y correos al cliente"
                  />
                  <Rejilla>
                    <CampoTexto
                      etiqueta="Razón social"
                      valor={borrador.empresa.razonSocial}
                      onChange={(razonSocial) => editar('empresa', { razonSocial })}
                    />
                    <CampoTexto
                      etiqueta="NIT"
                      valor={borrador.empresa.nit}
                      onChange={(nit) => editar('empresa', { nit })}
                    />
                    <CampoTexto
                      etiqueta="Correo de contacto"
                      tipo="email"
                      valor={borrador.empresa.correo}
                      onChange={(correo) => editar('empresa', { correo })}
                      ayuda="Se usa como remitente de las notificaciones al cliente."
                    />
                    <CampoTexto
                      etiqueta="Teléfono"
                      valor={borrador.empresa.telefono}
                      onChange={(telefono) => editar('empresa', { telefono })}
                    />
                    <CampoTexto
                      etiqueta="Dirección"
                      valor={borrador.empresa.direccion}
                      onChange={(direccion) => editar('empresa', { direccion })}
                    />
                    <CampoTexto
                      etiqueta="Zona horaria"
                      valor={borrador.empresa.zonaHoraria}
                      onChange={(zonaHoraria) => editar('empresa', { zonaHoraria })}
                    />
                  </Rejilla>
                </Card>

                <Card className="gap-3 px-5 py-[18px]">
                  <CardHeader
                    titulo="Operación de órdenes"
                    subtitulo="Reglas que se aplican al crear y asignar una orden de servicio"
                  />
                  <div>
                    <FilaToggle
                      titulo="Asignar técnico automáticamente"
                      descripcion="El sistema propone el técnico disponible más cercano a la dirección del cliente."
                      activo={borrador.operacion.asignacionAutomatica}
                      onChange={(asignacionAutomatica) =>
                        editar('operacion', { asignacionAutomatica })
                      }
                    />
                    <FilaToggle
                      titulo="Exigir cotización aprobada antes de programar"
                      descripcion="Una orden no pasa a Programada hasta que el cliente apruebe el valor."
                      activo={borrador.operacion.exigirCotizacionAprobada}
                      onChange={(exigirCotizacionAprobada) =>
                        editar('operacion', { exigirCotizacionAprobada })
                      }
                    />
                    <FilaToggle
                      titulo="Permitir reprogramar sin aprobación"
                      descripcion="Los coordinadores pueden mover la fecha de una visita sin pasar por revisión."
                      activo={borrador.operacion.reprogramarSinAprobacion}
                      onChange={(reprogramarSinAprobacion) =>
                        editar('operacion', { reprogramarSinAprobacion })
                      }
                    />
                    <FilaToggle
                      titulo="Cerrar la orden al registrar el pago"
                      descripcion="La orden pasa a Completada cuando el pago queda conciliado."
                      activo={borrador.operacion.cerrarAlPagar}
                      onChange={(cerrarAlPagar) => editar('operacion', { cerrarAlPagar })}
                    />
                  </div>
                </Card>

                <Card className="gap-4 px-5 py-[18px]">
                  <CardHeader
                    titulo="Numeración"
                    subtitulo="Formato de los consecutivos que ve el cliente"
                  />
                  <Rejilla columnas={3}>
                    <CampoTexto
                      etiqueta="Prefijo de órdenes"
                      valor={borrador.numeracion.prefijoOrden}
                      onChange={(prefijoOrden) => editar('numeracion', { prefijoOrden })}
                    />
                    <CampoTexto
                      etiqueta="Prefijo de cotizaciones"
                      valor={borrador.numeracion.prefijoCotizacion}
                      onChange={(prefijoCotizacion) =>
                        editar('numeracion', { prefijoCotizacion })
                      }
                    />
                    <CampoTexto
                      etiqueta="Próximo consecutivo"
                      valor={borrador.numeracion.proximoConsecutivo}
                      onChange={(proximoConsecutivo) =>
                        editar('numeracion', { proximoConsecutivo })
                      }
                      ayuda="Cambiar el prefijo no modifica las órdenes ya creadas."
                    />
                  </Rejilla>
                </Card>
              </>
            )}

            {seccion === 'marca' && (
              <Card className="gap-4 px-5 py-[18px]">
                <CardHeader
                  titulo="Marca y apariencia"
                  subtitulo="Cómo se ve el portal y los correos que salen a nombre de RvR"
                />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[12px] font-semibold text-fg">
                    Tema por defecto para nuevos usuarios
                  </span>
                  <div className="flex gap-1">
                    {(['system', 'light', 'dark'] as const).map((tema) => (
                      <button
                        key={tema}
                        type="button"
                        onClick={() => editar('marca', { temaPorDefecto: tema })}
                        className={cn(
                          'cursor-pointer rounded-[8px] px-3 py-2 text-[12.5px] font-semibold transition-colors',
                          borrador.marca.temaPorDefecto === tema
                            ? 'bg-primary-soft text-primary-on-soft'
                            : 'text-fg-muted hover:bg-surface-muted',
                        )}
                      >
                        {tema === 'system' ? 'Según el sistema' : tema === 'light' ? 'Claro' : 'Oscuro'}
                      </button>
                    ))}
                  </div>
                </div>
                <FilaToggle
                  titulo="Mostrar el logo en los correos"
                  descripcion="Encabeza las notificaciones que recibe el cliente."
                  activo={borrador.marca.mostrarLogoEnCorreos}
                  onChange={(mostrarLogoEnCorreos) =>
                    editar('marca', { mostrarLogoEnCorreos })
                  }
                />
                <CampoTexto
                  etiqueta="Pie de página de los correos"
                  valor={borrador.marca.piePersonalizado}
                  onChange={(piePersonalizado) => editar('marca', { piePersonalizado })}
                />
              </Card>
            )}

            {seccion === 'estados' && (
              <Card className="gap-4 px-5 py-[18px]">
                <CardHeader
                  titulo="Estados de órdenes"
                  subtitulo="Flujo que habilita el cambio de estado desde el listado: cada estado solo ofrece estos destinos"
                />
                <ul className="flex list-none flex-col gap-2.5 p-0">
                  {ESTADOS_ORDEN.map((estado) => (
                    <li
                      key={estado}
                      className="flex flex-wrap items-center gap-2 border-t border-border-base pt-2.5 first:border-t-0 first:pt-0"
                    >
                      <span className="w-[150px] flex-none">
                        <EstadoBadge meta={ESTADO_ORDEN_META[estado]} />
                      </span>
                      <span aria-hidden="true" className="text-fg-faint">
                        →
                      </span>
                      {TRANSICIONES_ORDEN[estado].length === 0 ? (
                        <span className="text-[12px] text-fg-subtle italic">
                          Estado final: no admite más cambios
                        </span>
                      ) : (
                        <span className="flex flex-wrap gap-1.5">
                          {TRANSICIONES_ORDEN[estado].map((destino) => (
                            <EstadoBadge key={destino} meta={ESTADO_ORDEN_META[destino]} />
                          ))}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            {seccion === 'sla' && (
              <Card className="gap-4 px-5 py-[18px]">
                <CardHeader
                  titulo="SLA y tiempos"
                  subtitulo="Metas de atención que alimentan los indicadores del dashboard"
                />
                <Rejilla columnas={3}>
                  <CampoTexto
                    etiqueta="Respuesta máxima (horas)"
                    tipo="number"
                    valor={borrador.sla.respuestaHoras}
                    onChange={(v) => editar('sla', { respuestaHoras: Number(v) })}
                  />
                  <CampoTexto
                    etiqueta="Cierre máximo (días)"
                    tipo="number"
                    valor={borrador.sla.cierreDias}
                    onChange={(v) => editar('sla', { cierreDias: Number(v) })}
                  />
                  <CampoTexto
                    etiqueta="Alerta sin asignar (horas)"
                    tipo="number"
                    valor={borrador.sla.alertaSinAsignarHoras}
                    onChange={(v) => editar('sla', { alertaSinAsignarHoras: Number(v) })}
                    ayuda="Las órdenes que superen este tiempo se marcan en el dashboard."
                  />
                </Rejilla>
              </Card>
            )}

            {seccion === 'notificaciones' && (
              <Card className="gap-3 px-5 py-[18px]">
                <CardHeader
                  titulo="Notificaciones"
                  subtitulo="Qué se envía automáticamente y a quién"
                />
                <div>
                  <FilaToggle
                    titulo="Avisar al cliente en cada cambio de estado"
                    descripcion="Correo con el estado nuevo de su orden y la fecha programada."
                    activo={borrador.notificaciones.correoCliente}
                    onChange={(correoCliente) =>
                      editar('notificaciones', { correoCliente })
                    }
                  />
                  <FilaToggle
                    titulo="Avisar al técnico cuando se le asigna una orden"
                    descripcion="Incluye dirección, contacto y diagnóstico inicial."
                    activo={borrador.notificaciones.correoTecnico}
                    onChange={(correoTecnico) =>
                      editar('notificaciones', { correoTecnico })
                    }
                  />
                  <FilaToggle
                    titulo="Resumen diario a coordinación"
                    descripcion="Órdenes del día, pendientes por asignar y pagos por conciliar."
                    activo={borrador.notificaciones.resumenDiario}
                    onChange={(resumenDiario) =>
                      editar('notificaciones', { resumenDiario })
                    }
                  />
                  <FilaToggle
                    titulo="Alertar cotizaciones por vencer"
                    descripcion="Aviso cinco días antes de que la oferta pierda vigencia."
                    activo={borrador.notificaciones.alertaVencimiento}
                    onChange={(alertaVencimiento) =>
                      editar('notificaciones', { alertaVencimiento })
                    }
                  />
                </div>
              </Card>
            )}

            {seccion === 'facturacion' && (
              <Card className="gap-4 px-5 py-[18px]">
                <CardHeader
                  titulo="Facturación"
                  subtitulo="Valores por defecto al cotizar y registrar pagos"
                />
                <Rejilla columnas={3}>
                  <CampoTexto
                    etiqueta="IVA (%)"
                    tipo="number"
                    valor={borrador.facturacion.iva}
                    onChange={(v) => editar('facturacion', { iva: Number(v) })}
                  />
                  <CampoTexto
                    etiqueta="Moneda"
                    valor={borrador.facturacion.moneda}
                    onChange={(moneda) => editar('facturacion', { moneda })}
                  />
                  <CampoTexto
                    etiqueta="Anticipo sugerido (%)"
                    tipo="number"
                    valor={borrador.facturacion.anticipoPorcentaje}
                    onChange={(v) =>
                      editar('facturacion', { anticipoPorcentaje: Number(v) })
                    }
                    ayuda="Se propone al registrar el primer pago de una orden."
                  />
                </Rejilla>
              </Card>
            )}

            {seccion === 'integraciones' && (
              <Card className="gap-3 px-5 py-[18px]">
                <CardHeader
                  titulo="Integraciones"
                  subtitulo="Servicios externos conectados al portal"
                />
                <div>
                  <FilaToggle
                    titulo="WhatsApp Business"
                    descripcion="Recibe solicitudes del canal de WhatsApp y las convierte en órdenes."
                    activo={borrador.integraciones.whatsapp}
                    onChange={(whatsapp) => editar('integraciones', { whatsapp })}
                  />
                  <FilaToggle
                    titulo="Correo saliente propio (SMTP)"
                    descripcion="Envía las notificaciones desde el dominio de la empresa."
                    activo={borrador.integraciones.correoSaliente}
                    onChange={(correoSaliente) =>
                      editar('integraciones', { correoSaliente })
                    }
                  />
                  <FilaToggle
                    titulo="Software contable"
                    descripcion="Exporta los pagos conciliados al cierre de cada mes."
                    activo={borrador.integraciones.contabilidad}
                    onChange={(contabilidad) => editar('integraciones', { contabilidad })}
                  />
                </div>
              </Card>
            )}

            {seccion === 'seguridad' && (
              <Card className="gap-4 px-5 py-[18px]">
                <CardHeader
                  titulo="Seguridad"
                  subtitulo="Reglas de acceso al portal · quedan registradas en log_accesos"
                />
                <FilaToggle
                  titulo="Exigir doble factor a los administradores"
                  descripcion="Código de un solo uso además de la contraseña."
                  activo={borrador.seguridad.dobleFactor}
                  onChange={(dobleFactor) => editar('seguridad', { dobleFactor })}
                />
                <Rejilla>
                  <CampoTexto
                    etiqueta="Expiración de sesión (horas)"
                    tipo="number"
                    valor={borrador.seguridad.expiracionSesionHoras}
                    onChange={(v) =>
                      editar('seguridad', { expiracionSesionHoras: Number(v) })
                    }
                  />
                  <CampoTexto
                    etiqueta="Intentos antes del bloqueo"
                    tipo="number"
                    valor={borrador.seguridad.intentosMaximos}
                    onChange={(v) => editar('seguridad', { intentosMaximos: Number(v) })}
                    ayuda="El login bloquea temporalmente la cuenta al superarlos."
                  />
                </Rejilla>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* La barra aparece solo cuando hay cambios: no ocupa espacio ni invita a
          guardar algo que nadie tocó. */}
      {sucio && (
        <div className="sticky bottom-0 z-20 mt-4 flex flex-wrap items-center gap-3 border-t border-border-base bg-surface px-7 py-3.5">
          <span className="text-[12px] text-fg-muted">
            Tienes cambios sin guardar en {SECCION_LABEL[seccion]}
          </span>
          <div className="ml-auto flex items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={() => setBorrador(original ? structuredClone(original) : null)}
            >
              Descartar
            </Button>
            <Button onClick={() => void guardar()} loading={guardando}>
              Guardar cambios
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
