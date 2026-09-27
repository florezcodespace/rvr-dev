/** Módulo del modo demostración (ver `demo/servidor.ts` y `vite.config.ts`). */
declare module 'virtual:rvr-demo' {
  export function prepararDemo(): Promise<unknown>
  export function reiniciarDemo(): void
  export function atender(peticion: {
    metodo: string
    url: URL
    cabeceras: Record<string, string>
    cuerpo?: unknown
  }): Promise<{ estado: number; datos: unknown }>
}
