/*
 * Inventario de licencias del Portal RvR Tecnologías.
 * Una sola fuente: la usan index.html (página) y mapa.html (mapa conceptual).
 *
 * Para cambiar el titular o los autores, edita solo `proyecto`.
 * Versiones sacadas de frontend/package-lock.json (web), backend/package-lock.json (API)
 * y pubspec.lock (app móvil) el día de `proyecto.corte`.
 */
window.LICENCIAS = {
  proyecto: {
    nombre: 'Portal RvR Tecnologías',
    titular: 'Equipo de desarrollo Portal RvR',
    año: 2026,
    cliente: 'RvR Tecnologías S.A.S.',
    licencia: 'Software privativo',
    corte: '11 de noviembre de 2026',
    contexto: 'Proyecto formativo · Tecnólogo ADSO · SENA',
    leyes: [
      'Ley 23 de 1982 (derecho de autor)',
      'Decisión Andina 351 de 1993',
      'Decreto 1360 de 1989 (soporte lógico)',
      'Ley 1915 de 2018',
    ],
    reglas: [
      { icono: 'ok', titulo: 'Uso autorizado', texto: 'Solo RvR Tecnologías, para la operación interna de su negocio.' },
      { icono: 'no', titulo: 'Sin copia ni distribución', texto: 'No se permite copiar, modificar, publicar, vender ni sublicenciar el software.' },
      { icono: 'candado', titulo: 'Sin ingeniería inversa', texto: 'No se permite descompilar ni analizar el código para reproducirlo.' },
      { icono: 'marca', titulo: 'Marca protegida', texto: 'El nombre y el logo de RvR Tecnologías son de la empresa; no se usan sin su permiso.' },
    ],
  },

  /* Familias de licencia: color y grupo para la gráfica y las insignias. */
  familias: {
    'MIT': { grupo: 'permisiva', color: '#0a6cf0' },
    'MIT-0': { grupo: 'permisiva', color: '#5ea3ff' },
    'ISC': { grupo: 'permisiva', color: '#8ec5ff' },
    'BSD-2-Clause': { grupo: 'permisiva', color: '#67d3e6' },
    'BSD-3-Clause': { grupo: 'permisiva', color: '#06a8c8' },
    'Apache-2.0': { grupo: 'permisiva', color: '#16a34a' },
    'PostgreSQL': { grupo: 'permisiva', color: '#f97316' },
    'MPL-2.0': { grupo: 'copyleft débil', color: '#f59e0b' },
    'OFL-1.1': { grupo: 'fuentes', color: '#1c283c' },
    'CC-BY-4.0': { grupo: 'permisiva', color: '#8b5cf6' },
    'Propio': { grupo: 'propio', color: '#536179' },
    'Por confirmar': { grupo: 'pendiente', color: '#ef4444' },
  },

  capas: [
    {
      id: 'web',
      titulo: 'Portal web',
      sub: 'Llega al navegador',
      icono: 'navegador',
      items: [
        { nombre: 'React', version: '19.2.8', uso: 'Biblioteca de interfaz', licencia: 'MIT', url: 'https://react.dev' },
        { nombre: 'React DOM', version: '19.2.8', uso: 'Dibuja React en el navegador', licencia: 'MIT', url: 'https://react.dev' },
        { nombre: 'React Router', version: '7.18.3', uso: 'Rutas de los tres portales', licencia: 'MIT', url: 'https://reactrouter.com' },
        { nombre: 'React Hook Form', version: '7.87.0', uso: 'Formularios', licencia: 'MIT', url: 'https://react-hook-form.com' },
        { nombre: '@hookform/resolvers', version: '5.9.1', uso: 'Une los formularios con Zod', licencia: 'MIT', url: 'https://github.com/react-hook-form/resolvers' },
        { nombre: 'Zod', version: '4.5.4', uso: 'Validación de datos', licencia: 'MIT', url: 'https://zod.dev' },
        { nombre: 'clsx', version: '2.1.1', uso: 'Clases CSS condicionales', licencia: 'MIT', url: 'https://github.com/lukeed/clsx' },
        { nombre: 'PGlite', version: '0.5.8', uso: 'PostgreSQL en el navegador', licencia: 'Apache-2.0', url: 'https://pglite.dev', nota: 'solo demo' },
        { nombre: 'bcryptjs', version: '3.0.3', uso: 'Cifra las claves dentro del navegador', licencia: 'BSD-3-Clause', url: 'https://github.com/dcodeIO/bcrypt.js', nota: 'solo demo' },
        { nombre: 'bin-list-data (Venelin Kochev)', version: 'feb 2025', uso: 'Reconoce el banco de la tarjeta (1.158 BINs de Colombia)', licencia: 'CC-BY-4.0', url: 'https://github.com/venelinkochev/bin-list-data', nota: 'datos' },
      ],
    },
    {
      id: 'web-dev',
      titulo: 'Web · desarrollo',
      sub: 'No llega al navegador',
      icono: 'llave',
      items: [
        { nombre: 'Vite', version: '8.2.2', uso: 'Compila y sirve el portal', licencia: 'MIT', url: 'https://vite.dev' },
        { nombre: '@vitejs/plugin-react', version: '6.1.1', uso: 'Soporte de React en Vite', licencia: 'MIT', url: 'https://github.com/vitejs/vite-plugin-react' },
        { nombre: 'Tailwind CSS', version: '4.3.3', uso: 'Estilos utilitarios', licencia: 'MIT', url: 'https://tailwindcss.com' },
        { nombre: '@tailwindcss/vite', version: '4.3.3', uso: 'Tailwind dentro de Vite', licencia: 'MIT', url: 'https://tailwindcss.com' },
        { nombre: 'TypeScript', version: '6.0.3', uso: 'Tipos y compilación', licencia: 'Apache-2.0', url: 'https://www.typescriptlang.org' },
        { nombre: 'Oxlint', version: '1.81.0', uso: 'Revisión del código', licencia: 'MIT', url: 'https://oxc.rs' },
        { nombre: '@types/react · react-dom · node', version: '19.2 · 24.13', uso: 'Tipos para TypeScript', licencia: 'MIT', url: 'https://github.com/DefinitelyTyped/DefinitelyTyped' },
      ],
    },
    {
      id: 'api',
      titulo: 'API y base de datos',
      sub: 'Corre en el servidor',
      icono: 'servidor',
      items: [
        { nombre: 'Node.js', version: '24.20.0', uso: 'Entorno de ejecución', licencia: 'MIT', url: 'https://nodejs.org' },
        { nombre: 'Express', version: '5.2.1', uso: 'Servidor HTTP y rutas', licencia: 'MIT', url: 'https://expressjs.com' },
        { nombre: 'pg (node-postgres)', version: '8.23.0', uso: 'Conexión con PostgreSQL', licencia: 'MIT', url: 'https://node-postgres.com' },
        { nombre: 'jsonwebtoken', version: '9.0.3', uso: 'Tokens de sesión (JWT)', licencia: 'MIT', url: 'https://github.com/auth0/node-jsonwebtoken' },
        { nombre: 'bcryptjs', version: '3.0.3', uso: 'Cifrado de contraseñas', licencia: 'BSD-3-Clause', url: 'https://github.com/dcodeIO/bcrypt.js' },
        { nombre: 'cors', version: '2.8.6', uso: 'Acceso desde el portal web', licencia: 'MIT', url: 'https://github.com/expressjs/cors' },
        { nombre: 'dotenv', version: '17.4.2', uso: 'Variables de entorno', licencia: 'BSD-2-Clause', url: 'https://github.com/motdotla/dotenv' },
        { nombre: 'Nodemailer', version: '7.0.13', uso: 'Envío de correos', licencia: 'MIT-0', url: 'https://nodemailer.com' },
        { nombre: 'Zod', version: '4.6.5', uso: 'Validación de peticiones', licencia: 'MIT', url: 'https://zod.dev' },
        { nombre: 'PostgreSQL', version: '—', uso: 'Base de datos', licencia: 'PostgreSQL', url: 'https://www.postgresql.org/about/licence/' },
        { nombre: 'tsx', version: '4.23.13', uso: 'Corre la API en desarrollo', licencia: 'MIT', url: 'https://tsx.is', nota: 'desarrollo' },
        { nombre: 'TypeScript', version: '5.9.3', uso: 'Compila la API', licencia: 'Apache-2.0', url: 'https://www.typescriptlang.org', nota: 'desarrollo' },
        { nombre: '@types/* (6 paquetes)', version: '—', uso: 'Tipos para TypeScript', licencia: 'MIT', url: 'https://github.com/DefinitelyTyped/DefinitelyTyped', nota: 'desarrollo' },
      ],
    },
    {
      id: 'movil',
      titulo: 'App móvil',
      sub: 'Técnicos en campo · Flutter',
      icono: 'celular',
      items: [
        { nombre: 'Flutter SDK', version: '3.47.1', uso: 'Framework de la app', licencia: 'BSD-3-Clause', url: 'https://flutter.dev' },
        { nombre: 'Dart', version: '3.13.1', uso: 'Lenguaje de la app', licencia: 'BSD-3-Clause', url: 'https://dart.dev' },
        { nombre: 'flutter_riverpod', version: '2.6.1', uso: 'Manejo del estado', licencia: 'MIT', url: 'https://riverpod.dev' },
        { nombre: 'go_router', version: '14.8.1', uso: 'Navegación entre pantallas', licencia: 'BSD-3-Clause', url: 'https://pub.dev/packages/go_router' },
        { nombre: 'equatable', version: '2.1.0', uso: 'Comparar entidades por valor', licencia: 'MIT', url: 'https://pub.dev/packages/equatable' },
        { nombre: 'intl', version: '0.20.3', uso: 'Fechas y formatos', licencia: 'BSD-3-Clause', url: 'https://pub.dev/packages/intl' },
        { nombre: 'shared_preferences', version: '2.5.5', uso: 'Guarda tema y sesión', licencia: 'BSD-3-Clause', url: 'https://pub.dev/packages/shared_preferences' },
        { nombre: 'Material Icons', version: '—', uso: 'Íconos de la app', licencia: 'Apache-2.0', url: 'https://fonts.google.com/icons' },
        { nombre: 'flutter_lints', version: '4.0.0', uso: 'Revisión del código', licencia: 'BSD-3-Clause', url: 'https://pub.dev/packages/flutter_lints', nota: 'desarrollo' },
        { nombre: 'flutter_launcher_icons', version: '0.14.4', uso: 'Genera el ícono de la app', licencia: 'MIT', url: 'https://pub.dev/packages/flutter_launcher_icons', nota: 'desarrollo' },
        { nombre: 'flutter_native_splash', version: '2.4.8', uso: 'Genera la pantalla de inicio', licencia: 'MIT', url: 'https://pub.dev/packages/flutter_native_splash', nota: 'desarrollo' },
        { nombre: 'image', version: '4.10.1', uso: 'Prepara el logo (script)', licencia: 'MIT', url: 'https://pub.dev/packages/image', nota: 'desarrollo' },
      ],
    },
    {
      id: 'grafica',
      titulo: 'Fuentes y marca',
      sub: 'Lo que se ve · código adaptado',
      icono: 'pincel',
      items: [
        { nombre: 'Sora', version: '—', uso: 'Fuente de los títulos', licencia: 'OFL-1.1', url: 'https://fonts.google.com/specimen/Sora' },
        { nombre: 'Plus Jakarta Sans', version: '—', uso: 'Fuente del texto', licencia: 'OFL-1.1', url: 'https://fonts.google.com/specimen/Plus+Jakarta+Sans' },
        { nombre: 'Logo RvR Tecnologías', version: '—', uso: 'Marca del portal y la app', licencia: 'Propio', nota: 'de RvR' },
        { nombre: 'Iconos del portal', version: '—', uso: 'Trazados SVG hechos para el proyecto', licencia: 'Propio' },
        { nombre: 'Glyph Portal (Christian Katzmann)', version: '—', uso: 'Portal «RVR» de la landing', licencia: 'MIT', url: 'https://ktzm.dk' },
        { nombre: 'Glass Fold (GradFlow)', version: '—', uso: 'Vidrio doblado en WebGL', licencia: 'Por confirmar', url: 'https://gradflow.meerbahadin.dev' },
        { nombre: 'Liquid Glass Button', version: '—', uso: 'Idea del botón de vidrio líquido', licencia: 'Por confirmar' },
      ],
    },
  ],

  /* Paquetes que llegan solos (dependencias de las dependencias). Sin contar
     los binarios hechos para cada sistema operativo. */
  indirectas: [
    { capa: 'Portal web', total: { 'MIT': 5 }, nota: 'react-router, scheduler, cookie…' },
    { capa: 'Web · desarrollo', total: { 'MIT': 21, 'ISC': 2, 'MPL-2.0': 2, 'Apache-2.0': 1, 'BSD-3-Clause': 1 }, nota: 'MPL-2.0: lightningcss, solo compila' },
    { capa: 'API', total: { 'MIT': 95, 'ISC': 7, 'BSD-3-Clause': 2, 'Apache-2.0': 1 }, nota: 'qs, ecdsa-sig-formatter, semver…' },
    { capa: 'App móvil', total: { 'BSD-3-Clause': 41, 'MIT': 8, 'Apache-2.0': 5 }, nota: 'paquetes de Dart y Flutter' },
  ],

  servicios: [
    { nombre: 'GitHub', uso: 'Guarda el código y su historial', url: 'https://docs.github.com/es/site-policy/github-terms/github-terms-of-service' },
    { nombre: 'Vercel', uso: 'Publica la versión de demostración', url: 'https://vercel.com/legal/terms' },
    { nombre: 'Servidor de correo (SMTP)', uso: 'Avisos y recuperación de contraseña', url: '', nota: 'Proveedor según backend/.env' },
    { nombre: 'Google Maps', uso: 'Enlace a la ubicación en la landing', url: 'https://www.google.com/intl/es/help/terms_maps/' },
  ],

  /* Qué permite y qué pide cada licencia, en palabras simples. */
  glosario: [
    { clave: 'MIT', nombre: 'MIT', tipo: 'Permisiva', resumen: 'Se puede usar, cambiar y vender. Solo pide conservar el aviso de autor.', pide: ['Conservar el aviso de copyright'] },
    { clave: 'MIT-0', nombre: 'MIT sin atribución', tipo: 'Permisiva', resumen: 'Igual que MIT, pero ni siquiera exige conservar el aviso.', pide: ['Nada'] },
    { clave: 'ISC', nombre: 'ISC', tipo: 'Permisiva', resumen: 'Una MIT más corta. Mismos permisos.', pide: ['Conservar el aviso de copyright'] },
    { clave: 'BSD-2-Clause', nombre: 'BSD de 2 cláusulas', tipo: 'Permisiva', resumen: 'Uso libre, también comercial.', pide: ['Conservar el aviso de copyright'] },
    { clave: 'BSD-3-Clause', nombre: 'BSD de 3 cláusulas', tipo: 'Permisiva', resumen: 'Como la BSD-2, y además prohíbe usar el nombre de los autores para promocionarse.', pide: ['Conservar el aviso', 'No usar su nombre como respaldo'] },
    { clave: 'Apache-2.0', nombre: 'Apache 2.0', tipo: 'Permisiva', resumen: 'Uso libre. Además da permiso sobre las patentes del código.', pide: ['Conservar el aviso y el archivo NOTICE', 'Indicar los archivos cambiados'] },
    { clave: 'PostgreSQL', nombre: 'Licencia PostgreSQL', tipo: 'Permisiva', resumen: 'Parecida a BSD y MIT. Uso libre, también comercial.', pide: ['Conservar el aviso de copyright'] },
    { clave: 'MPL-2.0', nombre: 'Mozilla 2.0', tipo: 'Copyleft débil', resumen: 'Si cambias sus archivos y los repartes, debes publicar esos archivos. Aquí solo compila los estilos: no se reparte.', pide: ['Publicar sus archivos si se modifican y distribuyen'] },
    { clave: 'CC-BY-4.0', nombre: 'Creative Commons Atribución 4.0', tipo: 'Permisiva', resumen: 'Para datos y contenidos: se usan y cambian libremente, citando al autor.', pide: ['Dar crédito al autor', 'Enlazar la licencia e indicar cambios'] },
    { clave: 'OFL-1.1', nombre: 'SIL Open Font License', tipo: 'Fuentes', resumen: 'Las fuentes se usan gratis en webs y apps. No se pueden vender solas.', pide: ['Incluir la licencia al repartir la fuente', 'No venderla por separado'] },
    { clave: 'Propio', nombre: 'Material propio', tipo: 'Propio', resumen: 'Hecho por el equipo o entregado por RvR. Lo cubre la licencia privativa del sistema.', pide: ['Permiso del titular'] },
    { clave: 'Por confirmar', nombre: 'Por confirmar', tipo: 'Pendiente', resumen: 'Código adaptado de un tercero que no publica su licencia. Hay que pedirla o reemplazarlo antes de la entrega.', pide: ['Revisar los términos del autor'] },
  ],

  /* Cómo cumple el proyecto cada obligación. */
  cumplimiento: [
    { hecho: true, texto: 'Las fuentes Sora y Plus Jakarta Sans viajan con su texto OFL (public/fonts).' },
    { hecho: true, texto: 'Glyph Portal conserva su aviso MIT en el archivo, como pide su autor.' },
    { hecho: true, texto: 'La tabla de BINs cita a bin-list-data y su licencia CC-BY-4.0 en el archivo generado.' },
    { hecho: true, texto: 'Ninguna dependencia es GPL ni AGPL: no obligan a abrir el código propio.' },
    { hecho: true, texto: 'lightningcss (MPL-2.0) solo compila los estilos; no se reparte ni se modifica.' },
    { hecho: false, texto: 'Glass Fold (GradFlow) y Liquid Glass Button: confirmar la licencia con sus autores.' },
  ],
}
