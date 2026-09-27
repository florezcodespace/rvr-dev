import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardHeader } from '@shared/components/ui'
import { cn } from '@shared/lib/cn'

/**
 * Piezas comunes de las pantallas de detalle (`/ordenes/:id`, `/clientes/:id`…).
 *
 * Son cuatro cosas que se repetían en las cinco fichas: el enlace de volver, la
 * tarjeta con título, la lista de datos y el aviso de sección vacía.
 */

/** Enlace de regreso al listado del módulo. */
export function Volver({ a, texto }: { a: string; texto: string }) {
  return (
    <Link
      to={a}
      className="inline-flex w-fit items-center gap-1.5 rounded-[8px] text-[12.5px] font-medium text-fg-muted transition-colors hover:text-fg"
    >
      <span aria-hidden="true">←</span>
      {texto}
    </Link>
  )
}

/** Tarjeta de sección de una ficha. */
export function Bloque({
  titulo,
  subtitulo,
  accion,
  children,
  className,
}: {
  titulo: string
  subtitulo?: string
  accion?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn('gap-3.5 px-[19px] py-[17px]', className)}>
      <CardHeader titulo={titulo} subtitulo={subtitulo} accion={accion} />
      {children}
    </Card>
  )
}

/**
 * Lista de datos. Es un `<dl>` de verdad —término y definición— para que un
 * lector de pantalla relacione cada valor con su etiqueta.
 */
export function Datos({
  items,
  columnas = 2,
}: {
  items: { label: string; valor: ReactNode }[]
  columnas?: 1 | 2 | 3
}) {
  return (
    <dl
      className={cn(
        'm-0 grid gap-x-6 gap-y-3.5',
        columnas === 1 && 'grid-cols-1',
        columnas === 2 && 'grid-cols-1 sm:grid-cols-2',
        columnas === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
      )}
    >
      {items.map((item) => (
        // `flex-col-reverse` para que el término vaya antes en el DOM y la
        // etiqueta se vea arriba: el orden visual no cambia el orden accesible.
        <div key={item.label} className="flex min-w-0 flex-col-reverse gap-1">
          <dd className="m-0 text-[13.5px] font-medium break-words text-fg">{item.valor}</dd>
          <dt className="text-[11px] font-semibold tracking-[0.06em] text-fg-subtle uppercase">
            {item.label}
          </dt>
        </div>
      ))}
    </dl>
  )
}

/** Mensaje de sección sin registros. */
export function SinDatos({ texto }: { texto: string }) {
  return (
    <p className="m-0 rounded-[10px] border border-dashed border-border-strong px-4 py-5 text-center text-[12.5px] text-fg-subtle">
      {texto}
    </p>
  )
}
