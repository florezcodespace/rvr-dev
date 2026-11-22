---
name: Portal RvR Tecnologías
description: Soporte técnico, redes, servidores, cámaras y alarmas en Medellín, con cada orden a la vista en el portal del cliente.
colors:
  azul-logo: "#0a6cf0"
  azul-logo-hover: "#0059d6"
  azul-vivo: "#1e88ff"
  azul-cielo: "#8ec5ff"
  tinta: "#1c283c"
  fondo: "#edf2f8"
  vidrio: "rgb(255 255 255 / 0.74)"
  vidrio-denso: "rgb(255 255 255 / 0.9)"
  texto: "#0f1b2d"
  texto-secundario: "#3c4a60"
  exito: "#16a34a"
  advertencia: "#f59e0b"
  error: "#ef4444"
typography:
  display:
    fontFamily: "Sora, 'Plus Jakarta Sans', system-ui, sans-serif"
    fontWeight: 800
    letterSpacing: "-0.03em"
  body:
    fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.6
rounded:
  control: "12px"
  tarjeta: "18px"
  panel: "24px"
  pildora: "999px"
components:
  boton-primario:
    backgroundColor: "{colors.azul-logo}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
  tarjeta:
    backgroundColor: "{colors.vidrio}"
    rounded: "{rounded.tarjeta}"
---

# Design System: Portal RvR Tecnologías · «Cristal»

## Overview

Vidrio translúcido tipo iOS sobre un fondo claro con luces suaves en los azules del logo. Limpio: colores planos, sin degradados en botones, textos ni tarjetas. Con vida: títulos que entran palabra a palabra, tarjetas que aparecen al hacer scroll y suben al pasar el cursor, luces que derivan despacio, barra de navegación flotante.

Base: la versión original del portal (Plus Jakarta Sans + Sora, tarjetas vivas, animaciones), con los colores del logo en lugar del índigo y el vidrio como material común.

## Colors
- **Azul del logo** `#0a6cf0`: acción (botones, activo del menú, interruptores). Hover `#0059d6`.
- **Azul tinta** `#1c283c`: el negro de la marca; panel del login, llamado final, iconos alternos.
- **Fondo** `#edf2f8` con tres luces fijas (`.luces-fondo` en `index.html`), que son lo que el vidrio deja ver.
- Estados: verde, ámbar, rojo, cian y azul con su versión suave al 10–15 %.

## Typography
Sora (800) para titulares h1/h2; Plus Jakarta Sans para todo lo demás, con cifras tabulares en el portal. Ambas servidas desde `public/fonts` (SIL OFL).

## Elevation & Depth
- `.vidrio`: blanco al 74 %, `backdrop-filter: blur(22px) saturate(180%)`, filo de luz arriba y sombra larga suave.
- `.vidrio-denso`: menús, diálogos, barra inferior del celular.
- `.vidrio-oscuro`: tarjetas sobre azul tinta.
- `.tarjeta` (Card) ya es vidrio.

## Shapes
Controles 12 px, tarjetas 18 px, paneles 24–36 px, estados en píldora.

## Components
Menú lateral y barra superior flotantes de vidrio; activo en píldora azul llena. Indicadores tipo widget (chip redondo con glifo de color). Interruptores tipo iOS en el cotizador. Control segmentado para categorías.

## Landing: momentos de marca
- **Portal «RVR»** (`GlyphPortal` en `shared/components/ui`, MIT, con su aviso): entre el hero y Servicios, «RVR» en Sora 800 con «TECNOLOGÍA» debajo. Al bajar, la cámara entra por la V a una escena azul tinta con luces y aparece la bienvenida. Respeta `prefers-reduced-motion` (queda estático).
- **Reflejo** (`.reflejo`): una luz suave sigue el cursor sobre las tarjetas de vidrio de la landing; solo con mouse.
- **Inclinación 3D** (`.inclinable`) de la tarjeta de muestra del hero, máx. 7°.
- **Progreso de lectura**: línea azul bajo la barra flotante.

- **Vidrio doblado** (`GlassFold`, WebGL, basado en GradFlow): relleno de «RVR» y de la escena de bienvenida, y fondo del cierre de contacto. Colores: cuerpo `#0a6cf0`, fondo `#0f1a2e`, bordes `#8ec5ff`. Se pausa fuera de pantalla; sin WebGL queda el azul tinta.
- **Splash de la landing** (index.html): dibuja el mismo shader con el mismo reloj (`performance.now`) recortado a «RVR» en la misma posición que la portada; el relevo no se mueve. Si cambia el shader o los colores, cambiarlos en ambos sitios.

## Do's and Don'ts
- **Do** mantener las animaciones de entrada y respetar `prefers-reduced-motion`.
- **Don't** degradados, fotos de banco, cifras de negocio o testimonios inventados.
