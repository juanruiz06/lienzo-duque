# Nivel 4 — Emails de verdad con Resend y dominio propio

> **Qué consigues:** los emails de tu app (confirmar cuenta, recuperar contraseña) llegan a
> **cualquier** usuario, desde una dirección tuya (`hola@tuapp.com`), en castellano y sin caer
> en spam. Y aprendes a mandar emails propios (bienvenida, avisos) desde el servidor.
>
> **Cuánto cuesta:** Resend Free, 0 €: 3.000 emails/mes, máximo 100 al día (sept. 2026,
> compruébalo). Dominio propio: ~10–15 €/año.
>
> **Cuándo hacerlo:** **antes** de dejar que se registre gente que no seas tú, y siempre antes
> de publicar en tiendas (nivel 5).
>
> **Tiempo estimado:** 1–2 horas (la verificación del dominio puede tardar desde minutos hasta
> unas horas en propagarse).
>
> **Requisitos:** [Nivel 1](01-nube-github-y-ci.md) (Supabase en la nube).

## Por qué hace falta

Supabase trae un servicio de email "de cortesía" que **solo sirve para pruebas**
([docs](https://supabase.com/docs/guides/auth/auth-smtp)), sept. 2026, compruébalo:

- **Solo entrega a los miembros de tu equipo** en Supabase (tu propio email). A cualquier otra
  persona, no le llega nada.
- **Máximo 2 emails por hora** en todo el proyecto.
- Sin garantías de entrega: puede acabar en spam.

Resultado: con usuarios reales, "confirma tu email" y "olvidé mi contraseña" **fallan en
silencio**. La solución es darle a Supabase un **SMTP propio**.

## Conceptos en una frase

- **SMTP:** el "idioma" estándar para enviar emails. Supabase sabe hablarlo con cualquier
  proveedor si le das servidor, usuario y contraseña.
- **Resend:** un proveedor de envío de emails pensado para desarrolladores: te da un servidor SMTP
  y una API sencilla.
- **Dominio propio:** tu dirección en internet (`tuapp.com`). Necesario para enviar emails "desde"
  ti; no puedes enviar como `@gmail.com`.
- **DNS:** la "agenda" pública de tu dominio. Añadiendo unas líneas, demuestras que Resend puede
  enviar en tu nombre.
- **SPF, DKIM y DMARC:** tres registros DNS que Gmail, Outlook, etc. comprueban para decidir si
  tu email es legítimo o spam. Resend te dice exactamente qué poner.
- **Email transaccional:** el que se envía por algo que ha pasado (registro, aviso, recibo), no
  publicidad.

## Límites de Resend Free (sept. 2026, compruébalo)

Según su [documentación de cuotas](https://resend.com/docs/knowledge-base/account-quotas-and-limits):
3.000 emails/mes, **100 al día** (se reinicia a medianoche UTC), hasta 3 dominios verificados,
10 peticiones por segundo y 30 días de historial. Al llegar al límite, **deja de enviar** (no
cobra). Si tu app crece y se registran más de ~80 personas al día, necesitarás Pro (~20 $/mes,
50.000 emails).

---

## Parte A — SMTP propio para Supabase Auth

### 1. Compra un dominio

Si ya tienes uno, sáltate este paso. Si no:

- **Dónde:** [Cloudflare Registrar](https://www.cloudflare.com/products/registrar/) (vende a
  precio de coste y su DNS es muy fácil), Namecheap, DonDominio, IONOS… Un `.com` o `.es` cuesta
  ~10–15 €/año (sept. 2026, compruébalo). Ojo con las ofertas de "1 € el primer año": mira el precio
  de **renovación**.
- **Consejo:** activa la **renovación automática**. Si el dominio caduca, tu app deja de enviar
  emails.

### 2. Crea tu cuenta de Resend y añade el dominio

1. Regístrate en [resend.com](https://resend.com).
2. **Domains → Add Domain.** Te recomendamos usar un **subdominio** para enviar, por ejemplo
   `mail.tuapp.com`: así, si algún día hay problemas de reputación con los envíos, no afectan al
   correo normal de `tuapp.com`.
3. **Region:** elige **Ireland (eu-west-1)** si aparece la opción (datos en la UE).
4. Resend te enseñará una tabla con 3–4 registros DNS (tipo `MX` y `TXT`, para SPF y DKIM).

### 3. Añade los registros DNS

Ve al panel de tu dominio (Cloudflare, Namecheap…) → **DNS** y crea **cada registro exactamente**
como lo indica Resend (tipo, nombre y valor). Si tu dominio está en Cloudflare, Resend puede
hacerlo solo con el botón de configuración automática.

Añade también un registro **DMARC** (le dice a Gmail qué hacer con emails que finjan ser tuyos).
Para empezar, en modo "solo observar":

| Tipo  | Nombre                                           | Valor               |
| ----- | ------------------------------------------------ | ------------------- |
| `TXT` | `_dmarc` (o `_dmarc.mail` si usas el subdominio) | `v=DMARC1; p=none;` |

Vuelve a Resend y pulsa **Verify DNS Records**. Cuando todo esté en **Verified** (verde), sigue.
Si tarda, espera y reintenta: los cambios DNS pueden tardar en propagarse.

### 4. Crea una API key para Supabase

**API Keys → Create API Key:**

- **Name:** `supabase-auth-smtp`.
- **Permission:** _Sending access_ (solo enviar).
- **Domain:** tu dominio (limitarla a él es más seguro).

Copia la clave (empieza por `re_`). Es **secreta** y Resend no te la vuelve a enseñar. No la
guardes en el repo ni en `.env`: la pegarás directamente en Supabase en el paso siguiente.

### 5. Configura el SMTP en Supabase

En el dashboard de Supabase: **Authentication → Emails → SMTP Settings** (el nombre exacto del
menú puede variar un poco) → activa **Enable custom SMTP** y rellena:

| Campo        | Valor                                                 |
| ------------ | ----------------------------------------------------- |
| Sender email | `no-responder@mail.tuapp.com` (tu dominio verificado) |
| Sender name  | El nombre de tu app                                   |
| Host         | `smtp.resend.com`                                     |
| Port         | `465` (SSL directo; si diera problemas, `587`)        |
| Username     | `resend`                                              |
| Password     | la API key del paso 4                                 |

Guarda.

**Ajusta el límite de envío.** Al activar SMTP propio, Supabase pone un límite prudente
(unos 30 emails/hora). Revísalo en **Authentication → Rate Limits** y súbelo si lo necesitas,
sin pasarte de lo que permite tu plan de Resend (100 al día en Free).

### 6. Traduce las plantillas

En **Authentication → Emails → Templates** tienes un email por situación (confirmar registro,
recuperar contraseña, cambio de email, enlace mágico, invitación). Vienen en inglés. Cambia al
menos **Confirm signup** y **Reset password**. Ejemplo para _Confirm signup_:

- **Subject:** `Confirma tu cuenta en Tu App`
- **Body:**

```html
<h2>¡Hola!</h2>
<p>Gracias por registrarte en <strong>Tu App</strong>. Para activar tu cuenta, pulsa aquí:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar mi cuenta</a></p>
<p>Si no has sido tú, ignora este mensaje.</p>
```

Y para _Reset password_:

- **Subject:** `Recupera tu contraseña de Tu App`
- **Body:**

```html
<h2>¿Has olvidado tu contraseña?</h2>
<p>Pulsa aquí para elegir una nueva:</p>
<p><a href="{{ .ConfirmationURL }}">Cambiar mi contraseña</a></p>
<p>Si no lo has pedido tú, ignora este mensaje: tu contraseña no cambia.</p>
```

No borres `{{ .ConfirmationURL }}`: es el enlace mágico que genera Supabase.

> En local no necesitas nada de esto: todos los emails de Supabase local se quedan en **Mailpit**,
> en [http://127.0.0.1:54424](http://127.0.0.1:54424). Ahí ves lo que se "enviaría" sin mandar
> nada de verdad.

### 7. Activa "Confirm email"

**Authentication → Sign In / Providers → Email → Confirm email: activado.** Si lo desactivaste en
el nivel 1 para dejar entrar a amigos, este es el momento de volver a activarlo. La app ya está
preparada: `signUp` (en `src/api/auth.ts`) detecta que hace falta confirmar y se lo dice al
usuario.

---

## Parte B — Emails propios desde una Edge Function

Los emails de login los manda Supabase Auth. Para **tus** emails (bienvenida, "te han compartido
una nota", avisos…) se usa una **Edge Function** que llama a la API de Resend. La API key vive en
el servidor, nunca en la app.

El ejemplo: un **email de bienvenida** que se envía cuando se crea el perfil de un usuario nuevo.

> ¿Merece la pena? Con "Confirm email" activado, el usuario recibirá dos emails seguidos (el de
> confirmar y el de bienvenida). Si solo quieres uno, basta con dar un tono de bienvenida a la
> plantilla de confirmación (paso 6) y saltarte esta parte. Aun así, este es **el patrón** que
> usarás para cualquier email propio.

### Cómo encaja

```
Usuario se registra → trigger crea fila en public.profiles
  → Database Webhook de Supabase (con cabecera secreta)
    → Edge Function send-welcome-email
      → busca el email del usuario en el servidor
        → API de Resend → bandeja de entrada
```

**Seguridad:** la función **no** la puede llamar la app. Se configura con `verify_jwt = false`
(el webhook no trae sesión de usuario), así que se protege con un **secreto compartido**: solo
quien conozca `WEBHOOK_SECRET` puede dispararla. Y el destinatario se saca del servidor, nunca de
lo que llegue en la petición: así nadie puede usarla para mandar spam.

### 1. Crea otra API key en Resend

Igual que en la Parte A, paso 4, pero llamada `edge-functions`. Tener claves separadas te permite
revocar una sin romper la otra.

### 2. Crea los secretos de la función

Genera un secreto aleatorio para el webhook:

```bash
openssl rand -hex 32
```

Crea (o edita) el archivo `supabase/functions/.env`, que **ya está en `.gitignore`**, con los tres
valores (todos **secretos** excepto `EMAIL_FROM`, que no es delicado):

```dotenv
RESEND_API_KEY=re_tu_clave_de_edge_functions
WEBHOOK_SECRET=el_valor_que_te_ha_dado_openssl
EMAIL_FROM=Tu App <hola@mail.tuapp.com>
```

Súbelos a Supabase en la nube:

```bash
npx supabase secrets set --env-file supabase/functions/.env
```

(Usar el archivo evita que la clave quede en el historial de la terminal. Los nombres no pueden
empezar por `SUPABASE_`: ese prefijo está reservado.) Comprueba que están (solo verás los nombres
y un resumen, no los valores):

```bash
npx supabase secrets list
```

### 3. Crea la función

Crea `supabase/functions/send-welcome-email/index.ts`:

```ts
// ════════════════════════════════════════════════════════════════════════════════════════════
// Edge Function `send-welcome-email`: envía el email de bienvenida a un usuario nuevo.
//
// Quién la llama: un Database Webhook de Supabase al insertarse una fila en public.profiles
// (la crea el trigger `handle_new_user` al registrarse alguien). La app NO la llama.
//
// Seguridad:
//   · verify_jwt = false (el webhook no trae sesión), así que exigimos la cabecera
//     `x-webhook-secret` igual al secreto WEBHOOK_SECRET.
//   · El destinatario lo buscamos en auth.users con el id del perfil. Nunca aceptamos un email
//     que venga en la petición (evita que usen la función para mandar spam).
//   · RESEND_API_KEY solo existe aquí, en el servidor (INV-SEC-1).
//
// Secretos:   npx supabase secrets set --env-file supabase/functions/.env
// Desplegar:  npx supabase functions deploy send-welcome-email
// Guía:       docs/graduacion/04-emails-con-resend.md
// ════════════════════════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

// Lo que envía un Database Webhook de Supabase en un INSERT.
type ProfileRecord = { id: string; display_name: string };
type WebhookPayload = {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: ProfileRecord | null;
  old_record: ProfileRecord | null;
};

const RESEND_API_URL = 'https://api.resend.com/emails';
const APP_NAME = 'Tu App';

// Compara sin filtrar por tiempo cuántos caracteres coinciden (buena práctica con secretos).
function safeEqual(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a);
  const y = new TextEncoder().encode(b);
  if (x.length !== y.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < x.length; i++) {
    diff |= x[i] ^ y[i];
  }
  return diff === 0;
}

// El nombre lo escribe el usuario: hay que escaparlo antes de meterlo en HTML.
function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const webhookSecret = Deno.env.get('WEBHOOK_SECRET');
  const resendApiKey = Deno.env.get('RESEND_API_KEY');
  const emailFrom = Deno.env.get('EMAIL_FROM');
  if (!webhookSecret || !resendApiKey || !emailFrom) {
    console.error('send-welcome-email: faltan secretos (revisa `npx supabase secrets list`)');
    return json({ error: 'Función sin configurar' }, 500);
  }

  // 1) ¿Viene del webhook? Sin el secreto correcto, fuera.
  const received = req.headers.get('x-webhook-secret') ?? '';
  if (!safeEqual(received, webhookSecret)) {
    return json({ error: 'No autorizado' }, 401);
  }

  // 2) ¿Es un perfil nuevo?
  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'JSON no válido' }, 400);
  }
  if (payload.type !== 'INSERT' || payload.table !== 'profiles' || !payload.record) {
    return json({ ok: true, skipped: true });
  }
  const { id: userId, display_name: displayName } = payload.record;

  // 3) El email lo sacamos de auth.users (servidor), nunca de la petición.
  //    Estas variables las inyecta Supabase automáticamente.
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { data, error: userError } = await admin.auth.admin.getUserById(userId);
  const email = data.user?.email;
  if (userError || !email) {
    console.error('send-welcome-email: usuario sin email', userId, userError?.message);
    return json({ error: 'Usuario no encontrado' }, 404);
  }

  // 4) Montamos el email (versión HTML + texto plano).
  const name = displayName.trim();
  const greeting = name ? `¡Hola, ${name}!` : '¡Hola!';
  const subject = `Bienvenido/a a ${APP_NAME}`;
  const text = [
    greeting,
    '',
    `Gracias por unirte a ${APP_NAME}. Ya puedes empezar a crear tus notas.`,
    '',
    'Si tienes cualquier duda, responde a este correo.',
  ].join('\n');
  const html = `
    <h2>${escapeHtml(greeting)}</h2>
    <p>Gracias por unirte a <strong>${APP_NAME}</strong>. Ya puedes empezar a crear tus notas.</p>
    <p>Si tienes cualquier duda, responde a este correo.</p>
  `;

  // 5) Enviamos con la API de Resend.
  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
      // Si el webhook se repite, Resend no manda el email dos veces (válido 24 h).
      'Idempotency-Key': `welcome-${userId}`,
    },
    body: JSON.stringify({ from: emailFrom, to: [email], subject, html, text }),
  });

  if (!res.ok) {
    // No registramos el email del usuario en los logs (dato personal): solo su id.
    const detail = await res.text();
    console.error('send-welcome-email: Resend respondió', res.status, detail, userId);
    return json({ error: 'No se pudo enviar el email' }, 502);
  }

  const { id } = await res.json();
  return json({ ok: true, id });
});
```

### 4. Declárala en `supabase/config.toml`

Añade al final, junto a la de `delete-account`:

```toml
[functions.send-welcome-email]
enabled = true
# El webhook no trae sesión de usuario; la función se protege con WEBHOOK_SECRET.
verify_jwt = false
```

### 5. Despliégala

```bash
npx supabase functions deploy send-welcome-email
```

(A partir de ahora, si tienes el nivel 1 completo, `deploy-supabase.yml` la redesplegará sola
cada vez que mergees cambios en `supabase/`.)

### 6. Crea el Database Webhook

En el dashboard de Supabase: **Integrations → Database Webhooks** (en versiones anteriores,
_Database → Webhooks_). Si te pide activar la integración, acéptalo. Luego **Create a new hook**:

- **Name:** `bienvenida`
- **Table:** `profiles` (esquema `public`)
- **Events:** solo **Insert**
- **Type:** _Supabase Edge Functions_ → función `send-welcome-email`, método `POST`
- **HTTP Headers:** añade `x-webhook-secret` con el valor de tu `WEBHOOK_SECRET`. No hace falta
  pulsar "Add auth header with service key".

Guarda.

> Este webhook vive **solo en la nube** (no está en `supabase/migrations/`). Si algún día creas
> otro proyecto (por ejemplo, staging en el nivel 10), tendrás que crearlo también allí. Guardarlo
> como migración sin meter el secreto en el repo es posible (con Supabase Vault), pero es más
> avanzado: pídeselo a Claude cuando lo necesites.

### 7. (Opcional) Probarla en local

En local, los secretos se leen de `supabase/functions/.env`. Arranca las funciones:

```bash
npx supabase functions serve
```

En otra terminal, simula el webhook con el id de un usuario que exista en tu base local
(lo ves en Studio, [http://127.0.0.1:54423](http://127.0.0.1:54423), tabla `profiles`):

```bash
curl -i -X POST http://127.0.0.1:54421/functions/v1/send-welcome-email -H "Content-Type: application/json" -H "x-webhook-secret: TU_WEBHOOK_SECRET" -d '{"type":"INSERT","table":"profiles","schema":"public","record":{"id":"UUID_DEL_USUARIO","display_name":"Ana"},"old_record":null}'
```

Ojo: esto **sí** envía un email real a través de Resend (la función no pasa por Mailpit). Hazlo
con un usuario local registrado con tu propio email. Si quieres crear el webhook también en local,
la URL es `http://host.docker.internal:54421/functions/v1/send-welcome-email`.

---

## ✅ Cómo sé que ha funcionado

- [ ] En Resend → **Domains**, tu dominio aparece como **Verified**.
- [ ] Te registras en la app con un email que **no** es miembro de tu equipo de Supabase (por
      ejemplo, el de un familiar) y le llega el email de confirmación, en castellano y desde tu
      dominio.
- [ ] Ese email **no** está en spam. (Si lo está, revisa DMARC/SPF/DKIM.)
- [ ] "¿Has olvidado tu contraseña?" envía el email y el enlace abre la app.
- [ ] En Resend → **Emails** ves los envíos con estado _Delivered_.
- [ ] (Parte B) Al registrarse alguien, le llega el email de bienvenida. En Supabase →
      **Edge Functions → send-welcome-email → Logs** ves la llamada con estado 200.
- [ ] (Parte B) Una llamada sin la cabecera secreta devuelve **401**.

## 🧯 Problemas típicos

- **"Error sending confirmation email" al registrarse:** datos SMTP incorrectos. Revisa usuario
  `resend`, host `smtp.resend.com`, que la contraseña es la API key completa y que el _Sender
  email_ es de un dominio **verificado** en Resend. Prueba el puerto `587` si `465` falla.
- **"Email rate limit exceeded":** has superado el límite de **Authentication → Rate Limits** de
  Supabase o los 100/día de Resend Free.
- **El email llega pero el enlace abre una web en blanco:** revisa Site URL y Redirect URLs (nivel
  1, paso 7). Si hiciste `npm run rename`, el esquema ya no es `lienzo://`.
- **El dominio no se verifica:** errores típicos al copiar DNS: algunos paneles añaden tu dominio al
  final del nombre (acabas con `resend._domainkey.tuapp.com.tuapp.com`). Copia solo la parte que te
  diga el panel. Y espera: puede tardar horas.
- **Los emails van a spam:** falta DMARC, o SPF/DKIM no están verificados. Evita asuntos tipo
  "¡¡GRATIS!!" y añade siempre versión de texto.
- **Antes de tener dominio, Resend solo deja enviar desde `onboarding@resend.dev`** y únicamente
  a tu propio email. Sirve para una prueba rápida, no para usuarios.
- **La función devuelve 401:** la cabecera del webhook no coincide con `WEBHOOK_SECRET` (¿espacios
  al copiar?). Si cambias el secreto, actualízalo en los dos sitios.
- **La función devuelve 500 "Función sin configurar":** faltan secretos en la nube.
  `npx supabase secrets list` y repite el paso 2.
- **La función devuelve 401 aunque la cabecera esté bien:** comprueba que `verify_jwt = false` está
  en `config.toml` **antes** de desplegar; si no, Supabase exige un JWT de usuario. Vuelve a
  desplegar.

## Pedírselo a Claude

```
/graduar 04
```

Para emails propios, usa la skill **`/enviar-email`**:

```
/enviar-email bienvenida al registrarse
```

O pega algo así:

> Ya tengo el dominio verificado en Resend y el SMTP configurado en Supabase. Crea la Edge Function
> send-welcome-email siguiendo docs/graduacion/04-emails-con-resend.md, añádela a config.toml y dime
> qué secretos tengo que subir yo. No me pidas que te pegue la API key.

> Quiero que el email de bienvenida se envíe cuando el usuario confirme su email, no al
> registrarse. ¿Cómo lo cambiamos?

## Documentación oficial

- [Supabase: SMTP propio](https://supabase.com/docs/guides/auth/auth-smtp)
- [Supabase: plantillas de email](https://supabase.com/docs/guides/auth/auth-email-templates)
- [Supabase: límites de Auth](https://supabase.com/docs/guides/auth/rate-limits)
- [Supabase: Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Supabase: secretos de Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Resend: SMTP](https://resend.com/docs/send-with-smtp)
- [Resend: API de envío](https://resend.com/docs/api-reference/emails/send-email)
- [Resend: con Supabase](https://resend.com/docs/send-with-supabase-smtp)
- [Resend: cuotas y límites](https://resend.com/docs/knowledge-base/account-quotas-and-limits)
