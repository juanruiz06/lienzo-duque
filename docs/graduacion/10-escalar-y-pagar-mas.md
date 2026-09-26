# Nivel 10 — Escalar y pagar más (cuando toca)

> **Qué consigues:** saber **cuándo** merece la pena pagar cada servicio y **por qué**; separar un
> entorno de pruebas (_staging_) del de producción; tener copias de seguridad de verdad; y que la
> base de datos siga rápida con muchos usuarios.
>
> **Cuánto cuesta:** desde ~25 $/mes (Supabase Pro) hasta ~150–250 $/mes con todo en plan de pago.
> Ver la tabla de presupuesto por etapa (sept. 2026, compruébalo).
>
> **Cuándo hacerlo:** **no antes de tener un motivo**. Las señales están en cada sección. La más
> habitual: tienes usuarios reales y perder sus datos sería un desastre → Supabase Pro.
>
> **Tiempo estimado:** Supabase Pro, 10 minutos. Entornos staging/producción, medio día.
> Revisión de rendimiento, 1–2 horas cada cierto tiempo.
>
> **Requisitos:** [Nivel 1](01-nube-github-y-ci.md) y, para que tenga sentido, app publicada
> ([nivel 5](05-publicar-en-tiendas.md)).

## La regla de oro

Paga por **tranquilidad** (backups, no pausas) antes que por **capacidad** (más máquinas). Una app
con cientos o pocos miles de usuarios cabe de sobra en los planes pequeños si la base de datos
está bien hecha (última sección). Y activa siempre los **límites de gasto** que ofrezca cada
servicio: así un error nunca se convierte en una factura sorpresa.

---

## 1. Supabase Pro (el primer pago que merece la pena)

**Señales:** tienes usuarios reales; te preocupa que el proyecto se **pause** tras 1 semana sin
actividad (plan gratis) o que no haya **copias de seguridad**; te acercas a los 500 MB de base de
datos o 1 GB de archivos.

