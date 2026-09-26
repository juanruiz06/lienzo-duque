---
name: nueva-feature
description: Construye una feature completa de punta a punta siguiendo el patrón canónico de "notas" - migración con RLS, tipos, validación zod, capa src/api, hooks de React Query, pantallas con sus estados, tests y verificación. Úsala cuando haya que añadir algo nuevo que guarde datos (tareas, eventos, gastos, favoritos…).
argument-hint: '[nombre de la feature o ruta a su spec en docs/specs]'
---

# Nueva feature (vertical completa)

Feature: $ARGUMENTS

La feature **notas** es la plantilla. Cada paso tiene su archivo de referencia: ábrelo y copia el
patrón, cambiando solo lo necesario. Lee `AGENTS.md` (sección "Cómo fluyen los datos") e `INVARIANTS.md`.

## 0. Plan

- Si hay spec en `docs/specs/`, léela. Si no la hay y la feature toca más de una tabla o pantalla,
  propone hacer `/planificar` primero. Para algo pequeño, basta con un plan de 5 líneas.
- Anuncia el plan: tabla(s), pantallas, y qué verá el usuario. Pide OK si hay decisiones de producto.

## 1. Base de datos → skill `/nueva-tabla`

Referencia: `supabase/migrations/20260926000100_notes.sql`. Resultado: migración nueva aplicada en
aplicada (nube: `npm run db:push`; local: `npm run db:reset`) y `npm run db:types` hecho.

## 2. Validación

En `src/utils/validation.ts`: esquema zod `xxxSchema` + `type XxxInput`, con los **mismos
límites** que los `check` del SQL. Mensajes de error en castellano, pensados para el usuario.

## 3. Capa de datos

`src/api/<feature>.ts` copiando `src/api/notes.ts`:

- `type Xxx = Pick<Tables<'xxx'>, …>` con solo las columnas que usa la UI.
- `list`, `get`, `create`, `update`, `delete` (solo las que hagan falta).
- Columnas explícitas en `select`, `parseOrThrow` antes de escribir, `throw error` si Supabase falla.
- Nunca mandar `user_id` (lo pone la base con `default auth.uid()`).

Claves en `src/api/queryKeys.ts` (`all`, `list()`, `detail(id)`).

## 4. Hooks

`src/hooks/use<Feature>.ts` copiando `src/hooks/useNotes.ts`: `useQuery` para leer, `useMutation`
para escribir, `invalidateQueries` en `onSuccess`, `trackEvent` si merece medirse (antes añade el
evento al catálogo: `/nuevo-evento`). Borrado con actualización optimista si es una lista.

## 5. Pantallas → skill `/nueva-pantalla`

Referencias: `src/app/(app)/(tabs)/index.tsx` (lista) y `src/app/(app)/note/[id].tsx` (crear/editar).
Los 4 estados obligatorios. Solo primitivos de `@/components/ui` y tokens del tema. Componentes
propios de la feature en `src/components/<feature>/`.

## 6. Tests → skill `/escribir-tests`

Mínimo: validación (`src/utils/__tests__/validation.test.ts`) y capa api
(`src/api/__tests__/notes.test.ts` como modelo).

## 7. Verificación (obligatoria)

```bash
npm run check
```

(`npm run check:rls` si trabaja con base local; si no, lo comprueba el CI en el PR.)

Y **prueba el flujo en la app** (`npm start`, en su móvil con Expo Go; tú puedes mirar antes en web con `w`): crear, ver, editar, borrar; con dos usuarios
distintos si los datos son privados (uno no debe ver los del otro). Si hay datos por usuario,
comprueba que borrar la cuenta los borra (INV-STORE-1: FK con `on delete cascade`).

## 8. Cierre

Resume en lenguaje llano qué se ha creado (lista de archivos con enlaces) y cómo probarlo.
Sugiere `/preparar-pr`.
