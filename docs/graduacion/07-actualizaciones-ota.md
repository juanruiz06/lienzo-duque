# Nivel 7 — Actualizaciones OTA (EAS Update)

> **Qué consigues:** arreglar un fallo o cambiar un texto de la app **ya instalada** en los móviles
> de tus usuarios en minutos, sin compilar ni pasar por la revisión de Apple/Google.
>
> **Cuánto cuesta:** gratis hasta **1.000 usuarios activos al mes** que reciban updates y 100 GiB
> de descarga. Starter (~19 $/mes) sube a 3.000; Production (~199 $/mes) a 50.000
> (sept. 2026, compruébalo en [expo.dev/pricing](https://expo.dev/pricing)).
>
> **Cuándo hacerlo:** en cuanto tengas la app publicada ([nivel 5](05-publicar-en-tiendas.md)) o
> repartida con el perfil `preview`. Cuanto antes lo configures, antes lo tendrás listo para la
> primera urgencia.
>
> **Tiempo estimado:** 1 hora + un build nuevo por plataforma.
>
> **Requisitos:** [Nivel 2](02-builds-con-eas.md) (EAS configurado, `projectId` en `app.json`).

## Qué es una actualización OTA

Tu app tiene dos capas:

- **La parte nativa** (el "motor"): el código compilado para iOS/Android, las librerías con código
  nativo, los permisos, el icono, el nombre. Solo cambia con un **build nuevo**.
- **La parte JavaScript** (el "contenido"): tus pantallas, la lógica, los textos, las imágenes.
  Esto es lo que manda una **actualización OTA** (_over the air_, "por el aire").

Con `expo-updates`, cada vez que el usuario abre la app, esta pregunta a los servidores de Expo "¿hay
algo nuevo para mí?". Si lo hay, lo descarga en segundo plano y lo usa **la siguiente vez que se
abra la app** (no a mitad de uso).

### Qué SÍ y qué NO se puede mandar por OTA

| ✔️ Por OTA (`eas update`)                                                     | ✖️ Necesita build nuevo (`eas build` + tiendas)                                                            |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Cambios en pantallas, componentes, estilos                                    | Instalar o actualizar una librería **con código nativo** (`expo-notifications`, `react-native-purchases`…) |
| Arreglos de lógica en `src/`                                                  | Cambiar `app.json`: nombre, icono, splash, permisos, `plugins`, `scheme`                                   |
| Textos, traducciones, imágenes de `assets/`                                   | Subir de versión de Expo SDK                                                                               |
| Nuevas pantallas en `src/app/`                                                | Cambiar el bundle id, la versión (`version`) o las credenciales                                            |
| Nuevas llamadas a Supabase / Edge Functions (el servidor se despliega aparte) | Cualquier cosa en carpetas `ios/` o `android/`                                                             |

Regla de Apple: las actualizaciones OTA no pueden cambiar **lo que es** la app (su propósito
principal) ni saltarse la revisión para añadir algo que la revisión rechazaría. Arreglos, mejoras y
pantallas nuevas coherentes con la app, sí.

---

## Paso 1 — Instalar `expo-updates`

```bash
npx expo install expo-updates
```

## Paso 2 — Configurar el proyecto

```bash
eas update:configure
```

Este comando añade a `app.json` la URL del servidor de updates (`updates.url`) y un
`runtimeVersion`. Haz commit del cambio: nada de esto es secreto.

## Paso 3 — Elegir la política `fingerprint`

Qué es el **runtime version**: una "etiqueta de compatibilidad". Un build solo acepta updates con
su misma etiqueta. Así, un update que necesita una librería nativa nueva **nunca** llega a un móvil
cuyo build no la tiene (lo que haría que la app se cerrara al abrirla).

Qué es la política **fingerprint** ("huella"): EAS calcula la etiqueta automáticamente a partir de
todo lo nativo (dependencias con código nativo, plugins y configuración nativa de `app.json`,
versión del SDK). Si no has tocado nada nativo, la huella no cambia y tu update llega a todos. Si lo
has tocado, la huella cambia y el update solo llegará a builds nuevos. Es la opción más segura
para alguien que empieza: **no tienes que acordarte de nada**.

En `app.json`, deja el `runtimeVersion` así (sustituye lo que haya puesto el paso 2):

```json
{
  "expo": {
    "runtimeVersion": { "policy": "fingerprint" }
  }
}
```

Para saber si un cambio que has hecho es "nativo" (necesita build) puedes comparar la huella
actual con la de tu último build (el comando te deja elegir el build de una lista y te dice qué ha
cambiado):

```bash
eas fingerprint:compare
```

## Paso 4 — Build nuevo (una sola vez)

Los builds que tenías **no tienen `expo-updates`**, así que no pueden recibir updates. Haz uno nuevo
de cada perfil que uses:

```bash
eas build --profile preview --platform all
```

```bash
eas build --profile production --platform all
```

Los de `production` súbelos a las tiendas como siempre ([nivel 5](05-publicar-en-tiendas.md)). A
partir de aquí, **los usuarios que tengan esta versión** ya pueden recibir OTA.

## Paso 5 — Entender canales (ya están configurados)

Qué es un **canal**: una "emisora" a la que está sintonizado cada build. En `eas.json` cada perfil
ya tiene el suyo:

| Perfil de build | Canal         | Quién lo tiene                           |
| --------------- | ------------- | ---------------------------------------- |
| `development`   | `development` | Tú, programando (usa Metro, no updates)  |
| `preview`       | `preview`     | Tus testers (APK / distribución interna) |
| `production`    | `production`  | Usuarios de las tiendas                  |

Un update publicado en `preview` **solo** lo reciben los builds `preview`. Esto te permite probar
antes de tocar a los usuarios reales.

## Paso 6 — Publicar: primero en `preview`, luego en `production`

Siempre en este orden:

1. Haz tu cambio, pasa las comprobaciones y súbelo a `main` (con PR si usas el nivel 1):

   ```bash
   npm run check
   ```

2. Publica en `preview`:

   ```bash
   eas update --channel preview --environment preview --message "Arreglo: el botón Guardar no respondía"
   ```

   `--environment` es **obligatorio** (SDK 55+): le dice a EAS qué variables `EXPO_PUBLIC_` meter
   en el update. Si pones un entorno equivocado, la app podría apuntar a otra base de datos.

3. En tu móvil con el build `preview`: **cierra la app del todo y ábrela; ciérrala otra vez y
   ábrela**. La primera apertura descarga el update y la segunda lo usa. Comprueba el arreglo.

4. Si todo va bien, publica en `production`:

   ```bash
   eas update --channel production --environment production --message "Arreglo: el botón Guardar no respondía"
   ```

**Sin terminal**: GitHub → Actions → **EAS Update (actualización OTA)** → Run workflow → elige el
canal y escribe el mensaje. Hace exactamente lo mismo (el workflow ya pasa `--environment` igual al
canal). Necesita el secret `EXPO_TOKEN` ([nivel 2](02-builds-con-eas.md)).

### Lanzamiento gradual (opcional)

Para cambios delicados puedes mandar el update a una parte de los usuarios y ampliar después desde
expo.dev:

```bash
eas update --channel production --environment production --rollout-percentage 10 --message "Nueva pantalla de ajustes"
```

## Paso 7 — Deshacer un update (rollback)

Si un update rompe algo, vuelve al anterior:

```bash
eas update:rollback
```

Te pregunta de forma interactiva y te da dos opciones:

- **Volver al update anterior**: vuelve a publicar el update previo; los móviles lo reciben igual
  que uno nuevo.
- **Volver al código "de fábrica" del build** (_embedded_): todos vuelven a lo que venía dentro del
  build de la tienda.

Después, arregla el fallo con calma y publica un update nuevo normal. Los usuarios que ya abrieron
la app con el update roto lo cambiarán en su próxima apertura (por eso conviene tener Sentry, del
[nivel 3](03-observabilidad.md), para enterarte rápido).

## Paso 8 (opcional) — Avisar "hay una versión nueva, reinicia"

Por defecto el update se aplica en la siguiente apertura, sin avisar. Si quieres ofrecer un botón
para aplicarlo ya, crea `src/hooks/useAppUpdate.ts`:

```ts
import * as Updates from 'expo-updates';

/**
 * ¿Hay un update OTA descargado esperando? (docs/graduacion/07-actualizaciones-ota.md)
 * `restart` reinicia la app con él. En desarrollo (Metro) siempre es `false`.
 */
export function useAppUpdate() {
  const { isUpdatePending } = Updates.useUpdates();
  return {
    isUpdatePending,
    restart: () => void Updates.reloadAsync(),
  };
}
```

Y úsalo, por ejemplo, arriba de la pantalla de Perfil (`src/app/(app)/(tabs)/profile.tsx`, dentro
de `ProfileForm`):

```tsx
const appUpdate = useAppUpdate();

// … en el JSX, al principio de <Screen>:
{
  appUpdate.isUpdatePending ? (
    <Card>
      <Text variant="bodyStrong">Hay una versión nueva de la app</Text>
      <Button label="Reiniciar para actualizar" onPress={appUpdate.restart} />
    </Card>
  ) : null;
}
```

(`Card` viene de `@/components/ui`, igual que `Button` y `Text`.) No reinicies la app sin
preguntar: el usuario podría perder lo que estaba escribiendo.

## Buenas prácticas

- **Siempre `preview` antes que `production`.** Dos minutos de prueba evitan un susto.
- **Mensajes claros** en `--message`: en expo.dev verás la lista y sabrás cuál deshacer.
- **Si cambias algo nativo, no intentes OTA**: haz build nuevo y súbelo a las tiendas. Con
  `fingerprint`, un update "nativo" simplemente no llegará a los builds viejos (no los rompe),
  pero tus usuarios no verán el cambio hasta que actualicen desde la tienda.
- **La base de datos va aparte.** Si tu update necesita una columna nueva, primero despliega la
  migración (merge en `main` → `deploy-supabase.yml`) y **después** publica el update. Y piensa
  que los usuarios con la versión anterior siguen usando la base de datos: no borres columnas que
  el código viejo aún lee.
- **Vigila el contador de usuarios**: en expo.dev → Usage verás los usuarios activos de updates
  del mes. El plan gratis no cobra excesos; si te acercas a 1.000, toca valorar Starter
  ([nivel 10](10-escalar-y-pagar-mas.md)).

---

## ✅ Cómo sé que ha funcionado

- `app.json` tiene `updates.url` y `"runtimeVersion": { "policy": "fingerprint" }`.
- En [expo.dev](https://expo.dev) → tu proyecto → **Updates** aparece tu update en la rama
  `preview` (o `production`) con tu mensaje.
- En el móvil con el build correspondiente, tras abrir-cerrar-abrir, ves el cambio **sin haber
  instalado nada**.
- En expo.dev, el update muestra instalaciones (puede tardar un rato en actualizarse).

## 🧯 Problemas típicos

- **El update no llega nunca**:
  - El build es anterior a instalar `expo-updates` → haz build nuevo (paso 4).
  - Publicaste en otro canal (`preview` vs `production`).
  - El **runtime version** del update no coincide con el del build (tocaste algo nativo). En
    expo.dev compara el _runtime version_ del update y el del build. Solución: build nuevo.
  - No has abierto la app **dos veces** (la primera solo descarga).
- **Tras el update la app no conecta con Supabase**: publicaste sin `--environment` o con el
  entorno equivocado, y las variables `EXPO_PUBLIC_` están vacías o son las de otro entorno.
  Rollback (paso 7) y vuelve a publicar con el entorno correcto.
- **"Required flag --environment"**: añade `--environment preview` o `--environment production`.
- **El workflow de GitHub termina en verde pero no publica nada**: falta el secret `EXPO_TOKEN`
  (el workflow es "no-op" sin él; mira el aviso en el log del run).
- **En desarrollo `isUpdatePending` siempre es false**: normal; con Metro no hay updates.

## Pedírselo a Claude

```
/graduar 07
```

Otros ejemplos:

- "Configura EAS Update con runtimeVersion fingerprint y dime qué builds tengo que rehacer."
- "He cambiado esto _(describe)_: ¿puedo mandarlo por OTA o necesito un build nuevo?"
- "Publica un update en preview con el mensaje 'Arreglo del botón Guardar' y dime cómo probarlo."
- "El último update de producción ha roto el login: haz rollback."
- "Añade el aviso de 'hay una versión nueva' en la pantalla de Perfil."

## Documentación oficial

- [EAS Update: introducción](https://docs.expo.dev/eas-update/introduction/)
- [Empezar con EAS Update](https://docs.expo.dev/eas-update/getting-started/)
- [Runtime versions](https://docs.expo.dev/eas-update/runtime-versions/)
- [Rollbacks](https://docs.expo.dev/eas-update/rollbacks/)
- [`expo-updates` (API)](https://docs.expo.dev/versions/latest/sdk/updates/)
