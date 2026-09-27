import type { ReactNode } from 'react'
import { Alert, Card, PageHeader } from '@shared/components/ui'
import { DataTable, type Columna } from './DataTable'
import { Pager } from './Pager'

/**
 * Esqueleto común de los listados (HU «Listar …»): encabezado, indicadores,
 * barra de búsqueda y filtros (RNF-006), tabla y paginación.
 */
export function Listado<T>({
  eyebrow,
  titulo,
  descripcion,
  acciones,
  indicadores,
  barra,
  columnas,
  filas,
  claveFila,
  cargando,
  error,
  onAbrir,
  vacio,
  pagina,
  onPagina,
  pie,
}: {
  eyebrow?: string
  titulo: string
  descripcion: ReactNode
  acciones?: ReactNode
  indicadores?: ReactNode
  barra?: ReactNode
  columnas: Columna<T>[]
  filas: T[]
  claveFila: (fila: T) => string | number
  cargando: boolean
  error?: string | null
  onAbrir?: (fila: T) => void
  vacio: { titulo: string; descripcion: string }
  pagina?: { pagina: number; totalPaginas: number; total: number; porPagina: number }
  onPagina?: (pagina: number) => void
  pie?: ReactNode
}) {
  const desde = pagina && pagina.total ? (pagina.pagina - 1) * pagina.porPagina + 1 : 0
  const hasta = pagina ? Math.min(pagina.pagina * pagina.porPagina, pagina.total) : 0

  return (
    <div className="flex flex-col gap-4 px-4 py-5 sm:px-7">
      <PageHeader eyebrow={eyebrow} titulo={titulo} descripcion={descripcion} acciones={acciones} />
      {indicadores}
      <Card className="flex flex-col overflow-hidden p-0">
        {barra && <div className="flex flex-wrap items-center gap-2.5 border-b border-border-base px-4 py-3">{barra}</div>}
        {error ? (
          <div className="p-5">
            <Alert tone="danger" title="No pudimos cargar la información" description={error} />
          </div>
        ) : (
          <DataTable columnas={columnas} filas={filas} claveFila={claveFila} cargando={cargando} onAbrir={onAbrir} vacio={vacio} />
        )}
        {pie}
        {pagina && onPagina && (
          <Pager
            pagina={pagina.pagina}
            totalPaginas={pagina.totalPaginas}
            info={pagina.total ? `${desde}–${hasta} de ${pagina.total.toLocaleString('es-CO')}` : 'Sin resultados'}
            onPagina={onPagina}
          />
        )}
      </Card>
    </div>
  )
}
