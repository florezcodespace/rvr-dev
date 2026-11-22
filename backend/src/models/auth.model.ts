import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { config } from '../config.js'
import { consultar, enTransaccion, unaFila } from '../db.js'
import type { Sesion } from '../middlewares/sesion.js'
import { correoConfigurado, enviarCorreo, notificarConPermiso } from '../utils/avisos.js'
import {
  contrasenaSegura, correoRequerido, documento, errorDocumento, telefono, textoRequerido, tipoDocumento,
} from '../utils/comun.js'
import { nombreUsuarioLibre } from '../utils/cuentas.js'
import { conflicto, ErrorHttp, regla } from '../utils/errores.js'
import { tipoDeCuenta } from '../utils/modulos.js'
import { firmar } from '../utils/token.js'

/**
 * Gestión de Acceso (HU_13, HU_14, HU_72, HU_73) y Autogestión de la cuenta
 * (HU_75, HU_77 · contraseña). Lo usan la web y la aplicación móvil.
 */

// ----------------------------------------------------------------- cuenta

interface FilaCuenta {
  id: number
  nombre_usuario: string
  correo: string
  nombres: string
  apellidos: string
  telefono: string | null
  estado: string
  contrasena_hash: string
  version_sesion: number
  rol_id: number
  rol_nombre: string
  rol_estado: string
  permisos: string[] | null
  cliente_id: number | null
  cliente_estado: string | null
  tecnico_id: number | null
  tecnico_estado: string | null
}

const SELECT_CUENTA = `
  SELECT u.id, u.nombre_usuario, u.correo, u.nombres, u.apellidos, u.telefono, u.estado,
         u.contrasena_hash, u.version_sesion,
         r.id AS rol_id, r.nombre AS rol_nombre, r.estado AS rol_estado,
         (SELECT array_agg(p.modulo || '.' || p.nombre ORDER BY p.modulo, p.nombre)
            FROM rol_x_permiso x JOIN permiso p ON p.id = x.permiso_id
           WHERE x.rol_id = r.id AND p.estado = 'activo') AS permisos,
         c.id AS cliente_id, c.estado AS cliente_estado,
         t.id AS tecnico_id, t.estado AS tecnico_estado
    FROM usuario u
    JOIN rol r          ON r.id = u.rol_id
    LEFT JOIN cliente c ON c.usuario_id = u.id
    LEFT JOIN tecnico t ON t.usuario_id = u.id
`

export function aCuenta(f: FilaCuenta) {
  const permisos = f.permisos ?? []
  return {
    id: f.id,
    nombreUsuario: f.nombre_usuario,
    nombres: f.nombres,
    apellidos: f.apellidos,
    nombre: `${f.nombres} ${f.apellidos}`.trim(),
    correo: f.correo,
    telefono: f.telefono ?? '',
    estado: f.estado,
    rol: { id: f.rol_id, nombre: f.rol_nombre },
    permisos,
    tipo: tipoDeCuenta(permisos),
    clienteId: f.cliente_id,
    tecnicoId: f.tecnico_id,
  }
}

export async function cuentaPorId(id: number) {
  const fila = await unaFila<FilaCuenta>(`${SELECT_CUENTA} WHERE u.id = $1`, [id])
  return fila ? aCuenta(fila) : null
}

async function registrarAcceso(
  ip: string,
  datos: { usuarioId: number | null; identificador: string; resultado: string; canal: 'web' | 'movil' },
) {
  await consultar(
    `INSERT INTO registro_acceso (usuario_id, identificador, resultado, canal, ip)
     VALUES ($1, $2, $3, $4, $5)`,
    [datos.usuarioId, datos.identificador.toLowerCase().slice(0, 100), datos.resultado, datos.canal, ip],
  )
}

// ----------------------------------------------------------- HU_13 · login

export const credenciales = z.object({
  /** CA_13_01 · nombre de usuario o correo */
  usuario: z.string().trim().min(1, 'Ingresa tu usuario o correo').max(100),
  contrasena: z.string().min(1, 'Ingresa tu contraseña').max(72),
  canal: z.enum(['web', 'movil']).default('web'),
})

/**
 * CA_13_05 · ¿Está bloqueado el identificador? El conteo vive en
 * `registro_acceso`, no en memoria: sobrevive a reinicios de la API y deja la
 * traza que pide CA_74_02.
 */
