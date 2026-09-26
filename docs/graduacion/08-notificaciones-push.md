# Nivel 8 — Notificaciones push

> **Qué consigues:** avisar a tus usuarios aunque tengan la app cerrada ("Tu pedido ha salido",
> "Te han respondido") y que, al tocar el aviso, la app se abra en la pantalla correcta.
>
> **Cuánto cuesta:** 0 €. El servicio de push de Expo, Firebase Cloud Messaging y el de Apple son
> gratis (sept. 2026, compruébalo). En iPhone necesitas la cuenta de Apple Developer (99 $/año).
>
> **Cuándo hacerlo:** cuando tu app tenga algo que **merezca** interrumpir a alguien. Una
> notificación inútil es la forma más rápida de que desinstalen la app.
>
> **Tiempo estimado:** medio día.
>
> **Requisitos:** [Nivel 1](01-nube-github-y-ci.md) (GitHub y CI) y [Nivel 2](02-builds-con-eas.md)
> (**development build** y `projectId` de EAS). Las push **no funcionan en Expo Go** en Android ni
> en el simulador: necesitas un **móvil de verdad**.

## Cómo funciona (en una frase cada pieza)

- **Permiso**: el sistema pregunta al usuario "¿Permitir notificaciones?". Sin un sí, no hay push.
- **Push token**: una "dirección postal" única de tu app en ese móvil, tipo
  `ExponentPushToken[xxxx]`. La guardamos en la tabla `push_tokens`.
- **Servicio de push de Expo**: el cartero. Le das el token y el mensaje, y él habla con Apple
  (**APNs**) o con Google (**FCM**) por ti.
- **Edge Function `send-push`**: el código en tu servidor que busca los tokens de un usuario y
  llama al cartero. Solo el servidor puede enviar push (nunca la app).

```
App ──(1) pide permiso y token──► src/api/pushTokens.ts ──(2) rpc register_push_token──► tabla push_tokens
                                                                                              │
Algo pasa en la BD (trigger) ──(3) pg_net──► Edge Function send-push ──(4)──► Expo ──► APNs/FCM ──► 📱
                                                                                              │
Usuario toca la notificación ──(5) data.url = "/note/123"──► expo-router abre esa pantalla ◄──┘
```

---

## Paso 1 — Instalar

```bash
npx expo install expo-notifications
```

```bash
npx expo install expo-device
```

(`expo-device` sirve para saber si estás en un móvil real o en un simulador.)

## Paso 2 — Credenciales de Apple y Google

### Android: Firebase (FCM v1)

1. Entra en [Firebase Console](https://console.firebase.google.com) → **Crear proyecto** (sin
   Analytics si no lo necesitas).
2. **Añadir app → Android** con tu package (el de `app.json`, p. ej. `com.lauraperez.recetario`).
   Descarga **`google-services.json`** y ponlo en la raíz del repo. Este archivo identifica tu
   proyecto de Firebase pero **no es una clave secreta**: puedes hacer commit.
3. Firebase → ⚙️ Configuración del proyecto → **Cuentas de servicio** → **Generar nueva clave
   privada**. Esto descarga otro JSON que **SÍ es secreto**: **no** lo metas en el repo. Súbelo a EAS:

   ```bash
   eas credentials --platform android
   ```

   Elige tu perfil → _Google Service Account_ → _Manage your Google Service Account Key for Push
   Notifications (FCM V1)_ → sube el archivo. Después bórralo de tu carpeta de Descargas.

Guía oficial: [FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials/).

### iOS: APNs

No tienes que hacer nada a mano: en el siguiente `eas build` para iOS, EAS te preguntará _"Would you
like to set up Push Notifications for your project?"_ → **Yes**, y creará la clave de APNs en tu
cuenta de Apple.

## Paso 3 — Configurar `app.json`

Añade el plugin y la ruta de `google-services.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      "expo-router",
      ["expo-splash-screen", { "...": "lo que ya tenías" }],
      ["expo-notifications", { "color": "#1F6FEB" }]
    ]
  }
}
```

(`color` es el color del iconito en Android; usa el principal de tu app.)

