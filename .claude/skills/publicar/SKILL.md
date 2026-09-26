---
name: publicar
description: Prepara y lanza una versión a App Store y Google Play con EAS - checklist previo, versión, build de producción, envío a TestFlight/Play y ficha de tienda. Úsala cuando quieran sacar una versión nueva a las tiendas.
disable-model-invocation: true
argument-hint: '[versión, p. ej. 1.2.0] [ios|android|all]'
---

# Publicar en las tiendas

Versión / plataforma: $ARGUMENTS

Requisitos: niveles 02 y 05 de `docs/graduacion/`. Si no están, ofrece `/graduar`.
Cada build y envío es una acción externa: **pide confirmación** antes de lanzarlos.

## 1. Checklist previo (no lances nada si algo falla)

- [ ] En `main`, actualizado, con el CI en verde (`gh pr checks` / GitHub Actions).
- [ ] `npm run check` y `npm run check:secrets` en verde, y el CI del último PR en verde (incluye `check:rls`).
- [ ] Migraciones de este release ya aplicadas en la nube **antes** del build (la app nueva las necesita).
- [ ] Edge Functions nuevas/cambiadas desplegadas.
- [ ] Probado en un móvil real con un build `preview` (no solo en Expo Go/simulador).
- [ ] Borrar cuenta funciona (INV-STORE-1) y la cuenta demo para revisores existe y funciona.
- [ ] Política de privacidad actualizada si recoges datos nuevos (y las fichas de privacidad de las tiendas).

## 2. Versión

`version` en `app.json` (semver): parche `1.0.1` = arreglos; menor `1.1.0` = funciones nuevas;
mayor `2.0.0` = cambios grandes. El número de build lo incrementa EAS solo (`autoIncrement`).
Commit: `Versión 1.1.0`.

## 3. Build + envío

```bash
npx eas-cli@latest build --profile production --platform all --auto-submit
```

(O GitHub → Actions → "EAS Build" con `profile=production`, `submit=true`.) Sigue el progreso en expo.dev.

## 4. En las consolas (lo hace la persona; guíala)

- **iOS**: App Store Connect → TestFlight (probar) → nueva versión → notas "Novedades" en castellano → enviar a revisión.
- **Android**: Play Console → pista interna/cerrada → probar → producción (despliegue gradual recomendado: 10-20 %).

## 5. Después

- Etiqueta: `git tag v1.1.0 && git push --tags` (confirma antes del push).
- Vigila errores (Sentry) y métricas (PostHog) las primeras 48 h.
- Si sale un fallo solo de JavaScript → `/actualizar-ota` en vez de un build nuevo.
