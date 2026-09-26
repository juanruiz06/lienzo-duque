# Nivel 2 — Builds con EAS: tu app en móviles reales

> **Qué consigues:** tu propia app instalable (con tu icono y tu nombre) en tu móvil, en vez de
> abrirla dentro de Expo Go. Puedes usar cualquier librería con código nativo y pasar la app a
> amigos para que la prueben.
>
> **Cuánto cuesta:** Expo/EAS Free (0 €): 15 builds de Android y 15 de iOS al mes, en cola de
> baja prioridad (sept. 2026, compruébalo). **Android: gratis. iPhone: necesitas el Apple
> Developer Program, 99 $/año**, sin excepción (ver paso 7).
>
> **Cuándo hacerlo:** cuando Expo Go se quede corto (una librería que no funciona en él), cuando
> vayas a hacer el nivel 3 (Sentry) o cuando quieras que otra persona pruebe la app en su móvil.
>
> **Tiempo estimado:** 1 hora (la mayor parte es esperar a que compile).
>
> **Requisitos:** Nivel 0 con tu Supabase en la nube (`npm run setup`): la app instalada habla con
> ese proyecto. Recomendable el [Nivel 1](01-nube-github-y-ci.md) para tener el código en GitHub.

## Conceptos en una frase

- **Expo Go:** una app de las tiendas que ya trae dentro un conjunto fijo de piezas nativas y
  "carga" tu JavaScript. Genial para empezar, pero no puedes añadirle nada.
- **Development build:** _tu propio Expo Go_: una app con tu nombre que incluye exactamente las
  piezas nativas que tu proyecto necesita, y que sigue cargando tu JavaScript desde tu ordenador
  (con recarga instantánea).
- **EAS (Expo Application Services):** los servidores de Expo que compilan tu app (EAS Build).
  Por eso no necesitas un Mac para compilar para iPhone.
- **Perfil de build:** una "receta" en `eas.json`. Lienzo trae tres:
  - `development` → development build, para ti mientras programas.
  - `preview` → app "normal" (sin menú de desarrollo) para pasar a amigos.
  - `production` → la que irá a las tiendas (nivel 5).
- **Distribución interna:** instalar la app sin pasar por las tiendas, con un enlace o un QR.

### ¿Cuándo se queda corto Expo Go?

Cuando instalas una librería que trae **código nativo** que Expo Go no incluye. Síntomas: errores
como _"Cannot find native module"_, _"… is not supported in Expo Go"_ o la librería simplemente
no hace nada. Ejemplos habituales: Sentry con captura de cuelgues nativos (nivel 3), Sign in with
Google nativo (nivel 6), pagos in-app (nivel 9). Las librerías `expo-*` que vienen en el SDK
normalmente sí funcionan en Expo Go. Regla práctica: si la documentación de una librería dice
"requires a development build" o "config plugin", necesitas este nivel.

---

## Pasos

### 1. Ponle nombre definitivo a la app (si no lo has hecho)

El bundle id (`com.example.lienzo`) identifica tu app en el móvil y en las tiendas, y **no se
puede cambiar una vez publicada**. Cámbialo antes del primer build:

```bash
npm run rename -- "Nombre De Tu App" com.tunombre.tuapp
```

Si lo cambias, el esquema de enlaces también cambia (por ejemplo `tuapp://`): actualiza la Site
URL y las Redirect URLs de Supabase (nivel 1, paso 2).

### 2. Crea tu cuenta de Expo

