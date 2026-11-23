/**
 * Contenido de la landing. Todo es real del negocio (catálogo, contacto,
 * recorrido de la orden); lo que es muestra del portal se dice como tal.
 */

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
