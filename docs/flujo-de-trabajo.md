# Flujo de trabajo

Cómo se trabaja en este repo en el día a día: de una idea a un cambio publicado, con Git, GitHub y
Claude Code. Parece mucho proceso para una persona sola, pero es lo que evita perder trabajo y
romper la app sin darte cuenta.

## El ciclo

```
idea → /planificar → rama → construir (/nueva-feature…) → npm run check → /preparar-pr → CI verde → merge a main
```

### 1. Idea → spec

Para cualquier cosa que toque la base de datos o más de una pantalla, escribe primero una spec
corta en `docs/specs/` (plantilla: `docs/specs/_plantilla.md`). Con Claude: `/planificar <tu idea>`.
Diez minutos de pensar ahorran horas de rehacer.

### 2. Rama

`main` es la versión buena, la que funciona. Nunca se trabaja directamente en ella. Cada cambio va
en una **rama** (una copia paralela):

```bash
git checkout main
```

```bash
git pull
```

```bash
git checkout -b feat/tareas
```

Nombres: `feat/…` (función nueva), `fix/…` (arreglo), `docs/…`, `chore/…` (mantenimiento).

### 3. Construir

Con Claude Code abierto en la carpeta del proyecto, pide lo que quieres en lenguaje normal o usa
una skill. Mientras, ten `npm start` en marcha para ver los cambios en el móvil al instante.

Guarda el progreso a menudo con commits pequeños (una "foto" del proyecto):

```bash
git add -A
```

```bash
git commit -m "Añade la tabla de tareas con sus reglas de acceso"
```

Al hacer commit, **Husky** formatea y revisa automáticamente los archivos que cambiaste.

### 4. Comprobar

```bash
npm run check
```

Y prueba el cambio en la app de verdad. Los tests no ven si un botón queda feo.

### 5. Pull Request (PR)

Un PR es pedir "mete mi rama en `main`". GitHub ejecuta el **CI** (`.github/workflows/ci.yml`):
tipos, lint, formato, tests, secretos, y si tocaste la base, que las migraciones aplican limpias y
las reglas RLS están bien. Con Claude: `/preparar-pr` lo hace todo (revisión, commit, push y PR).

### 6. Merge

Si el CI está en verde y lo has probado, pulsa **"Squash and merge"** en GitHub. Después:

```bash
git checkout main
```

```bash
git pull
```

Y rama nueva para lo siguiente. (Tras un _squash_, la rama vieja no se reutiliza.)

## Trabajar con Claude Code

Claude lee automáticamente `CLAUDE.md` → `AGENTS.md` (el mapa del proyecto) y conoce las reglas de
`INVARIANTS.md`. Consejos:

- **Sé concreto con el qué, no con el cómo**: "quiero que cada nota pueda marcarse como favorita
  y que las favoritas salgan arriba" funciona mejor que "añade un booleano".
- **Una cosa cada vez.** Termina, comprueba, commit, y lo siguiente.
- **Pide que te explique**: "explícame qué has cambiado" o `/explicar`. Aprenderás rapidísimo.
- **Si algo se tuerce**, `git diff` enseña qué cambió y `git checkout -- <archivo>` lo deshace
  (pregunta a Claude antes si no estás seguro).
- **No pegues claves secretas en el chat** si no hace falta. Las claves van en los paneles de
  Supabase/EAS/GitHub.

### Skills disponibles

| Quiero…                                | Escribe                      |
| -------------------------------------- | ---------------------------- |
| Configurar mi máquina la primera vez   | `/empezar`                   |
| Entender algo                          | `/explicar <qué>`            |
| Pensar una feature antes de hacerla    | `/planificar <idea>`         |
| Construir una feature completa         | `/nueva-feature <qué>`       |
| Solo cambiar la base de datos          | `/nueva-tabla <qué>`         |
| Una pantalla nueva                     | `/nueva-pantalla <cuál>`     |
| Un componente reutilizable             | `/nuevo-componente <cuál>`   |
| Que se vea mejor                       | `/pulir-ui <pantalla>`       |
| Fotos                                  | `/subir-imagenes <para qué>` |
| Código de servidor con claves          | `/edge-function <qué>`       |
| Medir algo                             | `/nuevo-evento <qué>`        |
| Mandar emails                          | `/enviar-email <cuál>`       |
| Arreglar un fallo                      | `/arreglar-bug <qué pasa>`   |
| Tests                                  | `/escribir-tests <qué>`      |
| Revisar la seguridad                   | `/revisar-seguridad`         |
| Subir mis cambios                      | `/preparar-pr`               |
| Siguiente nivel (GitHub, tiendas…)     | `/graduar`                   |
| Sacar versión a las tiendas            | `/publicar`                  |
| Arreglo rápido sin pasar por la tienda | `/actualizar-ota`            |
| Actualizar Expo                        | `/actualizar-expo <versión>` |

## Base de datos: desarrollo vs producción

|                            | Tu proyecto de desarrollo (nube, Free)                  | Producción (cuando publiques)                                                            |
| -------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Qué es                     | El proyecto que conectaste con `npm run setup`          | Un proyecto nuevo y limpio ([nivel 10](graduacion/10-escalar-y-pagar-mas.md), sección 2) |
| Para qué                   | Desarrollar y probar sin miedo                          | Usuarios reales                                                                          |
| Se puede romper            | Sí: datos y usuarios de prueba, bórralos cuando quieras | **No.** Solo cambia con migraciones revisadas                                            |
| Datos                      | De prueba (los que creas tú desde la app)               | Reales                                                                                   |
| Cómo le llegan los cambios | `npm run db:push` desde tu ordenador                    | El workflow `deploy-supabase.yml` al mergear en `main`                                   |

Cambios de esquema: migración nueva (`/nueva-tabla`) → `npm run db:push` a tu proyecto de
desarrollo (te enseña la migración y pide confirmación) → `npm run db:types` → probar en el móvil
→ PR (el CI crea una base desde cero con todas tus migraciones, revisa las reglas RLS y que los
tipos están al día) → merge. Cuando tengas producción, el merge se la aplica allí. Nunca crees
tablas desde el dashboard (INV-DB-7).

> **Si usas base local (Docker, opcional):** `npm run db:reset` la recrea desde cero con las
> migraciones y el seed (usuario demo), y `npm run check:rls` revisa las reglas en tu ordenador.
> En modo nube, `check:rls` lo ejecuta el CI en cada PR.

## Dos consejos que ahorran disgustos

1. **Haz commit antes de pedir un cambio grande.** Si no te gusta el resultado, vuelves atrás.
2. **Si el CI sale rojo, no lo ignores.** Pregúntale a Claude qué dice el error: casi siempre es
   algo pequeño, y si se acumula, se hace grande.
