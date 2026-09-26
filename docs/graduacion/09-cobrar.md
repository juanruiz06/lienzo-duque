# Nivel 9 — Cobrar (compras in-app y Stripe)

> **Qué consigues:** ganar dinero con tu app: suscripciones o compras de funciones "premium"
> (con **RevenueCat** sobre las compras de Apple/Google) o cobros por productos y servicios del
> mundo real (con **Stripe**).
>
> **Cuánto cuesta:** RevenueCat gratis hasta **2.500 $/mes** de ingresos y luego el **1 %** de lo
> que pase de ahí. Apple se queda un **15 %** si estás en el Small Business Program (30 % si no).
> Google: ver la sección de comisiones, porque cambió en junio de 2026. Stripe: ~**1,5 % + 0,25 €**
> por pago con tarjeta europea estándar (sept. 2026, compruébalo todo).
>
> **Cuándo hacerlo:** cuando tengas usuarios que ya usan la app y te hayan dado señales de que
> pagarían. Cobrar complica la revisión, los impuestos y el soporte.
>
> **Tiempo estimado:** 1–2 días de trabajo + esperas (acuerdos bancarios y fiscales con Apple y
> Google: varios días; revisión del primer producto).
>
> **Requisitos:** [Nivel 5](05-publicar-en-tiendas.md) (app creada en ambas tiendas, al menos en
> pruebas internas), [Nivel 2](02-builds-con-eas.md) (development build), y muy recomendable el
> [Nivel 3](03-observabilidad.md).

> Esta guía **no es asesoramiento fiscal ni legal**. Las reglas de las tiendas y las comisiones han
> cambiado varias veces en 2025–2026 y siguen en movimiento: compruébalas antes de decidir.

## La regla clave: ¿qué vendes?

| Lo que vendes                                 | Ejemplos                                                                            | Cómo tienes que cobrar                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| **Algo digital que se usa dentro de la app**  | Suscripción premium, quitar anuncios, créditos, plantillas, contenido desbloqueable | **Compras in-app** de Apple y Google (obligatorio). Aquí usamos RevenueCat |
| **Bienes físicos o servicios del mundo real** | Ropa, comida a domicilio, reservar una clase presencial, un taxi                    | **Stripe** (u otro TPV). Aquí **no** puedes usar compras in-app            |

