import { hoyISO, sumarDias } from '@shared/lib/fechas'

/** Últimos 30 días, hoy incluido. */
export const rangoPorDefecto = () => ({ desde: sumarDias(hoyISO(), -29), hasta: hoyISO() })
