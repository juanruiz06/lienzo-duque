---
name: preparar-pr
description: Deja un cambio listo para integrar - rama, revisión contra INVARIANTS, check completo, commit con buen mensaje, push y Pull Request con la plantilla. Úsala cuando digan "súbelo", "haz el PR", "ya está, guárdalo" o al terminar una feature.
disable-model-invocation: true
---

# Preparar el Pull Request

## 1. Rama

Si estás en `main`, crea una rama antes de commitear: `git checkout -b <tipo>/<descripcion-corta>`
(tipo: `feat`, `fix`, `docs`, `chore`, `refactor`). Nunca se trabaja directamente en `main`.

## 2. Revisión del diff

`git status` y `git diff` (y `git diff --staged`). Comprueba:

- Todo lo cambiado tiene que ver con este PR (si hay cosas mezcladas, propón separarlas).
- Sin archivos basura (`.env`, capturas, logs, `console.log`).
- Contra `INVARIANTS.md`: especialmente migraciones solo añadidas (INV-DB-4), RLS/grants, secretos,
  pantallas sin Supabase directo, colores del tema.

## 3. Verificación

```bash
npm run check
npm run check:secrets
```

Si hay cambios en `supabase/`: migración aplicada en su base de desarrollo y `npm run db:types`
hecho (el CI comprobará que las migraciones aplican desde cero, las reglas RLS y los tipos).
Si algo falla, arréglalo o explícalo; no abras un PR en rojo sin decirlo.

## 4. Commit

Mensaje en castellano, en imperativo, que diga el **qué y por qué**:
`Añade tareas con fecha límite y aviso visual cuando vencen`.
Cuerpo opcional con detalles. Commits pequeños y con sentido.

## 5. Push y PR (pide confirmación antes del push)

```bash
git push -u origin HEAD
```

```bash
gh pr create --fill
```

Rellena la plantilla (`.github/pull_request_template.md`): qué cambia, cómo probarlo, checklist
marcado con honestidad. Capturas si hay cambios visuales.

## 6. Después

Muestra el enlace del PR y explica que el CI (GitHub Actions) comprobará todo; si sale rojo,
ofrece revisarlo. Tras mergear: `git checkout main && git pull` y rama nueva para lo siguiente
(si el merge fue _squash_, no sigas trabajando en la rama vieja).
