import { useMemo, useState } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { ROUTES } from '@app/routes/paths'
import { ESTADO_ORDEN_META } from '@shared/domain/estadoOrden'
import { Alert, Button, Spinner } from '@shared/components/ui'
import { formatearMoneda, tiempoRelativo } from '@shared/lib/format'
import { ordenesService } from '../api'
import { AgendaTecnico } from '../components/AgendaTecnico'
import { BadgeEstado } from '../components/BadgeEstado'
import { CampoFormulario, CLASES_CONTROL } from '../components/CampoFormulario'
import { ResumenOrden } from '../components/ResumenOrden'
import { SeccionFormulario } from '../components/SeccionFormulario'
import { Selector } from '../components/Selector'
import { useBorradorOrden } from '../hooks/useBorradorOrden'
import { useAgendaTecnico, useCatalogosOrden } from '../hooks/useCatalogosOrden'
import {
  ESTADOS_INICIALES,
  MAX_DIAGNOSTICO,
  MAX_OBSERVACIONES,
  crearNuevaOrdenSchema,
  type NuevaOrdenFormValues,
} from '../schemas/ordenSchema'

const VALORES_INICIALES: NuevaOrdenFormValues = {
  clienteId: 0,
  servicioId: 0,
  tecnicoId: null,
  cotizacionId: null,
  fechaProgramada: '',
  estadoInicial: 'nueva',
  diagnostico: '',
  observaciones: '',
}

function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

