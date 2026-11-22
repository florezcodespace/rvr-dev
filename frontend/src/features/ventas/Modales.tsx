import { useEffect, useState } from 'react'
import { z } from 'zod'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { Select } from '@shared/components/form/Campos'
import { armarPago, DatosDelPago, ElegirMetodo, PAGO_INICIAL, type DatosPago } from '@shared/components/pago'
import { Alert, Button, Input, Modal } from '@shared/components/ui'
import { useToast } from '@shared/hooks/useToast'
import { ErrorApi, mensajeDe } from '@shared/lib/api'
import { formatearMoneda } from '@shared/lib/format'
import { ventasService, type Venta } from './api'

/**
 * HU_55 · Registrar la venta de una orden. El total sale de las cotizaciones
 * aprobadas de la orden (CA_55_01) y el anticipo es el 50 %, ajustable (CA_55_03).
 */
export function ModalVenta({ abierto, orden, onCerrar, onHecho }: {
  abierto: boolean
  /** Orden fija (desde su detalle). Sin ella, se elige de las que no tienen venta. */
  orden?: { id: number; codigo: string; total: number }
  onCerrar: () => void
  onHecho: (ventaId: number) => void
}) {
  const { mostrar } = useToast()
  const [ordenes, setOrdenes] = useState<{ id: number; codigo: string; cliente: string | null; total: number }[]>([])
  useEffect(() => {
    if (abierto && !orden) ventasService.ordenesSinVenta().then(setOrdenes).catch(() => undefined)
  }, [abierto, orden])

  const esquema = z.object({
    ordenId: z.coerce.number({ error: 'Selecciona la orden' }).int().positive('Selecciona la orden'),
    montoAnticipo: z.string().trim().transform((v, ctx) => {
      if (!v) return null
      const n = Number(v)
      if (!(n >= 0)) {
        ctx.addIssue({ code: 'custom', message: 'Debe ser un número mayor o igual a cero' })
        return z.NEVER
      }
      return n
    }),
  })

  return (
    <FormularioModal
      key={`venta-${orden?.id ?? ordenes.length}`}
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Registrar venta"
      descripcion="Formaliza el valor acordado. La venta nace «pendiente de anticipo»."
      textoGuardar="Registrar venta"
      antes={orden && <Alert tone="info" title={`Orden ${orden.codigo}`} description={`Total aprobado: ${formatearMoneda(orden.total)} · anticipo sugerido (50 %): ${formatearMoneda(Math.round(orden.total / 2))}`} />}
      campos={[
        orden
          ? { nombre: 'ordenId', label: 'Orden', tipo: 'select', valorInicial: String(orden.id), opciones: [{ valor: String(orden.id), label: orden.codigo }], soloLectura: false }
          : {
              nombre: 'ordenId', label: 'Orden', tipo: 'select', obligatorio: true, ancho: 'completo',
              opciones: [{ valor: '', label: ordenes.length ? 'Selecciona…' : 'No hay órdenes sin venta' }, ...ordenes.map((o) => ({ valor: String(o.id), label: `${o.codigo} · ${o.cliente ?? ''} · ${formatearMoneda(o.total)}` }))],
            },
        { nombre: 'montoAnticipo', label: 'Anticipo (vacío = 50 %)', tipo: 'numero', placeholder: orden ? String(Math.round(orden.total / 2)) : '50 % del total', ayuda: 'Puedes ajustarlo; no puede superar el total.' },
      ]}
      schema={esquema}
      onGuardar={async (v) => {
        const r = await ventasService.registrar(v.ordenId, v.montoAnticipo)
        mostrar({ tono: 'exito', mensaje: `Venta registrada: anticipo de ${formatearMoneda(r.montoAnticipo)} pendiente` })
        onHecho(r.id)
      }}
    />
  )
}

/**
 * HU_58 · Registrar abono: monto, tipo (anticipo o saldo), método y referencia
 * (CA_58_01), sin superar el saldo (CA_58_02). La fecha la pone el sistema.
 * El método se elige como en una pasarela y pide sus datos (tarjeta, Nequi, PSE…).
 */