Si cobras contenido digital con Stripe dentro de la app, **te rechazarán** (guideline 3.1.1 de
Apple; política de pagos de Google). Hay excepciones (apps "lectoras" tipo Netflix/Kindle, servicios
en tiempo real entre dos personas…), pero no cuentes con ellas sin leer la
[guideline 3.1](https://developer.apple.com/app-store/review/guidelines/#payments).

### Comisiones y cambios recientes por región (con prudencia)

- **Apple, en general**: 30 %, o **15 % con el
  [App Store Small Business Program](https://developer.apple.com/app-store/small-business-program/)**
  si ingresaste menos de 1 millón de dólares el año anterior (**hay que apuntarse**, no es
  automático). Las suscripciones pagan 15 % a partir del primer año de cada suscriptor.
- **Google Play**: desde el **30 de junio de 2026** en **EE. UU., el Espacio Económico Europeo y
  Reino Unido** la estructura es: **10 %** de comisión de servicio sobre el primer millón de
  dólares al año (y en todas las suscripciones con renovación automática) + un **5 %** de
  comisión de facturación si usas el sistema de pago de Google Play; en el resto de países se va
  desplegando por fases ([anuncio oficial](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html)).
- **EE. UU. (Apple)**: tras el caso _Epic v. Apple_, en la tienda de EE. UU. se permiten enlaces a
  pagar en tu web. En agosto de 2026 Apple ha propuesto cobrar comisión también por esas compras
  externas y el caso sigue en los tribunales (incluido el Supremo). **No construyas tu modelo
  sobre esto sin comprobar el estado actual.**
- **Unión Europea (DMA)**: Apple ha cambiado sus condiciones para la UE varias veces; en agosto de
  2026 anunció unas condiciones unificadas que entran en vigor el **1 de octubre de 2026**, con
  porcentajes distintos según cómo cobres
  ([nota de Apple](https://www.apple.com/newsroom/2026/08/apple-announces-changes-for-apps-in-the-european-union/)).

**Recomendación para empezar:** usa **compras in-app en todas partes**. Es lo único que funciona
igual en todos los países, lo más fácil de aprobar y lo que RevenueCat te resuelve. Ya optimizarás
comisiones cuando factures lo suficiente para que merezca la pena.

---

## Parte A — Suscripciones con RevenueCat

Qué es **RevenueCat**: un servicio que se pone entre tu app y las tiendas. Valida los recibos de
compra, sabe en todo momento quién está suscrito (renovaciones, cancelaciones, reembolsos), te da
pantallas de pago ("paywalls") ya hechas y avisa a tu servidor (**webhook**) cuando algo cambia.
Sin él tendrías que programar todo eso para Apple y para Google por separado.

Tres palabras de RevenueCat:

- **Producto**: lo que se compra en la tienda (`premium_mensual`, `premium_anual`).
- **Entitlement** ("derecho"): lo que el usuario **obtiene** (`premium`). Varios productos dan el
  mismo entitlement. Tu código solo pregunta "¿tiene `premium`?".
- **Offering**: el conjunto de productos que enseñas en el paywall.

```
Paywall (RevenueCat UI) ─► compra en Apple/Google ─► RevenueCat valida
                                                        │ webhook
                                                        ▼
                     Edge Function revenuecat-webhook ─► tabla subscriptions (solo la escribe el servidor)
                                                        │
App ─► usePremium() ─► ¿premium? = tabla (servidor) O RevenueCat en el móvil (instantáneo)
```

### Paso A1 — Papeleo con Apple y Google (empieza ya: tarda días)

- **Apple**: App Store Connect → **Negocio** (_Business_) → acepta el **Acuerdo de apps de pago**
  (_Paid Apps Agreement_) y rellena **cuenta bancaria**, **datos fiscales** (desde España, el
  formulario W-8BEN de EE. UU. para que no te retengan de más) y contactos. Sin esto, las compras
  no funcionan ni en pruebas.
- **Google**: Play Console → **Configuración → Perfil de pagos**: datos fiscales y bancarios.
- Apúntate al **Small Business Program** de Apple (enlace arriba).

### Paso A2 — Crear los productos en las tiendas

- **App Store Connect** → tu app → **Monetización → Suscripciones** → crea un **grupo**
  ("Premium") y dentro dos suscripciones con ID `premium_mensual` y `premium_anual` (los IDs no se
  pueden reutilizar nunca). Duración, precio, nombre y descripción en español, y una captura del
  paywall para la revisión.
- **Play Console** → tu app → **Monetizar → Productos → Suscripciones** → `premium_mensual` y
  `premium_anual`, cada una con un _plan básico_. Google solo te deja crearlas si ya has subido un
  build que incluya la librería de pagos (haz el paso A4 y sube un build a prueba interna antes).

### Paso A3 — Configurar RevenueCat

1. Crea cuenta en [revenuecat.com](https://www.revenuecat.com) → nuevo proyecto.
2. **Añade las apps**: App Store (bundle id + una **In-App Purchase Key** `.p8` que generas en App
   Store Connect → Usuarios y acceso → Integraciones) y Play Store (package + credenciales de una
   cuenta de servicio; sigue su guía). Esas claves las guarda RevenueCat; **no** las metas en el repo.
3. **Productos**: impórtalos de las tiendas.
4. **Entitlements** → crea `premium` y asígnale los cuatro productos (2 de Apple + 2 de Google).
5. **Offerings** → la `default` con paquetes mensual y anual.
6. **Paywalls** → diseña la pantalla de pago en su editor (incluye botón de "Restaurar compras",
   que Apple exige).
7. **API keys**: copia las **claves públicas del SDK** (empiezan por `appl_` y `goog_`). Son
   públicas: van en la app. La **clave secreta** (`sk_…`) es solo para el servidor (paso A7).

Guía oficial: [RevenueCat + Expo](https://www.revenuecat.com/docs/getting-started/installation/expo).

### Paso A4 — Instalar el SDK

```bash
npx expo install react-native-purchases react-native-purchases-ui
```

En `.env` (y el nombre vacío en `.env.example`), y súbelas también a EAS como en el
[nivel 2](02-builds-con-eas.md) (`--visibility plaintext`):

```bash
EXPO_PUBLIC_REVENUECAT_IOS_KEY=
EXPO_PUBLIC_REVENUECAT_ANDROID_KEY=
```

Y en `src/config/env.ts`, añade ambas como `z.string().optional()` al esquema y a `safeParse`
(igual que `EXPO_PUBLIC_SENTRY_DSN`).

Después, development build nuevo (código nativo):

```bash
eas build --profile development --platform all
```

(En Expo Go, RevenueCat funciona en un "modo simulado" para ver pantallas, pero sin compras reales.)

### Paso A5 — La tabla `subscriptions` (el usuario solo LEE)

```bash
npm run db:new -- subscriptions
```

```sql
-- ════════════════════════════════════════════════════════════════════════════════════════════
-- Estado de la suscripción de cada usuario (docs/graduacion/09-cobrar.md).
-- La ESCRIBE solo el servidor (Edge Function revenuecat-webhook, con service_role).
-- El usuario solo puede LEER la suya. Así nadie se "regala" premium desde la app.
-- ════════════════════════════════════════════════════════════════════════════════════════════

create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  entitlement text not null default 'premium',
  is_active boolean not null default false,
  expires_at timestamptz,               -- null = de por vida
  product_id text,
  store text,                           -- 'app_store' | 'play_store' | …
  environment text,                     -- 'SANDBOX' (pruebas) | 'PRODUCTION'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.subscriptions is 'Suscripción premium de cada usuario. Solo la escribe el servidor.';

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

alter table public.subscriptions enable row level security;

create policy "subscriptions: el dueño lee la suya"
  on public.subscriptions for select
  to authenticated
  using (user_id = (select auth.uid()));

-- Sin policies de INSERT/UPDATE/DELETE para authenticated: la app NO puede escribir aquí.
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on public.subscriptions to service_role;
revoke all on public.subscriptions from anon;

-- ─── ¿El usuario con sesión es premium? ─────────────────────────────────────────────────────
-- Úsala desde la app (rpc) y en las policies de otras tablas, p. ej.:
--   using (user_id = (select auth.uid()) and (select public.is_premium()))
create or replace function public.is_premium()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (
      select s.is_active and (s.expires_at is null or s.expires_at > now())
      from public.subscriptions s
      where s.user_id = (select auth.uid())
    ),
    false
  );
$$;

revoke execute on function public.is_premium() from public, anon;
grant execute on function public.is_premium() to authenticated;
```

Aplícala a tu proyecto de desarrollo (te enseña la migración y pide confirmación: responde `Y`)
y regenera los tipos. Si usas base local (Docker), en vez de `db:push`: `npm run db:reset`.

```bash
npm run db:push
```

```bash
npm run db:types
```

### Paso A6 — La Edge Function `revenuecat-webhook`

Crea `supabase/functions/revenuecat-webhook/index.ts`:

```ts
// ════════════════════════════════════════════════════════════════════════════════════════════
// Edge Function `revenuecat-webhook`: RevenueCat nos avisa de compras, renovaciones,
// cancelaciones… y aquí actualizamos la tabla `subscriptions`.
//
// Seguridad: la llama RevenueCat (no un usuario) → verify_jwt = false en config.toml. En su lugar
// comprobamos la cabecera Authorization que configuras en el dashboard de RevenueCat.
//
// Práctica recomendada por RevenueCat: no fiarse del contenido del evento, sino preguntar a su
// API el estado ACTUAL del usuario (así da igual si los eventos llegan desordenados o repetidos).
// Docs: https://www.revenuecat.com/docs/integrations/webhooks
// ════════════════════════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

import { json } from '../_shared/cors.ts';

const ENTITLEMENT = 'premium';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RevenueCatEvent = {
  type?: string;
  environment?: string;
  app_user_id?: string;
  original_app_user_id?: string;
  aliases?: string[];
  transferred_from?: string[];
  transferred_to?: string[];
};

type SubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, { expires_date: string | null; product_identifier: string }>;
    subscriptions?: Record<string, { store?: string }>;
  };
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  // 1) ¿Es RevenueCat? En su dashboard pusiste "Bearer <REVENUECAT_WEBHOOK_AUTH>".
  const expected = Deno.env.get('REVENUECAT_WEBHOOK_AUTH');
  if (!expected || req.headers.get('Authorization') !== `Bearer ${expected}`) {
    return json({ error: 'No autorizado' }, 401);
  }

  let event: RevenueCatEvent;
  try {
    ({ event } = (await req.json()) as { event: RevenueCatEvent });
  } catch {
    return json({ error: 'JSON no válido' }, 400);
  }

  // 2) Usuarios afectados. En la app hacemos Purchases.logIn(<id de Supabase>), así que el
  //    app_user_id es un uuid. Los ids anónimos de RevenueCat ($RCAnonymousID…) se ignoran.
  const candidates = [
    event.app_user_id,
    event.original_app_user_id,
    ...(event.aliases ?? []),
    ...(event.transferred_from ?? []),
    ...(event.transferred_to ?? []),
  ];
  const userIds = [...new Set(candidates.filter((id): id is string => !!id && UUID.test(id)))];
  if (userIds.length === 0) {
    return json({ ok: true, ignored: true }); // p. ej. el evento TEST del dashboard
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const secretKey = Deno.env.get('REVENUECAT_SECRET_API_KEY')!;

  for (const userId of userIds) {
    // 3) Estado actual según RevenueCat.
    const response = await fetch(
      `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    if (!response.ok) {
      console.error('revenuecat-webhook: API respondió', response.status, userId);
      return json({ error: 'RevenueCat no disponible' }, 500); // RevenueCat reintentará
    }
    const { subscriber } = (await response.json()) as SubscriberResponse;
    const entitlement = subscriber?.entitlements?.[ENTITLEMENT];
    const expiresAt = entitlement?.expires_date ?? null;
    const isActive = !!entitlement && (expiresAt === null || new Date(expiresAt) > new Date());
    const productId = entitlement?.product_identifier ?? null;

    // 4) Guardar (upsert = crear o actualizar).
    const { error } = await admin.from('subscriptions').upsert({
      user_id: userId,
      entitlement: ENTITLEMENT,
      is_active: isActive,
      expires_at: expiresAt,
      product_id: productId,
      store: productId ? (subscriber?.subscriptions?.[productId]?.store ?? null) : null,
      environment: event.environment ?? null,
    });
    if (error) {
      // Un usuario que ya no existe (cuenta borrada) da error de FK: lo dejamos pasar.
      console.error('revenuecat-webhook: no se pudo guardar', userId, error.message);
    }
  }

  return json({ ok: true });
});
```

En `supabase/config.toml`:

```toml
# La llama RevenueCat, no un usuario. La función comprueba la cabecera Authorization.
[functions.revenuecat-webhook]
enabled = true
verify_jwt = false
```

### Paso A7 — Secretos y conexión del webhook

Genera un valor aleatorio para la cabecera:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Guárdalo, junto con la clave secreta de RevenueCat (Project settings → API keys → _Secret API
key_), como **secrets de Supabase** (nunca en la app ni con `EXPO_PUBLIC_`):

```bash
npx supabase secrets set REVENUECAT_WEBHOOK_AUTH=el-valor-generado
```

```bash
npx supabase secrets set REVENUECAT_SECRET_API_KEY=sk_TU_CLAVE_SECRETA
```

```bash
npx supabase functions deploy revenuecat-webhook --use-api
```

En RevenueCat → **Integrations → Webhooks → Add**: URL
`https://TU_PROJECT_REF.supabase.co/functions/v1/revenuecat-webhook`, _Authorization header value_
`Bearer el-valor-generado`, y que envíe eventos de **sandbox y producción**. Pulsa **Send test
event**: debe responder 200.

### Paso A8 — El código de la app

**`src/api/purchases.ts`** (RevenueCat; no toca Supabase):

```ts
import { Platform } from 'react-native';
import Purchases from 'react-native-purchases';
import RevenueCatUI, { PAYWALL_RESULT } from 'react-native-purchases-ui';

import { env } from '@/config/env';

/** Compras in-app con RevenueCat (docs/graduacion/09-cobrar.md). */
export const PREMIUM_ENTITLEMENT = 'premium';

let configured = false;

/** Asocia las compras al usuario de Supabase. Se llama al iniciar sesión (useAuthListener). */
export async function identifyPurchaser(userId: string): Promise<void> {
  const apiKey = Platform.select({
    ios: env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
    android: env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  });
  if (!apiKey) {
    return; // web, o aún no configurado
  }
  if (!configured) {
    // appUserID = id de Supabase → el webhook sabe a qué fila de `subscriptions` va.
    Purchases.configure({ apiKey, appUserID: userId });
    configured = true;
  } else {
    await Purchases.logIn(userId);
  }
}

/** Al cerrar sesión: que el siguiente usuario de este móvil no herede las compras. */
export async function resetPurchaser(): Promise<void> {
  if (configured && !(await Purchases.isAnonymous())) {
    await Purchases.logOut();
  }
}

/** ¿Tiene premium según RevenueCat en ESTE móvil? Instantáneo tras comprar. */
export async function hasPremiumOnDevice(): Promise<boolean> {
  if (!configured) {
    return false;
  }
  const info = await Purchases.getCustomerInfo();
  return info.entitlements.active[PREMIUM_ENTITLEMENT] !== undefined;
}

/** Enseña el paywall (si no es premium ya). Devuelve true si ahora tiene premium. */
export async function presentPaywall(): Promise<boolean> {
  const result = await RevenueCatUI.presentPaywallIfNeeded({
    requiredEntitlementIdentifier: PREMIUM_ENTITLEMENT,
  });
  return (
    result === PAYWALL_RESULT.PURCHASED ||
    result === PAYWALL_RESULT.RESTORED ||
    result === PAYWALL_RESULT.NOT_PRESENTED // ya lo tenía
  );
}
```

**`src/api/subscriptions.ts`** (lo que dice el servidor):

```ts
import { supabase } from './supabase';

/** ¿El usuario con sesión es premium según la tabla `subscriptions` (escrita por el webhook)? */
export async function getMyPremiumStatus(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_premium');
  if (error) {
    throw error;
  }
  return data;
}
```

Añade la clave en `src/api/queryKeys.ts`:

```ts
  premium: {
    me: ['premium', 'me'] as const,
  },
```

**`src/hooks/usePremium.ts`**:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { hasPremiumOnDevice, presentPaywall } from '@/api/purchases';
import { queryKeys } from '@/api/queryKeys';
import { getMyPremiumStatus } from '@/api/subscriptions';

/**
 * ¿Es premium? Para la INTERFAZ vale con que lo diga el servidor O RevenueCat en el móvil
 * (el webhook tarda unos segundos en llegar tras comprar). Lo que proteja la base de datos
 * (policies con is_premium()) depende solo del servidor.
 */
export function usePremium() {
  return useQuery({
    queryKey: queryKeys.premium.me,
    queryFn: async () => (await getMyPremiumStatus()) || (await hasPremiumOnDevice()),
  });
}

export function useBuyPremium() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['premium', 'buy'],
    mutationFn: presentPaywall,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.premium.me }),
  });
}
```

**Conectar el usuario**: en `src/hooks/useAuthListener.ts`, donde ya se llama a
`identifyUser(nextUserId)`, añade `void identifyPurchaser(nextUserId);` y, en la rama de cierre de
sesión (junto a `resetAnalytics()`), `void resetPurchaser();` (importándolas de `@/api/purchases`).

**En una pantalla** (p. ej. Perfil):

```tsx
const premium = usePremium();
const buyPremium = useBuyPremium();

