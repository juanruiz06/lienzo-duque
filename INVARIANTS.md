# INVARIANTS.md — Reglas duras

Reglas **verificables** que no se rompen sin una decisión explícita y documentada. Cada una dice
qué es, **por qué existe** (qué pasa si la rompes) y **cómo comprobarla**. Un agente las revisa
contra el diff antes de abrir un PR (skill `/preparar-pr`), y el CI comprueba las automatizables.

Formato del ID: `INV-<área>-<n>`. Si rompes una a propósito, dilo en el PR y explica por qué.

Comprobación rápida de todo lo automatizable:

```bash
npm run check
npm run check:secrets
npm run check:ataque
npm run check:rls
```

---

## Seguridad y secretos

### INV-SEC-1 — La app nunca contiene claves secretas

`src/` solo usa valores `EXPO_PUBLIC_*`, que son **públicos**: cualquiera puede desempaquetar la
app y leerlos. La service-role / secret key de Supabase (`sb_secret_…`), las API keys de Resend,
Stripe, OpenAI, etc. viven SOLO en el servidor: Edge Functions (`npx supabase secrets set`),
secrets de EAS o secrets de GitHub.

- **Por qué:** la service-role se salta todo el RLS. En la app = base de datos abierta al mundo.
  Una API key de pago en la app = factura ajena a tu nombre.
- **Verificar:** `npm run check:secrets` (también en CI).

### INV-SEC-2 — Ningún secreto se commitea

`.env` está en `.gitignore`. `.env.example` lleva solo **nombres** de variables, sin valores.

- **Por qué:** lo que entra en git se queda en el historial para siempre, aunque lo borres después.
  Si pasa: **rota la clave** (genera otra y anula la vieja), no basta con borrarla.
- **Verificar:** `npm run check:secrets`.

### INV-SEC-3 — El servidor decide quién es el usuario

Las Edge Functions obtienen el usuario del **token** (`supabase.auth.getUser()` con la cabecera
`Authorization`), nunca de un `user_id` que mande la app en el body. Igual en SQL: `user_id` se
rellena con `default auth.uid()` y las policies comparan con `(select auth.uid())`.

- **Por qué:** cualquiera puede llamar a tu API con el `user_id` que quiera.
- **Verificar:** revisión del diff (ver `supabase/functions/delete-account/index.ts` como modelo).

---

## Base de datos

### INV-DB-1 — Toda tabla de `public` tiene RLS activado

`alter table public.<tabla> enable row level security;` en la misma migración que la crea, con
policies explícitas para cada operación que se permita.

- **Por qué:** sin RLS, cualquiera con la publishable key (que está en la app) lee y escribe la tabla entera.
- **Verificar:** `npm run check:rls` (también en CI).

### INV-DB-2 — Permisos explícitos; `anon` no recibe nada por defecto

Cada tabla nueva lleva sus `grant … to authenticated` y `revoke all on public.<tabla> from anon;`.
Si una tabla debe ser legible sin sesión (un catálogo público), se añade a `PUBLIC_TABLES` en
`scripts/check-rls.sh` y se justifica en el PR.

- **Por qué:** Supabase está cambiando cómo expone las tablas nuevas a la API; siendo explícitos
  el comportamiento es el mismo en local y en la nube, hoy y mañana.
- **Verificar:** `npm run check:rls`.

### INV-DB-3 — Policies `to authenticated` con `(select auth.uid())`

- **Por qué:** `to authenticated` evita evaluar la policy para visitantes sin sesión.
  `(select auth.uid())` hace que Postgres lo calcule una vez por consulta y no una vez por fila
  (con miles de filas, la diferencia es enorme).
- **Verificar:** `npm run check:rls`.

### INV-DB-4 — Las migraciones solo se añaden, nunca se editan

Una migración que ya se aplicó en la nube (o que otra persona ya tiene) no se toca. Para cambiar
algo: migración nueva (`npm run db:new -- <nombre>`).

- **Por qué:** la nube no vuelve a ejecutar migraciones viejas; si la editas, tu local y la nube
  divergen en silencio.
- **Verificar:** en el diff de un PR, `git diff --name-status origin/main -- supabase/migrations`
  solo debe mostrar archivos `A` (añadidos), nunca `M` (modificados).

### INV-DB-5 — Funciones `security definer` fijan `search_path`

