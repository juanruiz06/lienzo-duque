# Nivel 1 — Supabase en la nube, GitHub y CI

> **Qué consigues:** tu base de datos y tu login viven en internet (la app funciona en cualquier
> móvil, con cualquier wifi o con datos), tu código está a salvo en GitHub y cada cambio pasa
> por comprobaciones automáticas antes de entrar en `main`.
>
> **Cuánto cuesta:** 0 €. Supabase Free + GitHub Free. (Opcional: GitHub Pro ~4 $/mes si quieres
> que las reglas de rama se apliquen en un repo privado; ver paso 12.)
>
> **Cuándo hacerlo:** cuando quieras enseñar la app a otra persona, probarla en tu móvil fuera
> de casa o, simplemente, tener tu trabajo guardado fuera de tu ordenador.
>
> **Tiempo estimado:** 45–75 minutos la primera vez.
>
> **Requisitos:** Nivel 0 funcionando (`npm run doctor` sin ❌ y la app arrancando en local).

## Conceptos en una frase

- **Proyecto de Supabase en la nube:** lo mismo que tienes en local (Postgres + Auth + Edge
  Functions), pero en un servidor de Supabase accesible desde internet.
- **Migraciones:** los archivos de `supabase/migrations/` que describen tus tablas. "Empujarlas"
  (`db push`) crea esas tablas en la nube, igual que se crearon en local.
- **Edge Function:** un trozo de código que corre en el servidor de Supabase. Lienzo trae una,
  `delete-account`, que borra la cuenta del usuario (lo exigen Apple y Google).
- **GitHub:** el sitio donde guardas tu código con todo su historial.
- **CI (integración continua):** un robot de GitHub que, en cada cambio, comprueba tipos, lint,
  formato, tests y migraciones (`.github/workflows/ci.yml`). Si algo falla, lo ves en rojo.
- **PR (pull request):** una propuesta de cambio. Trabajas en una rama, abres un PR, el CI lo
  revisa y, si está en verde, lo "mergeas" (fusionas) en `main`.

---

## Parte A — Supabase en la nube

### Qué implica el plan Free (sept. 2026, compruébalo)