export function ModalAbono({ abierto, venta, onCerrar, onHecho }: {
  abierto: boolean
  /** Venta fija (desde la orden o la venta). Sin ella, se elige. */
  venta?: Pick<Venta, 'id' | 'saldo' | 'anticipoCubierto' | 'montoAnticipo' | 'abonado'> & { codigo: string }
  onCerrar: () => void
  onHecho: () => void
}) {
  const { mostrar } = useToast()
  const [ventas, setVentas] = useState<Venta[]>([])
  const [paso, setPaso] = useState<'metodo' | 'datos'>('metodo')
  const [ventaId, setVentaId] = useState('')
  const [monto, setMonto] = useState('')
  const [tipoAbono, setTipoAbono] = useState<'anticipo' | 'saldo'>('anticipo')
  const [pago, setPago] = useState<DatosPago>(PAGO_INICIAL)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!abierto) return
    if (!venta) ventasService.ventasConSaldo().then(setVentas).catch(() => undefined)
    // Cada vez que se abre arranca limpio, con lo sugerido para la venta
    setPaso('metodo')
    setVentaId(venta ? String(venta.id) : '')
    setMonto(venta ? String(venta.anticipoCubierto ? venta.saldo : Math.max(venta.montoAnticipo - venta.abonado, 0)) : '')
    setTipoAbono(venta && venta.anticipoCubierto ? 'saldo' : 'anticipo')
    setPago(PAGO_INICIAL)
    setErrores({})
    // Solo al abrir o cambiar de venta: «venta» llega como objeto nuevo en cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abierto, venta?.id])

  const elegida = venta ?? ventas.find((v) => String(v.id) === ventaId)

  const continuar = () => {
    const nuevos: Record<string, string> = {}
    if (!ventaId) nuevos.ventaId = 'Selecciona la venta'
    if (!(Number(monto) > 0)) nuevos.monto = 'Escribe el monto'
    else if (elegida && Number(monto) > elegida.saldo) nuevos.monto = `Máximo ${formatearMoneda(elegida.saldo)}`
    if (!pago.opcion) nuevos.metodo = 'Elige el método de pago'
    setErrores(nuevos)
    if (!Object.keys(nuevos).length) setPaso('datos')
  }

  const guardar = async () => {
    const pedido = armarPago(pago)
    setErrores(pedido.errores)
    if (Object.keys(pedido.errores).length || !pedido.metodoPago) return
    setGuardando(true)
    try {
      const r = await ventasService.registrarAbono({
        ventaId: Number(ventaId), monto: Number(monto), tipoAbono,
        metodoPago: pedido.metodoPago, referencia: pedido.referencia, detalle: pedido.detalle,
      })
      mostrar({
        tono: 'exito',
        mensaje: r.venta.estadoPago === 'pagada' ? 'Abono registrado: la venta quedó pagada' : r.ordenEnProceso ? 'Anticipo registrado: la orden pasó a «en proceso»' : 'Abono registrado',
      })
      onHecho()
      onCerrar()
    } catch (e) {
      if (e instanceof ErrorApi && Object.keys(e.campos).length) {
        setErrores({ ...e.campos, general: e.message })
      } else setErrores({ general: mensajeDe(e) })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} ancho="lg"
      titulo={paso === 'metodo' ? 'Registrar abono' : 'Datos del pago'}
      descripcion={paso === 'metodo' ? 'Al guardarlo se recalcula el saldo y el estado de pago de la venta.' : `${elegida ? `Orden ${'codigo' in elegida ? elegida.codigo : elegida.orden.codigo} · ` : ''}${tipoAbono === 'anticipo' ? 'Anticipo' : 'Saldo'} de ${formatearMoneda(Number(monto))}`}
      pie={paso === 'metodo'
        ? <><Button variant="secondary" onClick={onCerrar}>Cancelar</Button><Button onClick={continuar}>Continuar</Button></>
        : <><Button variant="secondary" onClick={() => setPaso('metodo')}>Atrás</Button><Button loading={guardando} onClick={() => void guardar()}>Registrar abono</Button></>}>
      {paso === 'metodo' ? (
        <div className="flex flex-col gap-5">
          {venta && <Alert tone="info" title={`Orden ${venta.codigo}`} description={`Saldo pendiente: ${formatearMoneda(venta.saldo)}${venta.anticipoCubierto ? '' : ` · anticipo por cubrir: ${formatearMoneda(Math.max(venta.montoAnticipo - venta.abonado, 0))}`}`} />}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {!venta && (
              <Select className="sm:col-span-3" label="Venta (orden)" value={ventaId} error={errores.ventaId} onChange={(e) => setVentaId(e.target.value)}>
                <option value="">{ventas.length ? 'Selecciona…' : 'No hay ventas con saldo'}</option>
                {ventas.map((v) => <option key={v.id} value={v.id}>{`${v.orden.codigo} · ${v.cliente?.nombre ?? ''} · saldo ${formatearMoneda(v.saldo)}`}</option>)}
              </Select>
            )}
            <Input label="Monto (COP)" inputMode="numeric" value={monto} error={errores.monto}
              onChange={(e) => setMonto(e.target.value.replace(/[^0-9]/g, ''))} hint={elegida ? `Saldo: ${formatearMoneda(elegida.saldo)}` : undefined} />
            <Select label="Tipo de abono" value={tipoAbono} onChange={(e) => setTipoAbono(e.target.value as 'anticipo' | 'saldo')}>
              <option value="anticipo">Anticipo</option>
              <option value="saldo">Saldo</option>
            </Select>
          </div>
          <ElegirMetodo valor={pago.opcion} onChange={(o) => setPago({ ...pago, opcion: o })} error={errores.metodo} />
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <DatosDelPago valor={pago} onChange={setPago} errores={errores} onCambiar={() => setPaso('metodo')} />
          {errores.general && <Alert tone="danger" title="No se registró" description={errores.general} />}
        </div>
      )}
    </Modal>
  )
}
