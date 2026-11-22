/**
 * Contenido de la landing. Todo es real del negocio (catálogo, contacto,
 * recorrido de la orden); lo que es muestra del portal se dice como tal.
 */

/* ------------------------------------------------------------------ */
/* Catálogo: mismos valores que db/02-catalogos.sql                    */
/* ------------------------------------------------------------------ */

export interface ServicioLanding {
  id: number
  nombre: string
  categoria: string
  precioBase: number
  duracionMin: number
  diasGarantia: number
}

export const CATALOGO: ServicioLanding[] = [
  { id: 1, nombre: 'Mantenimiento preventivo de computador', categoria: 'Mantenimiento', precioBase: 120000, duracionMin: 90, diasGarantia: 30 },
  { id: 2, nombre: 'Mantenimiento correctivo de computador', categoria: 'Mantenimiento', precioBase: 180000, duracionMin: 180, diasGarantia: 60 },
  { id: 3, nombre: 'Mantenimiento preventivo de impresora', categoria: 'Mantenimiento', precioBase: 95000, duracionMin: 60, diasGarantia: 30 },
  { id: 4, nombre: 'Formateo e instalación de sistema operativo', categoria: 'Mantenimiento', precioBase: 110000, duracionMin: 150, diasGarantia: 15 },
  { id: 5, nombre: 'Instalación y configuración de servidor', categoria: 'Servidores', precioBase: 1500000, duracionMin: 480, diasGarantia: 90 },
  { id: 6, nombre: 'Mantenimiento de servidor', categoria: 'Servidores', precioBase: 450000, duracionMin: 240, diasGarantia: 60 },
  { id: 7, nombre: 'Configuración de red IP', categoria: 'Redes', precioBase: 280000, duracionMin: 240, diasGarantia: 90 },
  { id: 8, nombre: 'Instalación de punto de red', categoria: 'Redes', precioBase: 85000, duracionMin: 90, diasGarantia: 180 },
  { id: 9, nombre: 'Instalación de cámara de seguridad', categoria: 'Cámaras de seguridad', precioBase: 250000, duracionMin: 120, diasGarantia: 180 },
  { id: 10, nombre: 'Kit de videovigilancia de 4 cámaras', categoria: 'Cámaras de seguridad', precioBase: 1650000, duracionMin: 360, diasGarantia: 365 },
  { id: 11, nombre: 'Instalación de sistema de alarma', categoria: 'Alarmas', precioBase: 900000, duracionMin: 300, diasGarantia: 365 },
  { id: 12, nombre: 'Mantenimiento de sistema de alarma', categoria: 'Alarmas', precioBase: 160000, duracionMin: 90, diasGarantia: 60 },
]

export const CATEGORIAS = ['Mantenimiento', 'Servidores', 'Redes', 'Cámaras de seguridad', 'Alarmas'] as const

/** Precio más bajo de una categoría (para «desde $…»). */
export const desdeCategoria = (categoria: string) =>
  Math.min(...CATALOGO.filter((s) => s.categoria === categoria).map((s) => s.precioBase))

/* ------------------------------------------------------------------ */
/* Recorrido de una orden (así funciona el sistema)                     */
/* ------------------------------------------------------------------ */

export const ETAPAS = [
  { nombre: 'Solicitud', texto: 'Elige los servicios del catálogo y nos cuenta qué está fallando. Queda guardado en su portal.' },
  { nombre: 'Cotización', texto: 'Un técnico la valora y le envía cada servicio con su precio. Usted la aprueba o la rechaza.' },
  { nombre: 'Anticipo', texto: 'Paga el 50 % por el medio que prefiera y sube el comprobante. RvR lo revisa y le confirma.' },
  { nombre: 'Visita', texto: 'Agendamos la visita en una franja de dos horas, con el técnico asignado a la vista.' },
  { nombre: 'Entrega', texto: 'El técnico deja el reporte con el diagnóstico y la solución. Usted paga el saldo.' },
  { nombre: 'Garantía', texto: 'La garantía empieza el día de la entrega. Si algo falla, la reclama desde el portal.' },
] as const

/* ------------------------------------------------------------------ */
/* Contacto                                                           */
/* ------------------------------------------------------------------ */

export const CONTACTO = {
  direccion: 'Calle 90 N 46-16, Int 302',
  ciudad: 'Medellín, Antioquia',
  mapa: 'https://maps.google.com/?q=Calle+90+46-16+Medellin',
  telefono: '+57 301 527 0761',
  telefonoHref: 'tel:+573015270761',
  correo: 'info@rvrtecnologias.com.co',
} as const

export const SECTORES = [
  'Oficinas',
  'Consultorios',
  'Bodegas',
  'Comercios y locales',
  'Conjuntos residenciales',
  'Colegios',
  'Talleres',
  'Hogares',
]
