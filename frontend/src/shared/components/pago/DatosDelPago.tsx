import type { ReactNode } from 'react'
import { Select } from '@shared/components/form/Campos'
import { Input } from '@shared/components/ui'
import { BANCOS } from '@shared/domain/estados'
import { cn } from '@shared/lib/cn'
import { detectarTarjeta, formatearNumero, formatearVencimiento, largoCvv, largoNumero, soloDigitos, type TarjetaDetectada } from '@shared/lib/tarjetas'
import { ICONOS, NOMBRE_OPCION } from './opciones'
import { esTarjeta, TIPOS_DOCUMENTO, type DatosPago } from './reglas'

/** Paso 2 · Los datos que pide el método elegido. */
export function DatosDelPago({ valor, onChange, errores, onCambiar, conReferencia = true }: {
  valor: DatosPago
  onChange: (v: DatosPago) => void
  errores: Record<string, string>
  /** Volver a «Elige cómo pagar». */
  onCambiar: () => void
  conReferencia?: boolean
}) {
  const o = valor.opcion
  if (!o) return null
  const poner = <K extends keyof DatosPago>(k: K, v: DatosPago[K]) => onChange({ ...valor, [k]: v })
  const err = (c: string) => errores[`detalle_${c}`]

  const referencia = {
    nequi: { label: 'Referencia del pago', ayuda: 'Aparece en el comprobante de Nequi, por ejemplo M1234567.', obligatoria: true },
    daviplata: { label: 'Referencia del pago', ayuda: 'El número de la transacción en Daviplata.', obligatoria: true },
    pse: { label: 'CUS', ayuda: 'Código Único de Seguimiento que muestra PSE al terminar.', obligatoria: true },
    credito: { label: 'Número de aprobación', ayuda: 'Si ya pagaste en un datáfono, el número del voucher.', obligatoria: false },
    debito: { label: 'Número de aprobación', ayuda: 'Si ya pagaste en un datáfono, el número del voucher.', obligatoria: false },
    transferencia: { label: 'Número del comprobante', ayuda: 'El que te dio el banco al transferir.', obligatoria: false },
    efectivo: { label: 'Número del recibo', ayuda: 'Si consignaste en un corresponsal, el número del recibo.', obligatoria: false },
  }[o]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3 rounded-[14px] border border-border-base bg-surface-muted px-4 py-3">
        {ICONOS[o]}
        <span className="flex-1 text-[14px] text-fg">{NOMBRE_OPCION[o]}</span>
        <button type="button" onClick={onCambiar} className="cursor-pointer text-[13px] font-semibold text-link underline-offset-2 hover:underline">Cambiar</button>
      </div>

      <div className="flex flex-col gap-4 rounded-[14px] border border-border-base p-4 sm:p-5">
        {esTarjeta(o) && <CamposTarjeta valor={valor} onChange={onChange} err={err} />}

        {(o === 'nequi' || o === 'daviplata') && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label={`Celular de ${NOMBRE_OPCION[o]}`} type="tel" inputMode="numeric" maxLength={10} placeholder="3001234567"
              value={valor.celular} error={err('celular')} onChange={(e) => poner('celular', soloDigitos(e.target.value))} />
            <Input label="Titular de la cuenta" placeholder="Ej.: María López" maxLength={100}
              value={valor.titular} error={err('titular')} onChange={(e) => poner('titular', e.target.value)} />
          </div>
        )}

        {o === 'pse' && (
          <>
            <SelectBanco valor={valor.banco} onChange={(b) => poner('banco', b)} error={err('banco')} label="Banco" />
            <Input label="Nombre del titular" placeholder="Ej.: María López" maxLength={100}
              value={valor.titular} error={err('titular')} onChange={(e) => poner('titular', e.target.value)} />
            <Documento valor={valor} onChange={onChange} error={err('documento')} />
          </>
        )}

        {o === 'transferencia' && (
          <SelectBanco valor={valor.banco} onChange={(b) => poner('banco', b)} error={err('banco')} label="Banco desde el que transferiste" />
        )}

        {conReferencia && (
          <Input label={`${referencia.label}${referencia.obligatoria ? '' : ' (opcional)'}`} maxLength={100}
            value={valor.referencia} error={errores.referencia} hint={referencia.ayuda}
            onChange={(e) => poner('referencia', e.target.value)} />
        )}
      </div>
    </div>
  )
}

