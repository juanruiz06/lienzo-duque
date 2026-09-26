# Arquitectura, explicada sin jerga

Lienzo es una app que corre en el móvil (el **cliente**) y habla con un **backend** (Supabase: tu
proyecto en la nube, el que conectaste con `npm run setup`) que guarda los datos y decide quién
puede ver qué. Este documento explica las piezas, cómo viajan los
datos y por qué está organizado así.

## El mapa en una imagen

```
┌──────────────────────────── MÓVIL (la app, código público) ─────────────────────────────┐
│                                                                                          │
│  src/app/        PANTALLAS      "qué se ve"          sign-in.tsx, index.tsx (notas)…     │
│      │                                                                                   │
│      ▼  usa                                                                              │
│  src/hooks/      HOOKS          "pide y recuerda"    useNotes(), useCreateNote()…         │
│      │           (React Query: caché, reintentos, refresco automático)                   │
│      ▼  llama a                                                                          │
│  src/api/        CAPA DE DATOS  "habla con el servidor"   listNotes(), createNote()…     │
│      │           (valida con zod, elige columnas, lanza errores)                         │
└──────┼───────────────────────────────────────────────────────────────────────────────────┘
       │  internet (HTTPS) + token de sesión del usuario
┌──────▼──────────────────────── SUPABASE (servidor, privado) ─────────────────────────────┐
│  Auth            ¿quién eres?  (email + contraseña → token)                              │
│  Postgres + RLS  ¿qué puedes ver/tocar?  (policies: "solo tus notas")                    │
│  Edge Functions  cosas con llaves secretas  (delete-account)                             │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

**La idea clave:** la app es pública (cualquiera puede desmontarla y ver su código y su
configuración). Por eso **la seguridad no está en la app, está en la base de datos**. Aunque
alguien llame a la API a mano, las reglas de Postgres (RLS) solo le dejan ver sus propias filas.

## Recorrido de un dato: "ver mis notas"

1. Abres la pestaña Notas → se pinta `src/app/(app)/(tabs)/index.tsx`.
2. La pantalla llama a `useNotes()` (`src/hooks/useNotes.ts`). Recibe `{ data, isPending, error }`.
3. React Query mira su caché: si tiene las notas y son recientes (< 30 s), las da al instante. Si
   no, llama a `listNotes()` (`src/api/notes.ts`).
4. `listNotes()` hace `supabase.from('notes').select('id, title, …')`. El cliente de Supabase
   añade tu **token** (tu "pase" de sesión).
5. En el servidor, Postgres ejecuta la consulta **aplicando la policy**
   `user_id = (select auth.uid())` → solo devuelve tus filas.
6. Vuelven los datos → React Query los guarda → la pantalla se repinta con la lista.

Y para **crear** una nota: pantalla → `useCreateNote()` → `createNote()` valida con zod (título
de 1 a 120 caracteres) → inserta → Postgres comprueba la policy de insert y los `check` → al
volver, el hook **invalida** la caché de la lista y React Query la vuelve a pedir sola.

## Las piezas, una a una

### Pantallas — `src/app/` (expo-router)

Cada archivo es una pantalla, y su ruta en la carpeta es su dirección:

| Archivo                    | Dirección                    | Qué es                     |
| -------------------------- | ---------------------------- | -------------------------- |
| `(auth)/sign-in.tsx`       | `/sign-in`                   | Login                      |
| `(app)/(tabs)/index.tsx`   | `/`                          | Lista de notas (pestaña 1) |
| `(app)/(tabs)/profile.tsx` | `/profile`                   | Perfil (pestaña 2)         |
| `(app)/note/[id].tsx`      | `/note/new`, `/note/abc-123` | Crear o editar nota        |

Las carpetas entre paréntesis `(auth)`, `(app)`, `(tabs)` son **grupos**: organizan sin cambiar la
dirección. `_layout.tsx` define cómo se muestran las pantallas de su carpeta (pila, pestañas…).

El **layout raíz** (`src/app/_layout.tsx`) decide qué grupo existe: con sesión solo `(app)`, sin
sesión solo `(auth)` (`Stack.Protected`). Por eso tras hacer login no hay que "navegar" a ningún
sitio: la app cambia sola.

### Hooks — `src/hooks/` (React Query)

Un hook es una función que una pantalla "enchufa" para recibir datos ya listos. Los nuestros usan
**React Query**, que resuelve lo difícil: cachear, no pedir dos veces lo mismo, reintentar si falla
la red, refrescar al volver, y estados de carga/error. Lectura = `useQuery`; escritura = `useMutation`.

Las claves de caché están todas en `src/api/queryKeys.ts` para no equivocarse.

### Capa de datos — `src/api/`

Funciones normales (`async`) que hablan con Supabase. Sin nada de React. Son el **único** sitio que
importa el cliente de Supabase (ESLint impide hacerlo desde pantallas: regla INV-ARCH-1).
Ventajas: si mañana cambias cómo se guarda algo, lo cambias en un sitio; y se pueden testear.

### Validación — `src/utils/validation.ts` (zod)

Esquemas que describen qué es un dato válido ("título de 1 a 120 caracteres"). Se usan en el
formulario (para enseñar el error debajo del campo) y en la capa de datos (para no mandar basura).
Los límites coinciden con los `check` de la tabla SQL: doble red.

### Estado local — `src/store/` (Zustand)

Para lo poco que NO viene del servidor. Hoy solo la sesión (`useSession`). Si dudas entre Zustand
y React Query: si el dato vive en la base de datos → React Query.

### Tema y componentes — `src/theme/`, `src/components/`

`tokens.ts` define colores (claro y oscuro), espacios, radios y tamaños de letra. Los componentes
de `components/ui/` (`Text`, `Button`, `TextField`, `Screen`, `Card`, estados vacío/error/carga)
los usan. Resultado: la app es coherente, el modo oscuro funciona solo, y cambiar la marca es
tocar un archivo.

### Observabilidad — `src/observability/`

`log` (en vez de `console.log`), `reportError` (errores → Sentry cuando lo conectes) y `trackEvent`
(analítica → PostHog cuando lo conectes). Están los "enchufes" preparados; conectarlos es el
[nivel 3](graduacion/03-observabilidad.md).

### Backend — `supabase/`

- **`migrations/`**: la receta de la base de datos, en pasos numerados por fecha. Nunca se edita un
  paso ya aplicado; se añade uno nuevo. `20260926000000_base.sql` crea perfiles; `…_notes.sql`, notas.
  Se aplican a tu proyecto con `npm run db:push`.
- **RLS (Row Level Security)**: reglas por fila. "Puedes leer una nota si `user_id` eres tú."
- **`functions/`**: Edge Functions, código que corre en el servidor. `delete-account` borra tu
  cuenta, algo que exige una llave de administrador que nunca puede estar en la app.
- **`seed.sql`**: datos de prueba (el usuario demo) solo para la base local opcional con Docker.
  En tu proyecto de la nube no se ejecuta: allí creas tus datos de prueba desde la app.
- **Tipos generados** (`src/types/database.ts`): TypeScript conoce tus tablas y te avisa si
  escribes mal una columna. Se regeneran con `npm run db:types`.

## Por qué estas tecnologías

| Elección                | Por qué                                                                                                | Alternativas que se descartaron                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| **Expo**                | Un código para iOS, Android y web; compila en la nube (sin Mac para iOS); actualizaciones OTA          | React Native "a pelo" (mucha más configuración nativa), Flutter (otro lenguaje, menos ecosistema web) |
| **expo-router**         | Rutas = archivos: fácil de entender; enlaces profundos gratis                                          | React Navigation manual (más código repetido)                                                         |
| **TypeScript estricto** | Los errores salen al escribir, no en el móvil del usuario                                              | JavaScript (errores en producción)                                                                    |
| **Supabase**            | Postgres de verdad + auth + almacenamiento + funciones; plan gratis generoso; SQL estándar (no te ata) | Firebase (NoSQL, más difícil de consultar y te ata a Google), backend propio (mucho trabajo)          |
| **React Query**         | Resuelve caché, reintentos y estados sin código propio                                                 | Guardar datos en `useState`/Redux a mano (fuente infinita de bugs)                                    |
| **Zustand**             | Mínimo y sin ceremonia para el poco estado global                                                      | Redux (demasiado para esto), Context (re-renders)                                                     |
| **Zod**                 | Una definición sirve para validar y para los tipos                                                     | Validación a mano                                                                                     |
| **StyleSheet + tokens** | Cero dependencias, rápido, suficiente                                                                  | NativeWind/Tamagui (válidos, pero más piezas que aprender al principio)                               |

## Qué NO trae (a propósito) y dónde está

Push, pagos, login social, Sentry/PostHog conectados, emails propios, OTA, subida de imágenes,
multi-idioma… Todo eso añade coste o complejidad y no hace falta el primer día. Cada uno tiene su
[nivel de graduación](graduacion/README.md) o skill (`/subir-imagenes`).
