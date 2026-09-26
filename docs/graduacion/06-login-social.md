# Nivel 6 — Login social (Apple y Google)

> **Qué consigues:** botones de **"Continuar con Apple"** y **"Continuar con Google"**: el usuario
> entra en un toque, sin inventarse otra contraseña.
>
> **Cuánto cuesta:** 0 €. Supabase, Google Cloud y Sign in with Apple no cobran por esto. Sí
> necesitas la cuenta de Apple Developer (99 $/año, sept. 2026, compruébalo) para Sign in with
> Apple.
>
> **Cuándo hacerlo:** cuando veas que la gente abandona en el registro, o antes de publicar si
> quieres salir ya con login social.
>
> **Tiempo estimado:** 2–4 horas (la mayor parte, configurando consolas de Apple y Google).
>
> **Requisitos:** [Nivel 1](01-nube-github-y-ci.md) (Supabase en la nube) y [Nivel 2](02-builds-con-eas.md)
> (**development build**: estas librerías tienen código nativo y **no funcionan en Expo Go**).
> Para probar en iPhone, cuenta de Apple de pago.

## Qué vas a montar (y por qué así)

Qué es el login social: en vez de email + contraseña, el móvil le pregunta a Apple o a Google
"¿quién es esta persona?" y te devuelve un **token de identidad** (un justificante firmado).
Tu app se lo pasa a Supabase con `signInWithIdToken` y Supabase crea o recupera el usuario.

Usamos el **login nativo** (la hoja del sistema de iOS/Android), no una ventana del navegador: es
más rápido, más bonito y lo que esperan los usuarios.

```
Pantalla sign-in.tsx ─► hook useSignInWithApple() ─► src/api/auth.ts signInWithApple()
                                                            │  1. hoja nativa de Apple
                                                            │  2. supabase.auth.signInWithIdToken
                                                            ▼
                                        Supabase Auth crea el usuario ─► trigger handle_new_user
                                                                          crea el perfil
```

### La regla de Apple (guideline 4.8)

