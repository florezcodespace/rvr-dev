import { Ayuda } from '@shared/components/ui/Tooltip'
import { SelectorFecha } from './SelectorFecha'
import { useRef, useState, type ReactNode } from 'react'
import type { ZodType } from 'zod'
import { Alert, Button, Modal } from '@shared/components/ui'
import { ErrorApi } from '@shared/lib/api'
import { cn } from '@shared/lib/cn'
import { CLASE_CAMPO } from './Campos'
import { CampoContrasena } from './InputContrasena'

export interface OpcionCampo {
  valor: string
  label: string
}

export interface CampoForm {
  nombre: string
  label: string
  tipo?: 'texto' | 'correo' | 'tel' | 'numero' | 'select' | 'area' | 'fecha' | 'hora' | 'contrasena' | 'booleano'
  placeholder?: string
  opciones?: OpcionCampo[]
  ayuda?: ReactNode
  /** Explicación corta en un ícono «?» junto a la etiqueta. */
  info?: string
  /** Ocupa las dos columnas de la rejilla. */
  ancho?: 'completo'
  valorInicial?: string
  /** Visible pero no editable (CA_77_02: el documento del cliente). */
  soloLectura?: boolean
  obligatorio?: boolean
  max?: number
  autoComplete?: string
  /** Se muestra solo si se cumple (p. ej. los datos de cliente cuando el rol es Cliente). */
  visibleSi?: (valores: Record<string, string>) => boolean
  /**
   * Revisión al salir del campo (un documento o correo que ya existe).
   * `error` lo marca en rojo; `aviso` es una nota informativa.
   */
  validarAlSalir?: (valor: string, valores: Record<string, string>) => Promise<{ error?: string; aviso?: string } | null>
}

type Valores = Record<string, string>

/**
 * Formulario de registro y edición en diálogo.
 *
 * El formulario recoge cadenas del DOM y el esquema zod las convierte y valida
 * al enviar. Los errores por campo que devuelva la API (422) se pintan en su
 * campo, y el resto (duplicado, regla de negocio) arriba del pie.
 */
