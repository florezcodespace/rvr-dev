import type { Request, Response } from 'express'
import * as tablero from '../models/tablero.model.js'

/** HU_60 · Reporte de órdenes. */
export async function reporteOrdenes(req: Request, res: Response) {
  const { desde, hasta } = tablero.rango(req.query)
  const p = tablero.filtroReporteOrdenes.parse(req.query)
  res.json(await tablero.reporteOrdenes(desde, hasta, p))
}

/** HU_61 · Reporte por técnico. */
export async function reporteTecnicos(req: Request, res: Response) {
  const { desde, hasta } = tablero.rango(req.query)
  const { tecnico } = tablero.filtroReporteTecnicos.parse(req.query)
  res.json(await tablero.reporteTecnicos(desde, hasta, tecnico))
}

/** HU_63 · Servicios realizados y órdenes por estado. */
export async function serviciosOrdenes(req: Request, res: Response) {
  const { desde, hasta } = tablero.rango(req.query)
  const { estado } = tablero.filtroServiciosOrdenes.parse(req.query)
  res.json(await tablero.serviciosOrdenes(desde, hasta, estado))
}

/** HU_64 · Más solicitados. */
export async function masSolicitados(req: Request, res: Response) {
  const { desde, hasta } = tablero.rango(req.query)
  res.json(await tablero.masSolicitados(desde, hasta))
}

/** HU_65 · Estadísticas generales. */
export async function estadisticas(req: Request, res: Response) {
  const { desde, hasta } = tablero.rango(req.query)
  res.json(await tablero.estadisticas(desde, hasta))
}
