---
name: pulir-ui
description: Revisa y mejora el diseño y la usabilidad de una pantalla o componente - jerarquía visual, espaciado con tokens, estados, modo oscuro, accesibilidad, textos y sensación nativa. Úsala cuando digan "queda feo", "mejora el diseño", "haz que parezca más profesional" o antes de enseñar la app.
argument-hint: '[pantalla o componente]'
---

# Pulir UI

Objetivo: $ARGUMENTS

## 1. Mira antes de tocar

Abre la pantalla en la app (simulador o `npm run web`) y haz captura si puedes. Lee el código.
Revisa también en **modo oscuro** (en el simulador iOS: Settings → Developer → Dark Appearance).

## 2. Checklist (anota qué falla)

**Jerarquía** — ¿Se sabe en 2 segundos qué es lo importante? Un solo `Button variant="primary"` por
pantalla. Títulos con `variant="title"`, secundarios con `color="textMuted"`.
**Espaciado** — Solo `t.spacing.*` (4/8/16/24/32/48). Mismo margen lateral en toda la app (16).
Agrupa lo relacionado (gap pequeño) y separa lo distinto (gap grande).
**Estados** — Cargando, vacío (con acción para salir de él), error (con reintentar), deshabilitado, pulsado.
**Textos** — Cortos, en castellano natural, verbos en los botones ("Guardar", no "OK"). Sin jerga técnica.
**Toque** — Objetivos ≥ 44 pt, `hitSlop` en iconos pequeños, feedback al pulsar.
**Accesibilidad** — `accessibilityLabel` en iconos sin texto; contraste suficiente (texto `textMuted` sobre `background` se lee); funciona con letra grande (Dynamic Type) sin cortarse.
**Nativo** — Márgenes seguros (notch), teclado no tapa inputs (`Screen scroll`), listas con pull-to-refresh, modales con gesto de cierre, títulos en la barra de navegación.
**Coherencia** — Mismo componente para lo mismo en toda la app. Sin colores fuera del tema.

## 3. Arregla por impacto

Primero lo que confunde o bloquea, luego lo que se ve mal, luego los detalles. Si un cambio de
marca afecta a toda la app (colores, radios), hazlo en `src/theme/tokens.ts`, no pantalla a pantalla.

## 4. Enseña el antes/después

Captura (o describe) antes y después y explica en 3-5 puntos qué mejoró y por qué. `npm run check`.

Para rendimiento de listas y animaciones consulta la skill `vercel-react-native-skills`.
