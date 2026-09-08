import type { ConfigSeries } from '@shared/components/charts'

/** Series del gráfico de tendencia: creadas (llena) vs. completadas (punteada). */
export const SERIES_ORDENES: ConfigSeries = {
  a: { label: 'Creadas', color: 'var(--rvr-chart-1)' },
  b: { label: 'Completadas', color: 'var(--rvr-chart-2)' },
}
