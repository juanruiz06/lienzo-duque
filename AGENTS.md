# AGENTS.md — Guía para agentes de IA que trabajan en este repo

> Este archivo lo leen Claude Code (a través de `CLAUDE.md`), Cursor, Codex y otros agentes.
> Es el **mapa** del proyecto y el **cómo** se trabaja aquí. Las reglas duras y verificables
> están en [`INVARIANTS.md`](INVARIANTS.md): léelas antes de tocar base de datos, auth o secretos.

## Qué es esto

**Lienzo** es una plantilla canónica para construir apps móviles (iOS, Android y web) con:

| Capa           | Tecnología                                                     |
| -------------- | -------------------------------------------------------------- |
| App            | Expo SDK 57 · React Native 0.86 · React 19 · TypeScript strict |
| Navegación     | expo-router (rutas = archivos en `src/app/`)                   |
| Datos servidor | React Query (`@tanstack/react-query`)                          |
| Estado local   | Zustand (poco y pequeño)                                       |
| Validación     | Zod (formularios + capa de datos)                              |
| Backend        | Supabase: Postgres + Auth + RLS + Edge Functions (Deno)        |
| Calidad        | ESLint · Prettier · Jest + Testing Library · Husky · GitHub CI |

Viene con una feature de ejemplo completa (**notas**: crear, listar, editar, borrar), auth por
email, perfil editable y borrado de cuenta. Es el patrón a copiar.

**La persona dueña del repo NO es muy técnica.** Explica lo que haces en lenguaje llano, sin
jerga innecesaria, y cuando tomes una decisión técnica di en una frase por qué. Si algo que pide
va contra una regla de `INVARIANTS.md`, explícale el riesgo con un ejemplo concreto y propón la
alternativa correcta en vez de hacerlo sin más.

## Expo cambia rápido: no te fíes de tu memoria

Expo publica cambios incompatibles en cada SDK. Antes de escribir código que toque una API de
Expo, EAS o React Native:

1. Mira la versión de `expo` en `package.json` (hoy: 57).
2. Consulta la documentación de esa versión: `https://docs.expo.dev/versions/v57.0.0/`
3. Índice para LLMs con correcciones de errores típicos: https://docs.expo.dev/llms.txt

Instala dependencias SIEMPRE con `npx expo install <paquete>` (elige la versión compatible con el
SDK), nunca con `npm install <paquete>` a secas. Excepción: herramientas de desarrollo puras
(`npm install -D …`).

## Comandos

| Comando                                | Qué hace                                                                                     |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `npm start`                            | Arranca Metro (servidor de desarrollo). `i` = iOS, `a` = Android, `w` = web                  |
| `npm run check`                        | **Los 4 gates**: typecheck + lint + formato + tests. Córrelo antes de dar nada por terminado |
| `npm run doctor`                       | Diagnostica la máquina y el `.env`                                                           |
| `npm run db:start` / `db:stop`         | Arranca/para Supabase local (necesita Docker)                                                |
| `npm run db:reset`                     | Borra la base LOCAL y la recrea con migraciones + `seed.sql`                                 |
| `npm run db:new -- <nombre>`           | Crea una migración vacía en `supabase/migrations/`                                           |
| `npm run db:types`                     | Regenera `src/types/database.ts` desde la base local. **Tras cada migración**                |
| `npm run db:push`                      | Aplica migraciones pendientes a la base de la NUBE (proyecto enlazado)                       |
| `npm run check:secrets`                | Busca claves secretas donde no deben estar                                                   |
| `npm run rename -- "Nombre" com.x.app` | Renombra la plantilla (nombre, slug, bundle id, esquema)                                     |

Supabase local usa puertos **544xx** (API `54421`, Studio `54423`, emails de prueba en Mailpit
`54424`) para no chocar con otros proyectos Supabase de la misma máquina.

Usuario de prueba del seed local: `demo@lienzo.test` / `lienzo-demo-1234`.

## Mapa de carpetas

```
src/
  app/                  RUTAS (expo-router). Cada archivo = una pantalla. Nada más vive aquí.
    _layout.tsx         Layout raíz: providers + Stack.Protected (con/sin sesión) + ErrorBoundary
    (auth)/             Pantallas SIN sesión: sign-in, sign-up, forgot-password
    (app)/              Pantallas CON sesión
      (tabs)/           Barra de pestañas: index (Notas), profile (Perfil)
      note/[id].tsx     Crear (/note/new) o editar (/note/<id>) una nota — modal
  api/                  CAPA DE DATOS. Único sitio que habla con Supabase.
    supabase.ts         El cliente (uno para toda la app)
    auth.ts notes.ts profiles.ts session.ts   Funciones async puras: reciben datos, devuelven datos o lanzan
    queryClient.ts      Config de React Query
    queryKeys.ts        TODAS las claves de caché
  hooks/                Hooks de React Query (useNotes, useAuth, useProfile…) + useAuthListener
  components/
    ui/                 Primitivos genéricos: Text, Button, TextField, Screen, Card, Empty/Error/LoadingState
    notes/              Componentes de una feature concreta (NoteCard)
  store/                Zustand: session.ts (la sesión). Solo estado que NO viene del servidor
  theme/                tokens.ts (colores claro/oscuro, espacios, radios, tipos) + useTheme()
  utils/                Lógica pura y testeable: validation (zod), errors, dates, confirm
  observability/        logger, reportError (→ Sentry), trackEvent (→ PostHog). Enchufes listos
  config/env.ts         Variables EXPO_PUBLIC_* validadas al arrancar
  types/database.ts     GENERADO por `npm run db:types`. No se edita a mano
supabase/
  migrations/           Historia del esquema. Solo se AÑADEN archivos; nunca se edita uno aplicado
  functions/            Edge Functions (Deno, servidor). delete-account = ejemplo con service-role
  seed.sql              Datos de prueba SOLO para la base local
  config.toml           Config de Supabase local
docs/                   Documentación para humanos (empieza por docs/README.md)
  graduacion/           Niveles: nube, builds, Sentry/PostHog, emails, tiendas, push, pagos…
  specs/                Especificaciones de features antes de construirlas
scripts/                doctor, rename-app, gen-db-types, check-secrets
.claude/skills/         Skills de Claude Code (/nueva-feature, /arreglar-bug…)
.github/workflows/      CI + despliegues (inactivos hasta configurar secrets)
```

