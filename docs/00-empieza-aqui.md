# Empieza aquí

> **La forma fácil: abre [`SETUP.html`](../SETUP.html) con doble clic.** Es una guía visual paso a
> paso para Windows, con botones de copiar y casillas que recuerdan por dónde vas. Este documento
> es el resumen en texto de lo mismo, y explica qué pasa por debajo.

**Nivel 0 — Todo gratis.** Tu app corre en tu móvil con **Expo Go**, el código vive en tu
ordenador, y los datos en un proyecto **gratuito de Supabase** en internet. No necesitas Mac,
ni Docker, ni tarjeta de crédito. Cuando quieras publicarla o enseñarla a más gente, sigue los
[niveles de graduación](graduacion/README.md).

---

## Los 10 pasos, resumidos

| #   | Qué                                                                                | Para qué                                                |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------- |
| 1   | Instalar **Node.js LTS** (nodejs.org, instalador `.msi`)                           | El "motor" de las herramientas                          |
| 2   | Instalar **Git for Windows** (git-scm.com, todo por defecto)                       | Historial de cambios                                    |
| 3   | Instalar **Visual Studio Code**                                                    | Editor de código con terminal integrada                 |
| 4   | Instalar **Expo Go** en el móvil                                                   | Ver la app mientras la construyes                       |
| 5   | Poner el proyecto en `C:\proyectos\…` (**fuera de OneDrive**) y abrirlo en VS Code | OneDrive se atasca con los miles de archivos de una app |
| 6   | `npm install`                                                                      | Descarga las librerías de la app                        |
| 7   | Crear un proyecto **Free** en supabase.com (guarda la _Database password_)         | La base de datos y el login                             |
| 8   | `npm run setup`                                                                    | Conecta la app con tu Supabase y crea las tablas        |
| 9   | `npm start` y escanear el QR con Expo Go                                           | Ver la app en el móvil                                  |
| 10  | Cambiar un texto y guardar                                                         | Comprobar que el móvil se actualiza solo                |

Todos los comandos se escriben en la **terminal de VS Code** (menú _Terminal → New Terminal_).

## Qué hace `npm run setup` por ti

1. Te pide la **Project URL** y la **Publishable key** de tu proyecto de Supabase y las guarda en
   `.env` (un archivo de configuración de tu ordenador que no se sube a git). Todo lo que empieza
   por `EXPO_PUBLIC_` acaba dentro de la app, por eso **ahí nunca van claves secretas**: si pegas
   la _Secret key_ por error, el asistente te avisa.
2. Inicia sesión en Supabase (se abre el navegador) y **enlaza** esta carpeta con tu proyecto.
3. Aplica las **migraciones** (`supabase/migrations/`): crea las tablas `profiles` y `notes` con
   sus reglas de seguridad (RLS: cada usuario solo ve sus datos).
4. Te guía para desactivar _Confirm email_ mientras desarrollas.
5. Sube la **Edge Function** `delete-account` (el botón "Borrar mi cuenta").

Se puede repetir sin miedo. Para ver qué haría sin cambiar nada: `npm run setup -- --dry-run`.

## El día a día

```bash
npm start
```

Escanea el QR con Expo Go. Cada vez que guardas un archivo, el móvil se actualiza. Para parar:
`Ctrl + C`. Otros comandos útiles:

| Comando                    | Qué hace                                                                               |
| -------------------------- | -------------------------------------------------------------------------------------- |
| `npm run start:tunnel`     | Como `npm start`, pero funciona aunque la wifi bloquee la conexión móvil–ordenador     |
| `npm run check`            | Revisa tipos, estilo, formato y tests. Tiene que salir en verde antes de subir cambios |
| `npm run doctor`           | Diagnóstico: te dice qué falta o está mal configurado                                  |
| `npm run db:new -- nombre` | Crea una migración nueva (mejor pídeselo a Claude: `/nueva-tabla`)                     |
| `npm run db:push`          | Aplica las migraciones nuevas a tu base de datos de Supabase                           |
| `npm run db:types`         | Actualiza los tipos TypeScript tras cambiar la base de datos                           |

## Tu proyecto de Supabase es tu "base de desarrollo"

Mientras no tengas usuarios reales, ese proyecto gratuito es tu zona de pruebas: puedes crear
tablas, borrar datos y registrarte con emails de prueba sin miedo. **Antes de publicar** en las
tiendas, crearás un segundo proyecto para producción, limpio (ver
[nivel 10](graduacion/10-escalar-y-pagar-mas.md), sección de entornos).

Límites del plan gratis que conviene conocer: si nadie usa el proyecto en una semana, Supabase lo
**pausa** (entras al panel y pulsas _Restore_, no se pierde nada), y los emails automáticos
(recuperar contraseña) están muy limitados hasta el [nivel 4](graduacion/04-emails-con-resend.md).

## Problemas típicos

| Síntoma                                      | Causa y solución                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `npm` / `node` "no se reconoce"              | La terminal se abrió antes de instalar Node. Cierra VS Code y ábrelo de nuevo.             |
| "la ejecución de scripts está deshabilitada" | En la terminal: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, responde `S`.       |
| La app dice **"Configuración inválida"**     | Falta el `.env`: `npm run setup`, y reinicia `npm start`.                                  |
| El móvil no conecta con el ordenador         | Misma wifi y permitir Node en el Firewall (redes privadas). Si no: `npm run start:tunnel`. |
| Expo Go: **"Project is incompatible"**       | Actualiza Expo Go desde la tienda.                                                         |
| "Sin conexión" al entrar en la app           | El proyecto de Supabase está pausado: panel de Supabase → _Restore_.                       |
| "Confirma tu email" al registrarte           | Supabase → Authentication → Sign In / Providers → Email → desactiva _Confirm email_.       |
| Otra cosa                                    | `npm run doctor`, y si no, pregúntale a Claude pegando el error.                           |

---

## Anexo: base de datos local con Docker (avanzado, opcional)

Hay una segunda forma de trabajar: con una copia de Supabase **dentro de tu ordenador**, usando
Docker. Ventajas: sin límites, sin internet, y puedes romperla y recrearla con un comando. Pega:
en Windows exige instalar Docker Desktop (con WSL2) y unos 4 GB de RAM libres. **No hace falta
para nada al principio**; el CI de GitHub ya prueba tus migraciones en una base local por ti.

Si algún día la quieres:

1. Instala [Docker Desktop](https://www.docker.com/products/docker-desktop) y ábrelo.
2. `npm run db:start` (la primera vez tarda varios minutos). Imprime `API_URL` y `PUBLISHABLE_KEY`.
3. En `.env`, pon esos valores. En un **móvil físico**, en vez de `127.0.0.1` usa la IP de tu
   ordenador (te la dice `npm run doctor`), p. ej. `http://192.168.1.20:54421`.
4. Usuario de prueba creado por `supabase/seed.sql`: `demo@lienzo.test` / `lienzo-demo-1234`.
5. Comandos: `npm run db:reset` (recrear desde cero), `npm run db:stop`, `npm run check:rls`
   (reglas de seguridad). Studio (ver las tablas): http://127.0.0.1:54423.

Los puertos son 544xx (no los 543xx habituales) para no chocar con otros proyectos Supabase.