async function minutosDeBloqueo(identificador: string): Promise<number> {
  const fila = await unaFila<{ restantes: number | null }>(
    `SELECT ceil(extract(epoch FROM (max(fecha) + make_interval(mins => $2) - now())) / 60)::int AS restantes
       FROM registro_acceso
      WHERE lower(identificador) = lower($1) AND resultado = 'bloqueado'
        AND fecha > now() - make_interval(mins => $2)`,
    [identificador, config.minutosBloqueo],
  )
  return Math.max(fila?.restantes ?? 0, 0)
}

/** Fallos consecutivos desde el último ingreso exitoso o bloqueo. */
async function fallosSeguidos(identificador: string): Promise<number> {
  const fila = await unaFila<{ n: number }>(
    `SELECT count(*)::int AS n FROM registro_acceso
      WHERE lower(identificador) = lower($1) AND resultado = 'fallido'
        AND fecha > now() - interval '30 minutes'
        AND fecha > coalesce((SELECT max(fecha) FROM registro_acceso
                               WHERE lower(identificador) = lower($1)
                                 AND resultado IN ('exitoso', 'bloqueado', 'restablecimiento')),
                             '-infinity')`,
    [identificador],
  )
  return fila?.n ?? 0
}

/** HU_13 · Iniciar sesión (web o móvil). */
export async function login({ usuario: identificador, contrasena, canal }: z.infer<typeof credenciales>, ip: string) {
  const bloqueo = await minutosDeBloqueo(identificador)
  if (bloqueo > 0) {
    throw new ErrorHttp(423, 'CUENTA_BLOQUEADA',
      `Demasiados intentos fallidos. Intenta de nuevo en ${bloqueo} ${bloqueo === 1 ? 'minuto' : 'minutos'}.`,
      { minutos: bloqueo })
  }

  const fila = await unaFila<FilaCuenta>(
    `${SELECT_CUENTA} WHERE lower(u.correo) = lower($1) OR lower(u.nombre_usuario) = lower($1)`,
    [identificador],
  )

  // CA_13_02 · contra el hash, nunca contra texto plano. Un hash inválido
  // (cuenta sin contraseña utilizable) simplemente no coincide.
  const coincide = fila !== null &&
    (await bcrypt.compare(contrasena, fila.contrasena_hash).catch(() => false))

  if (!coincide) {
    await registrarAcceso(ip, { usuarioId: fila?.id ?? null, identificador, resultado: 'fallido', canal })
    const fallos = await fallosSeguidos(identificador)
    if (fallos >= config.intentosMaximos) {
      await registrarAcceso(ip, { usuarioId: fila?.id ?? null, identificador, resultado: 'bloqueado', canal })
      throw new ErrorHttp(423, 'CUENTA_BLOQUEADA',
        `Demasiados intentos fallidos. El acceso quedó bloqueado ${config.minutosBloqueo} minutos.`,
        { minutos: config.minutosBloqueo })
    }
    // CA_13_04 · sin revelar si falló el usuario o la contraseña
    throw new ErrorHttp(401, 'CREDENCIALES_INVALIDAS', 'Usuario o contraseña incorrectos.', {
      intentosRestantes: config.intentosMaximos - fallos,
    })
  }

  const cuenta = aCuenta(fila)
  const rechazar = async (codigo: string, mensaje: string): Promise<never> => {
    await registrarAcceso(ip, { usuarioId: fila.id, identificador, resultado: 'fallido', canal })
    throw new ErrorHttp(403, codigo, mensaje)
  }

  // CA_11_02 · un usuario inactivo no inicia sesión; CA_83_04 · ni un cliente inactivo
  if (fila.estado !== 'activo' || fila.cliente_estado === 'inactivo') {
    await rechazar('USUARIO_INACTIVO', 'Tu cuenta está inactiva. Comunícate con RvR Tecnologías.')
  }
  if (fila.rol_estado !== 'activo') {
    await rechazar('ROL_INACTIVO', 'Tu rol está desactivado. Comunícate con el administrador.')
  }

  if (canal === 'movil') {
    // Móvil CA_01_01 · la app es solo para técnicos activos
    if (!cuenta.permisos.includes('movil.acceso') || fila.tecnico_id === null) {
      await rechazar('SOLO_TECNICOS', 'La aplicación móvil es para los técnicos de RvR Tecnologías.')
    }
    if (fila.tecnico_estado !== 'activo') {
      await rechazar('TECNICO_INACTIVO', 'Tu ficha de técnico está inactiva. Comunícate con el administrador.')
    }
  } else if (cuenta.tipo === 'tecnico') {
    await rechazar('USAR_APP_MOVIL', 'Los técnicos ingresan desde la aplicación móvil de RvR.')
  }

  await registrarAcceso(ip, { usuarioId: fila.id, identificador, resultado: 'exitoso', canal })
  const { token, expiraEn } = firmar({ usuarioId: fila.id, ver: fila.version_sesion, canal })
  return { usuario: cuenta, token, expiraEn }
}