Antes de crear nada, conviene saber dónde están los límites del plan gratuito
([precios](https://supabase.com/pricing)):

- **Se pausa tras 1 semana sin actividad.** Si nadie usa la app en 7 días, el proyecto se
  "duerme". Se despierta desde el dashboard (botón _Restore_), pero mientras tanto la app no
  funciona. Para una app con usuarios reales, esto es motivo para pasar a Pro (nivel 10).
- **Máximo 2 proyectos activos** por cuenta.
- **500 MB de base de datos, 1 GB de archivos, 5 GB de transferencia, 50.000 usuarios activos al
  mes, 500.000 llamadas a Edge Functions.** Para empezar, sobra.
- **Sin backups descargables.** Si borras datos por error, no hay copia que restaurar. En Pro hay
  backups diarios.
- **El email de Supabase es solo para pruebas.** Solo envía a miembros de tu equipo en Supabase
  y como mucho 2 emails por hora. Por eso existe el [nivel 4](04-emails-con-resend.md).

### 1. Crea el proyecto

1. Entra en [supabase.com](https://supabase.com) y regístrate (vale con tu cuenta de GitHub).
2. Pulsa **New project**.
3. Rellena:
   - **Name:** el nombre de tu app.
   - **Database password:** pulsa _Generate a password_ y **guárdala en tu gestor de contraseñas**
     (1Password, Bitwarden, el llavero del Mac…). La necesitarás en los pasos 3, 4 y 11 y
     Supabase no te la vuelve a enseñar.
   - **Region:** una de la UE, por ejemplo **Central EU (Frankfurt)** o **West EU (Ireland)**. Así
     los datos de tus usuarios se quedan en Europa (útil para el RGPD) y la app va más rápida
     desde España.
   - **Plan:** Free.
4. Pulsa **Create new project** y espera un par de minutos.

Apunta el **Project ref**: es el código de ~20 letras que aparece en la URL del dashboard
(`https://supabase.com/dashboard/project/ESTE_CODIGO`). No es secreto, pero tampoco hace falta
publicarlo.

### 2. Inicia sesión con la CLI

La CLI de Supabase ya viene instalada en el proyecto (está en `package.json`). Ábrela así:

```bash
npx supabase login
```

Se abrirá el navegador para autorizar. Cuando termine, la terminal dirá que has iniciado sesión.

### 3. Enlaza tu carpeta con el proyecto de la nube

Sustituye `TU_PROJECT_REF` por el código del paso 1:

```bash
npx supabase link --project-ref TU_PROJECT_REF
```

Te pedirá la contraseña de la base de datos (la del gestor). A partir de ahora, los comandos
"remotos" de la CLI apuntan a ese proyecto.

### 4. Crea las tablas en la nube

```bash
npm run db:push
```

Te enseñará la lista de migraciones que va a aplicar (`..._base.sql`, `..._notes.sql` y las que
hayas creado tú) y te pedirá confirmación. Responde `Y`.

> ⚠️ `db:push` **no** ejecuta `supabase/seed.sql`: los datos de ejemplo se quedan en local. En la
> nube empiezas con las tablas vacías, que es lo correcto.

### 5. Despliega la Edge Function

```bash
npx supabase functions deploy delete-account
```

La configuración (`verify_jwt = true`, es decir, "solo usuarios con sesión") se toma de
`supabase/config.toml`. En el dashboard, en **Edge Functions**, verás `delete-account` como
desplegada.

### 6. Apunta la app a la nube

En el dashboard: **Project Settings → API Keys**. Necesitas dos valores:

- **Project URL** (tiene la forma `https://TU_PROJECT_REF.supabase.co`).
- **Publishable key** (empieza por `sb_publishable_`). Es **pública**: puede ir en la app.

> 🚫 En esa misma pantalla verás la **secret key** (`sb_secret_…`) y, en la pestaña de claves
> antiguas, la **service_role**. **Nunca** las pongas en `.env`, en la app ni en el chat: dan
> acceso total a tu base de datos saltándose la seguridad (RLS). El CI (`npm run check:secrets`)
> te avisará si se cuelan en `src/`.

Abre tu `.env` y deja las dos versiones, comentando la que no uses:

```dotenv
# Local (Nivel 0)
# EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
# EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...local...

# Nube (Nivel 1)
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROJECT_REF.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

Reinicia Expo para que lea el `.env` nuevo (las variables se leen al arrancar):

```bash
npx expo start --clear
```

> Consejo: sigue desarrollando contra **local** (es más rápido, gratis y puedes romper cosas) y
> usa la nube para enseñar la app. Cambiar es comentar/descomentar esas líneas y reiniciar.

### 7. Configura Auth en el dashboard

Ve a **Authentication → URL Configuration**:

- **Site URL:** `lienzo://` (si ya ejecutaste `npm run rename`, usa tu esquema: el valor de
  `scheme` en `app.json` seguido de `://`).
- **Redirect URLs:** añade estas tres (botón _Add URL_):
  - `lienzo://**` → los enlaces de los emails abren tu app.
  - `exp://**` → para cuando pruebas con Expo Go.
  - `http://localhost:8081/**` → para la versión web en desarrollo.

Son las mismas que tienes en local en `supabase/config.toml` (`site_url` y
`additional_redirect_urls`); en la nube hay que ponerlas a mano.

Luego ve a **Authentication → Sign In / Providers → Email** y mira **Confirm email**:

- En la nube viene **activado**: al registrarse, el usuario recibe un email y no puede entrar
  hasta que pulse el enlace. Es lo que quieres en producción.
- **Pero** con el email por defecto de Supabase solo te llegará a **ti** (si tu email es miembro
  del equipo del proyecto) y como mucho 2 por hora.
- **Qué hacer:** si solo pruebas tú, déjalo activado. Si vas a dejar que se registren amigos antes
  del nivel 4, puedes **desactivarlo temporalmente** (entrarán sin confirmar). Apúntate
  reactivarlo en cuanto hagas el [nivel 4](04-emails-con-resend.md), y **nunca** publiques en
  tiendas con él desactivado.

---

## Parte B — GitHub y CI

### 8. Crea el repositorio

1. Regístrate en [github.com](https://github.com) si no tienes cuenta.
2. Arriba a la derecha, **+ → New repository**.
3. **Repository name:** el de tu app. **Visibility: Private.** No marques "Add a README" ni
   ".gitignore" (ya los tienes).
4. Pulsa **Create repository** y copia la URL que termina en `.git`.

### 9. Sube tu código

Primero comprueba que tu `.env` **no** se va a subir (debe salir listado como ignorado):

```bash
git check-ignore .env
```

Si imprime `.env`, perfecto. Ahora conecta tu carpeta con GitHub (sustituye la URL):

```bash
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git
```

Asegúrate de que tu rama se llama `main` y súbela:

```bash
git branch -M main
```

```bash
git push -u origin main
```

Si nunca has hecho un commit, antes haz `git add -A` y `git commit -m "Primer commit"` (o pídeselo
a Claude). Si tienes instalada la CLI de GitHub (`gh`), todo esto se resume en
`gh repo create --private --source . --push`.

### 10. Mira el CI en acción

En GitHub, pestaña **Actions**. Verás el workflow **CI** ejecutándose con dos trabajos:

- **Calidad (tipos, lint, formato, tests, secretos)**
- **Base de datos (migraciones + tipos al día)**

Tarda unos 3 minutos. En repos privados tienes **2.000 minutos gratis al mes** (sept. 2026,
compruébalo), así que da para cientos de ejecuciones.

### 11. Activa el despliegue automático de Supabase

El workflow `deploy-supabase.yml` aplica tus migraciones y despliega tus Edge Functions en la
nube **cada vez que mergeas en `main` algo que toque `supabase/`**. Hasta que le des las claves,
termina en verde sin hacer nada.

En GitHub: **Settings → Secrets and variables → Actions → New repository secret**. Crea estos
tres (todos son **secretos**):

| Nombre                  | De dónde sale                                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_ACCESS_TOKEN` | [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) → _Generate new token_. Ponle un nombre como "GitHub Actions". |
| `SUPABASE_PROJECT_REF`  | El Project ref del paso 1.                                                                                                                            |
| `SUPABASE_DB_PASSWORD`  | La contraseña de la base de datos (la del gestor).                                                                                                    |

Para probarlo sin esperar a un cambio: **Actions → Deploy Supabase → Run workflow**. Si los
secrets están bien, verás los pasos "Enlazar proyecto", "Aplicar migraciones" y "Desplegar Edge
Functions" en verde (en vez del aviso "Faltan secrets").

> Desde ahora, la forma "oficial" de cambiar la base de la nube es: migración nueva → PR → merge.
> Evita tocar tablas a mano en el dashboard: esos cambios no quedan en `supabase/migrations/` y
> tu local y la nube dejan de parecerse.

### 12. Protege la rama `main`

La idea: que nada entre en `main` si el CI está en rojo.

1. **Settings → Branches → Add branch ruleset** (o _Add classic branch protection rule_).
2. **Target / Branch name pattern:** `main`.
3. Activa **Require a pull request before merging** (puedes poner 0 aprobaciones si trabajas
   solo).
4. Activa **Require status checks to pass** y añade los dos checks del CI: _Calidad (tipos,
   lint, formato, tests, secretos)_ y _Base de datos (migraciones + tipos al día)_. Solo aparecen
   en el buscador si el CI se ha ejecutado al menos una vez (paso 10).
5. Guarda.

> ⚠️ **Límite del plan gratis de GitHub (sept. 2026, compruébalo):** en repos **privados** de
> cuentas Free, GitHub te deja crear la regla pero **no la aplica** (verás un aviso de que no se
> hará cumplir). Tienes tres opciones: pagar GitHub Pro (~4 $/mes), hacer el repo público (solo si
> no te importa que se vea el código; los secretos nunca están en él), o seguir sin regla y
> respetar el flujo por disciplina. Para alguien que trabaja solo, la tercera es razonable al
> principio: el CI sigue avisando en rojo aunque no bloquee.

### 13. El flujo de trabajo desde ahora

1. Crea una rama para cada cambio: `git switch -c feature/nombre-corto`.
2. Haz commits en esa rama.
3. Súbela: `git push -u origin feature/nombre-corto`.
4. En GitHub aparecerá un botón **Compare & pull request**. Ábrelo (la plantilla
   `.github/pull_request_template.md` te guía).
5. Espera al CI. Si sale rojo, entra en el detalle, arréglalo en la misma rama y vuelve a
   subir.
6. En verde → **Merge**. Si tocaste `supabase/`, el despliegue a la nube se lanza solo.

Claude Code puede hacer casi todo esto por ti ("crea una rama, haz commit y abre un PR").

### 14. (Opcional) Que Claude vea tu Supabase de la nube

El **MCP de Supabase** permite a Claude Code consultar tu proyecto (tablas, logs, advisors de
seguridad) directamente. Recomendación: **solo lectura y limitado a un proyecto**.

```bash
claude mcp add --scope local --transport http supabase "https://mcp.supabase.com/mcp?project_ref=TU_PROJECT_REF&read_only=true"
```

- `project_ref=…` limita el acceso a ese proyecto (equivale a `--project-ref` en la versión que
  se ejecuta con `npx @supabase/mcp-server-supabase`).
- `read_only=true` hace que las consultas se ejecuten con un usuario de Postgres de solo lectura
  (equivale a `--read-only`).
- `--scope local` lo guarda solo en tu máquina, no en el repo.

La primera vez que Claude lo use se abrirá el navegador para autorizarlo. Mantén activada la
aprobación manual de cada llamada. Más info: [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp).

---

## ✅ Cómo sé que ha funcionado

- [ ] En el dashboard de Supabase, **Table Editor** muestra `profiles` y `notes`.
- [ ] En **Edge Functions** aparece `delete-account`.
- [ ] Con el `.env` apuntando a la nube, te registras en la app y el usuario aparece en
      **Authentication → Users** (si "Confirm email" está activo, confirma desde tu email).
- [ ] Creas una nota y la ves en **Table Editor → notes**.
- [ ] La app funciona en tu móvil con Expo Go **usando datos móviles** (sin tu wifi).
- [ ] **Perfil → Borrar cuenta** borra el usuario de **Authentication → Users**.
- [ ] En GitHub, **Actions → CI** está en verde en `main`.
- [ ] **Actions → Deploy Supabase** (lanzado a mano) termina con los pasos de despliegue en
      verde, no con el aviso "Faltan secrets".

## 🧯 Problemas típicos

- **"Configuración inválida" al abrir la app:** falta algo en `.env` o no reiniciaste Expo. Revisa
  que la URL empiece por `https://` y reinicia con `npx expo start --clear`.
- **Me registro y "no pasa nada":** "Confirm email" está activo y el email no te llega (límite de 2
  por hora o tu email no es miembro del equipo). Mira **Authentication → Users**: el usuario estará
  "Waiting for verification". Opciones en el paso 7.
- **El enlace del email abre una web que no carga:** falta la Site URL o las Redirect URLs del paso 7.
- **`db push` falla con "password authentication failed":** contraseña de BD incorrecta. Puedes
  cambiarla en **Project Settings → Database → Reset database password** (y actualiza el secret
  `SUPABASE_DB_PASSWORD`).
- **`db push` dice que el remoto tiene migraciones que no tienes en local:** alguien (o tú)
  cambió la base desde el dashboard. Pídele a Claude que te ayude con
  `npx supabase migration list` antes de tocar nada.
- **La app va lenta o da error tras unos días sin usarla:** el proyecto se ha pausado. Dashboard →
  **Restore project**.
- **Borrar cuenta falla en la nube:** no desplegaste la función (paso 5) o la desplegaste antes del
  `link`. Repite el paso 5.
- **El PR se queda "esperando" un check que nunca llega:** el nombre del check obligatorio no
  coincide con el del job (p. ej. se renombró en `ci.yml`). En Settings → Branches, quita el check
  viejo y añade los actuales ("Calidad…" y "Base de datos…").
- **El CI falla en "Comprobar que src/types/database.ts está al día":** cambiaste una migración
  sin regenerar tipos. Ejecuta `npm run db:types`, haz commit y vuelve a subir.
- **`git push` pide usuario y contraseña:** GitHub ya no acepta contraseñas. Instala
  [GitHub CLI](https://cli.github.com) y ejecuta `gh auth login`, o usa GitHub Desktop.

## Pedírselo a Claude

```
/graduar 01
```

O pega algo así:

> Quiero pasar al nivel 1: ya he creado el proyecto de Supabase en Frankfurt y tengo el project
> ref y la contraseña en mi gestor. Guíame para enlazarlo, subir las migraciones, desplegar
> delete-account y apuntar mi .env a la nube. No me pidas que te pegue claves secretas: dime
> dónde ponerlas yo.

> Tengo el repo creado en GitHub y vacío. Sube mi código, comprueba que el .env no se sube y
> dime exactamente qué secrets tengo que crear para deploy-supabase.yml.

## Documentación oficial

- [Supabase: CLI y proyectos remotos](https://supabase.com/docs/guides/local-development/overview)
- [Supabase: desplegar Edge Functions](https://supabase.com/docs/guides/functions/deploy)
- [Supabase: URLs de redirección](https://supabase.com/docs/guides/auth/redirect-urls)
- [Supabase: precios y límites](https://supabase.com/pricing)
- [GitHub: secrets en Actions](https://docs.github.com/actions/security-for-github-actions/security-guides/using-secrets-in-github-actions)
- [GitHub: reglas de rama (rulesets)](https://docs.github.com/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets)
