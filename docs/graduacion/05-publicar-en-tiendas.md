# Nivel 5 — Publicar en App Store y Google Play

> **Qué consigues:** que cualquier persona pueda buscar tu app en la App Store o en Google Play y
> descargarla.
>
> **Cuánto cuesta:** Apple Developer Program **99 $/año** · Google Play Console **25 $ una sola
> vez** (sept. 2026, compruébalo). EAS Build gratis sirve (15 builds iOS + 15 Android al mes).
>
> **Cuándo hacerlo:** cuando la app ya la usan tus amigos sin problemas (niveles 1–4 hechos) y
> estás dispuesto a mantenerla: una app publicada hay que actualizarla al menos una vez al año.
>
> **Tiempo estimado:** 1–2 tardes de trabajo + **esperas**: verificación de cuentas (1–7 días),
> revisión de Apple (normalmente 1–3 días) y, en Google con cuenta personal nueva, **14 días de
> pruebas cerradas obligatorias** antes de poder publicar.
>
> **Requisitos:** [Nivel 1](01-nube-github-y-ci.md) (GitHub y CI), [Nivel 2](02-builds-con-eas.md)
> (EAS), [Nivel 4](04-emails-con-resend.md) (emails que llegan). Muy recomendable el
> [Nivel 3](03-observabilidad.md) (saber si la app falla en móviles ajenos).

## Antes de empezar: el mapa

Publicar tiene cuatro partes. No te agobies, se hacen una detrás de otra:

1. **Preparar la app**: nombre e identificador definitivos, icono, splash.
2. **Abrir las cuentas** de desarrollador (Apple y Google) y las páginas legales (privacidad).
3. **Compilar y subir**: `eas build` crea el archivo instalable, `eas submit` lo sube a la tienda.
4. **Rellenar la ficha** (capturas, descripción, formularios de privacidad) y **enviar a revisión**.

Dos palabras que vas a ver mucho:

- **Bundle id / package name**: el "DNI" de tu app en las tiendas, tipo `com.tunombre.miapp`.
  **No se puede cambiar nunca** una vez publicada.
- **Build**: un archivo instalable compilado (`.ipa` para iPhone, `.aab` para Android).

---

## Paso 1 — Nombre y bundle id definitivos (¡antes que nada!)

Tu repo todavía se llama "Lienzo" y usa `com.example.lienzo`. Las tiendas **rechazan** cualquier
cosa con `com.example`. Elige ahora:

- **Nombre visible**: el que sale debajo del icono (máx. 30 caracteres en la App Store). Búscalo en
  ambas tiendas para ver que no está cogido.
- **Bundle id**: `com.` + tu nombre o dominio + `.` + nombre de la app, en minúsculas y sin
  guiones. Ejemplo: `com.lauraperez.recetario`. Si tienes dominio (`recetario.app`), usa
  `app.recetario`.

```bash
npm run rename -- "Recetario" com.lauraperez.recetario
```

El script cambia `app.json` (nombre, slug, esquema de enlaces `recetario://`, bundle id de iOS y
package de Android), `package.json` y `supabase/config.toml`. Después:

1. Cambia el texto "Lienzo" de `src/app/(auth)/sign-in.tsx`.
2. En el **Dashboard de Supabase** (en tu proyecto de desarrollo y, si ya lo tienes, en el de
   producción) → Authentication → URL Configuration, cambia
   `lienzo://` por tu nuevo esquema en **Site URL** y **Redirect URLs** (si no, los enlaces de
   confirmación y de "olvidé mi contraseña" no abrirán la app).
3. Si ya hiciste builds con EAS con el id antiguo, no pasa nada: EAS creará credenciales nuevas
   para el id nuevo en el siguiente build.

## Paso 2 — Icono y pantalla de carga (splash)

- **Icono**: PNG de **1024 × 1024**, sin transparencias y sin esquinas redondeadas (las tiendas las
  redondean solas). En iOS, `app.json` apunta a `./assets/expo.icon` (formato de Icon Composer de
  Apple); en Android, a los tres PNG `android-icon-*` (icono adaptativo: fondo + primer plano +
  monocromo).