function CamposTarjeta({ valor, onChange, err }: { valor: DatosPago; onChange: (v: DatosPago) => void; err: (c: string) => string | undefined }) {
  const poner = <K extends keyof DatosPago>(k: K, v: DatosPago[K]) => onChange({ ...valor, [k]: v })
  const t = detectarTarjeta(valor.numero)
  const elegido = valor.opcion === 'credito' ? 'Crédito' : 'Débito'
  const otroTipo = t.tipo && t.tipo !== elegido

  return (
    <>
      <VistaTarjeta valor={valor} t={t} />
      <Input label="Número de tarjeta" inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000"
        maxLength={largoNumero(t.franquicia) + 3} value={formatearNumero(valor.numero)} error={err('numero')}
        onChange={(e) => poner('numero', soloDigitos(e.target.value))}
        hint={t.banco || t.franquicia ? (
          <span className={cn(otroTipo && 'text-warning-fg')}>
            {[t.banco, t.franquicia, t.tipo].filter(Boolean).join(' · ')}
            {otroTipo && ` — parece una tarjeta de ${t.tipo!.toLowerCase()}`}
            {otroTipo && <button type="button" className="ml-1 cursor-pointer font-semibold text-link underline underline-offset-2"
              onClick={() => poner('opcion', t.tipo === 'Crédito' ? 'credito' : 'debito')}>Cambiar a {t.tipo!.toLowerCase()}</button>}
          </span>
        ) : undefined} />
      {soloDigitos(valor.numero).length >= 6 && !t.banco && (
        <SelectBanco valor={valor.banco} onChange={(b) => poner('banco', b)} error={err('banco')} label="Banco emisor"
          ayuda="No reconocimos el banco de esta tarjeta: elígelo." />
      )}
      <Input label="Nombre del titular" autoComplete="cc-name" placeholder="Ej.: María López" maxLength={100} hint="Como aparece en la tarjeta."
        value={valor.titular} error={err('titular')} onChange={(e) => poner('titular', e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Vencimiento" inputMode="numeric" autoComplete="cc-exp" placeholder="MM/AA" maxLength={5}
          value={valor.vencimiento} error={err('vencimiento')} onChange={(e) => poner('vencimiento', formatearVencimiento(e.target.value))} />
        <Input label="Código de seguridad" type="password" inputMode="numeric" autoComplete="cc-csc" placeholder={'0'.repeat(largoCvv(t.franquicia))}
          maxLength={largoCvv(t.franquicia)} value={valor.cvv} error={err('cvv')} onChange={(e) => poner('cvv', soloDigitos(e.target.value))}
          trailing={<span title={`Los ${largoCvv(t.franquicia)} dígitos ${t.franquicia === 'American Express' ? 'del frente' : 'del reverso'} de la tarjeta`}
            className="absolute right-3 grid size-5 cursor-help place-items-center rounded-full border border-current text-[11px] font-bold text-link">?</span>} />
      </div>
      <Documento valor={valor} onChange={onChange} error={err('documento')} />
      {valor.opcion === 'credito' && (
        <Select label="Cuotas" value={valor.cuotas} onChange={(e) => poner('cuotas', e.target.value)}>
          {Array.from({ length: 36 }, (_, i) => String(i + 1)).map((n) => <option key={n} value={n}>{n === '1' ? '1 (contado)' : n}</option>)}
        </Select>
      )}
      <p className="m-0 text-[12px] text-fg-subtle">
        Por seguridad, RvR solo guarda el banco, la franquicia y los últimos 4 dígitos. El número completo, el vencimiento y el código no salen de tu navegador.
      </p>
    </>
  )
}

/** Tarjeta de muestra que se llena mientras se escribe. */
function VistaTarjeta({ valor, t }: { valor: DatosPago; t: TarjetaDetectada }) {
  const digitos = soloDigitos(valor.numero)
  const vacia = !digitos && !valor.titular
  const relleno = formatearNumero(digitos.padEnd(largoNumero(t.franquicia), '•'))
  return (
    <div className={cn(
      'relative aspect-[1.586] w-full max-w-[320px] overflow-hidden rounded-[16px] p-5 shadow-[0_8px_24px_rgb(0_0_0/0.18)] transition-colors',
      vacia ? 'bg-surface-muted text-fg-subtle' : 'bg-[linear-gradient(135deg,var(--rvr-primary-strong),var(--rvr-primary))] text-white',
    )}>
      <div aria-hidden="true" className="absolute -top-1/3 left-1/4 size-[140%] rounded-full border border-current opacity-10" />
      <div className="relative flex h-full flex-col justify-between">
        <div className="flex items-start justify-between gap-3 text-[12px] font-semibold">
          <span>{t.banco ?? (vacia ? '' : 'Tu banco')}</span>
          <span className="italic">{t.franquicia ?? ''}</span>
        </div>
        <div className="font-mono text-[16px] tracking-[0.08em] sm:text-[18px]">{vacia ? '' : relleno}</div>
        <div className="flex items-end justify-between gap-3 text-[11px] uppercase">
          <span className="truncate">{valor.titular || (vacia ? '' : 'Nombre del titular')}</span>
          <span className="font-mono">{valor.vencimiento || (vacia ? '' : 'MM/AA')}</span>
        </div>
      </div>
    </div>
  )
}

function Documento({ valor, onChange, error }: { valor: DatosPago; onChange: (v: DatosPago) => void; error?: string }) {
  return (
    <div className="flex flex-col">
      <label htmlFor="pago-documento" className="mb-1.5 text-[13px] font-semibold text-fg">Documento del titular</label>
      <div className={cn('flex overflow-hidden rounded-[12px] border bg-[var(--rvr-surface-raised)] focus-within:border-[var(--rvr-ring-border)] focus-within:shadow-[0_0_0_3px_var(--rvr-ring)]',
        error ? 'border-danger' : 'border-border-base')}>
        <select aria-label="Tipo de documento" value={valor.tipoDocumento} onChange={(e) => onChange({ ...valor, tipoDocumento: e.target.value })}
          className="h-11 cursor-pointer border-0 border-r border-border-base bg-transparent px-3 text-[13px] text-fg outline-none">
          {TIPOS_DOCUMENTO.map((d) => <option key={d.valor} value={d.valor}>{d.label}</option>)}
        </select>
        <input id="pago-documento" inputMode={valor.tipoDocumento === 'PP' ? 'text' : 'numeric'} placeholder="0.000.000.000" maxLength={15}
          aria-invalid={error ? true : undefined} value={valor.documento}
          onChange={(e) => onChange({ ...valor, documento: e.target.value.replace(/[^0-9A-Za-z]/g, '') })}
          className="h-11 min-w-0 flex-1 border-0 bg-transparent px-3.5 text-[13.5px] text-fg outline-none placeholder:text-fg-faint" />
      </div>
      {error && <p className="mt-1.5 text-[12px] text-danger-fg">{error}</p>}
    </div>
  )
}

function SelectBanco({ valor, onChange, error, label, ayuda }: { valor: string; onChange: (b: string) => void; error?: string; label: string; ayuda?: ReactNode }) {
  return (
    <div className="flex flex-col">
      <Select label={label} value={valor} error={error} onChange={(e) => onChange(e.target.value)}>
        <option value="">Elige…</option>
        {BANCOS.map((b) => <option key={b} value={b}>{b}</option>)}
      </Select>
      {ayuda && !error && <p className="mt-1.5 text-[12px] text-fg-subtle">{ayuda}</p>}
    </div>
  )
}