// … en el JSX:
{
  premium.data ? (
    <Text variant="bodyStrong">Eres premium ✨</Text>
  ) : (
    <Button
      label="Hazte premium"
      onPress={() => buyPremium.mutate()}
      loading={buyPremium.isPending}
    />
  );
}
```

### Paso A9 — Probar sin pagar de verdad

- **iPhone**: App Store Connect → Usuarios y acceso → **Sandbox** → crea un tester con un email que
  no sea un Apple ID. En el iPhone: Ajustes → App Store → _Cuenta de Sandbox_. Las compras en
  **TestFlight** también son de prueba y gratuitas. Las renovaciones van aceleradas (un mes dura
  minutos).
- **Android**: Play Console → Configuración → **Pruebas de licencia** → añade tu Gmail. Instala la
  app desde la **prueba interna** (no sirve un APK suelto).
- Tras comprar: en RevenueCat → Customers aparece tu usuario (su id es tu id de Supabase), y en
  Supabase → tabla `subscriptions` hay una fila con `environment = SANDBOX`.

### Revisión de Apple con suscripciones

La primera suscripción se envía **junto con una versión de la app**. El paywall debe mostrar
precio, duración, qué incluye, **Restaurar compras** y enlaces a tu **política de privacidad** y a
los **términos de uso** (puedes usar el EULA estándar de Apple y enlazarlo en la descripción).
Los paywalls de RevenueCat traen casi todo; revisa los enlaces.

---

## Parte B — Stripe para bienes físicos y servicios reales (breve)

Qué es **Stripe**: una pasarela de pago (como el TPV de una tienda, pero online). Solo para lo que
**no** es digital (tabla del principio).

Piezas mínimas:

1. **Instalar** y añadir el plugin `@stripe/stripe-react-native` a `app.json` (build nuevo):

   ```bash
   npx expo install @stripe/stripe-react-native
   ```

2. **Claves**: la _publishable key_ (`pk_test_…`) es pública → `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   La _secret key_ (`sk_test_…`) **solo** en Supabase:

   ```bash
   npx supabase secrets set STRIPE_SECRET_KEY=sk_test_TU_CLAVE
   ```

