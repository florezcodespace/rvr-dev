/** Error con código HTTP y un código de negocio que el portal sabe traducir. */
export class ErrorHttp extends Error {
  constructor(
    readonly estado: number,
    readonly codigo: string,
    mensaje: string,
    readonly extra?: Record<string, unknown>,
  ) {
    super(mensaje)
    this.name = 'ErrorHttp'
  }
}

export const noEncontrado = (que: string) =>
  new ErrorHttp(404, 'NO_ENCONTRADO', `No encontramos ${que}.`)

export const conflicto = (codigo: string, mensaje: string, extra?: Record<string, unknown>) =>
  new ErrorHttp(409, codigo, mensaje, extra)

export const regla = (codigo: string, mensaje: string, extra?: Record<string, unknown>) =>
  new ErrorHttp(422, codigo, mensaje, extra)