Toda función `security definer` lleva `set search_path = ''` y usa nombres completos
(`public.profiles`).

- **Por qué:** se ejecutan con permisos de administrador; sin `search_path` fijo, alguien podría
  colar un objeto con el mismo nombre y secuestrarla.
- **Verificar:** `npm run check:rls`.

### INV-DB-6 — Los tipos generados están al día

Tras cambiar el esquema: `npm run db:types` y commit de `src/types/database.ts`.

- **Por qué:** si no, TypeScript no sabe que la columna existe (o que ya no existe) y el error sale en producción.
- **Verificar:** job `database` del CI.

### INV-DB-7 — Nunca mutar la base de la nube a mano

Los cambios de esquema en la nube entran por migración (`npm run db:push` o el workflow de
deploy). Nada de crear tablas desde el dashboard ni scripts ad-hoc con la service-role.

- **Por qué:** lo que se hace a mano no queda en el repo → la siguiente persona (o Claude) no lo
  sabe, la base local no lo tiene y los tipos mienten.
- **Verificar:** revisión humana. `npx supabase db diff --linked` debería salir vacío.

---

## Arquitectura

### INV-ARCH-1 — Pantallas y componentes no hablan con Supabase

Flujo obligatorio: `src/app` → `src/hooks` → `src/api` → Supabase.

- **Por qué:** un solo sitio donde cambiar cómo se leen los datos, donde validarlos y donde testearlos.
- **Verificar:** `npm run lint` (regla `no-restricted-imports` en `eslint.config.js`).

### INV-ARCH-2 — El estado del servidor vive en React Query

Datos que vienen de Supabase se leen con hooks de React Query, no se copian a `useState` ni a
Zustand. Tras escribir, se invalida la clave correspondiente de `queryKeys`.

- **Por qué:** dos copias del mismo dato acaban desincronizadas ("he guardado pero la lista no cambia").
- **Verificar:** revisión del diff.

### INV-ARCH-3 — Dependencias con `npx expo install`

- **Por qué:** elige la versión compatible con el SDK de Expo. Una versión incompatible compila
  pero revienta en el móvil.
- **Verificar:** `npx expo install --check`.

---

## UI y experiencia

### INV-UI-1 — Colores y tamaños salen del tema

En `src/app/` y `src/components/` no hay colores literales (`'#fff'`, `'red'`, `rgb(…)`): se usa
`useTheme()` y los tokens de `src/theme/tokens.ts`.

- **Por qué:** el modo oscuro y cualquier cambio de marca dependen de ello.
- **Verificar:**
  ```bash
  grep -rnE "#[0-9a-fA-F]{3,8}\b|'(white|black|red|blue|green)'|rgba?\(" src/app src/components && echo "VIOLACIÓN" || echo OK
  ```

### INV-UI-2 — El usuario nunca ve un error técnico

Los errores se muestran con `toUserMessage(error)`. Toda pantalla con datos cubre los estados
cargando / error (con reintentar) / vacío / datos.

- **Verificar:** revisión del diff.

### INV-UI-3 — Accesibilidad básica

Todo lo pulsable tiene `accessibilityRole` y `accessibilityLabel` y mide al menos 44 pt.

- **Verificar:** revisión del diff (skill `/pulir-ui`).

---

## Tiendas y privacidad

### INV-STORE-1 — Se puede borrar la cuenta desde la app

Perfil → "Borrar mi cuenta" → Edge Function `delete-account`. Toda tabla nueva con datos de
usuario referencia `auth.users` con `on delete cascade` (o se limpia explícitamente).

- **Por qué:** Apple y Google lo exigen; sin ello rechazan la app.
- **Verificar:** crea un usuario de prueba, crea datos, bórralo y comprueba en Studio
  (http://127.0.0.1:54423) que no queda nada suyo.

### INV-PRIV-1 — La analítica no lleva datos personales

`trackEvent` solo recibe propiedades del catálogo `AppEvents` y nunca emails, nombres, teléfonos
ni texto escrito por el usuario. A PostHog/Sentry se les identifica solo con el `user.id` (UUID).

- **Por qué:** RGPD. Y porque lo declaras en las fichas de privacidad de las tiendas.
- **Verificar:** revisión de `src/observability/analytics.ts` en el diff.