3. **Edge Function `create-payment-intent`** (con `verify_jwt = true`, como `delete-account`). El
   **precio lo decide el servidor**, nunca la app:

   ```ts
   import { createClient } from 'npm:@supabase/supabase-js@2';

   import { corsHeaders, json } from '../_shared/cors.ts';

   // Catálogo en el servidor (o en una tabla). La app solo manda el id del producto.
   const PRODUCTS: Record<string, { amount: number; currency: string }> = {
     camiseta: { amount: 1990, currency: 'eur' }, // céntimos: 19,90 €
   };

   Deno.serve(async (req) => {
     if (req.method === 'OPTIONS') {
       return new Response('ok', { headers: corsHeaders });
     }
     const userClient = createClient(
       Deno.env.get('SUPABASE_URL')!,
       Deno.env.get('SUPABASE_ANON_KEY')!,
       { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
     );
     const {
       data: { user },
     } = await userClient.auth.getUser();
     if (!user) {
       return json({ error: 'Sesión no válida' }, 401);
     }

     const { productId } = (await req.json()) as { productId?: string };
     const product = productId ? PRODUCTS[productId] : undefined;
     if (!product) {
       return json({ error: 'Producto desconocido' }, 400);
     }

     const response = await fetch('https://api.stripe.com/v1/payment_intents', {
       method: 'POST',
       headers: {
         Authorization: `Bearer ${Deno.env.get('STRIPE_SECRET_KEY')}`,
         'Content-Type': 'application/x-www-form-urlencoded',
       },
       body: new URLSearchParams({
         amount: String(product.amount),
         currency: product.currency,
         'automatic_payment_methods[enabled]': 'true',
         'metadata[user_id]': user.id,
         'metadata[product_id]': productId!,
       }),
     });
     const intent = await response.json();
     if (!response.ok) {
       console.error('create-payment-intent:', intent.error?.message);
       return json({ error: 'No se pudo iniciar el pago' }, 500);
     }
     return json({ clientSecret: intent.client_secret });
   });
   ```