// --------------------------------------------------------- HU_14 · logout

/** HU_14 · Cerrar sesión. */
export async function logout(s: Sesion, ip: string) {
  // Móvil CA_02_02 · en el móvil el token se invalida en el servidor. En la
  // web basta con borrarlo del navegador (CA_14_02): invalidarlo aquí
  // cerraría también la sesión del mismo usuario en otros equipos.
  if (s.canal === 'movil') {
    await consultar(`UPDATE usuario SET version_sesion = version_sesion + 1 WHERE id = $1`, [s.usuarioId])
  }
  const fila = await unaFila<{ correo: string }>(`SELECT correo FROM usuario WHERE id = $1`, [s.usuarioId])
  await registrarAcceso(ip, { usuarioId: s.usuarioId, identificador: fila?.correo ?? '', resultado: 'cierre_sesion', canal: s.canal })
}

/** Cierra la sesión en todos los dispositivos. */
export async function logoutTodo(usuarioId: number) {
  await consultar(`UPDATE usuario SET version_sesion = version_sesion + 1 WHERE id = $1`, [usuarioId])
}

// ------------------------------------------------ HU_72 · recuperar contraseña

const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex')

export const datosRecuperar = z.object({ correo: correoRequerido })

/** HU_72 · Recuperar contraseña: envía el enlace (30 min, un solo uso). */
export async function recuperar(correo: string, ip: string) {
  const fila = await unaFila<{ id: number; nombres: string; estado: string }>(
    `SELECT id, nombres, estado FROM usuario WHERE correo = $1`,
    [correo],
  )

  let enlace: string | null = null
  if (fila && fila.estado === 'activo') {
    // CA_72_02 / CA_72_03 · token aleatorio, de un solo uso y con vigencia.
    // En la base queda su SHA-256: quien lea la tabla no puede usarlo.
    const token = randomBytes(32).toString('hex')
    await consultar(
      `UPDATE usuario
          SET token_recuperacion = $2,
              token_vence = now() + make_interval(mins => $3)
        WHERE id = $1`,
      [fila.id, sha256(token), config.minutosRecuperacion],
    )
    enlace = `${config.portalUrl}/restablecer?token=${token}`
    await enviarCorreo(
      correo,
      'Restablece tu contraseña · Portal RvR Tecnologías',
      `Hola ${fila.nombres}:\n\nRecibimos una solicitud para restablecer tu contraseña del Portal RvR Tecnologías.\n` +
        `Abre este enlace para crear una nueva (vence en ${config.minutosRecuperacion} minutos y sirve una sola vez):\n\n${enlace}\n\n` +
        'Si no fuiste tú, ignora este correo: tu contraseña actual sigue funcionando.',
    )
    await registrarAcceso(ip, { usuarioId: fila.id, identificador: correo, resultado: 'recuperacion', canal: 'web' })
  }

  // CA_72_04 · el mismo mensaje exista o no el correo
  return {
    mensaje: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.',
    // Solo en desarrollo y sin servidor de correo: el enlace, para poder
    // probar el flujo. En producción nunca se devuelve.
    ...(enlace && !correoConfigurado && !config.produccion ? { enlaceDesarrollo: enlace } : {}),
  }
}

// ------------------------------------------------ HU_73 · restablecer contraseña

async function cuentaDelToken(token: string) {
  return unaFila<{ id: number; correo: string }>(
    `SELECT id, correo FROM usuario
      WHERE token_recuperacion = $1 AND token_vence > now() AND estado = 'activo'`,
    [sha256(token)],
  )
}

/** CA_73_01 · el portal valida el enlace antes de pedir la contraseña nueva. */
export async function validarEnlace(tokenRuta: unknown) {
  const token = z.string().regex(/^[0-9a-f]{64}$/).safeParse(tokenRuta)
  const cuenta = token.success ? await cuentaDelToken(token.data) : null
  if (!cuenta) {
    throw regla('ENLACE_INVALIDO', 'El enlace no es válido, ya se usó o venció. Solicita uno nuevo.')
  }
  return { valido: true, correo: cuenta.correo.replace(/^(.{2}).*(@.*)$/, '$1•••$2') }
}

