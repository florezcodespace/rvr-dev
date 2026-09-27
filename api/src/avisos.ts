import nodemailer from 'nodemailer'
import { config } from './config.js'
import { consultar, type Conexion, pool } from './db.js'

/**
 * Avisos del sistema: la campana del portal (tabla `notificacion`) y, cuando
 * hay servidor de correo configurado, el correo.
 */

interface Aviso {
  titulo: string
  mensaje: string
  enlace?: string
}

/** Notifica a una cuenta concreta (el cliente dueño de una cotización, p. ej.). */
export async function notificarUsuario(usuarioId: number | null | undefined, aviso: Aviso, conexion: Conexion = pool) {
  if (!usuarioId) return
  await consultar(
    `INSERT INTO notificacion (usuario_id, titulo, mensaje, enlace) VALUES ($1, $2, $3, $4)`,
    [usuarioId, aviso.titulo, aviso.mensaje, aviso.enlace ?? null],
    conexion,
  )
}

/**
 * Notifica a todo el personal que tiene el permiso indicado (CA_78_04 «notificar
 * al Administrador»). Por permiso y no por nombre de rol: si mañana hay un rol
 * «Coordinador» que atiende cotizaciones, también le llega.
 */
export async function notificarConPermiso(permiso: string, aviso: Aviso, conexion: Conexion = pool) {
  const [modulo, nombre] = permiso.split('.')
  await consultar(
    `INSERT INTO notificacion (usuario_id, titulo, mensaje, enlace)
     SELECT DISTINCT u.id, $3, $4, $5
       FROM usuario u
       JOIN rol r            ON r.id = u.rol_id AND r.estado = 'activo'
       JOIN rol_x_permiso x  ON x.rol_id = r.id
       JOIN permiso p        ON p.id = x.permiso_id AND p.estado = 'activo'
      WHERE u.estado = 'activo' AND p.modulo = $1 AND p.nombre = $2`,
    [modulo, nombre, aviso.titulo, aviso.mensaje, aviso.enlace ?? null],
    conexion,
  )
}

/** Notifica al cliente dueño (si tiene cuenta en el portal). */
export async function notificarCliente(clienteId: number, aviso: Aviso, conexion: Conexion = pool) {
  await consultar(
    `INSERT INTO notificacion (usuario_id, titulo, mensaje, enlace)
     SELECT usuario_id, $2, $3, $4 FROM cliente WHERE id = $1 AND usuario_id IS NOT NULL`,
    [clienteId, aviso.titulo, aviso.mensaje, aviso.enlace ?? null],
    conexion,
  )
}

// ------------------------------------------------------------------ correo

const hayCorreo = Boolean(config.smtp.host)

const transporte = hayCorreo
  ? nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.puerto,
      secure: config.smtp.puerto === 465,
      auth: config.smtp.usuario ? { user: config.smtp.usuario, pass: config.smtp.clave } : undefined,
    })
  : null

export const correoConfigurado = hayCorreo

/**
 * Envía un correo. Sin SMTP configurado (desarrollo) lo escribe en la consola
 * de la API, para que se pueda probar la recuperación sin servidor de correo.
 */
export async function enviarCorreo(para: string, asunto: string, texto: string, html?: string): Promise<boolean> {
  if (!transporte) {
    console.log(`\n[correo · sin SMTP] Para: ${para}\nAsunto: ${asunto}\n${texto}\n`)
    return false
  }
  try {
    await transporte.sendMail({ from: config.smtp.remitente, to: para, subject: asunto, text: texto, html })
    return true
  } catch (error) {
    console.error('[correo] No se pudo enviar', error)
    return false
  }
}
