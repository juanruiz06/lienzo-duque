---
name: graduar
description: Acompaña paso a paso a subir de nivel el proyecto según docs/graduacion - Supabase en la nube, GitHub y CI, builds con EAS, Sentry y PostHog, emails con Resend, publicar en tiendas, login social, OTA, push, pagos y escalar. Úsala cuando digan "siguiente nivel", "quiero publicar", "configura Sentry/PostHog/Resend", "cómo pongo esto en la nube" o pasen un número de nivel.
argument-hint: '[número de nivel, p. ej. 03] (vacío = detectar el siguiente)'
---

# Graduar: subir de nivel

Nivel pedido: $ARGUMENTS

## 1. ¿En qué nivel está?

Lee `docs/graduacion/README.md`. Recuerda: usa **Windows**, Expo Go y Supabase Free; todo empieza gratis y cada nivel dice su coste. Si no se indicó nivel, detecta el estado actual y propone el siguiente:

| Señal en el repo / entorno                                                 | Nivel hecho |
| -------------------------------------------------------------------------- | ----------- |
| `supabase/.temp/project-ref` existe (lo crea `npm run setup`)              | 0 (base)    |
| `git remote -v` apunta a GitHub y el CI corre en los PR                    | 01          |
| `app.json` tiene `extra.eas.projectId`                                     | 02          |
| Existe `src/observability/sentry.ts` / `posthog.ts`                        | 03          |
| `supabase/config.toml` o docs mencionan SMTP propio / hay función de email | 04          |
| `eas.json` → `submit.production` configurado, app en tiendas               | 05          |
| `expo-apple-authentication` / google-signin en `package.json`              | 06          |
| `expo-updates` en `package.json`                                           | 07          |
| `expo-notifications` en `package.json`                                     | 08          |
| `react-native-purchases` / Stripe en `package.json`                        | 09          |

Explica en 3 frases qué ganará con el nivel, **cuánto cuesta** y cuánto se tarda. Pregunta si seguimos.

## 2. Guía el nivel

Lee el archivo del nivel (`docs/graduacion/NN-*.md`) y síguelo **paso a paso**:

- Lo que es **en su navegador** (crear cuentas, pagar, pulsar en dashboards, copiar claves): explícale exactamente dónde pulsar y espera a que diga "hecho". **Tú no creas cuentas ni introduces pagos ni contraseñas.**
- Lo que es **código** (instalar paquetes, crear archivos, config): hazlo tú siguiendo el doc y las reglas del repo (`AGENTS.md`, `INVARIANTS.md`).
- Lo que es **en la nube** (`db push`, `functions deploy`, `secrets set`, `eas build`, `eas submit`): explica qué hará y pide confirmación antes de cada comando.
- **Secretos**: nunca los escribas en archivos del repo. Pídele que los pegue él directamente en el comando/panel correspondiente (secrets de EAS, GitHub o Supabase), o en `.env` si son públicos (`EXPO_PUBLIC_*`).

## 3. Verifica

Sigue la sección "✅ Cómo sé que ha funcionado" del nivel. Luego `npm run check`.

## 4. Deja constancia

- Actualiza la documentación si algo del doc no coincidía con la realidad (las webs cambian): corrígelo en el propio archivo del nivel.
- Commit en una rama con `/preparar-pr`.
- Resume: qué nivel se completó, qué queda configurado, qué cuesta al mes a partir de ahora, y cuál sería el siguiente nivel lógico.
