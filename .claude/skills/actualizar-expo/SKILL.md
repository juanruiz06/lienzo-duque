---
name: actualizar-expo
description: Sube el proyecto a una versión nueva de Expo SDK (y React Native) de forma segura - leer el changelog, actualizar dependencias con expo install --fix, arreglar incompatibilidades, verificar y documentar. Úsala cuando salga un SDK nuevo o una librería lo exija.
disable-model-invocation: true
argument-hint: '[versión de SDK destino, p. ej. 58]'
---

# Actualizar Expo SDK

Destino: SDK $ARGUMENTS

Expo saca un SDK cada ~4 meses. No hace falta estar siempre en el último, pero conviene no
quedarse más de 1-2 atrás (las tiendas exigen versiones recientes de iOS/Android SDK).

## 1. Preparar

- Rama nueva: `git checkout -b chore/expo-sdk-$ARGUMENTS`.
- `npm run check` en verde ANTES de empezar (si no, no sabrás qué rompió la actualización).
- Lee el changelog/guía de actualización oficial del SDK destino (https://expo.dev/changelog) y
  anota cambios incompatibles que afecten a lo que usamos (expo-router, AsyncStorage, reanimated…).

## 2. Actualizar (de un SDK en un SDK)

```bash
npm install expo@^$ARGUMENTS.0.0
npx expo install --fix
npx expo-doctor
```

Resuelve lo que diga `expo-doctor`. Dev-deps de Expo (`jest-expo`, `eslint-config-expo`) también a la versión del SDK.

## 3. Arreglar y verificar

```bash
npm run check
```

Arranca la app en iOS, Android y web y recorre: login, notas (crear/editar/borrar), perfil, borrar cuenta.
Expo Go del móvil debe ser compatible con el SDK nuevo (actualízalo desde la tienda).

## 4. Consecuencias

- Es un cambio **nativo**: hace falta **build nuevo** (no vale OTA) y nuevos development builds.
- Actualiza `AGENTS.md` (versión de Expo y RN, enlace a docs versionadas) y `package.json`.
- PR con `/preparar-pr` indicando que requiere build nuevo.