export const datosRestablecer = z
  .object({
    token: z.string().regex(/^[0-9a-f]{64}$/, 'El enlace no es válido'),
    nueva: contrasenaSegura,
    confirmacion: z.string(),
  })
  .refine((d) => d.nueva === d.confirmacion, {
    message: 'Las contraseñas no coinciden', path: ['confirmacion'],
  })

/** HU_73 · Contraseña nueva con el token del enlace (un solo uso). */
export async function restablecer(datos: z.infer<typeof datosRestablecer>, ip: string) {
  const cuenta = await cuentaDelToken(datos.token)
  if (!cuenta) throw regla('ENLACE_INVALIDO', 'El enlace no es válido, ya se usó o venció. Solicita uno nuevo.')

  // CA_73_04 · se guarda cifrada y el token queda invalidado.
  // CA_73_05 · version_sesion + 1 cierra todas las sesiones abiertas.
  await consultar(
    `UPDATE usuario
        SET contrasena_hash = $2, token_recuperacion = NULL, token_vence = NULL,
            version_sesion = version_sesion + 1
      WHERE id = $1`,
    [cuenta.id, await bcrypt.hash(datos.nueva, 10)],
  )
  await registrarAcceso(ip, { usuarioId: cuenta.id, identificador: cuenta.correo, resultado: 'restablecimiento', canal: 'web' })
  return { mensaje: 'Tu contraseña se restableció. Ya puedes iniciar sesión.' }
}

// ------------------------------------------- HU_75 · registrarme en el portal

export const datosRegistro = z
  .object({
    tipoDocumento,
    documento,
    nombres: textoRequerido(100, 'Los nombres'),
    apellidos: textoRequerido(100, 'Los apellidos'),
    telefono: telefono.refine((v) => v !== null, 'El teléfono es obligatorio'),
    direccion: textoRequerido(150, 'La dirección'),
    correo: correoRequerido,
    contrasena: contrasenaSegura,
    confirmacion: z.string(),
  })
  .refine((d) => d.contrasena === d.confirmacion, {
    message: 'Las contraseñas no coinciden', path: ['confirmacion'],
  })
  .superRefine((d, ctx) => {
    const error = errorDocumento(d.tipoDocumento, d.documento)
    if (error) ctx.addIssue({ code: 'custom', path: ['documento'], message: error })
  })

