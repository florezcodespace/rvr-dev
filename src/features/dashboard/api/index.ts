import type { DashboardService } from './dashboardService'
import { mockDashboardService } from './mockDashboardService'

/** Punto único de intercambio mock ↔ API real. */
export const dashboardService: DashboardService = mockDashboardService

export type { DashboardService }
