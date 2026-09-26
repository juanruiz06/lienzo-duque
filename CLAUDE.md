@AGENTS.md

# Específico de Claude Code

## Con quién trabajas

La persona dueña de este repo está **empezando** a desarrollar, usa **Windows** (sin Mac), ve la
app en su móvil con **Expo Go** y su base de datos es un proyecto **gratuito** de Supabase en la
nube (ver "Entorno del dueño" en AGENTS.md). Si se atasca instalando o arrancando, remítele a
`SETUP.html` (guía visual) o usa `/empezar`. Por eso:

- **Explica antes de hacer** cuando el cambio sea grande: 2-4 frases de plan en lenguaje llano.
- **Enseña de paso**: al terminar, una o dos frases de "qué he tocado y por qué", mencionando los
  archivos con enlaces. Si aparece un concepto nuevo (RLS, migración, OTA…), explícalo en una
  frase o enlaza `docs/glosario.md`.
- **No la inundes**: nada de muros de texto ni de listas de 10 opciones. Recomienda UNA y di por qué.
- **Protégela de errores caros**: antes de algo irreversible o que cueste dinero (borrar datos,
  `db push` a la nube, publicar en tiendas, contratar un plan) explica qué pasará y pide un sí.
- Si pide algo que rompe `INVARIANTS.md`, no lo hagas sin más: explica el riesgo con un ejemplo y
  ofrece la forma correcta.

## Skills del proyecto

Están en `.claude/skills/`. Se invocan escribiendo `/nombre` (o Claude las usa solo cuando encajan).
Si la persona no sabe por dónde empezar, sugiérele la adecuada. Para cualquier tarea de más de un
par de archivos, la recomendada es **`/implement-task`**: orquesta las demás (y los agentes de
`.claude/agents/`) con paradas para que el dueño decida.

| Skill                   | Para qué                                                                                 |
| ----------------------- | ---------------------------------------------------------------------------------------- |
| `/empezar`              | Primera vez: dejar la máquina lista y la app funcionando                                 |
| `/explicar`             | Entender un archivo, un concepto o "cómo funciona X" sin jerga                           |
| `/implement-task`       | **El flujo completo** para cualquier tarea: entender → plan → construir → verificar → PR |
| `/planificar`           | Convertir una idea en una spec corta (docs/specs) antes de programar                     |
| `/nueva-feature`        | Feature completa: tabla + RLS + api + hooks + pantallas + tests                          |
| `/nueva-tabla`          | Migración de base de datos segura (RLS + permisos + tipos)                               |
| `/nueva-pantalla`       | Pantalla nueva con navegación y sus estados                                              |
| `/nuevo-componente`     | Componente de UI reutilizable con el tema y accesibilidad                                |
| `/pulir-ui`             | Revisar y mejorar el aspecto/usabilidad de una pantalla                                  |
| `/subir-imagenes`       | Fotos: elegir de la galería/cámara y guardarlas en Supabase Storage                      |
| `/edge-function`        | Código de servidor (con claves secretas) en Supabase                                     |
| `/nuevo-evento`         | Añadir un evento de analítica al catálogo                                                |
| `/enviar-email`         | Enviar emails desde el servidor con Resend                                               |
| `/arreglar-bug`         | Encontrar y arreglar un fallo con método                                                 |
| `/escribir-tests`       | Añadir tests a lo que ya existe                                                          |
| `/revisar-arquitectura` | Chequeo de diseño de sistemas: capas, datos, rendimiento, fallos, coste                  |
| `/anti-hackeo`          | Auditoría de seguridad completa como un atacante (+ `npm run check:ataque`)              |
| `/revisar-seguridad`    | Chequeo rápido de seguridad tras tocar tablas                                            |
| `/preparar-pr`          | Comprobar todo, commit, push y abrir el Pull Request                                     |
| `/graduar`              | Subir de nivel (nube, builds, Sentry, emails, tiendas, push, pagos…)                     |
| `/publicar`             | Build de producción y envío a App Store / Google Play                                    |
| `/actualizar-ota`       | Publicar un arreglo solo-JS sin pasar por la tienda                                      |
| `/actualizar-expo`      | Subir de versión de Expo SDK con seguridad                                               |

Además: `vercel-react-native-skills` (rendimiento RN) y `vercel-composition-patterns`
(arquitectura de componentes), y el plugin oficial de Expo (`.claude/settings.json`).

## MCP

`.mcp.json` conecta con el **MCP de Supabase local** (`http://127.0.0.1:54421/mcp`), que solo
existe en el modo local con Docker (`npm run db:start`). En el modo nube (el normal) no está
disponible y no pasa nada; para leer la base de la nube, ver
`docs/graduacion/01-nube-github-y-ci.md` (MCP en solo lectura, opcional).

## Antes de decir "hecho"

1. `npm run check` en verde.
2. Si tocaste la base de datos: aplica la migración (nube: `npm run db:push` con su OK; local:
   `npm run db:reset`), luego `npm run db:types`. `npm run check:rls` solo en modo local; en modo
   nube lo comprueba el CI en el PR.
3. Si tocaste UI o flujos: pídele que lo pruebe en su móvil (Expo Go) diciéndole exactamente qué
   tocar y qué debería ver; tú puedes comprobarlo antes en web (`npm start` → `w`).
4. Resume en 2-4 frases qué cambió y cómo probarlo.
