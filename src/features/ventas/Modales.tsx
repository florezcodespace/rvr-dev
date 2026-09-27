import { useEffect, useState } from 'react'
import { z } from 'zod'
import { FormularioModal } from '@shared/components/form/FormularioModal'
import { Alert } from '@shared/components/ui'
import { METODOS_PAGO } from '@shared/domain/estados'
import { useToast } from '@shared/hooks/useToast'
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
  useEffect(() => {
    if (abierto && !venta) ventasService.ventasConSaldo().then(setVentas).catch(() => undefined)
  }, [abierto, venta])

  const tipoSugerido = venta && !venta.anticipoCubierto ? 'anticipo' : 'saldo'
  const montoSugerido = venta ? (venta.anticipoCubierto ? venta.saldo : Math.max(venta.montoAnticipo - venta.abonado, 0)) : undefined

  const esquema = z.object({
    ventaId: z.coerce.number({ error: 'Selecciona la venta' }).int().positive('Selecciona la venta'),
    monto: z.coerce.number({ error: 'Escribe el monto' }).positive('El monto debe ser mayor que cero'),
    tipoAbono: z.enum(['anticipo', 'saldo'], { error: 'Selecciona el tipo' }),
    metodoPago: z.enum(METODOS_PAGO, { error: 'Selecciona el método de pago' }),
    referencia: z.string().trim().max(100).transform((v) => v || null),
  })

  return (
    <FormularioModal
      key={`abono-${venta?.id ?? ventas.length}`}
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Registrar abono"
      descripcion="Al guardarlo se recalcula el saldo y el estado de pago de la venta."
      textoGuardar="Registrar abono"
      antes={venta && <Alert tone="info" title={`Orden ${venta.codigo}`} description={`Saldo pendiente: ${formatearMoneda(venta.saldo)}${venta.anticipoCubierto ? '' : ` · anticipo por cubrir: ${formatearMoneda(Math.max(venta.montoAnticipo - venta.abonado, 0))}`}`} />}
      campos={[
        venta
          ? { nombre: 'ventaId', label: 'Venta', tipo: 'select', valorInicial: String(venta.id), opciones: [{ valor: String(venta.id), label: venta.codigo }] }
          : {
              nombre: 'ventaId', label: 'Venta (orden)', tipo: 'select', obligatorio: true, ancho: 'completo',
              opciones: [{ valor: '', label: ventas.length ? 'Selecciona…' : 'No hay ventas con saldo' }, ...ventas.map((v) => ({ valor: String(v.id), label: `${v.orden.codigo} · ${v.cliente?.nombre ?? ''} · saldo ${formatearMoneda(v.saldo)}` }))],
            },
        { nombre: 'monto', label: 'Monto', tipo: 'numero', obligatorio: true, valorInicial: montoSugerido ? String(montoSugerido) : '' },
        { nombre: 'tipoAbono', label: 'Tipo de abono', tipo: 'select', obligatorio: true, valorInicial: tipoSugerido ?? 'anticipo', opciones: [{ valor: 'anticipo', label: 'Anticipo' }, { valor: 'saldo', label: 'Saldo' }] },
        { nombre: 'metodoPago', label: 'Método de pago', tipo: 'select', obligatorio: true, opciones: [{ valor: '', label: 'Selecciona…' }, ...METODOS_PAGO.map((m) => ({ valor: m, label: m }))] },
        { nombre: 'referencia', label: 'Referencia', max: 100, placeholder: 'N.º de transacción o recibo' },
      ]}
      schema={esquema}
      onGuardar={async (v) => {
        const r = await ventasService.registrarAbono(v)
        mostrar({
          tono: 'exito',
          mensaje: r.venta.estadoPago === 'pagada' ? 'Abono registrado: la venta quedó pagada' : r.ordenEnProceso ? 'Anticipo registrado: la orden pasó a «en proceso»' : 'Abono registrado',
        })
        onHecho()
      }}
    />
  )
}