## Paso 4 — La tabla `push_tokens` (migración)

```bash
npm run db:new -- push_tokens
```

Pega esto en el archivo creado en `supabase/migrations/`. Sigue las mismas 5 piezas que
`20260926000100_notes.sql`, más una función para registrar tokens:

```sql
-- ════════════════════════════════════════════════════════════════════════════════════════════
-- Tokens de notificaciones push (docs/graduacion/08-notificaciones-push.md).
-- Un token = un móvil con la app instalada. Un usuario puede tener varios (móvil + tablet).
-- ════════════════════════════════════════════════════════════════════════════════════════════

create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- `unique`: un móvil solo pertenece a un usuario a la vez.
  token text not null unique check (token ~ '^Expo(nent)?PushToken\[.+\]$'),
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.push_tokens is 'Push tokens de Expo de cada móvil del usuario.';

-- La Edge Function busca "todos los tokens de este usuario": este índice lo hace rápido.
create index push_tokens_user_id_idx on public.push_tokens (user_id);

create trigger push_tokens_set_updated_at
  before update on public.push_tokens
  for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;

create policy "push_tokens: el dueño lee sus tokens"
  on public.push_tokens for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "push_tokens: el dueño borra sus tokens"
  on public.push_tokens for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- Sin policies de INSERT/UPDATE: los tokens se guardan SOLO con register_push_token (abajo),
-- que resuelve el caso "en este móvil ha entrado otra cuenta".
grant select, delete on public.push_tokens to authenticated;
-- La Edge Function send-push usa service_role: lee tokens y borra los caducados.
grant select, delete on public.push_tokens to service_role;
revoke all on public.push_tokens from anon;

-- ─── Registrar (o re-asignar) el token de este móvil ────────────────────────────────────────
-- `security definer` porque puede tener que "quitarle" el token a otra cuenta que usó antes este
-- móvil (y RLS no nos dejaría tocar su fila). El user_id SIEMPRE sale de la sesión, nunca de
-- un parámetro: nadie puede registrar tokens a nombre de otro.
create or replace function public.register_push_token(p_token text, p_platform text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  insert into public.push_tokens (user_id, token, platform)
  values (v_user_id, p_token, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id,
        platform = excluded.platform;
end;
$$;

revoke execute on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;
```

Aplícala a tu proyecto de desarrollo (te enseña la migración y pide confirmación: responde `Y`)
y regenera los tipos. Si usas base local (Docker), en vez de `db:push`: `npm run db:reset`.

```bash
npm run db:push
```

```bash
npm run db:types
```

## Paso 5 — Guardar el token: `src/api/pushTokens.ts`

```ts
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from './supabase';
import { AppError } from '@/utils/errors';

/**
 * Notificaciones push (docs/graduacion/08-notificaciones-push.md).
 *
 *  - registered  → tenemos permiso y el token está guardado en `push_tokens`.
 *  - denied      → el usuario no ha dado permiso (o no se lo hemos pedido aún).
 *  - unsupported → web o simulador: aquí no hay push.
 */
export type PushStatus = 'registered' | 'denied' | 'unsupported';

export async function registerPushToken(options: { askPermission: boolean }): Promise<PushStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return 'unsupported';
  }

  // Android 13+ exige crear un "canal" ANTES de pedir permiso.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted' && options.askPermission) {
    ({ status } = await Notifications.requestPermissionsAsync());
  }
  if (status !== 'granted') {
    return 'denied';
  }

  const token = await getExpoPushToken();
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: Platform.OS,
  });
  if (error) {
    throw error;
  }
  return 'registered';
}

/**
 * Borra el token de ESTE móvil (al cerrar sesión: que no le lleguen avisos de la cuenta anterior).
 * Debe llamarse ANTES de `supabase.auth.signOut()`, mientras aún hay sesión.
 */
export async function unregisterThisDevice(): Promise<void> {
  if (Platform.OS === 'web' || !Device.isDevice) {
    return;
  }
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    return;
  }
  const token = await getExpoPushToken();
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);
  if (error) {
    throw error;
  }
}

async function getExpoPushToken(): Promise<string> {
  // El projectId lo puso `eas init` en app.json (nivel 2). Sin él, Expo no sabe de qué app eres.
  const projectId: string | undefined =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) {
    throw new AppError('Falta configurar EAS en la app (projectId).', 'push_no_project');
  }
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}
```