const AHORA = new Intl.DateTimeFormat('es-CO', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export default function NuevaOrdenPage() {
  const navigate = useNavigate()
  const catalogos = useCatalogosOrden()
  const [enviando, setEnviando] = useState(false)
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null)
  const [fechaSolicitud] = useState(() => new Date())

  const borradorPrevio = useMemo(
    () => ({ ...VALORES_INICIALES, ...(leerBorrador() ?? {}) }),
    [],
  )

  // El esquema depende del catálogo: no se puede dejar programada una orden
  // con un técnico que hoy está fuera de servicio.
  const esquema = useMemo(
    () =>
      crearNuevaOrdenSchema(
        (catalogos?.tecnicos ?? []).filter((t) => !t.disponible).map((t) => t.id),
      ),
    [catalogos],
  )

  const {
    control,
    handleSubmit,
    register,
    setValue,
    formState: { errors, isDirty },
  } = useForm<NuevaOrdenFormValues>({
    resolver: zodResolver(esquema),
    mode: 'onBlur',
    defaultValues: borradorPrevio,
  })

  const valores = useWatch({ control }) as NuevaOrdenFormValues
  // Solo se guarda borrador si el usuario alcanzó a escribir algo.
  const { guardadoEn, limpiar } = useBorradorOrden(valores, isDirty && !enviando)

  const cliente = catalogos?.clientes.find((c) => c.id === Number(valores.clienteId))
  const servicio = catalogos?.servicios.find((s) => s.id === Number(valores.servicioId))
  const tecnico = catalogos?.tecnicos.find((t) => t.id === Number(valores.tecnicoId))
  const cotizacion = catalogos?.cotizaciones.find(
    (c) => c.id === Number(valores.cotizacionId),
  )

  const agenda = useAgendaTecnico(
    tecnico?.id ?? null,
    valores.fechaProgramada?.slice(0, 10) || '',
  )

  const cotizacionesCliente = (catalogos?.cotizaciones ?? []).filter(
    (c) => !cliente || c.clienteId === cliente.id,
  )

  const enviar = handleSubmit(async (datos) => {
    setEnviando(true)
    setErrorEnvio(null)
    try {
      const creada = await ordenesService.crear({
        clienteId: Number(datos.clienteId),
        servicioId: Number(datos.servicioId),
        tecnicoId: datos.tecnicoId === null ? null : Number(datos.tecnicoId),
        cotizacionId: datos.cotizacionId === null ? null : Number(datos.cotizacionId),
        fechaProgramada: datos.fechaProgramada,
        estadoInicial: datos.estadoInicial,
        diagnostico: datos.diagnostico,
        observaciones: datos.observaciones,
      })
      limpiar()
      navigate(`${ROUTES.ordenes}?q=${creada.codigo}`)
    } catch {
      setErrorEnvio('No pudimos crear la orden. Revisa la conexión e inténtalo de nuevo.')
      setEnviando(false)
    }
  })

  if (!catalogos) {
    return (
      <div className="flex h-full items-center justify-center text-fg-subtle">
        <Spinner className="size-6" />
      </div>
    )
  }

  return (
    <form onSubmit={enviar} noValidate className="flex min-h-full flex-col">
      <div className="flex flex-1 flex-col gap-[18px] px-7 pt-6">
        <div>
          <h1 className="m-0 mb-[5px] text-[23px] font-bold tracking-[-0.6px] text-fg">
            Nueva orden de servicio
          </h1>
          <p className="m-0 text-[13px] text-fg-muted">
            Registra la solicitud del cliente y asigna el técnico responsable. Los campos
            con <span className="text-danger">*</span> son obligatorios.
          </p>
        </div>

        {errorEnvio && <Alert tone="danger" title={errorEnvio} />}

        <div className="grid flex-1 grid-cols-1 gap-[18px] xl:grid-cols-[1fr_322px]">
          <div className="flex flex-col gap-3.5">
            <SeccionFormulario numero={1} titulo="Cliente y servicio">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                <CampoFormulario
                  label="Cliente"
                  obligatorio
                  error={errors.clienteId?.message}
                  ayuda={
                    cliente
                      ? `${cliente.documento} · ${cliente.ciudad} · contacto: ${cliente.contacto}`
                      : 'Selecciona el cliente que reporta la solicitud'
                  }
                >
                  {({ id, describedBy }) => (
                    <Controller
                      control={control}
                      name="clienteId"
                      render={({ field }) => (
                        <Selector
                          id={id}
                          describedBy={describedBy}
                          invalido={Boolean(errors.clienteId)}
                          placeholder="Selecciona un cliente"
                          valor={field.value || null}
                          onChange={(valor) => {
                            field.onChange(valor ?? 0)
                            setValue('cotizacionId', null)
                          }}
                          opciones={catalogos.clientes.map((c) => ({
                            id: c.id,
                            etiqueta: c.nombre,
                            avatar: iniciales(c.nombre),
                          }))}
                        />
                      )}
                    />
                  )}
                </CampoFormulario>

                <CampoFormulario
                  label="Servicio"
                  obligatorio
                  error={errors.servicioId?.message}
                  ayuda={
                    servicio
                      ? `Categoría: ${servicio.categoria} · duración estimada ${servicio.duracionHoras} h · garantía ${servicio.diasGarantia} días`
                      : 'Define el precio base y los días de garantía'
                  }
                >
                  {({ id, describedBy }) => (
                    <Controller
                      control={control}
                      name="servicioId"
                      render={({ field }) => (
                        <Selector
                          id={id}
                          describedBy={describedBy}
                          invalido={Boolean(errors.servicioId)}
                          placeholder="Selecciona un servicio"
                          valor={field.value || null}
                          onChange={(valor) => field.onChange(valor ?? 0)}
                          opciones={catalogos.servicios.map((s) => ({
                            id: s.id,
                            etiqueta: s.nombre,
                          }))}
                        />
                      )}
                    />
                  )}
                </CampoFormulario>

                <CampoFormulario
                  label="Técnico asignado"
                  error={errors.tecnicoId?.message}
                  ayuda="Disponibilidad tomada de horarios_tecnicos"
                >
                  {({ id, describedBy }) => (
                    <Controller
                      control={control}
                      name="tecnicoId"
                      render={({ field }) => (
                        <Selector
                          id={id}
                          describedBy={describedBy}
                          invalido={Boolean(errors.tecnicoId)}
                          limpiable
                          placeholder="Sin asignar"
                          valor={field.value}
                          onChange={field.onChange}
                          opciones={catalogos.tecnicos.map((t) => ({
                            id: t.id,
                            etiqueta: t.nombre,
                            avatar: iniciales(t.nombre),
                            trailing: (
                              <span
                                className={
                                  t.disponible
                                    ? 'rounded-[6px] bg-[var(--rvr-estado-completada-soft)] px-[7px] py-0.5 text-[10.5px] font-bold text-[var(--rvr-estado-completada-fg)]'
                                    : 'rounded-[6px] bg-[var(--rvr-estado-cancelada-soft)] px-[7px] py-0.5 text-[10.5px] font-bold text-[var(--rvr-estado-cancelada-fg)]'
                                }
                              >
                                {t.disponible ? '✓ DISPONIBLE' : '✕ NO DISPONIBLE'}
                              </span>
                            ),
                          }))}
                        />
                      )}
                    />
                  )}
                </CampoFormulario>

                <CampoFormulario
                  label="Cotización relacionada"
                  ayuda="Opcional · vincula los detalles de la cotización a la orden"
                >
                  {({ id, describedBy }) => (
                    <Controller
                      control={control}
                      name="cotizacionId"
                      render={({ field }) => (
                        <Selector
                          id={id}
                          describedBy={describedBy}
                          limpiable
                          placeholder={
                            cotizacionesCliente.length
                              ? 'Sin cotización'
                              : 'El cliente no tiene cotizaciones'
                          }
                          valor={field.value}
                          onChange={field.onChange}
                          opciones={cotizacionesCliente.map((c) => ({
                            id: c.id,
                            etiqueta: c.codigo,
                            secundario: `· ${formatearMoneda(c.valorTotal)} · ${
                              c.estado === 'aprobada' ? 'Aprobada' : 'Enviada'
                            }`,
                          }))}
                        />
                      )}
                    />
                  )}
                </CampoFormulario>
              </div>
            </SeccionFormulario>

            <SeccionFormulario numero={2} titulo="Programación y estado">
              <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                <CampoFormulario
                  label="Fecha de solicitud"
                  obligatorio
                  ayuda="Se registra automáticamente"
                >
                  {({ id }) => (
                    <div
                      id={id}
                      className="flex h-10 items-center rounded-[9px] border border-border-base bg-surface-muted px-3 text-[13px] text-fg-subtle"
                    >
                      {AHORA.format(fechaSolicitud).replace(',', ' ·')}
                    </div>
                  )}
                </CampoFormulario>

                <CampoFormulario
                  label="Fecha programada"
                  obligatorio
                  error={errors.fechaProgramada?.message}
                  ayuda="Debe ser posterior a la solicitud"
                >
                  {({ id, describedBy }) => (
                    <input
                      id={id}
                      aria-describedby={describedBy}
                      type="datetime-local"
                      className={`${CLASES_CONTROL} ${
                        errors.fechaProgramada ? 'border-[1.5px] border-danger' : ''
                      }`}
                      {...register('fechaProgramada')}
                    />
                  )}
                </CampoFormulario>

                <CampoFormulario
                  label="Estado inicial"
                  ayuda="Queda como primer registro de seguimiento"
                >
                  {({ id, describedBy }) => (
                    <Controller
                      control={control}
                      name="estadoInicial"
                      render={({ field }) => (
                        <Selector
                          id={id}
                          describedBy={describedBy}
                          placeholder="Estado"
                          valor={ESTADOS_INICIALES.indexOf(field.value) + 1}
                          onChange={(indice) =>
                            field.onChange(ESTADOS_INICIALES[(indice ?? 1) - 1])
                          }
                          opciones={ESTADOS_INICIALES.map((estado, i) => ({
                            id: i + 1,
                            etiqueta: ESTADO_ORDEN_META[estado].label,
                          }))}
                        />
                      )}
                    />
                  )}
                </CampoFormulario>
              </div>

              <div className="flex items-center gap-2 text-[11.5px] text-fg-subtle">
                Se creará como
                <BadgeEstado estado={valores.estadoInicial} />
              </div>
            </SeccionFormulario>

            <SeccionFormulario
              numero={3}
              titulo="Diagnóstico y observaciones"
              className="min-h-0 flex-1"
            >
              <div className="grid min-h-0 flex-1 grid-cols-1 gap-3.5 sm:grid-cols-2">
                <CampoFormulario
                  label="Diagnóstico inicial"
                  obligatorio
                  error={errors.diagnostico?.message}
                  ayuda={
                    <span className="flex justify-between gap-3">
                      <span>Descripción reportada por el cliente</span>
                      <span>
                        {valores.diagnostico?.length ?? 0} / {MAX_DIAGNOSTICO}
                      </span>
                    </span>
                  }
                  className="min-h-0"
                >
                  {({ id, describedBy }) => (
                    <textarea
                      id={id}
                      aria-describedby={describedBy}
                      maxLength={MAX_DIAGNOSTICO}
                      placeholder="Describe la falla reportada, desde cuándo ocurre y qué se ha intentado."
                      className={`min-h-24 flex-1 resize-none rounded-[9px] border bg-surface px-3 py-[11px] text-[12.5px] leading-[1.55] text-fg outline-none placeholder:text-fg-faint focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)] ${
                        errors.diagnostico
                          ? 'border-[1.5px] border-danger'
                          : 'border-border-strong'
                      }`}
                      {...register('diagnostico')}
                    />
                  )}
                </CampoFormulario>

                <CampoFormulario
                  label="Observaciones"
                  ayuda="Visible para el técnico en la app móvil"
                  className="min-h-0"
                >
                  {({ id, describedBy }) => (
                    <textarea
                      id={id}
                      aria-describedby={describedBy}
                      maxLength={MAX_OBSERVACIONES}
                      placeholder="Accesos, horarios de atención, restricciones del sitio…"
                      className="min-h-24 flex-1 resize-none rounded-[9px] border border-border-strong bg-surface px-3 py-[11px] text-[12.5px] leading-[1.55] text-fg outline-none placeholder:text-fg-faint focus:border-[var(--rvr-ring-border)] focus:shadow-[0_0_0_3px_var(--rvr-ring)]"
                      {...register('observaciones')}
                    />
                  )}
                </CampoFormulario>
              </div>
            </SeccionFormulario>
          </div>

          <div className="flex flex-col gap-3.5">
            <ResumenOrden
              codigo={catalogos.siguienteCodigo}
              cliente={cliente?.nombre}
              servicio={servicio?.nombre}
              tecnico={tecnico?.nombre}
              valor={cotizacion?.valorTotal ?? servicio?.precio ?? null}
            />
            <AgendaTecnico nombre={tecnico?.nombre} bloques={agenda} />
          </div>
        </div>
      </div>

      {/* La barra queda fija abajo: el formulario es más alto que la pantalla y las
          acciones deben estar siempre a la vista. */}
      <div className="sticky bottom-0 z-20 mt-4 flex flex-wrap items-center gap-3 border-t border-border-base bg-surface px-7 py-3.5">
        <span className="text-[12px] text-fg-subtle">
          {guardadoEn
            ? `Última edición ${tiempoRelativo(guardadoEn)} · borrador local`
            : 'El borrador se guarda solo en este equipo'}
        </span>

        <div className="ml-auto flex items-center gap-2.5">
          <Button
            variant="secondary"
            onClick={() => {
              limpiar()
              navigate(ROUTES.ordenes)
            }}
          >
            Cancelar
          </Button>
          <Button type="submit" size="lg" loading={enviando}>
            {enviando ? 'Creando…' : 'Crear orden'}
          </Button>
        </div>
      </div>
    </form>
  )
}

/** Lee el borrador antes de montar el formulario, para usarlo como defaultValues. */
function leerBorrador(): Partial<NuevaOrdenFormValues> | null {
  try {
    const crudo = window.localStorage.getItem('rvr.borrador-orden')
    if (!crudo) return null
    return (JSON.parse(crudo) as { valores: NuevaOrdenFormValues }).valores
  } catch {
    return null
  }
}