Si tu app de iPhone ofrece un login de terceros (Google, Facebook…) para la cuenta principal,
**también tiene que ofrecer una opción "equivalente"** que: solo pida nombre y email, deje al
usuario **ocultar su email** y no rastree para publicidad sin consentimiento
([guidelines, 4.8](https://developer.apple.com/app-store/review/guidelines/#login-services)).
Sign in with Apple cumple las tres. Tu email + contraseña propio **no** deja ocultar el email, así
que **no cuentes con él** como alternativa. Resumen práctico: **si pones Google en iOS, pon
Apple** (sept. 2026, compruébalo). En Android no existe esa regla: allí enseñaremos solo Google.

---

## Paso 1 — Instalar las librerías

```bash
npx expo install expo-apple-authentication
```

```bash
npx expo install @react-native-google-signin/google-signin
```

## Paso 2 — Configurar `app.json`

Añade `usesAppleSignIn` dentro de `ios` y los dos plugins al final de `plugins`:

```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true
    },
    "plugins": [
      "expo-router",
      ["expo-splash-screen", { "...": "lo que ya tenías" }],
      "expo-apple-authentication",
      [
        "@react-native-google-signin/google-signin",
        { "iosUrlScheme": "com.googleusercontent.apps.TU-ID-DE-CLIENTE-IOS" }
      ]
    ]
  }
}
```

`iosUrlScheme` es el **ID de cliente de iOS al revés** (lo sacas en el paso 4). Con
`usesAppleSignIn`, EAS activa la capacidad "Sign in with Apple" en tu App ID de Apple solo.

## Paso 3 — Apple: activar el proveedor en Supabase

1. Supabase Dashboard (nube) → **Authentication → Sign In / Providers → Apple** → activar.
2. En **Client IDs** pon tu **bundle id** (el de `app.json`, p. ej. `com.lauraperez.recetario`).
3. **Secret Key**: solo hace falta para el login web (OAuth). Para el login nativo que montamos,
   puedes dejarlo vacío.
4. Guarda.

Guía oficial: [Supabase — Sign in with Apple (React Native)](https://supabase.com/docs/guides/auth/social-login/auth-apple?platform=react-native).

## Paso 4 — Google: crear los IDs de cliente

Qué es un "client ID": el identificador que le dice a Google "esta petición viene de mi app". No
es secreto (va dentro de la app). Necesitas **tres** (más uno extra al publicar):

1. Entra en [Google Cloud Console](https://console.cloud.google.com) → crea un proyecto (p. ej.
   "Recetario").
2. **Google Auth Platform → Branding** (pantalla de consentimiento): nombre de la app, email de
   soporte, logo, URL de tu política de privacidad ([nivel 5](05-publicar-en-tiendas.md)).
   **Audience**: _External_ y, cuando vayas a publicar, **Publish app**.
3. **Clients → Create client**, tres veces:

   | Tipo                | Qué pide                      | Para qué                                                                |
   | ------------------- | ----------------------------- | ----------------------------------------------------------------------- |
   | **Web application** | Solo un nombre                | Supabase valida los tokens con él; también es tu `webClientId`          |
   | **iOS**             | Tu bundle id                  | Login en iPhone. Copia su _iOS URL scheme_ al `iosUrlScheme` del paso 2 |
   | **Android**         | Tu package + **huella SHA-1** | Login en Android                                                        |

4. **La huella SHA-1** (la "firma" de tu app Android). Sácala de EAS:

   ```bash
   eas credentials --platform android
   ```

   Elige el perfil (p. ej. `development`) y copia el **SHA1 Fingerprint**.

   > ⚠️ Cuando publiques en Google Play, Google **vuelve a firmar** tu app con otra llave. Crea un
   > **segundo cliente Android** con el SHA-1 que verás en Play Console → Integridad de la app →
   > _Firma de apps_. Si no, el login con Google funcionará en tus builds de prueba pero **fallará
   > en la versión descargada de la tienda**.

5. Supabase Dashboard → **Authentication → Sign In / Providers → Google** → activar:
   - **Client IDs**: los IDs separados por comas, **el Web primero**:
     `WEB_ID,IOS_ID,ANDROID_ID,ANDROID_PLAY_ID`.
   - **Client Secret**: el del cliente **Web** (Google Cloud → Clients → tu cliente web).
   - **Skip nonce checks**: **activado** (el SDK de Google en iOS añade un _nonce_ que no podemos
     leer; sin esto el login falla en iPhone).

Guía oficial: [Supabase — Login with Google (React Native)](https://supabase.com/docs/guides/auth/social-login/auth-google?platform=react-native)
y [react-native-google-signin](https://react-native-google-signin.github.io/docs/setting-up/expo).

## Paso 5 — Variables de entorno (públicas)

Los client IDs **no son secretos**, así que van con `EXPO_PUBLIC_`. En `.env` (y el nombre, sin
valor, en `.env.example`):

```bash
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
```

En `src/config/env.ts`, añade las dos al esquema y a `safeParse` (siguiendo el patrón de Sentry):

```ts
  // en envSchema:
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: z.string().optional(),
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: z.string().optional(),

  // en safeParse({ ... }):
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || undefined,
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || undefined,
```

Y súbelas a EAS para los tres entornos:

```bash
eas env:set --name EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID --value "TU_WEB_ID" --environment development --environment preview --environment production --visibility plaintext
```

```bash
eas env:set --name EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID --value "TU_IOS_ID" --environment development --environment preview --environment production --visibility plaintext
```

## Paso 6 — Que el perfil reciba el nombre de Apple/Google

El trigger `handle_new_user` (migración base) crea el perfil copiando `display_name` de los
metadatos del usuario. En el registro con email lo rellenamos nosotros, pero **Google lo llama
`full_name`** (y `name`), y **Apple no lo manda en el token**: solo te da el nombre **la primera
vez** que el usuario autoriza tu app, dentro de la respuesta nativa.

Solución en dos partes:

1. **Migración** para que el trigger también mire `full_name` y `name` (sirve para Google):

   ```bash
   npm run db:new -- perfil_nombre_login_social
   ```

   Pega esto en el archivo que se ha creado en `supabase/migrations/`:

   ```sql
   -- El trigger ahora acepta el nombre venga de donde venga:
   --   display_name → registro con email (src/api/auth.ts → signUp)
   --   full_name / name → Google (y Apple si lo guardamos con updateUser)
   -- `create or replace` sustituye la función; el trigger on_auth_user_created sigue igual.
   create or replace function public.handle_new_user()
   returns trigger
   language plpgsql
   security definer
   set search_path = ''
   as $$
   begin
     insert into public.profiles (id, display_name)
     values (
       new.id,
       left(
         coalesce(
           nullif(new.raw_user_meta_data ->> 'display_name', ''),
           nullif(new.raw_user_meta_data ->> 'full_name', ''),
           nullif(new.raw_user_meta_data ->> 'name', ''),
           ''
         ),
         50
       )
     );
     return new;
   end;
   $$;
   ```

   ```bash
   npm run db:reset
   ```

   ```bash
   npm run db:types
   ```

   (No añade tablas, así que `db:types` no debería cambiar nada; córrelo igualmente, es la regla.)
   Al hacer merge en `main`, el workflow `deploy-supabase.yml` la aplicará en la nube.

2. **Apple**: justo después de entrar, guardamos el nombre en los metadatos (`full_name`) y en el
   perfil **solo si está vacío** (para no pisar un nombre que el usuario haya cambiado). Lo hace
   `signInWithApple` en el paso siguiente.

## Paso 7 — La capa de datos: `src/api/auth.ts`

Añade estos imports arriba del archivo (junto a los que ya hay):

```ts
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { Platform } from 'react-native';

import { requireUserId } from './session';
import { env } from '@/config/env';
import { log } from '@/observability';
```

Y estas funciones al final:

```ts
// ─── Login social (docs/graduacion/06-login-social.md) ───────────────────────────────────────

/** `cancelled: true` = el usuario cerró la hoja de Apple/Google. No es un error. */
export type SocialSignInResult = { cancelled: boolean };

/** Sign in with Apple solo existe en iOS (en Android/web devolvemos false y no se pinta). */
export async function isAppleSignInAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }
  return AppleAuthentication.isAvailableAsync();
}

export async function signInWithApple(): Promise<SocialSignInResult> {
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (error) {
    if (hasCode(error, 'ERR_REQUEST_CANCELED')) {
      return { cancelled: true };
    }
    throw error;
  }

  if (!credential.identityToken) {
    throw new AppError('Apple no ha devuelto tus datos. Inténtalo de nuevo.', 'apple_no_token');
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) {
    throw error;
  }

  // Apple SOLO da el nombre la primera vez que el usuario autoriza la app. Si viene, lo guardamos.
  const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (fullName) {
    await saveNameFromProvider(fullName);
  }
  return { cancelled: false };
}

let googleConfigured = false;

function configureGoogle(): void {
  if (googleConfigured) {
    return;
  }
  if (!env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID) {
    throw new AppError('El login con Google no está configurado.', 'google_not_configured');
  }
  GoogleSignin.configure({
    // El ID del cliente WEB: Google emite el token "para" él y Supabase lo valida con él.
    webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  });
  googleConfigured = true;
}

export async function signInWithGoogle(): Promise<SocialSignInResult> {
  configureGoogle();
  try {
    // En Android comprueba que el móvil tiene Google Play Services (en iOS no hace nada).
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      return { cancelled: true };
    }
    const idToken = response.data.idToken;
    if (!idToken) {
      throw new AppError('Google no ha devuelto tus datos. Inténtalo de nuevo.', 'google_no_token');
    }
    // Google ya incluye `full_name` en los metadatos → el trigger rellena el perfil solo.
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken });
    if (error) {
      throw error;
    }
    return { cancelled: false };
  } catch (error) {
    if (isErrorWithCode(error) && error.code === statusCodes.IN_PROGRESS) {
      return { cancelled: true };
    }
    throw error;
  }
}

/** Guarda el nombre que da Apple. Si falla no pasa nada grave: el usuario puede ponerlo en Perfil. */
async function saveNameFromProvider(fullName: string): Promise<void> {
  const displayName = fullName.slice(0, 50);
  try {
    await supabase.auth.updateUser({ data: { full_name: displayName } });
    const userId = await requireUserId();
    // `.eq('display_name', '')`: solo si el perfil aún no tiene nombre.
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId)
      .eq('display_name', '');
    if (error) {
      throw error;
    }
  } catch (error) {
    log.warn('no se pudo guardar el nombre de Apple', error);
  }
}

function hasCode(error: unknown, code: string): boolean {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === code;
}
```

Opcional pero recomendable: en `signOut()`, cierra también la sesión de Google para que la
próxima vez salga el selector de cuentas. Añade al principio de la función:

```ts
try {
  await GoogleSignin.signOut();
} catch {
  // Si no se usó Google, no hay nada que cerrar.
}
```

## Paso 8 — Los hooks: `src/hooks/useAuth.ts`

Primero, en `src/api/queryKeys.ts` añade la clave nueva:

```ts
  auth: {
    appleAvailable: ['auth', 'apple-available'] as const,
  },
```

Y en `src/observability/analytics.ts`, amplía el método del evento:

```ts
sign_in: {
  method: 'email' | 'apple' | 'google';
}
```

Ahora los hooks (añade a los imports de `useAuth.ts` lo que falte: `useQuery`,
`useQueryClient`, `queryKeys` y las funciones nuevas de `@/api/auth`):

```ts
export function useAppleSignInAvailable() {
  return useQuery({
    queryKey: queryKeys.auth.appleAvailable,
    queryFn: isAppleSignInAvailable,
    staleTime: Infinity,
  });
}

export function useSignInWithApple() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['auth', 'signInApple'],
    mutationFn: signInWithApple,
    onSuccess: (result) => {
      if (!result.cancelled) {
        trackEvent('sign_in', { method: 'apple' });
        // El nombre de Apple se guarda justo después de entrar: refrescamos el perfil.
        void queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
      }
    },
  });
}

export function useSignInWithGoogle() {
  return useMutation({
    mutationKey: ['auth', 'signInGoogle'],
    mutationFn: signInWithGoogle,
    onSuccess: (result) => {
      if (!result.cancelled) {
        trackEvent('sign_in', { method: 'google' });
      }
    },
  });
}
```

## Paso 9 — Los botones: `src/app/(auth)/sign-in.tsx`

La pantalla **no** importa Supabase: solo los hooks. El botón de Apple **tiene** que ser el
oficial (`AppleAuthenticationButton`): Apple rechaza botones "hechos a mano". Archivo completo:

```tsx
import * as AppleAuthentication from 'expo-apple-authentication';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { Button, Screen, Text, TextField } from '@/components/ui';
import {
  useAppleSignInAvailable,
  useSignIn,
  useSignInWithApple,
  useSignInWithGoogle,
} from '@/hooks/useAuth';
import { useTheme } from '@/theme';
import { toUserMessage } from '@/utils/errors';
import { signInSchema, validateForm, type FieldErrors, type SignInInput } from '@/utils/validation';

export default function SignInScreen() {
  const t = useTheme();
  const signIn = useSignIn();
  const apple = useSignInWithApple();
  const google = useSignInWithGoogle();
  const appleAvailable = useAppleSignInAvailable();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<SignInInput>>({});

  // La librería gratuita de Google no funciona en la versión web.
  const showGoogle = Platform.OS !== 'web';
  const socialError = apple.error ?? google.error;

  const onSubmit = () => {
    const { data, errors: fieldErrors } = validateForm(signInSchema, { email, password });
    setErrors(fieldErrors ?? {});
    if (data) {
      // Si va bien, el layout raíz detecta la sesión y enseña la app solo.
      signIn.mutate(data);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.header, { marginTop: t.spacing.xxl }]}>
        <Text variant="display">Lienzo</Text>
        <Text color="textMuted">Entra para ver tus notas.</Text>
      </View>

      {appleAvailable.data ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={
            t.scheme === 'dark'
              ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
              : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
          }
          cornerRadius={999}
          style={styles.appleButton}
          onPress={() => apple.mutate()}
        />
      ) : null}
      {showGoogle ? (
        <Button
          label="Continuar con Google"
          variant="secondary"
          onPress={() => google.mutate()}
          loading={google.isPending}
        />
      ) : null}
      {socialError ? <Text color="danger">{toUserMessage(socialError)}</Text> : null}

      <Text color="textMuted" style={styles.divider}>
        o con tu email
      </Text>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="tu@email.com"
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={onSubmit}
      />

      {signIn.error ? <Text color="danger">{toUserMessage(signIn.error)}</Text> : null}

      <Button label="Entrar" onPress={onSubmit} loading={signIn.isPending} />

      <View style={styles.links}>
        <Link href="/forgot-password" style={{ color: t.color.primary }}>
          ¿Has olvidado la contraseña?
        </Link>
        <Link href="/sign-up" style={{ color: t.color.primary }}>
          ¿No tienes cuenta? Regístrate
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, marginBottom: 16 },
  appleButton: { width: '100%', height: 52 },
  divider: { textAlign: 'center', marginVertical: 8 },
  links: { gap: 16, alignItems: 'center', marginTop: 8 },
});
```

No hace falta navegar tras entrar: `Stack.Protected` del layout raíz ve la sesión nueva y enseña
la app. Tampoco hay pantalla de "registro con Apple": si el usuario no existía, se crea solo.

## Paso 10 — Compilar un development build nuevo

Has añadido código nativo, así que el build anterior no sirve:

```bash
eas build --profile development --platform all
```

Instálalo, arranca con `npm start` y prueba ambos botones. Mientras pruebas login social, apunta
tu `.env` al **proyecto de la nube** (la configuración de proveedores sociales en el Supabase
local es más delicada y no merece la pena al principio).

## ⚠️ Nota importante: borrar la cuenta y los tokens de Apple

Apple pide que, cuando un usuario que entró con Apple **borra su cuenta**, revoques sus tokens con
la [API REST de Sign in with Apple](https://developer.apple.com/documentation/sign_in_with_apple/revoke_tokens).
Supabase **no lo hace solo**, y el login nativo no guarda los tokens que hacen falta. Hacerlo bien
requiere: enviar el `authorizationCode` de Apple a una Edge Function, canjearlo por un
_refresh token_ (con una clave `.p8` de Apple como **secret de Supabase**) y llamar a
`/auth/revoke` desde `delete-account`. Es un paso avanzado: no siempre lo comprueban en la
revisión, pero si te lo piden, díselo a Claude (ver abajo) y lo montará contigo.

---

## ✅ Cómo sé que ha funcionado

- En iPhone ves el botón negro (o blanco en modo oscuro) de Apple; en Android, solo el de Google.
- Pulsas "Continuar con Apple", confirmas con Face ID y entras en la app sin escribir nada.
- En Supabase Dashboard → Authentication → Users aparece el usuario con proveedor `apple` o
  `google`.
- En **Perfil** aparece tu nombre (con Google siempre; con Apple, la primera vez que autorizas la
  app).
- Cerrar sesión y volver a entrar con el mismo botón te lleva a la **misma** cuenta (tus notas
  siguen ahí).

## 🧯 Problemas típicos

- **"Cannot find native module 'ExpoAppleAuthentication'" / "RNGoogleSignin could not be
  found"**: estás en Expo Go o en un build antiguo. Compila un development build nuevo (paso 10).
- **Google: `DEVELOPER_ERROR` en Android**: el SHA-1 o el package del cliente Android no
  coinciden. Revisa `eas credentials` y, si la app viene de Google Play, el segundo cliente con el
  SHA-1 de _Firma de apps_.
- **Google funciona en Android pero no en iPhone**: falta el `iosClientId`, el `iosUrlScheme` está
  mal o no activaste **Skip nonce checks** en Supabase.
- **"Unacceptable audience in id_token"**: el ID de cliente que emitió el token no está en la lista
  de _Client IDs_ de Supabase (Apple: tu bundle id; Google: web, iOS y Android).
- **El perfil de Apple sale sin nombre**: Apple solo lo manda la primera vez. Para probar de nuevo:
  en el iPhone, Ajustes → tu nombre → Inicio de sesión y seguridad → Iniciar sesión con Apple → tu app → **Dejar de usar**, borra
  el usuario en Supabase y repite.
- **Los emails de Resend no llegan a usuarios de Apple** (`...@privaterelay.appleid.com`): si el
  usuario ocultó su email, Apple solo reenvía correos de dominios registrados. Añade tu dominio
  en Apple Developer → Certificates, IDs & Profiles → Services → **Sign in with Apple for Email
  Communication** ([nivel 4](04-emails-con-resend.md)).
- **Un usuario se registró con email y luego entra con Google con el mismo email**: Supabase
  vincula ambas identidades a la misma cuenta si el email está verificado. Si ves duplicados,
  revisa que la confirmación de email esté activada en la nube.

## Pedírselo a Claude

```
/graduar 06
```

Otros ejemplos:

- "Añade login con Apple y Google siguiendo docs/graduacion/06-login-social.md. Para cuando
  necesites algo de las consolas de Apple, Google o Supabase, párate y dime exactamente qué
  hacer."
- "Solo quiero login con Google en Android por ahora, sin Apple."
- "Apple me pide revocar los tokens al borrar la cuenta: móntalo en `delete-account` con una Edge
  Function que canjee el authorizationCode."
- "El login con Google me da `DEVELOPER_ERROR`; ayúdame a revisar el SHA-1."