Y en `src/api/auth.ts`, dentro de `signOut()`, **antes** de `supabase.auth.signOut()`:

```ts
// Que este móvil deje de recibir avisos de esta cuenta. Si falla, cerramos sesión igualmente.
await unregisterThisDevice().catch(() => undefined);
```

(con `import { unregisterThisDevice } from './pushTokens';` arriba). Si el usuario **borra** la
cuenta, sus tokens se borran solos por el `on delete cascade`.

## Paso 6 — Los hooks: `src/hooks/usePushNotifications.ts`

```ts
import { useMutation } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

import { registerPushToken } from '@/api/pushTokens';
import { log } from '@/observability';

/**
 * Qué hacer si llega una notificación con la app ABIERTA: enseñarla como banner igualmente.
 * Se ejecuta una vez, al cargar este archivo.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Botón "Activar notificaciones": pide permiso (si hace falta) y guarda el token. */
export function useEnablePushNotifications() {
  return useMutation({
    mutationKey: ['push', 'enable'],
    mutationFn: () => registerPushToken({ askPermission: true }),
  });
}

/**
 * Al entrar en la app: si YA diste permiso, refresca el token en silencio (sin preguntar nada).
 * Los tokens pueden cambiar (reinstalar la app, restaurar el móvil…).
 */
export function useSyncPushToken(): void {
  useEffect(() => {
    registerPushToken({ askPermission: false }).catch((error: unknown) =>
      log.warn('push: no se pudo registrar el token', error),
    );
  }, []);
}

let lastHandledNotificationId: string | null = null;

/**
 * Al tocar una notificación que trae `data.url` (p. ej. "/note/123"), abre esa pantalla.
 * Funciona con la app abierta, en segundo plano y cerrada del todo.
 */
export function useNotificationDeepLinks(): void {
  useEffect(() => {
    function open(notification: Notifications.Notification) {
      const id = notification.request.identifier;
      const url = notification.request.content.data?.url;
      // Solo rutas internas ("/…") y cada notificación una sola vez.
      if (id === lastHandledNotificationId || typeof url !== 'string' || !url.startsWith('/')) {
        return;
      }
      lastHandledNotificationId = id;
      router.push(url as Href);
    }

    // Caso "app cerrada": la notificación que la abrió.
    const initial = Notifications.getLastNotificationResponse();
    if (initial?.notification) {
      open(initial.notification);
    }

    // Caso "app abierta o en segundo plano".
    const subscription = Notifications.addNotificationResponseReceivedListener((response) =>
      open(response.notification),
    );
    return () => subscription.remove();
  }, []);
}
```

## Paso 7 — Enchufarlo en las pantallas

**`src/app/(app)/_layout.tsx`** (solo existe con sesión iniciada, así que es el sitio justo):

```tsx
import { Stack } from 'expo-router';

import { useNotificationDeepLinks, useSyncPushToken } from '@/hooks/usePushNotifications';

/** Pantallas para quien SÍ tiene sesión: las tabs y, encima, el editor de notas (modal). */
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  useSyncPushToken();
  useNotificationDeepLinks();

  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="note/[id]" options={{ presentation: 'modal', title: 'Nota' }} />
    </Stack>
  );
}
```

**Botón en Perfil** (`src/app/(app)/(tabs)/profile.tsx`, dentro de `ProfileForm`). No pidas el
permiso nada más abrir la app: pídelo cuando el usuario entienda para qué sirve. Importa
`useEnablePushNotifications` de `@/hooks/usePushNotifications` (`notify` y `toUserMessage` ya
están importados en ese archivo).

