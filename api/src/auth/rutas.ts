import { createHash, randomBytes } from 'node:crypto'
import bcrypt from 'bcryptjs'
import { Router, type Request } from 'express'
import { z } from 'zod'
import { correoConfigurado, enviarCorreo, notificarConPermiso } from '../avisos.js'
import { config } from '../config.js'
import { consultar, enTransaccion, unaFila } from '../db.js'
import { asincrono, conflicto, ErrorHttp, regla } from '../errores.js'
import {
  contrasenaSegura,
  correoRequerido,
  documento,
  telefono,
  textoRequerido,
} from '../comun.js'
import { sesion } from './middleware.js'
import { tipoDeCuenta } from './modulos.js'
import { firmar } from './sesion.js'

/**
 * Gestión de Acceso (HU_13, HU_14, HU_72, HU_73) y Autogestión de la cuenta
 * (HU_75, HU_77 · contraseña). Lo usan la web y la aplicación móvil.
 */
export const rutasAuth = Router()

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

const ipDe = (req: Request) =>
  (req.headers['x-forwarded-for']?.toString().split(',')[0] ?? req.socket.remoteAddress ?? '').slice(0, 45)

async function registrarAcceso(
  req: Request,
  datos: { usuarioId: number | null; identificador: string; resultado: string; canal: 'web' | 'movil' },
) {
  await consultar(
    `INSERT INTO registro_acceso (usuario_id, identificador, resultado, canal, ip)
     VALUES ($1, $2, $3, $4, $5)`,
    [datos.usuarioId, datos.identificador.toLowerCase().slice(0, 100), datos.resultado, datos.canal, ipDe(req)],
  )
}

// ----------------------------------------------------------- HU_13 · login

