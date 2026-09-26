# Empieza aquí

Esta guía te lleva de "tengo el repo" a "veo la app en mi móvil con mis datos". Unos 30-45
minutos la primera vez (casi todo es esperar descargas). Si usas Claude Code, puedes escribir
**`/empezar`** y te acompaña paso a paso.

> **Nivel 0 — Local.** Todo corre en tu ordenador y es gratis. La app habla con una base de
> datos que vive en tu máquina. Cuando quieras que la usen otras personas, sigue los
> [niveles de graduación](graduacion/README.md).

---

## 1. Instala las herramientas (una sola vez)

| Herramienta               | Para qué                               | Dónde                                                           |
| ------------------------- | -------------------------------------- | --------------------------------------------------------------- |
| **Node.js 22 (LTS)**      | Ejecuta las herramientas de JavaScript | https://nodejs.org                                              |
| **Git**                   | Guarda el historial de cambios         | https://git-scm.com (en Mac viene con Xcode Command Line Tools) |
| **Docker Desktop**        | Hace funcionar la base de datos local  | https://www.docker.com/products/docker-desktop                  |
| **VS Code** (o Cursor)    | Editor de código                       | https://code.visualstudio.com                                   |
| **Claude Code**           | Tu compañero de programación           | https://claude.com/claude-code                                  |
| **Expo Go** (en tu móvil) | Abre la app sin compilar nada          | App Store / Google Play                                         |

Opcional: **Xcode** (solo Mac, para el simulador de iPhone) y/o **Android Studio** (para el
emulador de Android). No son imprescindibles: con Expo Go en tu móvil basta para empezar.

Comprueba en una terminal:

```bash
node --version
```

Debe decir `v22.x` (o superior).

## 2. Descarga las dependencias

En la carpeta del proyecto:

```bash
npm install
```

Crea la carpeta `node_modules/` con todas las librerías. Tarda 1-3 minutos.

## 3. Arranca la base de datos local

Abre **Docker Desktop** (tiene que estar en marcha) y ejecuta:

```bash
npm run db:start
```

La primera vez descarga unas imágenes (varios minutos). Al terminar imprime algo así:

```
API_URL: http://127.0.0.1:54421
STUDIO_URL: http://127.0.0.1:54423
PUBLISHABLE_KEY: sb_publishable_...
```

Qué acaba de pasar: Supabase ha creado una base de datos Postgres en tu ordenador, ha aplicado
las **migraciones** (`supabase/migrations/`: las tablas `profiles` y `notes` con sus reglas de
seguridad) y ha cargado el **seed** (`supabase/seed.sql`: un usuario demo con dos notas).

Abre **Studio** (http://127.0.0.1:54423) para ver las tablas como si fueran hojas de cálculo.

## 4. Configura el `.env`

```bash
cp .env.example .env
```

Abre `.env` y pega los valores del paso anterior:

```
EXPO_PUBLIC_SUPABASE_URL=http://127.0.0.1:54421
EXPO_PUBLIC_SUPABASE_KEY=sb_publishable_...
```

`.env` guarda configuración de TU máquina y no se sube a git. Todo lo que empieza por
`EXPO_PUBLIC_` acaba dentro de la app, así que **ahí nunca van claves secretas**.

Comprueba que todo está bien:

```bash
npm run doctor
```

## 5. Abre la app

```bash
npm start
```

Se queda funcionando (es **Metro**, el servidor que envía tu código a la app). Verás un QR y un menú:

- **Móvil con Expo Go**: escanea el QR (iPhone: con la cámara; Android: desde Expo Go).
  ⚠️ Con la base de datos local, tu móvil no entiende `127.0.0.1` (para él significa "yo mismo").
  Cambia en `.env` la URL por la IP de tu ordenador (te la dice `npm run doctor`), por ejemplo
  `http://192.168.1.20:54421`, y reinicia `npm start`. Móvil y ordenador en la misma wifi.
- **Simulador de iPhone**: pulsa `i` (necesita Xcode).
- **Emulador de Android**: pulsa `a` (necesita Android Studio).
- **Navegador**: pulsa `w`. Rápido para probar, pero la app es para móvil: pruébala también ahí.

Entra con el usuario de prueba:

- Email: `demo@lienzo.test`
- Contraseña: `lienzo-demo-1234`

Deberías ver dos notas. Crea una, edítala, bórrala. Ve a Perfil y cámbiate el nombre. Regístrate
con otro email (en local no hace falta confirmar) y comprueba que ese usuario **no** ve las notas
del demo: eso es la seguridad por filas (RLS) funcionando.

**Magia del día a día**: con `npm start` en marcha, cambia un texto en
`src/app/(auth)/sign-in.tsx`, guarda, y mira cómo la app se actualiza sola en un segundo.

## 6. Comprueba la calidad

```bash
npm run check
```

Pasa 4 controles: tipos (TypeScript), estilo de código (ESLint), formato (Prettier) y tests
(Jest). Tiene que salir todo en verde antes de subir cambios. Lo mismo lo comprueba GitHub
automáticamente en cada Pull Request.

## 7. Hazla tuya

Elige el nombre de tu app y un identificador único (dominio al revés, en minúsculas):

```bash
npm run rename -- "Mi App" com.minombre.miapp
```

⚠️ El identificador (`com.minombre.miapp`) no se puede cambiar después de publicar en las tiendas.

---

## Y ahora qué

1. Lee [arquitectura.md](arquitectura.md) (15 minutos) para entender cómo encaja todo.
2. Lee [flujo-de-trabajo.md](flujo-de-trabajo.md) para trabajar con ramas, PRs y Claude.
3. Piensa tu primera feature y pídele a Claude: `/planificar quiero que los usuarios puedan …`
4. Cuando quieras enseñarla a otros: [niveles de graduación](graduacion/README.md).

## Problemas típicos

| Síntoma                                    | Causa y solución                                                                                          |
| ------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| La app dice **"Configuración inválida"**   | Falta `.env` o está vacío. Rellénalo y reinicia `npm start` (Ctrl+C y otra vez).                          |
| **"Network request failed"** en el móvil   | Estás usando `127.0.0.1` en un móvil físico, o distinta wifi, o la base está parada (`npm run db:start`). |
| `npm run db:start` falla                   | Docker Desktop no está abierto, o los puertos 544xx están ocupados por otro proyecto.                     |
| Expo Go dice **"Project is incompatible"** | Actualiza Expo Go desde la tienda (debe ser compatible con el SDK 57).                                    |
| Cambié el `.env` y no se nota              | Las variables se leen al arrancar: para `npm start` y vuelve a lanzarlo.                                  |
| Quiero empezar la base de cero             | `npm run db:reset` (borra los datos locales y recarga migraciones + seed).                                |
| Otra cosa                                  | `npm run doctor`, y si no, pregúntale a Claude con el texto del error.                                    |
