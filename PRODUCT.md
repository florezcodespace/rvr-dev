# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Clientes de RvR Tecnologías** (empresas y hogares del Área Metropolitana de Medellín): llegan a la landing buscando quién les resuelva soporte técnico, redes, servidores, cámaras o alarmas; luego usan el portal del cliente para pedir servicios, aprobar cotizaciones, seguir sus órdenes, reportar pagos y reclamar garantías.
- **Personal de RvR** (Administrador y Coordinador): trabajan a diario en el portal administrativo: cotizaciones, órdenes de servicio, agenda de visitas, clientes, ventas, abonos, comprobantes y garantías.
- **Técnicos**: trabajan desde una aplicación móvil aparte (no es parte de esta web); la web solo los remite allá.

## Product Purpose

Centralizar la operación técnica de RvR Tecnologías: que el cliente pida y siga su servicio sin escribir por WhatsApp, y que el equipo tenga cada cotización, orden, visita, pago y garantía trazable en un solo lugar.

## Positioning

- **Un solo equipo para todo:** mantenimiento de computadores e impresoras, servidores, redes y cableado, cámaras de seguridad y alarmas con la misma empresa.
- **Seguimiento en el portal:** el cliente ve en línea su cotización, su orden, la visita del técnico, sus pagos y su garantía.

## Operating Context

Flujo real del servicio: solicitud del cliente → cotización (servicios del catálogo + repuestos) → aprobación → orden de servicio → anticipo del 50 % → visita agendada con un técnico → ejecución y reporte técnico desde el móvil → saldo → orden finalizada → garantía (días según el servicio). Los pagos se registran como abonos; el cliente puede subir el comprobante para que RvR lo apruebe.

## Capabilities and Constraints

- Stack: React 19 + Vite + Tailwind 4, API Express + PostgreSQL; demo en el navegador con PGlite (despliegue en Vercel sin backend).
- Roles y permisos configurables; módulos según la ficha técnica y la matriz de historias de usuario v6 del proyecto.
- Catálogo con precio base, tiempo estimado y días de garantía por servicio (datos de demostración).

## Brand Commitments

- Nombre: RvR Tecnologías. Lema existente: «Soluciones a su alcance».
- Logo en `public/marca/` (azul tinta #1c283c y el azul eléctrico de la V, #0050c8 → #0088f8). Estilo «Cristal»: vidrio translúcido tipo iOS, limpio, sin degradados ni fotos (DESIGN.md).
- Trato de «usted» en la landing; «tú» en el portal del cliente.

## Evidence on Hand

- Contacto publicado en la landing: Calle 90 N 46-16 Int 302, Medellín · +57 301 527 0761 · info@rvrtecnologias.com.co.
- **No hay** fotos propias de RvR: se usan imágenes con licencia libre del entorno, con crédito, nunca presentadas como trabajos de RvR.
- **No hay** cifras confirmadas: «+500 servicios», «10+ años» y «cotización en 24 h» eran de ejemplo y no se publican.
- **No hay** testimonios, clientes, logos de clientes ni prensa: no se inventan.

## Product Principles

1. Que el cliente siempre sepa en qué va su servicio.
2. Un solo responsable para toda la tecnología del cliente.
3. Todo queda por escrito: cotización, reporte técnico, pagos y garantía.
4. Nada inventado: las cifras, fotos y testimonios solo si son reales.

## Accessibility & Inclusion

Contraste AA, uso cómodo desde el celular (clientes que revisan su orden en el teléfono), textos en español claro.
