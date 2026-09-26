---
name: anti-hackeo
description: Auditoría de seguridad completa pensando como un atacante - cuentas y contraseñas del dueño, claves filtradas (también en el historial de git), base de datos atacada sin sesión y entre usuarios, login y spam, Edge Functions, archivos, dependencias, abuso que cuesta dinero y plan si te hackean. Usa pruebas reales (npm run check:ataque), no suposiciones. Úsala antes de enseñar la app a desconocidos, antes de publicar, tras tocar login/permisos/pagos, o cuando pregunten "¿me pueden hackear?". Modo "cambio" para revisar solo un diff.
argument-hint: '[vacío = auditoría completa | cambio | tema concreto]'
---

# Anti-hackeo

Alcance: $ARGUMENTS (vacío = auditoría completa; `cambio` = solo lo que cambia la rama actual
respecto a `main`, secciones 2-6).

La persona dueña no es técnica. **Informe primero, arreglos después y solo con su OK.** Cada
hallazgo se explica con **cómo lo aprovecharía alguien, en una frase de la vida real** ("cualquiera
que descargue tu app podría leer las notas de todos tus usuarios"). Nada de alarmismo: separa lo
grave de lo teórico.

## 0. Modelo de amenazas (explícaselo en 5 líneas al empezar)

Quién ataca de verdad a una app pequeña:

1. **Bots** que crean cuentas basura o envían spam a tus formularios.
2. **Un usuario curioso** que abre tu app, saca la _publishable key_ (es pública) y habla con tu
   API directamente, saltándose tus pantallas. Por eso la seguridad está en la base de datos (RLS).
3. **Alguien que roba tu contraseña** de Supabase, GitHub, Expo o tu email. Es la forma más
   común de que te hackeen, y no tiene nada que ver con el código.
4. **Abuso que cuesta dinero**: alguien que llama mil veces a una función que paga por uso (IA,
   emails, SMS) o sube gigas de archivos.
5. **Una dependencia maliciosa o vulnerable** instalada sin mirar.

## 1. Cuentas del dueño (lo primero; no se ve en el código)

Pregúntale y marca cada punto. Tú no puedes comprobarlo: guíale para que lo haga él.

- [ ] **Verificación en dos pasos (2FA)** activada en: su **email** (el primero: recupera todo lo
      demás), **GitHub**, **Supabase**, **Expo**, y Apple/Google Developer si los tiene. Con app de
      autenticación o llave, mejor que SMS.
- [ ] Contraseñas distintas y guardadas en un **gestor de contraseñas** (Bitwarden es gratis).
- [ ] La _Database password_ de Supabase guardada en el gestor, no en un archivo ni en el chat.
- [ ] Nadie más tiene acceso a sus proyectos (Supabase → Organization → Members; GitHub → Settings →
      Collaborators). Tokens de acceso viejos revocados (supabase.com/dashboard/account/tokens, GitHub →
      Settings → Developer settings, expo.dev → Access tokens).

## 2. Claves y secretos

```bash
npm run check:secrets
```

- Busca también en el **historial** de git (una clave borrada sigue ahí):
  `git log -p --all -S "sb_secret_"`, y lo mismo con `service_role`, `sk_live_`, `re_` (Resend),
  `-----BEGIN`. Si el repo es público o está en GitHub, trátalo como filtrado.
- `.env` sin claves secretas (solo `EXPO_PUBLIC_*`); secretos de servidor en
  `npx supabase secrets list` (lista nombres, no valores), EAS o GitHub.
- **Si una clave se filtró: rotarla YA** (borrarla del código no basta). Supabase → Project
  Settings → API Keys → crear una secret key nueva y borrar la vieja; en otros servicios, igual.
  Después, actualizar donde se use (secrets de Supabase/GitHub/EAS).

## 3. Base de datos: el atacante con la publishable key

**3a. Sin sesión (automático):**

```bash
npm run check:ataque
```

Intenta leer y escribir en todas las tablas, llamar a las funciones SQL y a las Edge Functions
sin login, y listar archivos. Todo ❌ es un agujero real: explícalo y propón la migración que lo
cierra (RLS, `revoke all … from anon`, `revoke execute on function … from anon`). Con base local,
además `npm run check:rls`.

**3b. Entre usuarios (manual, lo importante):** con **dos cuentas de prueba** (A y B) en la base de
**desarrollo**, para cada tabla con datos de usuario, comprueba desde B, llamando a la API como lo
haría un atacante (un script de un solo uso con `@supabase/supabase-js` en la carpeta de scratch,
iniciando sesión como B; nunca con la secret key):

- [ ] B **no lee** filas de A (`select` por id de A → vacío).
- [ ] B **no edita ni borra** filas de A (`update`/`delete` con `eq('id', idDeA)` → 0 filas).
- [ ] B **no crea filas a nombre de A** (`insert` con `user_id: idDeA` → error).
- [ ] B **no se "roba" una fila** cambiando su `user_id` (policy de update con `with check`).
- [ ] B **no edita columnas protegidas** de su propia fila (rol, saldo, `is_premium`, contadores):
      si existen, deben estar en otra tabla escrita solo por el servidor o protegidas con
      `grant update (col1, col2)` por columna.
- [ ] Si hay **datos compartidos** (grupos, amigos, chats): B ve solo lo de sus grupos; al salir de
      un grupo deja de verlo; no puede añadirse a sí mismo a un grupo ajeno.
- [ ] Funciones `security definer`: no reciben un `user_id` que el cliente pueda falsear (usan
      `auth.uid()`), tienen `set search_path = ''` y `revoke execute … from anon` si no son públicas.

Si no hay forma rápida de probar un caso, léelo en la migración y explica tu conclusión.
**Borra las cuentas de prueba al terminar** (desde la app: Perfil → Borrar mi cuenta).

## 4. Login y registro

- [ ] Contraseñas de **mínimo 8** caracteres (`supabase/config.toml` y Dashboard → Authentication →
      Policies/Password). La protección contra contraseñas filtradas (HaveIBeenPwned) es de planes
      de pago: dilo, no la exijas.
- [ ] **Antes de enseñar la app a desconocidos o publicar**: activar _Confirm email_ (con SMTP
      propio, nivel 4) y **CAPTCHA** en el registro (Cloudflare Turnstile, gratis) para frenar bots.
- [ ] Límites de intentos: Dashboard → Authentication → Rate Limits (revisar que no estén abiertos).
- [ ] Al cerrar sesión se borra la caché local (ya lo hace `useAuthListener`) y **borrar cuenta**
      borra todo lo del usuario (FK `on delete cascade` + archivos de Storage).
- [ ] Mensajes de error que no dicen si un email existe (en recuperar contraseña ya es así).

## 5. Edge Functions

Para cada función en `supabase/functions/`:

- [ ] `verify_jwt = true` en `config.toml`, salvo webhooks externos, que entonces **verifican la
      firma** o un secreto compartido en cabecera.
- [ ] El usuario sale del **token** (`auth.getUser()`), nunca de un id del body (INV-SEC-3).
- [ ] Valida la entrada (tipos, longitudes); no mete texto del usuario en SQL crudo, HTML ni prompts
      de IA sin control.
- [ ] Si llama a algo **de pago**: límite por usuario y por día (tabla de uso), y límite de gasto en
      el proveedor.
- [ ] Los errores al cliente no filtran detalles internos ni claves.

## 6. Archivos (Storage) y app

- [ ] Buckets **privados** salvo contenido de verdad público; policies por carpeta del usuario;
      **límite de tamaño y tipos** en el bucket (`file_size_limit`, `allowed_mime_types`).
- [ ] La app no contiene secretos (ver 2), no carga URLs arbitrarias en WebViews, no ejecuta
      acciones peligrosas desde un enlace profundo (`lienzo://…`) sin confirmación, y no registra datos
      personales en logs ni analítica (INV-PRIV-1).
- [ ] Ofuscar la app **no** es seguridad: todo lo que va en la app se considera público.

## 7. Dependencias

- `npm audit --omit=dev`: explica que muchos avisos son de herramientas de desarrollo y no llegan
  a la app; céntrate en los de producción con severidad alta/crítica. Arreglo: `npx expo install --fix`
  o actualizar esa dependencia (con `/actualizar-expo` si es de Expo).
- Paquetes nuevos: solo conocidos (muchas descargas semanales, mantenidos, repo público). Desconfía
  de nombres parecidos a otros famosos.

## 8. Abuso, costes y copias de seguridad

- Plan Free de Supabase: al pasarte de los límites se **restringe**, no te cobra. En planes de pago,
  mantener el **límite de gasto** (spend cap) activado.
- Spam de contenido (si hay cosas públicas o compartidas): límite de publicaciones por usuario, y
  opción de reportar/bloquear si es una app social.
- Copias de seguridad: el plan Free no las ofrece descargables. Con usuarios reales, copia periódica
  (`npx supabase db dump --linked -f copia.sql`, guardada fuera del repo) o plan Pro (nivel 10).

## 9. Si te hackean (déjale esto claro y corto)

1. Cambia la contraseña de la cuenta afectada y cierra sesiones abiertas; activa 2FA.
2. **Rota todas las claves secretas** (Supabase, Resend, etc.) y revoca tokens.
3. Si hay datos de usuarios expuestos: pausa el proyecto si hace falta, averigua qué se vio, y en la
   UE hay que **notificarlo a la AEPD en 72 h** si afecta a datos personales (y a los usuarios si
   el riesgo es alto). Pide ayuda: no es algo para improvisar.

## Informe final

1. **Semáforo** por sección (🟢 bien · 🟡 mejorable · 🔴 agujero).
2. **Hallazgos** ordenados por gravedad: qué pasa · cómo lo aprovecharía alguien (una frase) ·
   archivo o panel · arreglo propuesto · ¿lo hago?
3. **Checklist de cuentas** (sección 1) con lo que queda pendiente para él.
4. Arreglos de base de datos siempre como **migración nueva** (`/nueva-tabla`), probada con
   `npm run check:ataque` otra vez. Si hay algo 🔴 en una app ya publicada, es lo primero de todo.