## Cómo fluyen los datos (la regla más importante)

```
Pantalla (src/app)  →  Hook (src/hooks)  →  Función (src/api)  →  Supabase  →  Postgres + RLS
   pinta UI            cachea/reintenta       valida con zod         red         SEGURIDAD REAL
```

- Las **pantallas y componentes nunca importan Supabase** (ESLint lo bloquea). Piden datos a un hook.
- Los **hooks** envuelven funciones de `src/api` con `useQuery` / `useMutation`, usan
  `queryKeys` e invalidan la caché tras escribir.
- Las **funciones de `src/api`** validan la entrada con los esquemas de `src/utils/validation.ts`,
  seleccionan columnas explícitas y lanzan el error si Supabase devuelve uno.
- **La seguridad la pone la base de datos (RLS)**, no la app: la app es pública y cualquiera
  puede llamar a la API con la publishable key. Si una tabla no tiene RLS, sus datos son públicos.

## Recetas

### Añadir una feature con datos (p. ej. "tareas")

Usa la skill **`/nueva-feature`**. A mano, copiando el patrón de notas:

1. `npm run db:new -- tasks` → escribe la tabla siguiendo `supabase/migrations/20260926000100_notes.sql`
   (checks, índice, trigger `updated_at`, RLS, 4 policies `to authenticated` con
   `(select auth.uid())`, GRANTs, `revoke all … from anon`).
2. `npm run db:reset` (aplica en local) → `npm run db:types`.
3. Esquema zod en `src/utils/validation.ts` (mismos límites que los `check` del SQL).
4. `src/api/tasks.ts` (copia `notes.ts`) + claves en `src/api/queryKeys.ts`.
5. `src/hooks/useTasks.ts` (copia `useNotes.ts`).
6. Pantalla(s) en `src/app/(app)/…` con los 4 estados: cargando, error, vacío, datos.
7. Tests: validación + capa api (copia `src/api/__tests__/notes.test.ts`).
8. `npm run check`.

### Añadir una pantalla

Un archivo en `src/app/`. Dentro de `(app)/` exige sesión; dentro de `(auth)/`, lo contrario.
Una pestaña nueva: archivo en `(app)/(tabs)/` + su `Tabs.Screen` en `(tabs)/_layout.tsx`.
Envuelve el contenido en `<Screen>` y usa los primitivos de `@/components/ui`.

### Añadir código de servidor (algo con claves secretas)

Edge Function en `supabase/functions/<nombre>/index.ts` (skill **`/edge-function`**). Los secretos
se guardan con `npx supabase secrets set NOMBRE=valor`, nunca en la app.

## Convenciones

- **Idioma:** textos de usuario, comentarios y docs en **castellano**. Nombres de código
  (variables, funciones, archivos, columnas) en **inglés**.
- **Imports** con alias `@/` (= `src/`). Orden: externos, línea en blanco, internos.
- **Estilos:** `useTheme()` + tokens. Nada de colores/tamaños mágicos en componentes (INV-UI-1).
  `StyleSheet.create` para lo estático; lo que depende del tema va inline con `t.color.*`.
- **Errores al usuario:** siempre `toUserMessage(error)`, nunca `error.message` crudo.
- **Confirmaciones:** `confirm()` de `@/utils/confirm` (funciona también en web).
- **Logs:** `log` de `@/observability`, no `console.log`.
- **Analítica:** solo `trackEvent()` con eventos del catálogo `AppEvents`. Nunca datos personales.
- **React Compiler está activado:** no hace falta `useMemo`/`useCallback` por rendimiento.
- **Accesibilidad:** todo lo pulsable lleva `accessibilityRole` y `accessibilityLabel`; objetivos
  táctiles ≥ 44 pt.
- **Tests** junto al código en `__tests__/`. Lógica pura en `utils/` → fácil de testear.
- **Comentarios:** explican el _porqué_, no el _qué_. El dueño aprende leyendo el código.

## Reglas de trabajo para agentes

1. **`npm run check` en verde** antes de decir que algo está hecho. Si falla, arréglalo o explica.
2. **Nunca edites una migración ya aplicada** (en la nube o compartida): crea una nueva.
3. **Nunca `supabase db reset` contra la nube**, ni `db push` sin que el dueño lo pida. Explica
   primero qué va a cambiar.
4. **Nunca metas secretos** en `src/`, `app.json`, `.env.example` ni en commits (INV-SEC-*).
5. **No añadas dependencias sin necesidad.** Antes mira si Expo/React Native ya lo resuelve.
   Si añades una con código nativo, avisa: Expo Go deja de valer y hace falta un development
   build (docs/graduacion/02-builds-con-eas.md).
6. **No toques `ios/` ni `android/`**: no existen en el repo (se generan con prebuild). La config
   nativa va en `app.json` y plugins.
7. **Cambios pequeños y verificables.** Mejor 3 PRs claros que uno gigante.
8. **Prueba en la app** (simulador, Expo Go o web), no solo con tests, cuando cambies UI o flujos.
9. Si una decisión es del dueño (coste, producto, privacidad), **pregúntale** con opciones claras.
