---
name: revisar-arquitectura
description: Revisión de diseño de sistemas (arquitectura / system design) de una idea, una spec, un cambio o el proyecto entero - capas, modelo de datos y relaciones, dónde vive cada lógica (app, base de datos, Edge Function), rendimiento y límites del plan gratis, fallos y reintentos, evolución sin romper apps instaladas, servicios externos, coste y simplicidad. Devuelve un informe con semáforo, diagrama y recomendaciones, y registra las decisiones importantes. Úsala antes de construir algo grande, cuando algo "va lento" o "se está complicando", o de vez en cuando como chequeo.
argument-hint: '[idea | ruta de spec | cambio | vacío = proyecto entero]'
---

# Revisar la arquitectura (system design)

Qué revisar: $ARGUMENTS

Tres modos: **diseño** (una idea o spec antes de programar), **cambio** (el diff de la rama
actual contra `main`) y **auditoría** (vacío: el proyecto entero). Solo lees y opinas: no cambias
código. La persona dueña no es técnica: cada recomendación con **qué pasaría si no se hace**, en
una frase de la vida real.

**Principio rector: para una app que empieza, la mejor arquitectura es la más simple que aguante
el siguiente paso.** Señala tanto lo que falta como lo que sobra (complicaciones prematuras).

## 1. Entiende qué hay

Lee `AGENTS.md` (mapa y flujo de datos), `INVARIANTS.md`, `docs/decisiones/` y lo que toque:
spec, diff (`git diff main...HEAD`) o, en auditoría, `src/api/`, `src/hooks/`, `src/app/`,
`supabase/migrations/`, `supabase/functions/`. Dibuja el mapa actual antes de juzgar.

## 2. Repasa cada área

**A. Capas y límites.** ¿Se respeta pantalla → hook → `src/api` → Supabase (INV-ARCH-1)? ¿Hay lógica
de negocio en pantallas que debería estar en `src/utils` (testeable) o en la base de datos? ¿Hay
componentes gigantes (>300 líneas) que mezclan datos y UI?

**B. Modelo de datos.** Entidades y relaciones (1:1, 1:N, N:M con tabla intermedia). Cada dato en
un solo sitio (sin copias que se desincronicen, salvo contadores cacheados a propósito). Claves
`uuid`, `created_at`/`updated_at`, `check` con límites, FK con el `on delete` correcto (cascade si
el hijo no tiene sentido sin el padre). Enumeraciones con `check (x in (...))` o tabla. Nada de
meter en `jsonb` lo que se va a filtrar u ordenar. Modelo de acceso claro:

- _Solo el dueño_ → `user_id = (select auth.uid())`.
- _Compartido_ (grupos, amigos) → tabla de miembros + función `security definer` `is_member(...)`
  estable usada en las policies (evita policies recursivas y lentas).
- _Público_ → catálogo de solo lectura, escrito solo por el servidor.

**C. Dónde vive cada lógica.**

| Necesidad                                                       | Sitio correcto                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Que se vea bien, feedback inmediato                             | App (pantalla/hook), actualización optimista                                                |
| Validar formularios                                             | zod en `src/utils/validation.ts` **y** `check` en SQL                                       |
| Quién puede ver/tocar qué                                       | **RLS** (nunca solo en la app)                                                              |
| Reglas entre varias filas o tablas, que deben cumplirse siempre | Constraint, trigger o función SQL (RPC) en una **transacción**                              |
| Claves secretas, servicios de pago, emails, webhooks            | **Edge Function**                                                                           |
| Tareas periódicas (limpiar, resúmenes)                          | `pg_cron` + función SQL o Edge Function                                                     |
| Datos en tiempo real                                            | Supabase Realtime solo si hace falta de verdad; si no, refrescar al abrir/tirar hacia abajo |

**D. Rendimiento y límites.** Un índice por cada consulta frecuente (columnas del `where` y del
`order by`). Paginación en listas que crecen (`range` o por cursor), nunca "traer todo". Nada de
N+1 (una consulta por cada elemento de una lista): usa selects anidados
(`select('id, title, author:profiles(display_name)')`) o una vista/RPC. Columnas explícitas.
Imágenes comprimidas. Recuerda los límites del **plan gratis** de Supabase (base de datos de
~500 MB, ~1 GB de archivos, tráfico mensual limitado; compruébalo en supabase.com/pricing) y
estima cuándo se alcanzarían con el uso previsto.

**E. Estado en la app.** Datos del servidor en React Query con claves de `queryKeys`; invalidación
tras escribir; Zustand solo para estado local. Nada de copiar datos del servidor a `useState`.

**F. Fallos.** ¿Qué pasa sin red, con la base pausada, si una Edge Function falla a mitad? Botones
que se pueden pulsar dos veces (duplicados) → deshabilitar mientras guarda o idempotencia. Operaciones
de varios pasos → una transacción (RPC) en vez de varias llamadas desde la app. Errores visibles
con `toUserMessage` y reintento.

**G. Evolución.** Migraciones solo añadidas. Si ya hay usuarios con la app instalada: cambios de
esquema **compatibles** (añadir antes de quitar: columna nueva → app que usa la nueva → borrar la
vieja en otra versión). Dependencias nativas nuevas = build nuevo (y Expo Go deja de valer).

**H. Servicios externos.** Cada uno: para qué, coste ahora y al crecer, qué pasa si se cae, dónde
viven sus claves, y cuánto costaría cambiarlo por otro. Preferir lo que ya da Supabase/Expo.

**I. Privacidad y datos.** Guardar lo mínimo. Borrado de cuenta borra todo (FK + Storage). Nada
personal en analítica.

**J. Simplicidad.** Señala lo que sobra: abstracciones sin segundo uso, librerías para algo que
Expo ya hace, capas vacías, "por si acaso". Menos piezas = menos que romper.

## 3. Informe

1. **Mapa** del flujo de datos de lo revisado (ASCII o `mermaid`), corto.
2. **Semáforo** por área A–J (🟢 bien · 🟡 mejorable · 🔴 problema), solo las que apliquen.
3. **Hallazgos** por gravedad: qué pasa · qué pasaría si no se hace (en llano) · dónde · propuesta ·
   esfuerzo (S/M/L).
4. **Lo que está bien** (2-3 puntos): también enseña.
5. En modo **diseño**: la versión recomendada del diseño en ≤10 líneas, lista para `/implement-task`
   o `/nueva-feature`.

## 4. Registra las decisiones importantes

Si se decide algo que marca el futuro (una tabla compartida, un servicio externo, tiempo real,
cómo se modelan los permisos), propón escribirlo en `docs/decisiones/NNN-titulo.md` con la
plantilla `docs/decisiones/_plantilla.md`. Así, dentro de seis meses, se sabe por qué se hizo así.