```tsx
const enablePush = useEnablePushNotifications();

const onEnablePush = () => {
  enablePush.mutate(undefined, {
    onSuccess: (status) => {
      if (status === 'registered') {
        notify('Notificaciones activadas');
      } else if (status === 'denied') {
        notify('Sin permiso', 'Actívalas en los Ajustes del móvil → Notificaciones → esta app.');
      } else {
        notify('No disponible', 'Las notificaciones solo funcionan en un móvil de verdad.');
      }
    },
    onError: (e) => notify('No se pudo activar', toUserMessage(e)),
  });
};

// … en el JSX, antes de "Cerrar sesión":
<Button
  label="Activar notificaciones"
  variant="secondary"
  onPress={onEnablePush}
  loading={enablePush.isPending}
/>;
```

## Paso 8 — La Edge Function `send-push`

Crea `supabase/functions/send-push/index.ts`:

```ts
// ════════════════════════════════════════════════════════════════════════════════════════════
// Edge Function `send-push`: manda una notificación a TODOS los móviles de un usuario.
//
// La llaman el servidor (trigger de la BD vía pg_net, u otra Edge Function), NUNCA la app.
// Por eso no usa el JWT del usuario (verify_jwt = false) sino un secreto compartido en la
// cabecera `x-push-secret` (PUSH_WEBHOOK_SECRET).
//
// Body: { "user_id": "uuid", "title": "…", "body": "…", "url": "/note/123" (opcional) }
// Docs Expo: https://docs.expo.dev/push-notifications/sending-notifications/
// ════════════════════════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

import { json } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const MAX_PER_REQUEST = 100; // límite de Expo por petición

type PushRequest = { user_id?: string; title?: string; body?: string; url?: string | null };
type ExpoTicket =
  { status: 'ok'; id: string } | { status: 'error'; message: string; details?: { error?: string } };

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  // 1) ¿Quién llama? Solo quien conoce el secreto (la BD u otra función).
  const expected = Deno.env.get('PUSH_WEBHOOK_SECRET');
  if (!expected || req.headers.get('x-push-secret') !== expected) {
    return json({ error: 'No autorizado' }, 401);
  }

  let payload: PushRequest;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'JSON no válido' }, 400);
  }
  if (!payload.user_id || !payload.title) {
    return json({ error: 'Faltan user_id o title' }, 400);
  }

  // 2) Tokens del usuario (service_role: se salta RLS; solo existe aquí, en el servidor).
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data: rows, error } = await admin
    .from('push_tokens')
    .select('token')
    .eq('user_id', payload.user_id);
  if (error) {
    console.error('send-push: no se pudieron leer los tokens', error.message);
    return json({ error: 'No se pudieron leer los tokens' }, 500);
  }
  if (!rows || rows.length === 0) {
    return json({ sent: 0 });
  }

  const messages = rows.map((row: { token: string }) => ({
    to: row.token,
    title: payload.title,
    body: payload.body ?? '',
    sound: 'default',
    channelId: 'default',
    data: payload.url ? { url: payload.url } : {},
  }));

  // 3) Enviar a Expo en tandas de 100.
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  // Opcional: si activas "Enhanced Security for Push Notifications" en expo.dev.
  const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN');
  if (expoAccessToken) {
    headers.Authorization = `Bearer ${expoAccessToken}`;
  }

  const deadTokens: string[] = [];
  for (let i = 0; i < messages.length; i += MAX_PER_REQUEST) {
    const chunk = messages.slice(i, i + MAX_PER_REQUEST);
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(chunk),
    });
    if (!response.ok) {
      console.error('send-push: Expo respondió', response.status, await response.text());
      continue;
    }
    const { data: tickets } = (await response.json()) as { data: ExpoTicket[] };
    tickets.forEach((ticket, index) => {
      // El usuario desinstaló la app o quitó el permiso: ese token ya no vale.
      if (ticket.status === 'error' && ticket.details?.error === 'DeviceNotRegistered') {
        deadTokens.push(chunk[index]!.to);
      }
    });
  }

  // 4) Limpieza de tokens muertos.
  if (deadTokens.length > 0) {
    await admin.from('push_tokens').delete().in('token', deadTokens);
  }

  return json({ sent: messages.length, removed: deadTokens.length });
});
```

Añade al final de `supabase/config.toml`:

