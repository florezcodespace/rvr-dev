import { EstadoBadge, Listado, type Columna } from '@shared/components/data'
import { FiltroFecha, FiltroSelect } from '@shared/components/form/Campos'
import { RESULTADO_ACCESO_META, RESULTADOS_ACCESO } from '@shared/domain/estados'
import { Button, SearchInput, StatCard, StatGrid } from '@shared/components/ui'
import { useFiltros } from '@shared/hooks/useFiltros'
import { useRecurso } from '@shared/hooks/useRecurso'
import { formatearFechaHora } from '@shared/lib/format'
import { usuariosService, type Acceso } from '../api'

const cargar = usuariosService.accesos.bind(usuariosService)

/**
 * HU_74 · Registro de accesos. Solo lectura (CA_74_04): aquí no hay editar ni
 * borrar, y la base lo impide. Filtro por usuario, fechas o resultado (CA_74_03).
 */
export default function AccesosPage() {
  const f = useFiltros(['resultado', 'canal', 'desde', 'hasta'] as const)
  const { datos, cargando, error } = useRecurso(cargar, f.params)
  const r = datos?.resumen7Dias

  const columnas: Columna<Acceso>[] = [
    { clave: 'fecha', titulo: 'Fecha y hora', ancho: '170px', render: (a) => <span className="font-mono whitespace-nowrap text-[12px] text-fg">{formatearFechaHora(a.fecha)}</span> },
    {
      clave: 'usuario', titulo: 'Usuario',
      render: (a) => (
        <div className="min-w-0">
          <div className="truncate font-semibold text-fg">{a.nombre ?? 'Cuenta no registrada'}</div>
          <div className="truncate text-[11px] text-fg-subtle">{a.identificador}{a.rol && ` · ${a.rol}`}</div>
        </div>
      ),
    },
    { clave: 'resultado', titulo: 'Resultado', ancho: '160px', render: (a) => <EstadoBadge meta={RESULTADO_ACCESO_META[a.resultado]} /> },
    { clave: 'canal', titulo: 'Canal', ancho: '90px', render: (a) => (a.canal === 'movil' ? 'Móvil' : 'Web') },
    { clave: 'ip', titulo: 'IP', ancho: '140px', render: (a) => <span className="font-mono whitespace-nowrap text-[11.5px]">{a.ip || '—'}</span> },
  ]

  return (
    <Listado
      eyebrow="Configuración · Auditoría"
      titulo="Registro de accesos"
      descripcion="Cada intento de ingreso, con su resultado, los bloqueos temporales y los cierres de sesión. Es de solo lectura."
      indicadores={r && (
        <StatGrid>
          <StatCard etiqueta="Ingresos exitosos" valor={String(r.exitosos)} detalle="Últimos 7 días" glifo="✓" tono="success" />
          <StatCard etiqueta="Intentos fallidos" valor={String(r.fallidos)} detalle="Últimos 7 días" glifo="✕" tono="warning" detalleDestacado={r.fallidos > 10} />
          <StatCard etiqueta="Bloqueos temporales" valor={String(r.bloqueos)} detalle="3 fallos seguidos bloquean 5 minutos" glifo="⊘" tono="danger" />
        </StatGrid>
      )}
      barra={
        <>
          <SearchInput valor={f.valores.q} onChange={(v) => f.set('q', v)} placeholder="Usuario o correo…" className="w-full max-w-[260px]" />
          <FiltroSelect etiqueta="Resultado" valor={f.valores.resultado} onChange={(v) => f.set('resultado', v)}
            opciones={RESULTADOS_ACCESO.map((x) => ({ valor: x, label: RESULTADO_ACCESO_META[x].label }))} />
          <FiltroSelect etiqueta="Canal" valor={f.valores.canal} onChange={(v) => f.set('canal', v)} opciones={[{ valor: 'web', label: 'Web' }, { valor: 'movil', label: 'Móvil' }]} />
          <FiltroFecha etiqueta="Desde" valor={f.valores.desde} onChange={(v) => f.set('desde', v)} max={f.valores.hasta || undefined} />
          <FiltroFecha etiqueta="Hasta" valor={f.valores.hasta} onChange={(v) => f.set('hasta', v)} min={f.valores.desde || undefined} />
          {f.hayFiltros && <Button variant="ghost" size="sm" onClick={f.limpiar}>Limpiar</Button>}
        </>
      }
      columnas={columnas}
      filas={datos?.items ?? []}
      claveFila={(a) => a.id}
      cargando={cargando}
      error={error}
      vacio={{ titulo: 'Sin registros', descripcion: 'No hay accesos con esos filtros.' }}
      pagina={datos ?? undefined}
      onPagina={f.setPagina}
    />
  )
}