Regístrate en [expo.dev/signup](https://expo.dev/signup). Es gratis.

### 3. Instala la CLI de EAS e inicia sesión

```bash
npm install -g eas-cli
```

```bash
eas login
```

(Si prefieres no instalar nada global, cambia `eas` por `npx eas-cli@latest` en todos los
comandos de esta guía.)

### 4. Vincula el proyecto con Expo

```bash
eas init
```

Crea el proyecto en tu cuenta de expo.dev y añade a `app.json` un bloque
`"extra": { "eas": { "projectId": "…" } }`. Ese id **no es secreto**: haz commit del cambio.

### 5. Instala el cliente de desarrollo

El perfil `development` de `eas.json` usa `"developmentClient": true`, que necesita esta
librería:

```bash
npx expo install expo-dev-client
```

### 6. Sube tus variables de entorno a EAS

Tu `.env` **no** viaja a los servidores de Expo (está en `.gitignore`), así que el build no sabría
a qué Supabase conectarse. Las variables se guardan en EAS, por **entorno**: `development`,
`preview` y `production`. Cada perfil de `eas.json` ya dice qué entorno usa (el campo
`"environment"`), así que no tienes que tocar `eas.json`.

Sube la URL y la publishable key de Supabase (las mismas de tu `.env`) a los tres entornos. Son
valores **públicos** (`EXPO_PUBLIC_*`), por eso la visibilidad es `plaintext`. Cuando crees tu
proyecto de producción ([nivel 10](10-escalar-y-pagar-mas.md)), cambiarás las del entorno
`production`:

```bash
eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value https://TU_PROJECT_REF.supabase.co --environment development --environment preview --environment production --visibility plaintext
```

```bash
eas env:set --name EXPO_PUBLIC_SUPABASE_KEY --value sb_publishable_TU_CLAVE --environment development --environment preview --environment production --visibility plaintext
```

Comprueba que están:

```bash
eas env:list --environment preview
```

Las tres visibilidades posibles, para cuando subas secretos en niveles posteriores:

| Visibilidad | Quién la ve                             | Úsala para                                             |
| ----------- | --------------------------------------- | ------------------------------------------------------ |
| `plaintext` | Todos (web, CLI, logs)                  | `EXPO_PUBLIC_*` (van dentro de la app de todos modos)  |
| `sensitive` | Oculta en logs, visible en la web y CLI | Cosas poco delicadas                                   |
| `secret`    | Nadie fuera de los servidores de EAS    | Tokens de verdad (p. ej. `SENTRY_AUTH_TOKEN`, nivel 3) |

> Nota: en versiones antiguas de la CLI el comando era `eas env:create`; desde julio de 2026 está
> obsoleto y se usa `eas env:set` (crea o actualiza).
>
> Recuerda: **nunca** subas a EAS con prefijo `EXPO_PUBLIC_` algo secreto. Todo `EXPO_PUBLIC_*`
> acaba dentro de la app, la visibilidad de EAS no lo protege.

### 7. Lanza el development build

**Android** (gratis, no necesitas nada más):

```bash
eas build --profile development --platform android
```

**iPhone** — antes lee esto:

> 🍎 **Para instalar cualquier build en un iPhone físico necesitas una cuenta de pago del
> [Apple Developer Program](https://developer.apple.com/programs/enroll/) (99 $/año, sept. 2026,
> compruébalo).** Con una Apple ID gratuita no se puede con EAS. La aprobación de la cuenta puede
> tardar de horas a un par de días. Además, cada iPhone tiene que estar **registrado** antes del
> build (máximo 100 iPhones al año por cuenta).
>
> Si todavía no quieres pagar: usa Android (gratis), o sigue probando en el iPhone con **Expo Go**
> mientras no necesites librerías nativas. (El simulador de iOS solo existe en Mac, así que desde
> Windows no es una opción.)

Si tienes la cuenta de Apple, registra tu iPhone:

```bash
eas device:create
```

Te dará un enlace/QR. Ábrelo **desde el iPhone** y sigue los pasos (instala un perfil de
configuración). Después lanza el build:

```bash
eas build --profile development --platform ios
```

La primera vez, EAS te pedirá iniciar sesión con tu Apple ID y se encargará de crear
certificados y perfiles de aprovisionamiento. Acepta que los gestione EAS: es lo más sencillo.

**Mientras compila:** el plan Free usa una cola de baja prioridad, así que puede tardar desde
unos minutos hasta más de una hora en horas punta. Puedes cerrar la terminal; el progreso se ve
en [expo.dev](https://expo.dev) → tu proyecto → **Builds**.

### 8. Instala la app en el móvil

Cuando termine, verás un enlace y un QR (en la terminal y en expo.dev).

- **Android:** abre el enlace en el móvil, descarga el `.apk` e instálalo. Android te pedirá
  permitir "instalar apps de orígenes desconocidos" para tu navegador: acéptalo para esta
  instalación.
- **iPhone:** escanea el QR con la cámara e instala. Luego activa el **Modo desarrollador**:
  **Ajustes → Privacidad y seguridad → Modo desarrollador** (solo aparece tras instalar la
  primera app de desarrollo), activa y reinicia el iPhone.

### 9. Úsala para programar

Con el development build instalado, en tu ordenador:

```bash
npx expo start --dev-client
```

Abre **tu app** (no Expo Go) en el móvil y elige tu ordenador en la lista, o escanea el QR. Todo
funciona como antes (recarga al guardar), pero con tus librerías nativas.

> ¿Cuándo hay que hacer **otro** development build? Solo cuando cambies algo nativo: instalar
> o quitar una librería con código nativo, tocar `plugins` o permisos en `app.json`, o cambiar
> iconos/nombre. Si solo tocas JavaScript/TypeScript, no.

### 10. Pásasela a tus amigos (perfil `preview`)

`preview` genera una app "normal", sin menú de desarrollo, que no necesita tu ordenador:

```bash
eas build --profile preview --platform android
```

Comparte el enlace de la build. En Android basta con eso. En iPhone, **cada** iPhone tiene que
registrarse antes con `eas device:create` (tú les pasas el enlace) y después hay que volver a
hacer el build para incluirlos.

Para llegar a mucha gente en iPhone, lo razonable es **TestFlight** (nivel 5).

### 11. Lanza builds desde GitHub (opcional)

El workflow `.github/workflows/eas-build.yml` compila desde GitHub con un botón. Está inactivo
hasta que le des un token:

1. En [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens) → **Create
   token** (nombre: "GitHub Actions"). Cópialo: es **secreto**.
2. En GitHub: **Settings → Secrets and variables → Actions → New repository secret** →
   nombre `EXPO_TOKEN`, valor el token.
3. **Actions → EAS Build (+ envío a las tiendas) → Run workflow**, elige perfil y plataforma.

Las builds de iOS lanzadas desde GitHub necesitan que las credenciales de Apple ya existan en EAS,
así que haz la primera de iOS desde tu terminal (paso 7).

---

## ✅ Cómo sé que ha funcionado

- [ ] `app.json` tiene `extra.eas.projectId` y el cambio está en git.
- [ ] `eas env:list --environment development` muestra las dos variables de Supabase.
- [ ] En expo.dev → **Builds**, tu build aparece como **Finished**.
- [ ] En el móvil tienes una app con **tu nombre e icono** (no Expo Go).
- [ ] La abres, te conectas a `npx expo start --dev-client` y ves la pantalla de login.
- [ ] Inicias sesión con un usuario de la nube y ves sus notas.
- [ ] (Si hiciste `preview`) un amigo instala la app y se registra sin que tu ordenador esté
      encendido.

## 🧯 Problemas típicos

- **"Configuración inválida" nada más abrir la build:** faltan las variables en el entorno EAS que
  usa ese perfil. Revisa con `eas env:list --environment development` (o `preview`) y vuelve a
  compilar: las variables se meten en la app **al compilar**.
- **La app se conecta a `127.0.0.1` y no carga nada:** subiste a EAS los valores de la base local
  con Docker (modo avanzado). En el móvil `127.0.0.1` es el propio móvil. Usa los de tu proyecto
  de la nube (`https://….supabase.co`).
- **"expo-dev-client is not installed":** te saltaste el paso 5.
- **iOS: "Untrusted developer" o la app no abre:** falta activar el Modo desarrollador (paso 8).
- **iOS: "Unable to install" o el QR no hace nada:** ese iPhone no estaba registrado cuando se hizo
  el build. `eas device:create`, y compila otra vez.
- **El build lleva mucho en cola:** es el plan Free. Espera, o mira el plan Starter (nivel 10).
  Compilar en tu propio ordenador (`eas build --local`) exige macOS o Linux, así que en Windows no
  es una opción práctica.
- **"You have reached your build limit":** has gastado los builds del mes. Espera al mes
  siguiente o mira el plan Starter. Consejo: no compiles para "probar un cambio de JavaScript"; eso
  se prueba con `npx expo start --dev-client`.
- **El build falla y no entiendes el log:** copia el enlace del build de expo.dev y pásaselo a
  Claude: "este build de EAS ha fallado, ¿qué pasa?".

## Pedírselo a Claude

```
/graduar 02
```

O pega algo así:

> Quiero instalar la app en mi Android. Ya tengo cuenta de Expo y he hecho `eas login`. Guíame con
> eas init, expo-dev-client, las variables de entorno de EAS con mis valores de Supabase de la
> nube y el primer development build.

> Tengo un iPhone y todavía no tengo cuenta de Apple Developer. ¿Qué opciones tengo y cuánto
> cuesta cada una?

## Documentación oficial

- [Development builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Distribución interna](https://docs.expo.dev/build/internal-distribution/)
- [Variables de entorno en EAS](https://docs.expo.dev/eas/environment-variables/)
- [Referencia de la CLI de EAS](https://docs.expo.dev/eas/cli/)
- [Precios de EAS](https://expo.dev/pricing)
- [Modo desarrollador en iOS](https://docs.expo.dev/guides/ios-developer-mode/)