```toml
# verify_jwt = false: la llama la BD, no un usuario. La función comprueba x-push-secret.
[functions.send-push]
enabled = true
verify_jwt = false
```

### El secreto compartido

Genera uno largo y aleatorio:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guárdalo como secreto de tu proyecto de Supabase:

```bash
npx supabase secrets set PUSH_WEBHOOK_SECRET=el-valor-generado
```

Y despliega la función (o haz merge en `main` y lo hará `deploy-supabase.yml`):

```bash
npx supabase functions deploy send-push --use-api
```

> **Si usas base local (Docker):** crea `supabase/functions/.env` (ya está en `.gitignore`) con
> `PUSH_WEBHOOK_SECRET=el-valor-generado`.

## Paso 9 — Disparar la push desde la base de datos

Qué es **`pg_net`**: una extensión de Postgres que permite hacer peticiones HTTP desde SQL, sin
bloquear (la petición sale después de guardar). Qué es **Vault**: la "caja fuerte" de Supabase
para guardar secretos dentro de la BD, cifrados, fuera de tus migraciones.

Nueva migración:

```bash
npm run db:new -- push_trigger
```

```sql
-- ════════════════════════════════════════════════════════════════════════════════════════════
-- Enviar push desde la BD (docs/graduacion/08-notificaciones-push.md).
-- La URL de la función y el secreto NO están aquí: se leen de Vault (ver la guía).
-- Esquema `private`: no se expone en la API, así que nadie puede llamar a esto desde la app.
-- ════════════════════════════════════════════════════════════════════════════════════════════

create extension if not exists pg_net with schema extensions;
create schema if not exists private;

create or replace function private.send_push(
  p_user_id uuid,
  p_title text,
  p_body text,
  p_url text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_url text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'send_push_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'send_push_secret';
  if v_url is null or v_secret is null then
    raise warning 'send_push: faltan send_push_url / send_push_secret en Vault; no se envía nada';
    return;
  end if;

  perform net.http_post(
    url := v_url,
    body := jsonb_build_object('user_id', p_user_id, 'title', p_title, 'body', p_body, 'url', p_url),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-push-secret', v_secret)
  );
end;
$$;

revoke all on function private.send_push(uuid, text, text, text) from public;

-- ─── EJEMPLO didáctico: avisar al dueño cuando se crea una nota ─────────────────────────────
-- En tu app real será "te han escrito", "tu reserva está confirmada"… Copia el patrón.
create or replace function private.notify_note_created()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.send_push(new.user_id, 'Nota guardada', new.title, '/note/' || new.id::text);
  return new;
end;
$$;

create trigger notes_notify_created
  after insert on public.notes
  for each row execute function private.notify_note_created();
```

Aplícala a tu proyecto de desarrollo (te enseña la migración y pide confirmación: responde `Y`)
y regenera los tipos. Si usas base local (Docker), en vez de `db:push`: `npm run db:reset`.

```bash
npm run db:push
```

```bash
npm run db:types
```

Ahora guarda los dos secretos en Vault. Supabase Dashboard → **SQL Editor** y ejecuta, con tu
Project ref y tu secreto:

```sql
select vault.create_secret('https://TU_PROJECT_REF.supabase.co/functions/v1/send-push', 'send_push_url');
select vault.create_secret('el-valor-generado', 'send_push_secret');
```

Se hace una vez por proyecto: cuando crees el de producción (nivel 10), repítelo allí con su URL.

> **Si usas base local (Docker):** hazlo en Studio (`http://127.0.0.1:54423`) → SQL Editor, con
> la URL `http://host.docker.internal:54421/functions/v1/send-push` (desde dentro de Docker, tu
> ordenador se llama `host.docker.internal`). `npm run db:reset` borra la base local, **Vault
> incluido**: tras cada reset, vuelve a ejecutar esas dos líneas.

**Otra forma de disparar**: desde otra Edge Function (por ejemplo, un webhook de pagos del
[nivel 9](09-cobrar.md)) llama a `send-push` con `fetch` a
`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push`, método `POST`, cabecera `x-push-secret`
y el mismo body JSON.

## Paso 10 — Compilar y probar

Has añadido código nativo: build nuevo.