/** HU_75 · Registro del cliente en el portal. */
export async function registrar(d: z.infer<typeof datosRegistro>) {
  const rolCliente = await unaFila<{ id: number }>(
    `SELECT id FROM rol WHERE nombre = 'Cliente' AND estado = 'activo'`,
  )
  if (!rolCliente) {
    throw regla('REGISTRO_CERRADO', 'El registro en el portal no está disponible en este momento.')
  }

  // CA_75_02 · correo único entre las cuentas
  if (await unaFila(`SELECT 1 FROM usuario WHERE correo = $1`, [d.correo])) {
    throw conflicto('CORREO_EN_USO', 'Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.',
      { detalles: [{ campo: 'correo', mensaje: 'Ya hay una cuenta con ese correo.' }] })
  }

  const existente = await unaFila<{ id: number; usuario_id: number | null; estado: string }>(
    `SELECT id, usuario_id, estado FROM cliente WHERE documento_identidad = $1`,
    [d.documento],
  )
  if (existente?.usuario_id) {
    throw conflicto('DOCUMENTO_EN_USO', 'Ese documento ya tiene una cuenta en el portal. Inicia sesión o recupera tu contraseña.',
      { detalles: [{ campo: 'documento', mensaje: 'Ese documento ya tiene una cuenta en el portal.' }] })
  }
  // [Feedback 5] El correo tampoco puede ser el de otro cliente
  if (await unaFila(`SELECT 1 FROM cliente WHERE correo = $1 AND documento_identidad <> $2`, [d.correo, d.documento])) {
    throw conflicto('CORREO_DUPLICADO', 'Ese correo ya está registrado para otro cliente.',
      { detalles: [{ campo: 'correo', mensaje: 'Ese correo ya está registrado para otro cliente.' }] })
  }
  if (existente?.estado === 'inactivo') {
    throw regla('CLIENTE_INACTIVO', 'Tu registro de cliente está inactivo. Comunícate con RvR Tecnologías.')
  }

  const nombreUsuario = await nombreUsuarioLibre(d.correo)
  const hash = await bcrypt.hash(d.contrasena, 10)

  const clienteId = await enTransaccion(async (tx) => {
    const usuario = await unaFila<{ id: number }>(
      `INSERT INTO usuario (rol_id, nombre_usuario, correo, contrasena_hash, nombres, apellidos, telefono, estado)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING id`,
      [rolCliente.id, nombreUsuario, d.correo, hash, d.nombres, d.apellidos, d.telefono],
      tx,
    )

    // CA_75_03 · si el administrador ya lo había registrado, se vincula
    // la cuenta a ese registro en lugar de duplicarlo.
    if (existente) {
      await consultar(
        `UPDATE cliente
            SET usuario_id = $2, nombres = $3, apellidos = $4, telefono = $5, direccion = $6, correo = $7, tipo_documento = $8
          WHERE id = $1`,
        [existente.id, usuario!.id, d.nombres, d.apellidos, d.telefono, d.direccion, d.correo, d.tipoDocumento],
        tx,
      )
      return existente.id
    }

    // CA_75_05 · fecha de registro automática
    const cliente = await unaFila<{ id: number }>(
      `INSERT INTO cliente (tipo_documento, documento_identidad, nombres, apellidos, telefono, direccion, correo, usuario_id, estado)
       VALUES ($8, $1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING id`,
      [d.documento, d.nombres, d.apellidos, d.telefono, d.direccion, d.correo, usuario!.id, d.tipoDocumento],
      tx,
    )
    return cliente!.id
  })

  await notificarConPermiso('clientes.listar', {
    titulo: 'Nuevo cliente registrado',
    mensaje: `${d.nombres} ${d.apellidos} creó su cuenta en el portal.`,
    enlace: `/clientes/${clienteId}`,
  })

  // CA_75_06 · confirmación y paso al inicio de sesión
  return {
    mensaje: existente
      ? 'Tu cuenta quedó creada y vinculada a tu historial con RvR Tecnologías. Ya puedes iniciar sesión.'
      : 'Tu cuenta quedó creada. Ya puedes iniciar sesión.',
    vinculado: Boolean(existente),
    nombreUsuario,
  }
}

// ---------------------------------------------------------------- perfil

/** Cuenta de la sesión con su rol, tipo de cuenta y permisos. */
export async function perfil(usuarioId: number) {
  const cuenta = await cuentaPorId(usuarioId)
  if (!cuenta) throw new ErrorHttp(401, 'SESION_INVALIDA', 'La cuenta ya no existe.')
  return cuenta
}

export const datosPerfil = z.object({
  nombres: textoRequerido(100, 'Los nombres'),
  apellidos: textoRequerido(100, 'Los apellidos'),
  correo: correoRequerido,
  telefono,
})

/** Mis datos, para el personal. El cliente actualiza los suyos en /portal/perfil. */
export async function actualizarPerfil(usuarioId: number, d: z.infer<typeof datosPerfil>) {
  await consultar(
    `UPDATE usuario SET nombres = $2, apellidos = $3, correo = $4, telefono = $5 WHERE id = $1`,
    [usuarioId, d.nombres, d.apellidos, d.correo, d.telefono],
  )
  return cuentaPorId(usuarioId)
}

export const datosContrasena = z
  .object({ actual: z.string().min(1, 'Ingresa tu contraseña actual'), nueva: contrasenaSegura, confirmacion: z.string().optional() })
  .refine((v) => v.confirmacion === undefined || v.confirmacion === v.nueva, {
    message: 'Las contraseñas no coinciden', path: ['confirmacion'],
  })

/** CA_77_04 · cambio de contraseña exigiendo la actual. */
export async function cambiarContrasena(usuarioId: number, d: z.infer<typeof datosContrasena>) {
  const fila = await unaFila<{ contrasena_hash: string }>(
    `SELECT contrasena_hash FROM usuario WHERE id = $1`,
    [usuarioId],
  )
  const coincide = fila && (await bcrypt.compare(d.actual, fila.contrasena_hash).catch(() => false))
  if (!coincide) throw regla('CONTRASENA_ACTUAL', 'La contraseña actual no coincide.')
  if (d.actual === d.nueva) throw regla('CONTRASENA_IGUAL', 'La contraseña nueva debe ser distinta de la actual.')

  await consultar(`UPDATE usuario SET contrasena_hash = $2 WHERE id = $1`, [
    usuarioId,
    await bcrypt.hash(d.nueva, 10),
  ])
}