export function FormularioModal<TSalida>({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  campos,
  schema,
  textoGuardar = 'Guardar',
  onGuardar,
  antes,
  ancho = 'md',
}: {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  descripcion?: string
  campos: CampoForm[]
  schema: ZodType<TSalida>
  textoGuardar?: string
  onGuardar: (valores: TSalida) => Promise<void>
  /** Contenido antes de los campos (un aviso, un resumen). */
  antes?: ReactNode
  ancho?: 'sm' | 'md' | 'lg'
}) {
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [enviando, setEnviando] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [avisos, setAvisos] = useState<Record<string, string>>({})
  // Valores en vivo: los necesitan `visibleSi` y `validarAlSalir`
  const inicial = () => Object.fromEntries(campos.map((c) => [c.nombre, c.valorInicial ?? '']))
  const [valores, setValores] = useState<Valores>(inicial)
  const formRef = useRef<HTMLFormElement>(null)

  const leer = (form: HTMLFormElement): Valores => {
    const datos = new FormData(form)
    return Object.fromEntries(campos.map((c) => [c.nombre, c.tipo === 'booleano' ? (datos.get(c.nombre) === 'si' ? 'si' : '') : String(datos.get(c.nombre) ?? '')]))
  }
  const visibles = campos.filter((c) => !c.visibleSi || c.visibleSi(valores))

  const alSalir = async (campo: CampoForm) => {
    if (!campo.validarAlSalir || !formRef.current) return
    const actuales = leer(formRef.current)
    const valor = (actuales[campo.nombre] ?? '').trim()
    const limpiar = (r: Record<string, string>) => { const n = { ...r }; delete n[campo.nombre]; return n }
    if (!valor) { setAvisos(limpiar); return }
    try {
      const r = await campo.validarAlSalir(valor, actuales)
      setErrores((e) => (r?.error ? { ...e, [campo.nombre]: r.error } : limpiar(e)))
      setAvisos((a) => (r?.aviso ? { ...a, [campo.nombre]: r.aviso } : limpiar(a)))
    } catch {
      // Si la revisión falla, la validación definitiva la hace la API al guardar
    }
  }

  const cerrar = () => {
    setErrores({})
    setErrorGeneral(null)
    setAvisos({})
    setValores(inicial())
    onCerrar()
  }

  const enviar = async (evento: React.FormEvent<HTMLFormElement>) => {
    evento.preventDefault()
    const datos = new FormData(evento.currentTarget)
    const bruto = Object.fromEntries(
      visibles.map((c) => [
        c.nombre,
        c.tipo === 'booleano' ? datos.get(c.nombre) === 'si' : String(datos.get(c.nombre) ?? '').trim(),
      ]),
    )

    const resultado = schema.safeParse(bruto)
    if (!resultado.success) {
      const nuevos: Record<string, string> = {}
      for (const problema of resultado.error.issues) {
        const clave = String(problema.path[0] ?? '')
        if (clave && !nuevos[clave]) nuevos[clave] = problema.message
      }
      setErrores(nuevos)
      return
    }

    setErrores({})
    setErrorGeneral(null)
    setEnviando(true)
    try {
      await onGuardar(resultado.data)
      cerrar()
    } catch (error) {
      // Un error con campo (documento repetido, p. ej.) se pinta solo en su campo
      if (error instanceof ErrorApi && Object.keys(error.campos).length) setErrores(error.campos)
      else setErrorGeneral(error instanceof Error && error.message ? error.message : 'No pudimos guardar. Inténtalo de nuevo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={cerrar} titulo={titulo} descripcion={descripcion} ancho={ancho}>
      <form ref={formRef} noValidate onSubmit={enviar} onChange={(e) => setValores(leer(e.currentTarget))} className="contents">
        {antes && <div className="mb-4">{antes}</div>}
        <div className="grid grid-cols-1 gap-x-4 gap-y-[18px] sm:grid-cols-2">
          {visibles.map((campo) => {
            const error = errores[campo.nombre]
            const idError = `${campo.nombre}-error`
            const comun = {
              id: campo.nombre,
              name: campo.nombre,
              disabled: campo.soloLectura,
              'aria-invalid': error ? true : undefined,
              'aria-describedby': error ? idError : undefined,
              'aria-required': campo.obligatorio || undefined,
              onBlur: campo.validarAlSalir ? () => void alSalir(campo) : undefined,
            }

            if (campo.tipo === 'booleano') {
              return (
                <label key={campo.nombre} className={cn('flex cursor-pointer items-start gap-2.5 rounded-[10px] border border-border-base bg-surface-muted px-3.5 py-3', campo.ancho === 'completo' && 'sm:col-span-2')}>
                  <input type="checkbox" name={campo.nombre} value="si" defaultChecked={campo.valorInicial === 'si'} className="mt-0.5 size-4 cursor-pointer accent-[var(--rvr-primary)]" />
                  <span className="flex flex-col gap-0.5">
                    <span className="text-[13px] font-semibold text-fg">{campo.label}</span>
                    {campo.ayuda && <span className="text-[12px] text-fg-subtle">{campo.ayuda}</span>}
                  </span>
                </label>
              )
            }

            return (
              <div key={campo.nombre} className={cn('flex flex-col', campo.ancho === 'completo' && 'sm:col-span-2')}>
                <label htmlFor={campo.nombre} className="mb-1.5 text-[13px] font-semibold text-fg">
                  {campo.label}
                  {campo.obligatorio && <span aria-hidden="true" className="ml-0.5 text-danger-fg">*</span>}
                  {campo.info && <Ayuda texto={campo.info} className="ml-1" />}
                </label>

                {campo.tipo === 'select' ? (
                  <select {...comun} defaultValue={campo.valorInicial ?? ''} className={cn(CLASE_CAMPO, 'h-11 cursor-pointer', error ? 'border-danger' : 'border-border-strong')}>
                    {campo.opciones?.map((opcion) => (
                      <option key={opcion.valor} value={opcion.valor}>{opcion.label}</option>
                    ))}
                  </select>
                ) : campo.tipo === 'area' ? (
                  <textarea
                    {...comun}
                    rows={3}
                    maxLength={campo.max}
                    defaultValue={campo.valorInicial}
                    placeholder={campo.placeholder}
                    className={cn(CLASE_CAMPO, 'h-auto py-2.5 leading-[1.5]', error ? 'border-danger' : 'border-border-strong')}
                  />
                ) : campo.tipo === 'fecha' ? (
                  <SelectorFecha
                    id={campo.nombre}
                    name={campo.nombre}
                    valorInicial={campo.valorInicial ?? ''}
                    disabled={campo.soloLectura}
                    invalido={!!error}
                    placeholder={campo.placeholder ?? 'Elegir fecha'}
                    borrable={!campo.obligatorio}
                    aria-describedby={error ? idError : undefined}
                  />
                ) : campo.tipo === 'contrasena' ? (
                  <CampoContrasena
                    {...comun}
                    maxLength={campo.max}
                    autoComplete={campo.autoComplete}
                    defaultValue={campo.valorInicial}
                    placeholder={campo.placeholder}
                    className={cn(CLASE_CAMPO, 'h-11', error ? 'border-danger' : 'border-border-strong')}
                  />
                ) : (
                  <input
                    {...comun}
                    type={
                      { correo: 'email', tel: 'tel', numero: 'number', fecha: 'date', hora: 'time', contrasena: 'password' }[
                        campo.tipo as string
                      ] ?? 'text'
                    }
                    inputMode={campo.tipo === 'numero' ? 'decimal' : undefined}
                    step={campo.tipo === 'numero' ? 'any' : undefined}
                    maxLength={campo.max}
                    autoComplete={campo.autoComplete}
                    defaultValue={campo.valorInicial}
                    placeholder={campo.placeholder}
                    className={cn(CLASE_CAMPO, 'h-11', error ? 'border-danger' : 'border-border-strong')}
                  />
                )}

                {error ? (
                  <p id={idError} className="mt-1.5 text-[12px] text-danger-fg">{error}</p>
                ) : avisos[campo.nombre] ? (
                  <p className="mt-1.5 text-[12px] font-medium text-info-fg">{avisos[campo.nombre]}</p>
                ) : campo.ayuda ? (
                  <p className="mt-1.5 text-[12px] text-fg-subtle">{campo.ayuda}</p>
                ) : null}
              </div>
            )
          })}
        </div>

        {errorGeneral ? (
          <div className="mt-5">
            <Alert tone="danger" title="No se guardó" description={errorGeneral} />
          </div>
        ) : null}

        <div className="-mx-5 -mb-5 mt-5 flex items-center justify-end gap-2.5 border-t border-border-base bg-surface-muted px-5 py-3.5">
          <Button type="button" variant="secondary" onClick={cerrar}>Cancelar</Button>
          <Button type="submit" loading={enviando}>{enviando ? 'Guardando…' : textoGuardar}</Button>
        </div>
      </form>
    </Modal>
  )
}