4. **App**: envuelve la app en `<StripeProvider publishableKey={…}>` (en `src/app/_layout.tsx`),
   crea `createPaymentIntent(productId)` en `src/api/payments.ts` (con
   `supabase.functions.invoke('create-payment-intent', { body: { productId } })`) y un hook
   `useCheckout()` en `src/hooks/` que use `useStripe()` → `initPaymentSheet({ merchantDisplayName,
paymentIntentClientSecret, returnURL: 'tuesquema://stripe-redirect' })` →
   `presentPaymentSheet()`. La pantalla solo llama a `checkout.mutate('camiseta')`.
5. **Confirmar el pago en el servidor**: no marques un pedido como pagado porque la app lo diga.
   Crea un webhook de Stripe (`payment_intent.succeeded`) hacia otra Edge Function que verifique la
   firma con `STRIPE_WEBHOOK_SECRET` y actualice tu tabla de pedidos.

Prueba con las [tarjetas de test de Stripe](https://docs.stripe.com/testing) (p. ej.
`4242 4242 4242 4242`) y las claves `test`. Guía oficial:
[Stripe React Native — Payment Sheet](https://docs.stripe.com/payments/accept-a-payment?platform=react-native).

---

## Obligaciones fiscales mínimas (piensa en ellas antes de cobrar)

No es asesoramiento fiscal: **habla con un gestor o asesor** antes de tu primer euro. Lo que
conviene saber para esa conversación:

- **Compras in-app**: Apple y Google venden **en su nombre** al usuario final y se encargan del IVA
  de esas ventas en la UE; tú recibes lo que queda tras comisión e impuestos. Aun así, esos
  ingresos **son tuyos y hay que declararlos** (según tu caso, como autónomo o sociedad), y puede
  que tengas que emitirles factura.
- **Stripe**: aquí **tú** eres el vendedor: cobras el IVA que toque, emites facturas y declaras.
  Stripe solo mueve el dinero (tiene un servicio de pago, Stripe Tax, que ayuda a calcularlo).
- **Estado de comerciante (DSA)** en la UE: si cobras, casi seguro eres _trader_ y Apple publicará
  tus datos de contacto en la ficha ([nivel 5](05-publicar-en-tiendas.md)).
- **Datos que piden las tiendas**: cuenta bancaria, NIF, formularios fiscales de EE. UU. (W-8BEN
  para personas; W-8BEN-E para empresas). Tenlos a mano.

---

## ✅ Cómo sé que ha funcionado

- Con una cuenta de sandbox/pruebas de licencia, el botón "Hazte premium" abre el paywall, compras
  y la pantalla cambia a "Eres premium" **al instante**.
- En Supabase → `subscriptions` aparece tu fila con `is_active = true` segundos después.
- Desde la app **no** puedes escribir en `subscriptions` (prueba un `update` con la sesión de un
  usuario: RLS lo bloquea).
- Cancelas la suscripción de prueba y, al caducar (minutos en sandbox), `is_active` pasa a `false`.
- Stripe: pagas con `4242…` y en el dashboard de Stripe (modo test) ves el pago.

## 🧯 Problemas típicos

- **El paywall sale vacío o "no products"**: el Acuerdo de apps de pago no está activo, los
  productos no están en estado "Listo para enviar", no están en la offering `default` o (Android)
  la app no se instaló desde la prueba interna. Espera también unas horas tras crear productos.
- **Compra hecha pero `subscriptions` no cambia**: revisa en RevenueCat → Webhooks el historial
  (código de respuesta). 401 = la cabecera no coincide con `REVENUECAT_WEBHOOK_AUTH`. 500 = mira
  los logs de la función en Supabase → Edge Functions → Logs.
- **En RevenueCat el cliente aparece con id `$RCAnonymousID…`**: no se llamó a `identifyPurchaser`
  (revisa `useAuthListener`).
- **"Invalid API key"** en la app: estás usando la clave secreta en vez de la pública del SDK, o la
  de iOS en Android.
- **Apple rechaza por 3.1.1**: vendes algo digital fuera de las compras in-app, o hay un enlace o
  texto que lleva a pagar en tu web.
- **Apple rechaza por 3.1.2**: al paywall le falta el precio claro, la duración o los enlaces a
  privacidad/términos.

## Pedírselo a Claude

```
/graduar 09
```

Otros ejemplos:

- "Quiero una suscripción premium mensual y anual con RevenueCat siguiendo
  docs/graduacion/09-cobrar.md. Párate cada vez que tenga que configurar algo en App Store
  Connect, Play Console o RevenueCat."
- "Haz que crear más de 10 notas solo se pueda siendo premium, protegido en la base de datos con
  `is_premium()`."
- "Vendo _(producto físico)_: monta Stripe con Payment Sheet, la Edge Function y el webhook que
  marca el pedido como pagado."
- "¿Lo que quiero vender _(descríbelo)_ es digital o físico según Apple?"

## Documentación oficial

- [Apple — Guidelines de pagos (3.1)](https://developer.apple.com/app-store/review/guidelines/#payments)
- [Google Play — Política de pagos](https://support.google.com/googleplay/android-developer/answer/9858738)
- [RevenueCat — Expo](https://www.revenuecat.com/docs/getting-started/installation/expo) ·
  [Webhooks](https://www.revenuecat.com/docs/integrations/webhooks) ·
  [Precios](https://www.revenuecat.com/pricing)
- [Stripe React Native](https://docs.stripe.com/sdks/react-native)