- **Splash**: lo configura el plugin `expo-splash-screen` en `app.json` (imagen centrada + color de
  fondo claro y oscuro).

Guía detallada: [docs/guias/iconos-y-splash.md](../guias/iconos-y-splash.md) y la
[doc oficial de Expo](https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/).
Si no sabes diseñar, un icono sencillo (una letra o símbolo sobre un color) es perfectamente
válido.

## Paso 3 — Abrir las cuentas de desarrollador

### Apple Developer Program (99 $/año)

Qué es: la suscripción que te deja publicar en la App Store y usar TestFlight (la app de Apple
para probar versiones antes de publicarlas).

Alta en [developer.apple.com/programs/enroll](https://developer.apple.com/programs/enroll/). Necesitas
un Apple ID con verificación en dos pasos. Dos modalidades:

|                          | **Particular**               | **Organización (empresa)**                                                                                          |
| ------------------------ | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Quién sale como vendedor | Tu nombre y apellidos        | El nombre de la empresa                                                                                             |
| Qué necesitas            | DNI/pasaporte                | Empresa constituida + **número D-U-N-S** (gratis, lo da Dun & Bradstreet; tarda días o semanas) + web de la empresa |
| Cuándo elegirla          | Proyecto personal o autónomo | Ya tienes una sociedad                                                                                              |

**Estado de "comerciante" en la UE (Ley de Servicios Digitales)**: App Store Connect te preguntará
si eres _trader_ (comerciante). Si lo eres (vas a ganar dinero con la app), Apple **mostrará en la
ficha de la UE** tu dirección, teléfono y email, y el teléfono no se puede ocultar. Si esto te
preocupa, valora un apartado de correos, un número solo para esto o darte de alta como empresa.
Info oficial: [requisitos DSA de Apple](https://developer.apple.com/help/app-store-connect/manage-compliance-information/manage-european-union-digital-services-act-trader-requirements/).

### Google Play Console (25 $ una vez)

Alta en [play.google.com/console/signup](https://play.google.com/console/signup). También hay
cuenta **personal** u **organización** (esta pide D-U-N-S). Google verifica tu identidad con un
documento y te pide acceso a un móvil Android.

> ⚠️ **Regla de las pruebas cerradas (cuentas personales creadas después del 13-11-2023):** antes
> de poder publicar, tu app tiene que estar en una **prueba cerrada con al menos 12 testers que
> sigan apuntados durante 14 días seguidos**. Si alguien se da de baja, no cuenta. Después
> rellenas un cuestionario ("¿qué aprendiste de la prueba?") y Google tarda hasta ~7 días en darte
> acceso a producción (sept. 2026, compruébalo en la
> [ayuda oficial](https://support.google.com/googleplay/android-developer/answer/14151465)).
> Las cuentas de organización están exentas. **Empieza a reclutar testers ya** (familia, amigos,
> compañeros con Android).

## Paso 4 — Política de privacidad, términos y página de borrado

Las dos tiendas **exigen una URL pública** con tu política de privacidad. Google además exige una
**URL web donde pedir el borrado de la cuenta** (para quien ya desinstaló la app).

Qué es una política de privacidad: un texto que explica qué datos recoges, para qué, con quién los
compartes y cómo se borran. Como estás en España, aplica el **RGPD**.

Qué recoge Lienzo tal cual viene (ajústalo si añades cosas):

- **Email y contraseña** (cuenta, gestionados por Supabase Auth; la contraseña se guarda cifrada).
- **Nombre** (`display_name` del perfil) y **el contenido que crea el usuario** (notas).
- Si hiciste el nivel 3: **datos de fallos** (Sentry) y **uso de la app** (PostHog), sin emails
  ni textos del usuario.
- Proveedores que tratan datos por ti: Supabase (elige región UE al crear el proyecto), Expo,
  Sentry, PostHog, Resend.

Opciones **gratis** para publicarla:

- **Una página de Notion o de Google Sites** marcada como pública. Lo más rápido.
- **GitHub Pages** en un repo público aparte (p. ej. `miapp-legal`) con 3 archivos Markdown:
  `privacidad.md`, `terminos.md` y `borrar-cuenta.md`.
- Generadores de texto base (revísalo siempre): [App Privacy Policy Generator](https://app-privacy-policy-generator.nisrulz.com/),
  [TermsFeed](https://www.termsfeed.com/). Claude puede redactarte un borrador a partir del código.

La página **"Cómo borrar tu cuenta"** puede ser muy simple: "Desde la app: Perfil → Borrar mi
cuenta. Si ya no tienes la app, escribe a _tu-email_ desde el email de tu cuenta y la borraremos
en un máximo de 30 días". Requisitos de Google:
[borrado de cuentas](https://support.google.com/googleplay/android-developer/answer/13327111).

> Esto no es asesoramiento legal. Si tu app trata datos de salud, menores o pagos, consulta con
> un profesional.

## Paso 5 — Deja la nube lista para los revisores

Hasta ahora has trabajado con tu proyecto de Supabase de **desarrollo** (el de `npm run setup`),
lleno de usuarios y datos de prueba. Los usuarios de las tiendas deben ir a un proyecto
**nuevo y limpio de producción**: créalo y configúralo siguiendo el
[nivel 10, sección 2](10-escalar-y-pagar-mas.md#2-entornos-separados-desarrollo-y-producción).
Todo lo de este paso se hace **en el proyecto de producción**.

1. **Borrar cuenta funciona en la nube**: la Edge Function `delete-account` tiene que estar
   desplegada en producción (el workflow `deploy-supabase.yml` lo hace al mergear en `main` si
   sus secrets apuntan a producción; o a mano, con el Project ref de producción):

   ```bash
   npx supabase functions deploy delete-account --use-api --project-ref TU_REF_DE_PRODUCCION
   ```

   Pruébalo en tu móvil: crea una cuenta de usar y tirar → Perfil → **Borrar mi cuenta**.

2. **Cuenta demo para los revisores**. Apple y Google entran en tu app; si hay login, **necesitan
   credenciales**. Créala en Supabase Dashboard → Authentication → Users → **Add user** →
   email tipo `review@tudominio.com`, contraseña larga y marca **Auto Confirm User**. Entra con
   ella desde la app y crea 2–3 notas de ejemplo para que no vea la app vacía. **No la borres
   nunca** (se usa en cada revisión).
3. **Que el proyecto no se pause**: en el plan gratis, Supabase pausa el proyecto tras 1 semana sin
   actividad. Si el revisor abre la app con el proyecto pausado, **te rechazan**. Entra tú en la
   app el día que envíes a revisión, o pasa a Pro ([nivel 10](10-escalar-y-pagar-mas.md)).
4. **Variables de producción en EAS**: el perfil `production` de `eas.json` usa el entorno EAS
   `production`. Comprueba que tiene las variables del proyecto de **producción**:

   ```bash
   eas env:list --environment production
   ```

   Deben aparecer `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_KEY` (las del proyecto de
   producción, no las de desarrollo ni las de `127.0.0.1`). Si faltan o son las de desarrollo,
   cámbialas (ver [nivel 2](02-builds-con-eas.md)).

## Paso 6 — Compilar la versión de tienda

**Versión vs. número de build** (confunde a todo el mundo):

- **Versión** (`"version": "1.0.0"` en `app.json`): la que ven los usuarios en la tienda. La
  cambias **tú** en cada lanzamiento: `1.0.0` → `1.0.1` (arreglos) → `1.1.0` (novedades).
- **Número de build** (`buildNumber` en iOS, `versionCode` en Android): un contador interno que
  **debe subir en cada archivo que envías**. Aquí no lo tocas nunca: `eas.json` tiene
  `"appVersionSource": "remote"` y `"autoIncrement": true`, así que EAS lo guarda en sus servidores
  y lo sube solo.

```bash
eas build --profile production --platform ios
```

```bash
eas build --profile production --platform android
```

La primera vez, EAS te pedirá entrar con tu Apple ID y creará los certificados de firma por ti.
Di que **sí** a todo lo que ofrezca generar. En Android genera el _keystore_ (la llave de firma):
EAS lo guarda; **no lo pierdas** (puedes descargar una copia con `eas credentials`).

Alternativa sin terminal: GitHub → Actions → **EAS Build (+ envío a las tiendas)** → Run workflow
→ perfil `production`, plataforma, y `submit` marcado para que al terminar lo suba solo. Para que
el envío automático funcione sin preguntarte nada, antes tienes que haber hecho **un** `eas submit`
a mano por plataforma (así EAS guarda las credenciales de subida).

## Paso 7 — Subir a Apple (TestFlight)

1. En [App Store Connect](https://appstoreconnect.apple.com) → Apps → **+** → Nueva app: nombre,
   idioma principal (Español (España)), bundle id (elige el tuyo) y un SKU (cualquier texto, p. ej.
   `recetario-001`).
2. Sube el build:

   ```bash
   eas submit --platform ios --latest
   ```

   La primera vez te ofrece crear una **App Store Connect API Key**: acepta, EAS la guarda.

3. Tras 10–30 minutos, el build aparece en **TestFlight**. Añádete como tester interno (hasta 100
   personas de tu equipo, sin revisión) e instálalo con la app TestFlight en tu iPhone.
   Para testers externos (cualquier email, hasta 10.000) Apple hace una revisión rápida de la beta.

`app.json` ya declara `ITSAppUsesNonExemptEncryption: false`, así que Apple no te preguntará por
la exportación de cifrado en cada build.

## Paso 8 — Subir a Google Play

1. En [Play Console](https://play.google.com/console) → **Crear aplicación**: nombre, idioma,
   app/juego, gratis/de pago (**gratis no se puede cambiar a de pago después**).
2. Crea una **cuenta de servicio de Google** para que EAS pueda subir por ti. Sigue la guía de Expo
   [Creating a Google Service Account](https://expo.fyi/creating-google-service-account). Descarga
   el JSON y súbelo a EAS (así **no** vive en tu repo):

   ```bash
   eas credentials --platform android
   ```

   (Elige _Google Service Account_ → _Upload_.) **Nunca hagas commit de ese JSON**: es una llave.

3. Sube el build:

   ```bash
   eas submit --platform android --latest
   ```

   La primera subida va a la pista de **prueba interna** como borrador. Si Play Console se queja de
   que el primer archivo debe subirse a mano, descarga el `.aab` desde expo.dev y súbelo una vez
   en Play Console → Pruebas → Prueba interna.

4. **Cuenta personal nueva**: crea una **prueba cerrada** (Pruebas → Prueba cerrada), añade la
   lista de emails de tus 12+ testers, pásales el enlace de inscripción y espera 14 días. Pídeles
   que la abran de vez en cuando y te den feedback (lo necesitarás para el cuestionario).
5. Cuando se cumpla, Panel → **Solicitar acceso a producción**.

## Paso 9 — La ficha de la tienda

### App Store (App Store Connect → tu app)

- **Nombre** (30), **subtítulo** (30), **descripción**, **palabras clave** (100 caracteres, separadas
  por comas), **URL de soporte** (obligatoria: puede ser tu página de Notion) y **URL de la política
  de privacidad**.
- **Capturas**: App Store Connect te indica los tamaños obligatorios (hoy, los del iPhone más
  grande). Como `supportsTablet` es `false`, **no necesitas capturas de iPad**. Sin Mac no hay
  simulador: hazlas en un iPhone grande con la build de TestFlight, o pide prestado uno y, si el
  tamaño no cuadra, ajústalas con una herramienta de capturas para tiendas.
- **Categoría** y **clasificación por edades**: responde el cuestionario (desde 2025 hay franjas
  4+, 9+, 13+, 16+ y 18+). Si los usuarios pueden publicar contenido que ven otros, dilo.
- **App Privacy** ("etiquetas nutricionales"): ver paso 10.
- **Información para la revisión**: marca "Se requiere iniciar sesión" y pon el email y la
  contraseña de la **cuenta demo**. Añade una nota en inglés sencillo: _"Create notes from the +
  button. Account deletion: Profile tab → Delete my account."_

### Google Play (Play Console → Crecer → Presencia en Play Store)

- Descripción breve (80), descripción completa (4.000), icono 512 × 512, **gráfico de funciones**
  1024 × 500 (una imagen horizontal con el nombre) y al menos 2 capturas de móvil.
- En **Contenido de la app** (Política → Contenido de la app) hay que completar todo: política de
  privacidad, **acceso a la app** (credenciales demo), anuncios (no), **clasificación de contenido**
  (cuestionario IARC), público objetivo (si incluyes menores de 13, hay requisitos extra: evita
  marcarlo si no es tu público), **Seguridad de los datos** y borrado de cuentas (paso 10).

## Paso 10 — Formularios de privacidad y borrado de cuenta

Tienen que **coincidir con tu política de privacidad y con lo que hace el código**. Una
discrepancia es motivo de rechazo. Con Lienzo tal cual (+ nivel 3):

| Dato            | Apple (App Privacy)                                       | Google (Seguridad de los datos)                    | ¿Para rastrear/anuncios? |
| --------------- | --------------------------------------------------------- | -------------------------------------------------- | ------------------------ |
| Email           | Información de contacto → Email · Funcionalidad de la app | Información personal → Email · Gestión de cuenta   | No                       |
| Nombre          | Información de contacto → Nombre                          | Información personal → Nombre                      | No                       |
| Notas           | Contenido del usuario → Otro contenido                    | Mensajes/Archivos → Otro contenido                 | No                       |
| Id de usuario   | Identificadores → ID de usuario                           | Identificadores → ID de usuario                    | No                       |
| Fallos (Sentry) | Diagnóstico → Datos de fallos                             | Info y rendimiento de la app → Registros de fallos | No                       |
| Uso (PostHog)   | Datos de uso → Interacción con el producto                | Actividad en la app → Interacciones                | No                       |

En Google responde además: datos **cifrados en tránsito**: sí (todo va por HTTPS); ¿el usuario
puede pedir que se borren?: **sí**, y pega la URL de tu página "Cómo borrar tu cuenta".

**Borrar la cuenta desde la app** es obligatorio en ambas tiendas si hay registro. **Ya lo tienes**:
Perfil → **Borrar mi cuenta** llama a la Edge Function `delete-account`, que borra el usuario y,
en cascada, su perfil y sus notas. Si añades tablas nuevas con `on delete cascade` hacia
`auth.users` (como hace la skill `/nueva-tabla`), también se borrarán solas. Si añades **Sign in
with Apple** ([nivel 6](06-login-social.md)), lee allí la nota sobre revocar tokens.

## Paso 11 — Enviar a revisión

- **Apple**: en la versión (p. ej. 1.0), sección _Compilación_ → elige el build de TestFlight →
  **Añadir para revisión** → **Enviar**. Elige "publicar manualmente" para decidir tú el día.
- **Google**: Producción → **Crear nueva versión** → elige el build → notas de la versión →
  **Revisar versión** → enviar. Puedes hacer un lanzamiento **escalonado** (p. ej. 20 % de usuarios)
  para ir con cuidado.

### Rechazos típicos y cómo responder

| Motivo                             | Qué significa                                                                          | Qué hacer                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **2.1 App Completeness**           | Se colgó, o la cuenta demo no funcionaba                                               | Comprueba la cuenta demo y que Supabase no esté pausado; mira Sentry |
| **4.2 Minimum Functionality**      | "Hace demasiado poco" o parece una web metida en una app                               | Añade valor real; explica en la respuesta qué aporta la app          |
| **5.1.1 Data Collection**          | Pides datos que no necesitas, faltan textos de permisos o no se puede borrar la cuenta | Justifica cada dato; indica dónde está "Borrar mi cuenta"            |
| **4.8 Login Services**             | Tienes login con Google sin una opción "equivalente"                                   | Añade Sign in with Apple ([nivel 6](06-login-social.md))             |
| **3.1.1 In-App Purchase**          | Cobras contenido digital sin compras in-app                                            | Ver [nivel 9](09-cobrar.md)                                          |
| **2.3 Metadata**                   | Capturas o texto que no coinciden con la app                                           | Rehaz capturas reales                                                |
| Google: **Seguridad de los datos** | El formulario no coincide con lo que detectan                                          | Revisa SDKs (Sentry, PostHog) y declara lo que envían                |

Cómo responder: en App Store Connect, en el mensaje de rechazo (_App Review_), contesta en **inglés
sencillo**, educado y concreto: qué has cambiado o dónde está lo que no encontraron (con pasos).
Si crees que se equivocan, puedes explicarlo; muchas veces basta con aclararlo. Si cambias código
nativo, sube un build nuevo; si solo es la ficha, no hace falta. Claude te puede redactar la
respuesta: pégale el mensaje de Apple.

### Publicar actualizaciones después

1. Sube `version` en `app.json` (`1.0.0` → `1.0.1`).
2. `eas build --profile production` + `eas submit` (o el workflow con `submit`).
3. En la tienda, crea la versión nueva y envíala a revisión.

Si el cambio es **solo JavaScript** (textos, pantallas, arreglos de lógica), puedes saltarte las
tiendas con una actualización OTA: [nivel 7](07-actualizaciones-ota.md).

---

## ✅ Cómo sé que ha funcionado

- Instalas la app desde **TestFlight** y desde la **prueba interna/cerrada** de Google, entras con
  la cuenta demo y ves sus notas (eso demuestra que apunta a tu proyecto de producción).
- Perfil → Borrar mi cuenta funciona con una cuenta de prueba (y desaparece en Supabase →
  Authentication → Users).
- Tus URLs de privacidad y de borrado abren en una ventana de incógnito.
- App Store Connect muestra "Listo para distribución" y Play Console "Publicada". Buscas el nombre
  en la tienda (tarda unas horas en aparecer en búsquedas) y la descargas.

## 🧯 Problemas típicos

- **"Bundle ID … is not available"**: alguien ya lo usa (o lo usaste en otra cuenta). Elige otro
  y vuelve a ejecutar `npm run rename`.
- **La app instalada no conecta / pantalla de error al abrir**: el build de producción no tiene
  las variables de producción. Revisa `eas env:list --environment production` y recompila.
- **"The version code has already been used"**: alguien subió un build a mano. Ajusta el contador
  remoto con `eas build:version:set` y recompila.
- **Google: "Tu app no cumple el requisito de testers"**: el reloj de 14 días se reinicia si bajas
  de 12 testers. Pide a más gente de la necesaria (15–20) por si alguien se da de baja.
- **El revisor dice que no puede iniciar sesión**: proyecto de Supabase pausado, cuenta demo sin
  confirmar o se te olvidó poner la contraseña. Pruébala tú antes de cada envío.
- **Enlaces de confirmación de email abren `lienzo://`**: no actualizaste las Redirect URLs de
  Supabase tras renombrar (paso 1).
- **El workflow con `submit` falla pidiendo credenciales**: haz primero un `eas submit` manual por
  plataforma para que EAS guarde la API key de Apple y la cuenta de servicio de Google.

## Pedírselo a Claude

```
/graduar 05
```

Otros ejemplos:

- "Renombra la app a _Recetario_ con bundle id `com.lauraperez.recetario` y dime qué más tengo
  que cambiar a mano."
- "Revisa el código y redáctame una política de privacidad en español según lo que recoge la
  app de verdad, más la página de 'cómo borrar tu cuenta'."
- "Rellena conmigo el formulario App Privacy de Apple y el de Seguridad de los datos de Google."
- "Apple me ha rechazado con este mensaje: _(pégalo)_. ¿Qué cambio y qué les respondo?"
- "Escríbeme la descripción de la tienda (corta y larga) y 100 caracteres de palabras clave."
