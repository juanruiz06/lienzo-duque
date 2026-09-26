# Plantilla de spec técnica (implement-task)

Archivo: `docs/specs/NNN-<slug>.md` (o se amplía la spec de producto que ya exista de
`/planificar`). Castellano, claro, sin relleno. En una tarea **media** bastan las secciones
marcadas (M); en una **compleja** van todas.

```markdown
# NNN · <título que diga el resultado para el usuario, no la técnica>

_Fecha: AAAA-MM-DD · Dificultad: media|compleja · Superficie: app / migración / Edge / nativo / servicio externo · Coste: 0 € | …_

## 1. Problema (M)

Qué le pasa hoy al usuario (o qué no puede hacer), con evidencia: capturas, `archivo:línea`.
Si es un bug, la causa raíz, no solo el síntoma.

## 2. Objetivo y fuera de alcance (M)

- Qué cambia para el usuario, en frases que el dueño pueda comprobar en su móvil.
- Qué NO se hace (y por qué), para que nadie lo añada por el camino.

## 3. Decisiones (M)

- Ya cerradas por el dueño que aplican (y dónde constan).
- Del brainstorm: la opción elegida y por qué se descartaron las demás.
- Abiertas: cada una con opciones y recomendación → se cierran en el gate G3.

## 4. Diseño (M)

Por capa, qué cambia y por qué así:

- **Datos/SQL**: tablas, columnas (tipo y límites), quién puede leer/crear/editar/borrar (en
  castellano y como policy), índices, triggers, funciones (firma exacta).
- **Servidor**: Edge Functions, secretos (nombre, dónde se guardan), servicios externos y su coste.
- **App**: funciones de `src/api/`, hooks y `queryKeys`, pantallas y componentes, textos exactos
  en castellano, estados (cargando, vacío, error).
- **Compatibilidad**: si ya hay usuarios con la app instalada, qué ven cuando cambie el servidor.

## 5. Invariantes que aplican (M)

Lista de `INV-*` que esta tarea podría romper y cómo no se rompen.

## 6. Plan por partes (DAG)

Oleadas en orden, archivos distintos dentro de cada oleada, toda la parte SQL en un solo nodo.

| Nodo | Qué           | Archivos                                       | Depende de | Tests que añade     |
| ---- | ------------- | ---------------------------------------------- | ---------- | ------------------- |
| N1   | Esquema zod   | `src/utils/validation.ts`                      | —          | validation.test.ts  |
| N2   | Migración     | `supabase/migrations/<fecha>_<nombre>.sql`     | —          | (CI: check:rls)     |
| N3   | Capa de datos | `src/api/<feature>.ts`, `src/api/queryKeys.ts` | N1, N2     | `<feature>`.test.ts |

## 7. Pruebas (M)

Tests automáticos (qué casos) y checklist para el dueño en su móvil con casos límite (sin
conexión, texto largo, lista vacía, otro usuario, Android/iPhone).

## 8. Despliegue y cómo deshacerlo

Orden (migración → tipos → Edge Function → app), qué necesita OK del dueño, cómo se comprueba, y
cómo se deshace cada paso (migración inversa nueva, versión anterior de la función…).

## 9. Riesgos

Qué puede salir mal, probabilidad/impacto y cómo se evita.

## 10. Bitácora

Se rellena durante la implementación: oleadas cerradas, cambios respecto al plan, decisiones de
la prueba en el móvil, PR, estado de despliegue.
```