const credenciales = z.object({
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

rutasAuth.post(
  '/login',
  asincrono(async (req, res) => {
    const { usuario: identificador, contrasena, canal } = credenciales.parse(req.body)

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
      await registrarAcceso(req, { usuarioId: fila?.id ?? null, identificador, resultado: 'fallido', canal })
      const fallos = await fallosSeguidos(identificador)
      if (fallos >= config.intentosMaximos) {
        await registrarAcceso(req, { usuarioId: fila?.id ?? null, identificador, resultado: 'bloqueado', canal })
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
      await registrarAcceso(req, { usuarioId: fila.id, identificador, resultado: 'fallido', canal })
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

    await registrarAcceso(req, { usuarioId: fila.id, identificador, resultado: 'exitoso', canal })
    const { token, expiraEn } = firmar({ usuarioId: fila.id, ver: fila.version_sesion, canal })
    res.json({ usuario: cuenta, token, expiraEn })
  }),
)

// --------------------------------------------------------- HU_14 · logout

rutasAuth.post(
  '/logout',
  sesion,
  asincrono(async (req, res) => {
    const s = req.sesion!
    // Móvil CA_02_02 · en el móvil el token se invalida en el servidor. En la
    // web basta con borrarlo del navegador (CA_14_02): invalidarlo aquí
    // cerraría también la sesión del mismo usuario en otros equipos.
    if (s.canal === 'movil') {
      await consultar(`UPDATE usuario SET version_sesion = version_sesion + 1 WHERE id = $1`, [s.usuarioId])
    }
    const fila = await unaFila<{ correo: string }>(`SELECT correo FROM usuario WHERE id = $1`, [s.usuarioId])
    await registrarAcceso(req, { usuarioId: s.usuarioId, identificador: fila?.correo ?? '', resultado: 'cierre_sesion', canal: s.canal })
    res.status(204).end()
  }),
)

/** Cierra la sesión en todos los dispositivos. */
rutasAuth.post(
  '/logout-todo',
  sesion,
  asincrono(async (req, res) => {
    await consultar(`UPDATE usuario SET version_sesion = version_sesion + 1 WHERE id = $1`, [req.sesion!.usuarioId])
    res.status(204).end()
  }),
)

// ------------------------------------------------ HU_72 · recuperar contraseña

const sha256 = (texto: string) => createHash('sha256').update(texto).digest('hex')

rutasAuth.post(
  '/recuperar',
  asincrono(async (req, res) => {
    const { correo } = z.object({ correo: correoRequerido }).parse(req.body)

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
      await registrarAcceso(req, { usuarioId: fila.id, identificador: correo, resultado: 'recuperacion', canal: 'web' })
    }

    // CA_72_04 · el mismo mensaje exista o no el correo
    res.json({
      mensaje: 'Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.',
      // Solo en desarrollo y sin servidor de correo: el enlace, para poder
      // probar el flujo. En producción nunca se devuelve.
      ...(enlace && !correoConfigurado && !config.produccion ? { enlaceDesarrollo: enlace } : {}),
    })
  }),
)

// ------------------------------------------------ HU_73 · restablecer contraseña

async function cuentaDelToken(token: string) {
  return unaFila<{ id: number; correo: string }>(
    `SELECT id, correo FROM usuario
      WHERE token_recuperacion = $1 AND token_vence > now() AND estado = 'activo'`,
    [sha256(token)],
  )
}

/** CA_73_01 · el portal valida el enlace antes de pedir la contraseña nueva. */
rutasAuth.get(
  '/restablecer/:token',
  asincrono(async (req, res) => {
    const token = z.string().regex(/^[0-9a-f]{64}$/).safeParse(req.params.token)
    const cuenta = token.success ? await cuentaDelToken(token.data) : null
    if (!cuenta) {
      throw regla('ENLACE_INVALIDO', 'El enlace no es válido, ya se usó o venció. Solicita uno nuevo.')
    }
    res.json({ valido: true, correo: cuenta.correo.replace(/^(.{2}).*(@.*)$/, '$1•••$2') })
  }),
)

rutasAuth.post(
  '/restablecer',
  asincrono(async (req, res) => {
    const datos = z
      .object({
        token: z.string().regex(/^[0-9a-f]{64}$/, 'El enlace no es válido'),
        nueva: contrasenaSegura,
        confirmacion: z.string(),
      })
      .refine((d) => d.nueva === d.confirmacion, {
        message: 'Las contraseñas no coinciden', path: ['confirmacion'],
      })
      .parse(req.body)

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
    await registrarAcceso(req, { usuarioId: cuenta.id, identificador: cuenta.correo, resultado: 'restablecimiento', canal: 'web' })
    res.json({ mensaje: 'Tu contraseña se restableció. Ya puedes iniciar sesión.' })
  }),
)

// ------------------------------------------- HU_75 · registrarme en el portal

const registro = z
  .object({
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

/** Nombre de usuario libre a partir del correo: ana.suarez, ana.suarez2… */
async function nombreUsuarioLibre(correo: string): Promise<string> {
  const base = correo.split('@')[0]!.replace(/[^a-z0-9._-]/gi, '').slice(0, 40).toLowerCase() || 'cliente'
  const usados = await consultar<{ nombre_usuario: string }>(
    `SELECT nombre_usuario FROM usuario WHERE nombre_usuario ~ ('^' || $1 || '[0-9]*$')`,
    [base.replace(/[.]/g, '\\.')],
  )
  const set = new Set(usados.map((u) => u.nombre_usuario))
  if (!set.has(base)) return base
  for (let i = 2; ; i++) if (!set.has(`${base}${i}`)) return `${base}${i}`
}

rutasAuth.post(
  '/registro',
  asincrono(async (req, res) => {
    const d = registro.parse(req.body)

    const rolCliente = await unaFila<{ id: number }>(
      `SELECT id FROM rol WHERE nombre = 'Cliente' AND estado = 'activo'`,
    )
    if (!rolCliente) {
      throw regla('REGISTRO_CERRADO', 'El registro en el portal no está disponible en este momento.')
    }

    // CA_75_02 · correo único entre las cuentas
    if (await unaFila(`SELECT 1 FROM usuario WHERE correo = $1`, [d.correo])) {
      throw conflicto('CORREO_EN_USO', 'Ya hay una cuenta con ese correo. Inicia sesión o recupera tu contraseña.')
    }

    const existente = await unaFila<{ id: number; usuario_id: number | null; estado: string }>(
      `SELECT id, usuario_id, estado FROM cliente WHERE documento_identidad = $1`,
      [d.documento],
    )
    if (existente?.usuario_id) {
      throw conflicto('DOCUMENTO_EN_USO', 'Ese documento ya tiene una cuenta en el portal. Inicia sesión o recupera tu contraseña.')
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
              SET usuario_id = $2, nombres = $3, apellidos = $4, telefono = $5, direccion = $6, correo = $7
            WHERE id = $1`,
          [existente.id, usuario!.id, d.nombres, d.apellidos, d.telefono, d.direccion, d.correo],
          tx,
        )
        return existente.id
      }

      // CA_75_05 · fecha de registro automática
      const cliente = await unaFila<{ id: number }>(
        `INSERT INTO cliente (documento_identidad, nombres, apellidos, telefono, direccion, correo, usuario_id, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'activo') RETURNING id`,
        [d.documento, d.nombres, d.apellidos, d.telefono, d.direccion, d.correo, usuario!.id],
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
    res.status(201).json({
      mensaje: existente
        ? 'Tu cuenta quedó creada y vinculada a tu historial con RvR Tecnologías. Ya puedes iniciar sesión.'
        : 'Tu cuenta quedó creada. Ya puedes iniciar sesión.',
      vinculado: Boolean(existente),
      nombreUsuario,
    })
  }),
)

// ---------------------------------------------------------------- perfil

rutasAuth.get(
  '/perfil',
  sesion,
  asincrono(async (req, res) => {
    const cuenta = await cuentaPorId(req.sesion!.usuarioId)
    if (!cuenta) throw new ErrorHttp(401, 'SESION_INVALIDA', 'La cuenta ya no existe.')
    res.json(cuenta)
  }),
)

/** Mis datos, para el personal. El cliente actualiza los suyos en /portal/perfil. */
rutasAuth.put(
  '/perfil',
  sesion,
  asincrono(async (req, res) => {
    const d = z
      .object({
        nombres: textoRequerido(100, 'Los nombres'),
        apellidos: textoRequerido(100, 'Los apellidos'),
        correo: correoRequerido,
        telefono,
      })
      .parse(req.body)

    await consultar(
      `UPDATE usuario SET nombres = $2, apellidos = $3, correo = $4, telefono = $5 WHERE id = $1`,
      [req.sesion!.usuarioId, d.nombres, d.apellidos, d.correo, d.telefono],
    )
    res.json(await cuentaPorId(req.sesion!.usuarioId))
  }),
)

/** CA_77_04 · cambio de contraseña exigiendo la actual. */
rutasAuth.post(
  '/contrasena',
  sesion,
  asincrono(async (req, res) => {
    const d = z
      .object({ actual: z.string().min(1, 'Ingresa tu contraseña actual'), nueva: contrasenaSegura, confirmacion: z.string().optional() })
      .refine((v) => v.confirmacion === undefined || v.confirmacion === v.nueva, {
        message: 'Las contraseñas no coinciden', path: ['confirmacion'],
      })
      .parse(req.body)

    const fila = await unaFila<{ contrasena_hash: string }>(
      `SELECT contrasena_hash FROM usuario WHERE id = $1`,
      [req.sesion!.usuarioId],
    )
    const coincide = fila && (await bcrypt.compare(d.actual, fila.contrasena_hash).catch(() => false))
    if (!coincide) throw regla('CONTRASENA_ACTUAL', 'La contraseña actual no coincide.')
    if (d.actual === d.nueva) throw regla('CONTRASENA_IGUAL', 'La contraseña nueva debe ser distinta de la actual.')

    await consultar(`UPDATE usuario SET contrasena_hash = $2 WHERE id = $1`, [
      req.sesion!.usuarioId,
      await bcrypt.hash(d.nueva, 10),
    ])
    res.status(204).end()
  }),
)
