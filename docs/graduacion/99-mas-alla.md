# Más allá — temas avanzados

Esto no son niveles con pasos, sino un **mapa**: cosas que quizá necesites algún día, qué son en
un párrafo y dónde está la documentación oficial. No hagas ninguna "por si acaso": espera a tener
el problema que resuelven. Cuando llegue el momento, pídeselo a Claude citando la sección, por
ejemplo: _"Quiero hacer lo de 'Modo offline' de docs/graduacion/99-mas-alla.md"_.

Recuerda las reglas de siempre en todo lo que añadas: pantalla → hook (`src/hooks`) → función
(`src/api`); tablas nuevas con RLS y GRANTs; secretos solo en el servidor; dependencias con
`npx expo install`.

---

## Sesión cifrada en el Keychain

Hoy la sesión de Supabase se guarda en **AsyncStorage** (`src/api/supabase.ts`): un almacén
normal del móvil, sin cifrar. Es lo habitual y suficiente para la mayoría de apps, pero si tu app
maneja datos sensibles (salud, dinero) conviene guardarla cifrada en el **Keychain** (iOS) /
**Keystore** (Android) con `expo-secure-store`. Como SecureStore tiene un límite de tamaño y la
sesión puede superarlo, la receta oficial de Supabase es un **"LargeSecureStore"**: guarda en
SecureStore solo una clave de cifrado y en AsyncStorage la sesión cifrada con ella.
→ [Supabase + Expo (almacenamiento cifrado)](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) ·
[expo-secure-store](https://docs.expo.dev/versions/latest/sdk/securestore/)

## Internacionalización (varios idiomas)

Qué es: que la app salga en inglés a quien tiene el móvil en inglés. Se usa `expo-localization`
para saber el idioma del móvil y una librería como `i18next` (con `react-i18next`) para sacar los
textos a archivos por idioma (`es.json`, `en.json`). Lo costoso no es el código, es mover todos
los textos de las pantallas y mantener las traducciones; no olvides también los mensajes de
`src/utils/errors.ts` y la ficha de las tiendas.
→ [Expo: Localization](https://docs.expo.dev/guides/localization/) ·
[react-i18next](https://react.i18next.com/)

## Modo offline y caché persistente

Hoy React Query guarda los datos **en memoria**: al cerrar la app se pierden y al abrirla sin
conexión la lista sale vacía. Con el _persister_ de React Query
(`@tanstack/query-async-storage-persister` + `PersistQueryClientProvider`) la caché se guarda en
el móvil y la app enseña lo último que vio aunque no haya internet. Con `onlineManager` y
`@react-native-community/netinfo`, las escrituras hechas sin red se pueden reintentar al volver la
conexión. Un offline "completo" con sincronización y conflictos es otro mundo (herramientas como
PowerSync o Legend State): no empieces por ahí.
→ [TanStack Query: persistQueryClient](https://tanstack.com/query/latest/docs/framework/react/plugins/persistQueryClient) ·
[React Native](https://tanstack.com/query/latest/docs/framework/react/react-native)

## Tiempo real (Supabase Realtime)

Qué es: que la pantalla se actualice sola cuando otro usuario (u otro móvil tuyo) cambia algo,
sin recargar. Supabase Realtime puede avisarte de cambios en una tabla (_Postgres Changes_,
respetando RLS) o mandar mensajes efímeros entre usuarios (_Broadcast_, _Presence_: "está
escribiendo…"). En Lienzo encaja así: `src/api` se suscribe al canal y, en el hook, al llegar un
cambio haces `invalidateQueries` y React Query recarga. Cada suscripción es una conexión abierta:
desuscríbete al salir de la pantalla y mira los límites de tu plan.
→ [Supabase Realtime](https://supabase.com/docs/guides/realtime)

## Subir imágenes a Storage

Para fotos de perfil, adjuntos, etc. se usa **Supabase Storage** (archivos) con policies de
seguridad parecidas a RLS, más `expo-image-picker` para elegir la foto y `expo-image` para
mostrarla con caché. Hay detalles delicados (comprimir antes de subir, rutas por usuario,
policies del bucket), así que Lienzo trae una skill: escribe **`/subir-imagenes`** en Claude Code.
→ [Supabase Storage](https://supabase.com/docs/guides/storage) ·
[expo-image-picker](https://docs.expo.dev/versions/latest/sdk/imagepicker/)

## Tests E2E con Maestro

Los tests actuales (Jest) prueban funciones y componentes sueltos. Un test **E2E** (_end to end_)
abre la app de verdad en un simulador y hace lo que haría una persona: "toca Entrar, escribe el
email, comprueba que aparece la lista". **Maestro** lo hace con archivos YAML muy legibles, y EAS
Workflows puede ejecutarlos en la nube en cada PR. Útil cuando ya tienes flujos críticos (registro,
pago) que no quieres romper nunca.
→ [Maestro](https://docs.maestro.dev) ·
[EAS Workflows: tests E2E](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)

## Feature flags (PostHog)

Qué es un _feature flag_: un interruptor remoto para activar una función solo para algunos
usuarios (tú, el 10 %, los de España…) sin publicar nada nuevo. Sirve para lanzar con cuidado,
hacer pruebas A/B o apagar algo que falla. Si ya tienes PostHog del
[nivel 3](03-observabilidad.md), viene incluido (1 millón de peticiones gratis al mes, sept. 2026,
compruébalo). Úsalo desde un hook (`useFeatureFlag`) y nunca como única protección de algo
sensible: la seguridad sigue siendo RLS.
→ [PostHog Feature Flags](https://posthog.com/docs/feature-flags)

## Deep links y universal links

La app ya responde a enlaces con su **esquema** (`lienzo://note/123`, o el tuyo tras
`npm run rename`), y expo-router convierte cada archivo de `src/app/` en una ruta. Los
**universal links** (iOS) / **App Links** (Android) van un paso más allá: que un enlace normal
`https://tudominio.com/note/123` abra la app si está instalada y la web si no. Requiere tu dominio,
publicar dos archivos de verificación (`apple-app-site-association` y `assetlinks.json`) y
configurar `app.json`.
→ [Expo: Linking](https://docs.expo.dev/linking/overview/) ·
[Universal links iOS](https://docs.expo.dev/linking/ios-universal-links/) ·
[App Links Android](https://docs.expo.dev/linking/android-app-links/)

## Accesibilidad

Que la app la pueda usar alguien con lector de pantalla, letra grande o poca vista. Los
componentes de `src/components/ui` ya ponen lo básico (`accessibilityRole`, estados, tamaño
mínimo de toque). Lo siguiente: probar la app con **VoiceOver** (iOS) y **TalkBack** (Android),
poner `accessibilityLabel` a iconos sin texto, comprobar que nada se rompe con el texto del sistema
al máximo y cuidar el contraste de colores en `src/theme/tokens.ts`. Además de ser lo correcto,
en la UE la accesibilidad es cada vez más una obligación legal para ciertos servicios.
→ [React Native: Accessibility](https://reactnative.dev/docs/accessibility)

## Rendimiento de listas largas

La lista de notas usa los componentes estándar, que van bien hasta unos cientos de elementos. Con
miles de filas, imágenes o scroll infinito, cambia a **FlashList** (de Shopify) o **Legend
List**: reciclan las filas que salen de pantalla y el scroll sigue fluido. Combínalo con
paginación (`useInfiniteQuery`) para no traer todo de golpe ([nivel 10](10-escalar-y-pagar-mas.md)).
→ [FlashList](https://shopify.github.io/flash-list/) ·
[Legend List](https://legendapp.com/open-source/list/)

## Animaciones

**Reanimated** (ya instalado: `react-native-reanimated`) y **Gesture Handler** (también) permiten
animaciones fluidas que corren fuera del hilo de JavaScript: aparecer/desaparecer elementos,
arrastrar, deslizar para borrar. Empieza por las _layout animations_ (`entering`/`exiting`), que
dan mucho con una línea. Usa animaciones para explicar (qué ha pasado, adónde ha ido algo), no
para decorar, y respeta la opción del sistema "Reducir movimiento".
→ [Reanimated](https://docs.swmansion.com/react-native-reanimated/) ·
[Gesture Handler](https://docs.swmansion.com/react-native-gesture-handler/)

## Web y landing page

Lienzo ya arranca en web (`npm run web`), útil para probar. Pero la **landing page** (la web que
explica tu app, con los botones de descarga y tus páginas legales) suele ir mejor como un sitio
aparte y sencillo (Carrd, Framer, Notion, o Astro si quieres código), porque tiene otros objetivos
(SEO, velocidad, textos). Si quieres publicar la versión web de la propia app, Expo tiene **EAS
Hosting**.
→ [Expo para web](https://docs.expo.dev/workflow/web/) ·
[EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/)

## Monorepo

Qué es: un único repositorio con varios proyectos (la app, la web, un panel de administración) que
comparten código (tipos de la base de datos, validaciones de zod). Tiene sentido cuando de verdad
hay un segundo proyecto que comparte mucho; antes, añade complejidad sin ganancia.
→ [Expo: Monorepos](https://docs.expo.dev/guides/monorepos/)

## CI de previews (EAS Workflows)

Hoy los builds y updates se lanzan a mano desde GitHub Actions. **EAS Workflows** es el sistema de
automatización de Expo (archivos en `.eas/workflows/`): por ejemplo, publicar un **update de
preview por cada Pull Request** para probar el cambio en el móvil antes de mergear, lanzar builds
solo si cambió algo nativo (usando la _fingerprint_ del [nivel 7](07-actualizaciones-ota.md)) o
enviar a las tiendas al crear un _release_. Puede convivir con GitHub Actions o sustituir los
workflows `eas-*.yml`.
→ [EAS Workflows](https://docs.expo.dev/eas/workflows/get-started/)

## Integración de IA (LLMs)

Para añadir funciones con IA (resumir notas, sugerir textos, un chat), la app **nunca** llama
directamente al proveedor del modelo: la API key iría dentro de la app y cualquiera podría
sacarla y gastar a tu costa. El patrón correcto es una **Edge Function** (como `delete-account`)
que comprueba la sesión del usuario, aplica un **límite de uso por usuario** (para controlar el
coste), llama al modelo con la clave guardada como **secret de Supabase** y devuelve el resultado.
Además, cuenta en tu política de privacidad y en la app qué datos envías a un proveedor de IA:
Apple exige informar y pedir permiso explícito antes de compartir datos personales con IA de
terceros (guideline 5.1.2, compruébalo).
→ [Supabase: Edge Functions](https://supabase.com/docs/guides/functions) ·
[Supabase AI](https://supabase.com/docs/guides/ai) ·
[API de Claude (Anthropic)](https://docs.claude.com/)

## Más seguridad: MFA y CAPTCHA

Supabase Auth permite **verificación en dos pasos** (MFA con app de códigos) y proteger el
registro y el login con un **CAPTCHA** invisible (hCaptcha o Cloudflare Turnstile) cuando empiecen
a aparecer cuentas falsas o ataques de contraseña. Actívalo cuando lo necesites; en
`supabase/config.toml` ya ves las secciones `[auth.mfa]` y los límites de `[auth.rate_limit]`.
→ [Supabase MFA](https://supabase.com/docs/guides/auth/auth-mfa) ·
[CAPTCHA](https://supabase.com/docs/guides/auth/auth-captcha)

---

## Pedírselo a Claude

- "Lee docs/graduacion/99-mas-alla.md y dime cuál de estos temas me conviene ahora, según cómo está
  mi app."
- "Quiero la sesión cifrada con LargeSecureStore, respetando que solo `src/api` toca Supabase."
- "Haz que la lista de notas funcione sin conexión con el persister de React Query."
- "Añade un botón 'Resumir con IA' en la nota, con una Edge Function y un límite de 20 usos al día
  por usuario."
