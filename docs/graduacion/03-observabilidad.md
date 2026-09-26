# Nivel 3 — Observabilidad: Sentry (errores) y PostHog (analítica)

> **Qué consigues:** cuando la app falle en el móvil de alguien, te llega el error a **Sentry**
> con la línea exacta del código. Y en **PostHog** ves qué se usa de tu app (cuánta gente se
> registra, cuántas notas se crean…) sin espiar a nadie.
>
> **Cuánto cuesta:** 0 €. Sentry Developer: 5.000 errores/mes, 1 usuario. PostHog: 1 millón de
> eventos/mes gratis (sept. 2026, compruébalo).
>
> **Cuándo hacerlo:** antes de que la app la use alguien que no seas tú. Si no te enteras de los
> fallos, tus usuarios simplemente se irán.
>
> **Tiempo estimado:** 1–1,5 horas (Sentry ~45 min, PostHog ~30 min).
>
> **Requisitos:** [Nivel 2](02-builds-con-eas.md) para Sentry (necesita un development build;
> ver abajo). PostHog funciona ya en Expo Go.

## Conceptos en una frase

- **Observabilidad:** poder ver desde fuera qué le pasa a tu app en los móviles de otros.
- **Sentry:** servicio que recoge los errores y cuelgues de la app, los agrupa y te avisa.
- **DSN:** la "dirección" de tu proyecto de Sentry a la que la app manda los errores. Es
  **pública** (va dentro de la app).
- **Source maps:** un "diccionario" que traduce el código comprimido de la app a tu código
  original, para que el error diga `src/api/notes.ts:42` en vez de `index.bundle:1:98231`.
- **PostHog:** servicio de analítica de producto: cuenta **eventos** ("alguien creó una nota") y
  te hace gráficas y embudos.
- **Evento tipado:** en Lienzo solo se pueden enviar eventos declarados en el catálogo
  `AppEvents` (`src/observability/analytics.ts`). TypeScript no te deja inventarte uno.

## Cómo está preparado Lienzo

Ya tienes los "enchufes" hechos; este nivel solo conecta los servicios:

- Toda la app llama a `reportError(error, contexto)` (`src/observability/reporter.ts`). Hoy solo
  escribe en el log. Cuando llames a `setErrorReporter({ captureException, setUser })`, esos
  errores irán a Sentry **sin tocar nada más**.
- Toda la app llama a `trackEvent('note_created', {...})` (`src/observability/analytics.ts`).
  Cuando llames a `setAnalyticsClient({ capture, identify, reset })`, irán a PostHog.
- `useAuthListener` ya llama a `identifyUser(id)` / `setReporterUser({ id })` al iniciar sesión y
  a `resetAnalytics()` / `setReporterUser(null)` al cerrarla. Solo se envía el **id** interno del
  usuario, nunca su email.
- `initObservability()` (`src/observability/index.ts`) se ejecuta una vez al arrancar. Ahí
  añadiremos `initSentry()` e `initPostHog()`.
- `src/config/env.ts` ya acepta dos variables **opcionales**: `EXPO_PUBLIC_SENTRY_DSN` y
  `EXPO_PUBLIC_POSTHOG_KEY`. **Sin clave = no se envía nada** (coste cero, útil en local).

---

## Parte A — Sentry (errores)

> ⚠️ **Requiere development build (nivel 2).** En Expo Go, Sentry solo captura los errores de
> JavaScript: no ve los cuelgues nativos ni guarda errores sin conexión, y la subida de source
> maps solo ocurre al compilar con EAS. Para probarlo de verdad, usa tu development build.

### 1. Crea la cuenta y el proyecto

