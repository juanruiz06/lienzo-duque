---
name: nuevo-evento
description: Añade un evento de analítica de producto al catálogo tipado (AppEvents) y lo dispara en el sitio correcto, sin datos personales. Úsala cuando quieran medir algo ("cuánta gente usa X", "cuántos completan Y").
argument-hint: '[qué se quiere medir]'
---

# Nuevo evento de analítica

Medir: $ARGUMENTS

1. **Pregunta de negocio primero**: ¿qué decisión tomarás con este dato? Si no hay ninguna, quizá no hace falta el evento.
2. **Nombre**: `objeto_accion` en inglés, pasado, snake_case (`task_completed`, `invite_sent`). Revisa que no exista ya uno equivalente en `src/observability/analytics.ts`.
3. **Propiedades**: pocas, útiles y **sin datos personales** (INV-PRIV-1): nada de emails, nombres, textos escritos por el usuario, ubicación exacta. Sí: contadores, longitudes, categorías, booleanos, ids opacos si hace falta.
4. **Añádelo al catálogo** `AppEvents` en `src/observability/analytics.ts`:
   ```ts
   task_completed: {
     from: 'list' | 'detail';
     had_due_date: boolean;
   }
   ```
   (`Record<string, never>` si no lleva propiedades.)
5. **Dispáralo** con `trackEvent('task_completed', {...})` en el `onSuccess` del hook de la mutación
   (no en la pantalla, y nunca antes de que el servidor confirme).
6. `npm run check`. Explica dónde verlo: hoy solo sale en la consola de Metro en desarrollo; con
   PostHog conectado (nivel 3, `docs/graduacion/03-observabilidad.md`) aparece en su panel.
