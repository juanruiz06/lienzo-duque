# Lienzo

Plantilla para construir apps móviles **de verdad** con **Expo + React Native + TypeScript +
Supabase**. Viene montada, funcionando y preparada para crecer: login, base de datos segura, una
feature de ejemplo completa, tests, CI, y una guía por niveles para ir a la nube, publicar en las
tiendas, cobrar y escalar.

Pensada para empezar a desarrollar **con Claude Code** como compañero: trae instrucciones para el
agente (`AGENTS.md`, `CLAUDE.md`), reglas verificables (`INVARIANTS.md`) y 20 skills listas
(`/nueva-feature`, `/arreglar-bug`, `/graduar`…).

## Qué trae

- 📱 App iOS / Android / web con **expo-router**: login, registro, recuperar contraseña, lista de
  notas (crear, editar, borrar), perfil editable, cerrar sesión y **borrar cuenta**.
- 🗄️ **Supabase** local con migraciones, **RLS** (cada usuario solo ve lo suyo), seed con usuario
  demo y una **Edge Function** de ejemplo.
- 🧱 Arquitectura por capas: pantallas → hooks (React Query) → capa de datos → Supabase.
- 🎨 Tema con modo claro/oscuro y componentes base (`Button`, `TextField`, `Screen`, `Card`…).
- ✅ TypeScript estricto, ESLint (que hace cumplir la arquitectura), Prettier, Jest + Testing
  Library, Husky, y **GitHub Actions** (calidad, migraciones, RLS, secretos).
- 🚀 Workflows listos (se activan al añadir claves) para desplegar Supabase, compilar con EAS y
  publicar actualizaciones OTA.
- 🧭 Enchufes de observabilidad listos para **Sentry** y **PostHog**.
- 🎓 [Niveles de graduación](docs/graduacion/README.md): nube, builds, Sentry/PostHog, emails
  con Resend, tiendas, login social, OTA, push, pagos y escalar — con costes.

## Arrancar en 5 minutos

Necesitas Node 22, Git y Docker Desktop (para la base de datos local). Guía completa y sin
supuestos: **[docs/00-empieza-aqui.md](docs/00-empieza-aqui.md)**.

```bash
npm install
```

```bash
cp .env.example .env
```

```bash
npm run db:start
```

Copia `API_URL` y `PUBLISHABLE_KEY` que imprime el comando anterior en `.env`, y luego:

```bash
npm start
```

Pulsa `i` (iOS), `a` (Android) o `w` (web), o escanea el QR con **Expo Go**. Usuario de prueba:
`demo@lienzo.test` / `lienzo-demo-1234`.

¿Algo no va? `npm run doctor`.

## Hazla tuya

```bash
npm run rename -- "Mi App" com.minombre.miapp
```

## Documentación

| Documento                                               | Para qué                                     |
| ------------------------------------------------------- | -------------------------------------------- |
| [docs/00-empieza-aqui.md](docs/00-empieza-aqui.md)      | Instalar todo y ver la app funcionando       |
| [docs/arquitectura.md](docs/arquitectura.md)            | Cómo encaja todo, explicado sin jerga        |
| [docs/flujo-de-trabajo.md](docs/flujo-de-trabajo.md)    | Día a día: ramas, PRs, CI y Claude Code      |
| [docs/graduacion/](docs/graduacion/README.md)           | Siguientes niveles, paso a paso y con costes |
| [docs/glosario.md](docs/glosario.md)                    | Qué significa cada palabra rara              |
| [AGENTS.md](AGENTS.md) · [INVARIANTS.md](INVARIANTS.md) | Mapa del código y reglas duras               |

## Comandos principales

| Comando            | Qué hace                                                |
| ------------------ | ------------------------------------------------------- |
| `npm start`        | Arranca la app en modo desarrollo                       |
| `npm run check`    | Tipos + lint + formato + tests (antes de cada PR)       |
| `npm run doctor`   | Diagnóstico de la máquina y la configuración            |
| `npm run db:start` | Arranca Supabase local (Studio: http://127.0.0.1:54423) |
| `npm run db:reset` | Recrea la base local desde las migraciones + seed       |
| `npm run db:types` | Regenera los tipos TypeScript de la base de datos       |