1. Regístrate en [sentry.io](https://sentry.io/signup/). Al crear la organización te preguntará
   dónde guardar los datos: elige **EU** (Alemania) si puedes; es más fácil de justificar con el
   RGPD.
2. Plan: **Developer** (gratis).
3. **Create project → React Native**. Ponle el nombre de tu app.
4. Apunta tres cosas:
   - El **DSN** (Settings → Projects → tu proyecto → **Client Keys (DSN)**). Público.
   - El **slug de la organización** y el **slug del proyecto** (salen en la URL:
     `sentry.io/organizations/ORG/projects/PROYECTO/`). Públicos.

> No uses el asistente automático (`npx @sentry/wizard`): escribe `Sentry.init` en el layout con
> opciones que envían datos personales por defecto. Aquí lo hacemos a mano, respetando la
> arquitectura de Lienzo.

### 2. Instala el SDK

```bash
npx expo install @sentry/react-native
```

### 3. Añade el plugin a `app.json`

Dentro de `"plugins"`, añade este elemento (si la instalación ya lo añadió, no lo dupliques; solo
completa los valores):

```json
[
  "@sentry/react-native/expo",
  {
    "url": "https://sentry.io/",
    "organization": "TU_ORG_SLUG",
    "project": "TU_PROYECTO_SLUG"
  }
]
```

**Nunca** pongas aquí `authToken`: el token va como secreto (paso 7).

### 4. Crea `metro.config.js`

Lienzo no tiene este archivo todavía (usa la configuración por defecto de Expo). Créalo en la
raíz del proyecto con este contenido; sirve para que los source maps encajen con Sentry:

```js
// Configuración de Metro (el empaquetador de JavaScript). La de Sentry = la de Expo + lo
// necesario para que los errores apunten a tu código original.
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

module.exports = getSentryExpoConfig(__dirname);
```

### 5. Crea `src/observability/sentry.ts`

```ts
import * as Sentry from '@sentry/react-native';

import { env } from '@/config/env';

import { log } from './logger';
import { setErrorReporter } from './reporter';

/**
 * Conecta Sentry al "enchufe" de errores (reporter.ts).
 *
 * Solo se activa si hay `EXPO_PUBLIC_SENTRY_DSN` en el entorno. Sin DSN no se importa nada
 * raro ni se envía nada: `reportError` sigue escribiendo solo en el log.
 *
 * Nivel 3 de graduación: docs/graduacion/03-observabilidad.md
 */

declare const __DEV__: boolean;

let started = false;

export function initSentry(): void {
  const dsn = env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || started) {
    return;
  }
  started = true;

  Sentry.init({
    dsn,
    // Separa en Sentry los errores de tu development build de los de usuarios reales.
    environment: __DEV__ ? 'development' : 'production',
    // PRIVACIDAD: no envía IP, cabeceras ni datos personales automáticamente.
    // El único dato de usuario que mandamos es su id interno (ver setUser más abajo).
    sendDefaultPii: false,
    // Rendimiento y grabación de sesiones desactivados: gastan cuota y aquí no los necesitamos.
    // Si un día quieres medir rendimiento, añade `tracesSampleRate: 0.1`.
  });

  setErrorReporter({
    captureException: (error, context) => {
      Sentry.captureException(error, context ? { extra: context } : undefined);
    },
    setUser: (user) => {
      // Solo el id (un UUID de Supabase). Nunca email ni nombre.
      Sentry.setUser(user ? { id: user.id } : null);
    },
  });

  log.info('Sentry activado');
}
```

### 6. Llámalo al arrancar y envuelve el layout

En `src/observability/index.ts`, importa la función y llámala dentro de `initObservability()`
(el archivo completo, con PostHog incluido, está en la [Parte B, paso 6](#6-llámalo-al-arrancar)).

Opcional pero recomendable: en `src/app/_layout.tsx`, envuelve el layout raíz con `Sentry.wrap`.
Así Sentry registra además los toques previos a un error ("breadcrumbs"). Son tres cambios:

1. Añade este import junto a los demás, arriba del archivo:

   ```tsx
   import * as Sentry from '@sentry/react-native';
   ```

2. Quita el `export default` de la función del layout. Cambia:

   ```tsx
   export default function RootLayout() {
   ```

   por:

   ```tsx
   function RootLayout() {
   ```

3. Justo después del cierre de la función `RootLayout` (antes de `function RootNavigator`),
   exporta la versión envuelta:

   ```tsx
   export default Sentry.wrap(RootLayout);
   ```

(La pantalla de error `ErrorBoundary` del mismo archivo se queda como está: sigue llamando a
`reportError`, que ahora llega a Sentry.)

`Sentry.wrap` no hace nada si Sentry no se ha iniciado (sin DSN), así que es seguro dejarlo.

### 7. Configura las claves

**Local** — añade el DSN a tu `.env` (es **público**):

```dotenv
EXPO_PUBLIC_SENTRY_DSN=https://xxxxx@oXXXX.ingest.de.sentry.io/XXXX
```

**EAS** — el DSN, para que vaya dentro de las builds (público → `plaintext`):

```bash
eas env:set --name EXPO_PUBLIC_SENTRY_DSN --value "TU_DSN" --environment development --environment preview --environment production --visibility plaintext
```

**Token para subir source maps** (**secreto**). Créalo en Sentry: **Settings → Auth Tokens →
Create New Token** (o _Organization Tokens_). Guárdalo **solo** en EAS, con visibilidad `secret`:

```bash
eas env:set --name SENTRY_AUTH_TOKEN --value "TU_TOKEN" --environment preview --environment production --visibility secret
```

> 🚫 `SENTRY_AUTH_TOKEN` nunca va en `.env`, en `app.json` ni en el repo. Con él se puede
> escribir en tu cuenta de Sentry. Si alguna vez quieres subir source maps desde tu ordenador, ponlo
> en `.env.local` (ignorado por git) y nunca con prefijo `EXPO_PUBLIC_`.

### 8. Haz un build nuevo

Has añadido código nativo (el SDK de Sentry), así que tu development build anterior ya no vale:

```bash
eas build --profile development --platform android
```

(o `--platform ios`). Las builds `preview` y `production` subirán los source maps solas gracias al
plugin y a `SENTRY_AUTH_TOKEN`.

### 9. Provoca un error de prueba

Pídele a Claude un botón temporal en la pantalla de Perfil que haga
`reportError(new Error('Prueba de Sentry'), { where: 'boton-prueba' })`. Púlsalo en tu development
build y, en un minuto, lo verás en Sentry → **Issues**, con `environment: development`. Después
**borra el botón**.

---

## Parte B — PostHog (analítica)

### 1. Crea la cuenta y el proyecto

1. Regístrate en [posthog.com](https://posthog.com) y, cuando te pregunte la región, elige
   **EU Cloud** (servidores en Frankfurt). La región no se puede cambiar después.
2. Crea un proyecto. En **Project settings** verás el **Project API key** (empieza por `phc_`).
   Es **pública**: está pensada para ir dentro de apps.
3. Recomendado para el RGPD: en **Project settings**, activa **Discard client IP data** para no
   guardar direcciones IP.

### 2. Instala el SDK y sus dependencias

```bash
npx expo install posthog-react-native expo-file-system expo-application expo-device expo-localization
```

Todas son librerías de Expo incluidas en Expo Go, así que PostHog funciona sin nuevo build
(aunque, si ya usas development build, tendrás que rehacerlo si alguna no estaba).

### 3. Crea `src/observability/posthog.ts`

```ts
import PostHog from 'posthog-react-native';

import { env } from '@/config/env';

import { setAnalyticsClient } from './analytics';
import { log } from './logger';

/**
 * Conecta PostHog al "enchufe" de analítica (analytics.ts).
 *
 * Solo se activa si hay `EXPO_PUBLIC_POSTHOG_KEY`. Sin clave, `trackEvent` sigue escribiendo
 * solo en el log.
 *
 * Nivel 3 de graduación: docs/graduacion/03-observabilidad.md
 */

declare const __DEV__: boolean;

// Región EU (Frankfurt). Si creaste el proyecto en US: 'https://us.i.posthog.com'.
const POSTHOG_HOST = 'https://eu.i.posthog.com';

// Se añade a cada evento para poder filtrar en PostHog lo que haces tú en desarrollo.
const APP_ENV = __DEV__ ? 'development' : 'production';

type CaptureProperties = NonNullable<Parameters<PostHog['capture']>[1]>;

let posthog: PostHog | null = null;

export function initPostHog(): void {
  const apiKey = env.EXPO_PUBLIC_POSTHOG_KEY;
  if (!apiKey || posthog) {
    return;
  }

  const client = new PostHog(apiKey, {
    host: POSTHOG_HOST,
    // "Application Opened/Backgrounded/Installed": útiles y sin datos personales.
    captureAppLifecycleEvents: true,
    // Sin grabación de sesiones: puede capturar lo que la gente escribe en pantalla.
    enableSessionReplay: false,
    // Solo crea "perfil de persona" para usuarios con sesión iniciada (identify).
    personProfiles: 'identified_only',
  });
  // Autocapture de toques y pantallas: NO se activa porque no usamos <PostHogProvider>.
  // Es muy ruidoso y puede capturar textos de botones. Medimos solo eventos del catálogo.
  posthog = client;

  setAnalyticsClient({
    capture: (event, properties) => {
      // Las propiedades vienen del catálogo AppEvents, que solo tiene valores JSON simples.
      client.capture(event, {
        ...(properties as CaptureProperties | undefined),
        app_env: APP_ENV,
      });
    },
    identify: (userId) => {
      // Solo el id interno de Supabase. Nunca pases email ni nombre como propiedades.
      client.identify(userId);
    },
    reset: () => {
      client.reset();
    },
  });

  log.info('PostHog activado');
}

/**
 * Permite al usuario desactivar (o reactivar) la analítica, p. ej. desde un interruptor en
 * Perfil. PostHog recuerda la elección en el dispositivo.
 */
export async function setAnalyticsConsent(granted: boolean): Promise<void> {
  if (!posthog) {
    return;
  }
  if (granted) {
    await posthog.optIn();
  } else {
    await posthog.optOut();
  }
}
```

### 4. Configura la clave

**Local** — en `.env` (**pública**):

```dotenv
EXPO_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxx
```

**EAS** — para las builds:

```bash
eas env:set --name EXPO_PUBLIC_POSTHOG_KEY --value "phc_TU_CLAVE" --environment development --environment preview --environment production --visibility plaintext
```

### 5. (Opcional) Deja que el usuario diga que no

`setAnalyticsConsent(false)` apaga el envío en ese móvil. Si lo expones en la app, respeta la
arquitectura: reexpórtalo desde `src/observability/index.ts` (ver abajo) y úsalo desde un hook
(por ejemplo, un interruptor "Enviar estadísticas de uso anónimas" en Perfil). Pídeselo a Claude.

### 6. Llámalo al arrancar

Así queda `src/observability/index.ts` con Sentry y PostHog enchufados:

```ts
/**
 * Punto de entrada de la observabilidad (logs, errores, analítica).
 *
 * `initObservability()` se llama UNA vez al arrancar (src/app/_layout.tsx). Sentry y PostHog
 * solo se activan si hay clave en el entorno (sin clave = no-op, coste cero).
 */
import { initPostHog } from './posthog';
import { initSentry } from './sentry';

export { log, type Logger } from './logger';
export { reportError, setErrorReporter, setReporterUser, type ErrorReporter } from './reporter';
export {
  identifyUser,
  resetAnalytics,
  setAnalyticsClient,
  trackEvent,
  type AnalyticsClient,
  type AppEventName,
  type AppEvents,
} from './analytics';
export { setAnalyticsConsent } from './posthog';

let initialized = false;

export function initObservability(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  initSentry(); // → setErrorReporter(...)
  initPostHog(); // → setAnalyticsClient(...)
}
```

Reinicia Expo (`npx expo start --clear`) para que lea la clave nueva.

### 7. Añade eventos nuevos (siempre al catálogo)

Para medir algo nuevo **no** se escribe `posthog.capture(...)` suelto. Se añade al catálogo
`AppEvents` de `src/observability/analytics.ts`:

```ts
export type AppEvents = {
  // …los que ya hay…
  note_shared: { channel: 'whatsapp' | 'email' | 'otro' };
};
```

y se usa desde el hook o la función de `src/api/` correspondiente:

```ts
trackEvent('note_shared', { channel: 'whatsapp' });
```

Nombres en `snake_case`, en pasado (`algo_hecho`), y propiedades que describan el **qué**, no el
**quién**. La skill **`/nuevo-evento`** lo hace por ti siguiendo estas reglas.

### 8. Privacidad y RGPD

- **Nada de datos personales en eventos:** ni emails, ni nombres, ni el texto que escribe el
  usuario (fíjate en que `note_created` envía `title_length`, no el título).
- **Identificador:** solo el UUID de Supabase. Aun así, para el RGPD es un dato _seudonimizado_:
  sigue contando como dato personal.
- **Opt-out:** ofrece la opción de desactivar la analítica (paso 5).
- **Política de privacidad:** menciona que usas Sentry (errores) y PostHog (analítica de uso),
  qué datos envían, que están alojados en la UE y para qué. La necesitarás para publicar (nivel 5).
- **Sesiones grabadas y autocapture:** desactivados a propósito. Si algún día los activas,
  revisa primero qué capturan y actualiza la política.

### 9. (Opcional) Que Claude consulte PostHog

PostHog tiene un servidor MCP para que Claude Code pueda consultar tus gráficas y eventos
("¿cuántos registros hubo la semana pasada?"):

```bash
claude mcp add --scope local --transport http posthog https://mcp.posthog.com/mcp
```

La primera vez te pedirá iniciar sesión en PostHog (detecta sola la región EU). También existe
`npx @posthog/wizard mcp add`. Más info: [PostHog MCP](https://posthog.com/docs/model-context-protocol).

---

## ✅ Cómo sé que ha funcionado

- [ ] `npm run check` pasa (tipos, lint, formato y tests).
- [ ] Sin claves en `.env`, la app arranca igual que antes (no se rompe nada).
- [ ] Con las claves, en la consola de Metro ves `Sentry activado` y `PostHog activado`.
- [ ] El error de prueba (Parte A, paso 9) aparece en Sentry → **Issues** con `environment:
development`, y el stack trace apunta a tus archivos `.ts`.
- [ ] Tras iniciar sesión, el error muestra un **User** con un id (UUID), sin email.
- [ ] Creas una nota y en PostHog → **Activity** (o _Events_) aparece `note_created` con
      `title_length` y `app_env`.
- [ ] Tras un build `preview`, en Sentry → **Settings → Source Maps** aparecen artefactos subidos.

## 🧯 Problemas típicos

- **No aparece "Sentry activado":** la variable no llega. ¿Está en `.env` con el nombre exacto?
  ¿Reiniciaste con `--clear`? En builds, ¿está en el entorno EAS de ese perfil?
- **Sentry funciona en Expo Go pero el development build se cierra al abrir:** el build es anterior
  a instalar Sentry. Haz un build nuevo (paso 8).
- **Los errores dicen `index.bundle:1:…`:** no se subieron los source maps. Comprueba que
  `SENTRY_AUTH_TOKEN` está en EAS para ese entorno y que el plugin de `app.json` tiene `organization`
  y `project` correctos. En development es normal verlo peor.
- **El build falla con un error de `sentry-cli` / "An organization slug is required":** faltan
  `organization`/`project` en el plugin, o el token no tiene permisos (créalo como _Organization
  Token_).
- **PostHog no muestra eventos:** tardan uno o dos minutos. Comprueba que el host (`eu` vs `us`)
  coincide con la región de tu proyecto: si no, la clave no se reconoce y los eventos se pierden
  sin aviso.
- **TypeScript se queja de `trackEvent`:** estás usando un evento o una propiedad que no está en
  `AppEvents`. Es intencionado: añádelo al catálogo (o usa `/nuevo-evento`).
- **`npm test` falla al importar `@sentry/react-native` o `posthog-react-native`** (errores tipo
  _Cannot use import statement outside a module_ o _native module not found_): los tests cargan
  `src/observability` a través de otros archivos. En tests no hay claves, así que nada se inicia,
  pero los imports sí se ejecutan. Añade al final de `jest.setup.js` unos sustitutos:

  ```js
  // Sentry y PostHog no se usan en tests (no hay claves); se sustituyen por versiones vacías.
  jest.mock('@sentry/react-native', () => ({
    init: jest.fn(),
    captureException: jest.fn(),
    setUser: jest.fn(),
    wrap: (component) => component,
  }));
  jest.mock('posthog-react-native', () => ({ __esModule: true, default: jest.fn() }));
  ```

- **Se te acaba la cuota de Sentry:** un error en un bucle puede mandar miles. Arréglalo y, en
  Sentry, usa **Inbound Filters** o _Spike Protection_.

## Pedírselo a Claude

```
/graduar 03
```

O pega algo así:

> Quiero conectar Sentry. Ya tengo el DSN, el slug de organización y de proyecto (te los paso; el
> token de source maps lo subo yo a EAS como secreto). Crea src/observability/sentry.ts siguiendo
> docs/graduacion/03-observabilidad.md, enchúfalo en initObservability y dime qué build hacer.

> Añade el evento `note_shared` con la propiedad `channel` usando /nuevo-evento.

## Documentación oficial

- [Sentry para Expo](https://docs.sentry.io/platforms/react-native/manual-setup/expo/)
- [Sentry: opciones de configuración](https://docs.sentry.io/platforms/react-native/configuration/options/)
- [Sentry: precios](https://sentry.io/pricing/)
- [PostHog para React Native](https://posthog.com/docs/libraries/react-native)
- [PostHog: privacidad y RGPD](https://posthog.com/docs/privacy/gdpr-compliance)
- [PostHog: precios](https://posthog.com/pricing)