```bash
eas build --profile development --platform all
```

Instálalo y arranca la app:

```bash
npm start
```

(Si usas base local con Docker, arranca antes las funciones en otra terminal con
`npx supabase functions serve`.)

Pruebas, de la más simple a la completa:

1. **¿Llega una push al móvil?** Perfil → **Activar notificaciones** → Permitir. En el Dashboard
   de Supabase → **Table Editor** → tabla `push_tokens` copia tu token y pruébalo en la
   herramienta de Expo [expo.dev/notifications](https://expo.dev/notifications).
2. **¿Funciona la función?** Dashboard → **Edge Functions → send-push** → botón de probar la
   función (_Test_). Método `POST`, añade la cabecera `x-push-secret` con tu secreto y este body
   (con tu `user_id`, que ves en `push_tokens`):

   ```json
   {
     "user_id": "TU_USER_ID",
     "title": "Hola",
     "body": "Prueba desde el Dashboard",
     "url": "/note/new"
   }
   ```

   Si algo falla, mira **Edge Functions → send-push → Logs**.

3. **¿Funciona el trigger?** Crea una nota en la app, **sal a la pantalla de inicio del móvil** y
   espera la notificación "Nota guardada". Tócala: se abre esa nota.

---

## ✅ Cómo sé que ha funcionado

- Tras activar, hay una fila tuya en `push_tokens` (y solo tú la ves: RLS).
- La herramienta de Expo y la prueba desde el Dashboard hacen vibrar el móvil.
- Con la app **cerrada del todo**, tocar la notificación abre la app **directamente en la nota**.
- Al cerrar sesión, tu fila desaparece de `push_tokens`; al borrar la cuenta, también.

## 🧯 Problemas típicos

- **`registerPushToken` devuelve `unsupported`**: estás en un simulador o en web. Usa un móvil real.
- **Error "Default FirebaseApp is not initialized"** (Android): falta `googleServicesFile` en
  `app.json` o no hiciste build nuevo tras añadirlo.
- **Expo responde `InvalidCredentials`**: no subiste la clave FCM v1 a EAS (Android) o no se creó
  la clave de APNs (iOS). Repite el paso 2 y rehaz el build.
- **La prueba de la función devuelve 401**: el secreto de la cabecera no coincide con
  `PUSH_WEBHOOK_SECRET` (`npx supabase secrets list` para ver que existe). Si usas base local,
  ¿reiniciaste `functions serve` tras crear `supabase/functions/.env`?
- **El trigger no envía nada**: mira los avisos en Dashboard → **Logs → Postgres** ("faltan … en
  Vault") y la tabla `net._http_response` (respuestas de `pg_net`, desde el SQL Editor). Si usas
  base local, recuerda que `db:reset` borra Vault.
- **Se guarda el token pero no llega nada en iPhone**: si instalaste un build de antes de
  configurar APNs, reinstala el nuevo. Revisa también que no estés en modo Concentración.
- **La notificación llega pero no navega**: comprueba que `data.url` empieza por `/` y que la ruta
  existe en `src/app/`.

## Pedírselo a Claude

```
/graduar 08
```

Otros ejemplos:

- "Monta las notificaciones push siguiendo docs/graduacion/08-notificaciones-push.md. Cuando haya
  que tocar Firebase, Apple o Vault, párate y dime qué hacer."
- "Quiero que cuando _(algo pase en mi app)_ le llegue una push a _(quién)_ y al tocarla se abra
  _(pantalla)_. Cambia el trigger de ejemplo por ese."
- "Las push no llegan en Android: ayúdame a diagnosticarlo paso a paso."
- "Añade una preferencia en Perfil para desactivar las notificaciones."

## Documentación oficial

- [Push notifications: introducción](https://docs.expo.dev/push-notifications/overview/)
- [Configurar push en Expo](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Enviar con el servicio de Expo](https://docs.expo.dev/push-notifications/sending-notifications/)
- [`expo-notifications` (API)](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Supabase: pg_net](https://supabase.com/docs/guides/database/extensions/pg_net) ·
  [Vault](https://supabase.com/docs/guides/database/vault)
