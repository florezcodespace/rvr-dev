> **Reemplazado (19 oct 2026):** la referencia vigente es `DESIGN.md` en la raíz del proyecto, alineada con el Manual de Identidad Cromática de RvR (`docs/diseno/manual-identidad-cromatica.html`). Este archivo queda como historial del primer pase de diseño.

# Sistema de diseño · Portal RvR Tecnologías

Hecho siguiendo el flujo de la skill **UI/UX Pro Max** (analizar → sistema de
diseño → diales → reglas por prioridad). La base de datos de búsqueda de la
skill no estaba disponible en la sesión, así que estilo, paleta y tipografía
salen de sus reglas por defecto y de la marca de RvR, no de una búsqueda.

Feedback de origen: *«mejorar el diseño para que no se vea tan IA»* (Diego).

## 1. Análisis

| | |
|---|---|
| Producto | Operación de servicios técnicos B2B: portal administrativo, portal del cliente y landing |
| Público | Personal de RvR (uso diario, mucha tabla) y clientes empresa/hogar en Medellín |
| Pila | React 19 + Vite + Tailwind 4 (tokens CSS `--rvr-*`) |
| Palabras clave | confiable, técnico, ordenado, local, sin adornos |

## 2. Diales

| Dial | Valor | Por qué |
|---|---|---|
| Variación de estilo | 3 / 10 | Herramienta de trabajo: lo raro cansa |
| Movimiento | 2 / 10 | Solo transiciones de estado, nada que flote |
| Densidad | 6 / 10 | Tablas y formularios largos: más datos por pantalla |

## 3. Estilo: «utilitario suizo»

Plano, con estructura por bordes de 1 px y jerarquía tipográfica. Un solo color
de acento usado con intención. Sombras solo en lo que flota (menús, diálogos).

### Lo que delataba «hecho por IA» y se quitó

- Índigo + violeta (`#4f46e5` / `#7c3aed`) en todo, degradados en botones y titulares.
- Halos de color bajo botones, orbes difuminados y partículas en el fondo.
- Retícula de fondo en el hero, línea de luz en el borde de las tarjetas.
- Palabras del titular pintadas de otro color.
- Icono en cuadrito de color en la esquina de cada tarjeta de indicador.
- Todo en píldora (radios de 14–20 px) y tarjetas que «saltan» al pasar el mouse.
- Plus Jakarta Sans + Sora: la pareja tipográfica de mil plantillas.

## 4. Color (de la marca)

El logo es azul tinta + azul eléctrico. De ahí sale todo:

| Token | Claro | Oscuro | Uso |
|---|---|---|---|
| `--rvr-ink` | `#13203a` | — | Menú lateral, panel de marca, titulares de la landing |
| `--rvr-primary` | `#1f5fd1` | `#4c86f0` | Acciones principales, enlaces, foco |
| `--rvr-bg` | `#f4f5f7` | `#0e1116` | Fondo de página |
| `--rvr-surface` | `#ffffff` | `#151a21` | Tarjetas y tablas |
| `--rvr-border` | `#e1e4e9` | `#262d37` | Estructura |

Contraste comprobado: texto `#13203a` sobre blanco 16.2:1; primario `#1f5fd1`
sobre blanco 5.8:1 (AA en texto normal); blanco sobre primario 5.8:1.

Los estados (pendiente, en proceso, finalizada…) bajan saturación y se apoyan
en glifo + texto, nunca solo en color.

## 5. Tipografía

- **IBM Plex Sans** (400/500/600/700) para todo: técnica, legible, con carácter
  propio y alineada con una empresa de tecnología.
- **IBM Plex Mono** para códigos (OS-2026-0001), dinero y fechas en tablas.
- Titulares en 600, sin tracking negativo agresivo. Base 14 px en el portal.

## 6. Forma

| | Radio |
|---|---|
| Controles (botón, campo) | 6 px |
| Tarjetas, tablas, diálogos | 8 px |
| Insignias de estado | 4 px |

## 7. Reglas por prioridad (de la skill) aplicadas

1. **Accesibilidad:** contraste AA, foco visible de 2 px, iconos con nombre accesible.
2. **Interacción:** objetivos de 32 px mínimo en escritorio, estados de carga en botones.
3. **Rendimiento:** sin capas animadas de fondo (orbes, partículas).
4. **Estilo:** iconos SVG del set propio, nada de emojis.
5. **Responsive:** sin scroll horizontal; tablas con columnas que se recortan.
6. **Tipografía y color:** tokens semánticos, nada de colores sueltos.
7. **Animación:** 120–180 ms, solo opacidad/color; respeta `prefers-reduced-motion`.
8. **Formularios:** etiqueta visible, error junto al campo, ayuda debajo.

## 8. Qué se cambió en el código (octubre 2026)

| Archivo | Cambio |
|---|---|
| `src/styles/tokens.css` | Paleta nueva (tinta + azul del logo), sin degradados, halos ni sombras de tarjeta. Respaldo: `_respaldos/tokens-antes-diseno.css` |
| `src/styles/componentes.css` | Botones planos, tarjetas sin salto ni filo de luz, menú lateral en azul tinta (`.lateral-tinta`) |
| `index.html`, `src/styles/index.css` | IBM Plex Sans / Mono en lugar de Plus Jakarta + Sora + JetBrains |
| `src/shared/components/ui/*` | Radios 6/8 px, `PageHeader` sin texto animado, `StatCard` sin icono en la esquina, insignias en minúscula |
| `src/shared/components/decor/*` | Orbes y partículas desactivados (respaldo en `_respaldos/decor/`) |
| `src/features/landing/*` | Hero con titular de un color, secciones alineadas a la izquierda, pasos numerados, sin cinta animada |
| `src/features/auth/components/BrandPanel.tsx` | Panel del login azul tinta plano |
| Todos los `.tsx` | Radios grandes → 6/8 px, `font-bold` → `font-semibold`, etiquetas en mayúscula espaciada → texto normal |
