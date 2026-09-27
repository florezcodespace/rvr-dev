import 'dotenv/config'

function requerido(clave: string): string {
  const valor = process.env[clave]
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${clave}. Copia .env.example a .env y complétala.`,
    )
  }
  return valor
}

export const config = {
  databaseUrl: requerido('DATABASE_URL'),
  jwtSecret: requerido('JWT_SECRET'),
  sesionHoras: Number(process.env.SESION_HORAS ?? 8),
  puerto: Number(process.env.PORT ?? 4000),
  origenes: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  /** CA_13_05 · Intentos fallidos consecutivos antes del bloqueo temporal. */
  intentosMaximos: Number(process.env.INTENTOS_MAXIMOS ?? 3),
  /** Minutos que dura el bloqueo temporal. */
  minutosBloqueo: Number(process.env.MINUTOS_BLOQUEO ?? 5),
  /** CA_72_02 · Vigencia del enlace de recuperación, en minutos. */
  minutosRecuperacion: Number(process.env.MINUTOS_RECUPERACION ?? 30),
  /** Dirección pública del portal: arma el enlace de recuperación del correo. */
  portalUrl: (process.env.PORTAL_URL ?? 'http://localhost:5173').replace(/\/$/, ''),
  produccion: process.env.NODE_ENV === 'production',
  /** Correo saliente (recuperación de contraseña y avisos). Opcional. */
  smtp: {
    host: process.env.SMTP_HOST ?? '',
    puerto: Number(process.env.SMTP_PORT ?? 587),
    usuario: process.env.SMTP_USER ?? '',
    clave: process.env.SMTP_PASS ?? '',
    remitente: process.env.SMTP_FROM ?? 'Portal RvR Tecnologías <no-responder@rvrtecnologias.com.co>',
  },
}
