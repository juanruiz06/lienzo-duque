---
name: actualizar-ota
description: Publica un arreglo o cambio solo de JavaScript/imágenes a las apps ya instaladas con EAS Update, sin pasar por la revisión de las tiendas, comprobando antes que no hay cambios nativos. Úsala para hotfixes urgentes o mejoras pequeñas tras publicar.
disable-model-invocation: true
argument-hint: '[canal: preview|production] [mensaje]'
---

# Actualización OTA (over-the-air)

Canal / mensaje: $ARGUMENTS

Requisito: nivel 07 (`docs/graduacion/07-actualizaciones-ota.md`, `expo-updates` instalado).

## 1. ¿Se puede mandar por OTA?

Compara con el último build publicado (tag `vX.Y.Z` o el commit del build):

```bash
git diff --stat <tag-del-build>..HEAD
```

**NO** se puede (hace falta build nuevo → `/publicar`) si cambió: `app.json` (plugins, permisos,
iconos, bundle id), `package.json` con librerías nativas nuevas o actualizadas, `eas.json`, o la
versión de Expo. Con `runtimeVersion` por _fingerprint_, EAS lo detecta: si el fingerprint cambió,
el update no llegará a los builds viejos. Explícalo si pasa.

**SÍ** se puede: pantallas, lógica, textos, estilos, imágenes, arreglos en `src/`.

Ojo con la base de datos: si el cambio JS depende de una migración, aplica la migración en la nube
**antes** y asegúrate de que no rompe la versión instalada.

## 2. Verificar y publicar (pide confirmación)

```bash
npm run check
```

Primero a `preview` y pruébalo en un build preview; luego a `production`:

```bash
npx eas-cli@latest update --channel production --environment production --message "Arregla X"
```

(O GitHub → Actions → "EAS Update".)

## 3. Después

Los usuarios lo reciben al reabrir la app (a veces hace falta abrirla dos veces). Vigila Sentry.
Si algo va mal: `npx eas-cli@latest update:rollback` o publica otro update con la corrección.