Qué te da **Pro** (~25 $/mes por organización, sept. 2026, compruébalo en
[supabase.com/pricing](https://supabase.com/pricing)):

|                             | Free            | Pro                                                            |
| --------------------------- | --------------- | -------------------------------------------------------------- |
| Se pausa por inactividad    | Sí (1 semana)   | **No**                                                         |
| Copias de seguridad         | No              | **Diarias, 7 días**                                            |
| Base de datos               | 500 MB          | 8 GB incluidos (luego pago por uso)                            |
| Usuarios activos/mes (Auth) | 50.000          | 100.000                                                        |
| Archivos (Storage)          | 1 GB            | 100 GB                                                         |
| Transferencia (egress)      | 5 GB            | 250 GB                                                         |
| Computación                 | Nano compartida | Incluye 10 $/mes de crédito = 1 instancia **Micro** (1 GB RAM) |

Extras opcionales de Pro:

- **PITR** (_point-in-time recovery_): qué es, poder volver la base de datos a **cualquier
  minuto** de los últimos días, no solo a la copia de anoche. ~100 $/mes por 7 días y exige una
  computación mayor que Micro. Solo cuando un error de datos te costaría dinero de verdad.
- **Compute add-ons**: qué son, una máquina más grande para la base de datos. Small ~15 $/mes
  (2 GB RAM), Medium ~60 $/mes (4 GB). Súbelo **solo** si el panel de uso muestra CPU o memoria
  altas de forma sostenida y ya revisaste índices (sección 6).
- **Spend cap** (límite de gasto): viene **activado** en Pro. Si te pasas de lo incluido, en vez
  de cobrarte se limita el servicio. Déjalo activado hasta que entiendas tu consumo.

Cómo: Dashboard → Organization → **Billing** → Change plan → Pro. No hay que migrar nada ni hay
cortes.

Y aunque tengas backups de Supabase, guarda de vez en cuando **tu propia copia** (por si pierdes
el acceso a la cuenta). Con el proyecto enlazado (`supabase link`, nivel 1):

```bash
npx supabase db dump --linked -f copia-esquema.sql
```

```bash
npx supabase db dump --linked --data-only -f copia-datos.sql
```

Guárdalas **fuera del repo** (contienen datos personales de tus usuarios) y cifradas si puedes.

## 2. Entornos separados: staging y producción

**Señales:** ya tienes usuarios reales y te da miedo probar una migración o un cambio "a ver qué
pasa"; o quieres que tus testers usen la app sin mezclar sus datos con los de producción.

Qué es **staging**: una copia del sistema, con su propia base de datos, donde pruebas antes de
tocar producción. Los usuarios reales nunca lo ven.

### El plan

| Entorno        | Base de datos                           | Build EAS / canal     | Quién lo usa            |
| -------------- | --------------------------------------- | --------------------- | ----------------------- |
| **Local**      | Supabase en Docker (`npm run db:start`) | Metro / `development` | Tú programando          |
| **Staging**    | Proyecto Supabase `miapp-staging`       | `preview`             | Tú y tus testers        |
| **Producción** | Proyecto Supabase `miapp-prod`          | `production`          | Usuarios de las tiendas |

### Pasos

1. **Crea un segundo proyecto** en Supabase (misma región). Si tu organización es Pro, el segundo
   proyecto suma ~10 $/mes de computación Micro. Alternativa barata: pon staging en una
   organización gratuita aparte (se pausará si no lo usas, pero para staging da igual).
2. **Configúralo igual que producción**: Auth (Redirect URLs, SMTP de Resend del
   [nivel 4](04-emails-con-resend.md), proveedores sociales), secrets de Edge Functions
   (`npx supabase secrets set … --project-ref REF_DE_STAGING`) y, si usas push, los secretos de
   Vault ([nivel 8](08-notificaciones-push.md)).
3. **EAS environments**: cada entorno de EAS apunta a un proyecto distinto. Cambia `preview` para
   que use staging (repite con `EXPO_PUBLIC_SUPABASE_KEY`):

   ```bash
   eas env:set --name EXPO_PUBLIC_SUPABASE_URL --value https://REF_DE_STAGING.supabase.co --environment preview --visibility plaintext
   ```

   Y deja `production` con los valores de producción. Revisa ambos con `eas env:list`. El
   workflow `eas-update.yml` ya publica cada canal con su entorno (`--environment` = canal), así
   que un update de `preview` nunca apuntará a la base de datos de producción.

4. **Tu `.env` local** sigue apuntando al Supabase local. Si alguna vez quieres probar contra
   staging desde tu ordenador, baja sus variables:

   ```bash
   eas env:pull --environment preview
   ```

   Esto crea `.env.local` (no se sube a git), que **tiene prioridad** sobre `.env`: mientras
   exista, tu app en desarrollo usará staging. Bórralo para volver a tu base local.

5. **GitHub Actions**: hoy `deploy-supabase.yml` despliega en **un** proyecto al hacer merge en
   `main`. Pásalo a dos pasos usando **GitHub Environments** (Settings → Environments →
   `staging` y `production`, cada uno con sus `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD`…):
   - Merge en `main` → despliega en **staging** automáticamente.
   - Botón manual (_Run workflow_) o crear un _release_ → despliega en **producción**, con
     aprobación obligatoria (GitHub Environments → _Required reviewers_).

   Es un cambio de YAML delicado: pídeselo a Claude (ver al final).

El flujo diario queda así: PR → CI verde → merge → staging se actualiza solo → pruebas en la app
`preview` → lanzas el deploy de producción → `eas update` a `production` o build nuevo.

### Opcional: Supabase Branching

Qué es: Supabase crea una **base de datos temporal por cada Pull Request** (con tus migraciones y
el seed), y la borra al cerrar el PR. Es como tener un staging por cambio. Se conecta con la
integración de GitHub y cobra por hora cada rama encendida (~0,013 $/h, unos 10 $/mes si
estuviera siempre encendida; sept. 2026, compruébalo). Solapa con el workflow de despliegue:
si lo activas, deja que Branching despliegue y simplifica `deploy-supabase.yml`. Para una persona
sola, staging suele bastar. [Docs de Branching](https://supabase.com/docs/guides/deployment/branching).

## 3. Expo / EAS de pago

**Señales:** esperas **mucho** en la cola de builds gratis; necesitas más de 15 builds al mes por
plataforma; o más de **1.000 usuarios al mes** reciben updates OTA ([nivel 7](07-actualizaciones-ota.md)).

| Plan (sept. 2026, compruébalo) | Precio     | Builds                                       | Usuarios de updates/mes |
| ------------------------------ | ---------- | -------------------------------------------- | ----------------------- |
| Free                           | 0 $        | 15 Android + 15 iOS, cola lenta, 45 min máx. | 1.000                   |
| **Starter**                    | ~19 $/mes  | 45 $ de crédito para builds prioritarios     | 3.000                   |
| Production                     | ~199 $/mes | 225 $ de crédito, 2 builds a la vez          | 50.000                  |

Starter es el salto natural: builds rápidos y más margen de OTA. Se puede activar un mes y
volver a Free. [expo.dev/pricing](https://expo.dev/pricing).

## 4. Observabilidad, emails y demás

| Servicio       | Gratis (sept. 2026, compruébalo)         | Cuándo pagar                                                      | Plan de pago                                                   |
| -------------- | ---------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------- |
| **Sentry**     | 5.000 errores/mes, 1 usuario             | Te quedas sin cupo a mitad de mes, o alguien más necesita acceso  | Team ~26 $/mes (50.000 errores, usuarios ilimitados)           |
| **PostHog**    | 1 M eventos, 5.000 grabaciones/mes       | Pasas del millón de eventos                                       | Pago por uso a partir de ahí; **pon un límite de facturación** |
| **Resend**     | 3.000 emails/mes, 100/día                | Más de 100 emails un día (registros masivos, newsletters)         | Pro ~20 $/mes (50.000 emails)                                  |
| **GitHub**     | Repos privados, 2.000 min/mes de Actions | Reglas de rama obligatorias en repo privado, o trabajas en equipo | Pro ~4 $/mes                                                   |
| **RevenueCat** | Hasta 2.500 $/mes de ingresos            | Automático                                                        | 1 % de lo que pase de 2.500 $                                  |

**Dominio y email profesional:** el dominio (~10–15 €/año) ya lo tienes del
[nivel 4](04-emails-con-resend.md). Para **recibir** email en `hola@tudominio.com`:

- Gratis: **reenvío** a tu Gmail (p. ej. Cloudflare Email Routing o tu registrador de dominios).
- De pago: Google Workspace Business Starter (~6,90 €/usuario/mes + IVA) u otros (Zoho Mail,
  iCloud+ con dominio propio). Vale la pena cuando escribes a usuarios, tiendas o empresas a diario.

## 5. Presupuesto mensual por etapa

Cifras aproximadas en dólares (sept. 2026, compruébalo). "Apple" es la cuota anual de 99 $
repartida (~8 $/mes).

| Etapa                                              | Qué tienes                                | Servicios de pago                                                                            | Total aprox./mes                                                         |
| -------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Hobby**                                          | Solo tú, en local o nube gratis           | Ninguno (Apple si pruebas en iPhone)                                                         | **0 $** (≈8 $ con Apple)                                                 |
| **Beta con amigos** (≤ 50 personas)                | Nube gratis, builds `preview`, TestFlight | Apple, dominio                                                                               | **≈9 $**                                                                 |
| **Lanzamiento** (tiendas, cientos–pocos miles)     | App publicada, usuarios reales            | Supabase Pro, Apple, dominio (+ Google 25 $ una vez)                                         | **≈35 $** (≈42 $ con email profesional)                                  |
| **Con ingresos** (miles de usuarios, quizá equipo) | Staging + producción, OTA frecuentes      | Supabase Pro + 2.º proyecto, EAS Starter, Sentry Team, Resend Pro, Workspace, Apple, dominio | **≈120–180 $** + PostHog por uso + 1 % RevenueCat + comisiones de tienda |

Si tu app cobra, compara siempre ese total con lo que ingresas: un buen objetivo es que la
infraestructura no pase del 10–20 % de los ingresos.

## 6. Rendimiento de la base de datos (gratis y lo más importante)

Antes de pagar una máquina más grande, revisa esto. La mayoría de apps lentas lo son por una de
estas cuatro cosas:

### a) Índices

Qué es un **índice**: como el índice de un libro; Postgres encuentra filas sin leer la tabla
entera. Regla: crea un índice para cada columna por la que **filtras** (`.eq(...)`), **ordenas**
(`.order(...)`) o por la que filtra una **policy** (casi siempre `user_id`). Las notas de ejemplo
ya lo hacen:

```sql
create index notes_user_id_updated_at_idx on public.notes (user_id, updated_at desc);
```

Si añades una tabla con `user_id` y la consultas por fecha, copia ese patrón en su migración.
Las claves foráneas (`references …`) **no** crean índice solas: añádelo tú.

### b) `(select auth.uid())` en las policies

Escribir `using (user_id = (select auth.uid()))` en vez de `using (user_id = auth.uid())` hace que
Postgres calcule tu id **una vez por consulta** y no una vez **por fila**. Con 100.000 filas se
nota muchísimo. Todas las migraciones de Lienzo ya lo hacen; mantenlo en las tuyas (la skill
`/nueva-tabla` lo aplica). Pon también siempre `to authenticated` en las policies: así Postgres ni
siquiera las evalúa para `anon`.

### c) Pedir solo lo necesario

- Columnas explícitas (`select('id, title')`), nunca `*`: `src/api/notes.ts` es el ejemplo.
- Paginación: no traigas 5.000 filas. Usa `.range(desde, hasta)` o `.limit()`, y en listas largas,
  `useInfiniteQuery` de React Query.

### d) Los Advisors del dashboard

Supabase Dashboard → **Advisors**:

- **Security Advisor**: tablas sin RLS, funciones con `search_path` mutable, vistas que se saltan
  RLS… Todo lo que salga en **rojo**, arréglalo.
- **Performance Advisor**: claves foráneas sin índice, policies con `auth.uid()` sin `select`,
  policies duplicadas, índices que no se usan…

Revísalos **antes de publicar** y luego una vez al mes. Pega los avisos a Claude y te propondrá la
migración que los corrige. Para buscar consultas lentas: Dashboard → **Reports / Query
Performance** ([docs](https://supabase.com/docs/guides/database/query-optimization)).

### Límites de conexiones

La app no abre conexiones directas a Postgres: habla con la API de Supabase (HTTP), que ya
reparte las conexiones. Por eso los límites de la instancia Micro (60 conexiones directas, 200
clientes a través del _pooler_) rara vez importan en una app móvil. Solo te afectan si conectas un
servidor propio o una herramienta externa con `postgres://…`: usa entonces la cadena del
**pooler** (Dashboard → Connect → _Transaction pooler_).
[Docs de conexiones](https://supabase.com/docs/guides/database/connecting-to-postgres).

---

## ✅ Cómo sé que ha funcionado

- Supabase → Billing muestra **Pro** y en Database → Backups aparecen copias diarias.
- Tienes dos proyectos (staging y prod). El build `preview` guarda datos en staging y el de la
  tienda en producción (crea una nota con cada uno y compruébalo en cada dashboard).
- Un merge en `main` despliega solo en staging; producción solo con tu aprobación.
- Security Advisor y Performance Advisor sin avisos rojos.
- Sabes cuánto pagas al mes y tienes límites de gasto donde se puede.

## 🧯 Problemas típicos

- **"Mi app de la tienda ve datos de staging"** (o al revés): variables de EAS cruzadas. Revisa
  `eas env:list --environment production` y `--environment preview`; tras corregir, build nuevo
  o update con el entorno correcto.
- **Una migración funciona en staging pero falla en producción**: los datos reales son distintos
  (p. ej. filas que no cumplen un `check` nuevo). Prueba con una copia de datos parecida y escribe
  migraciones que toleren los datos existentes.
- **Supabase te limita el servicio** con el spend cap activado: miras en Usage qué se ha
  disparado (egress, almacenamiento…) antes de quitar el límite.
- **Te llega un aviso de Supabase por egress alto**: suele ser por descargar imágenes grandes sin
  caché o listas sin paginar. Revisa la sección 6c antes de subir de plan.
- **Olvidaste configurar algo en staging** (SMTP, secrets, Vault): haz una lista de "todo lo que
  se configura a mano" y repásala en ambos proyectos.

## Pedírselo a Claude

```
/graduar 10
```

Otros ejemplos:

- "Tengo X usuarios y estos servicios: ¿qué me conviene pagar ya y qué puede esperar?"
- "Monta staging y producción: dos proyectos Supabase, EAS environments y cambia
  `deploy-supabase.yml` para desplegar en staging al hacer merge y en producción con aprobación
  manual usando GitHub Environments."
- "Estos son los avisos del Performance Advisor _(pégalos)_: escribe la migración que los arregla."
- "La lista de notas va lenta con muchos datos: añade paginación infinita."
- "Crea un workflow semanal que haga `supabase db dump` y lo guarde cifrado como artefacto."

## Documentación oficial

- [Supabase — Precios](https://supabase.com/pricing) ·
  [Compute](https://supabase.com/docs/guides/platform/compute-and-disk) ·
  [Backups](https://supabase.com/docs/guides/platform/backups) ·
  [RLS y rendimiento](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [Supabase — Advisors](https://supabase.com/docs/guides/database/database-advisors)
- [EAS — Entornos y variables](https://docs.expo.dev/eas/environment-variables/) ·
  [Precios](https://expo.dev/pricing)
- [GitHub — Environments](https://docs.github.com/actions/deployment/targeting-different-environments/using-environments-for-deployment)
