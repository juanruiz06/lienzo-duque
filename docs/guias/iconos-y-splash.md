# Icono y pantalla de carga (splash)

Los archivos viven en `assets/images/` y se configuran en `app.json`.

| Archivo                       | Tamaño                                                              | Uso                                                       |
| ----------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| `icon.png`                    | 1024×1024, sin transparencia, sin esquinas redondeadas              | Icono general (Apple redondea solo)                       |
| `android-icon-foreground.png` | 1024×1024, dibujo centrado en el ~66 % interior, fondo transparente | Icono adaptativo de Android (capa delantera)              |
| `android-icon-background.png` | 1024×1024                                                           | Capa trasera (o usa solo `backgroundColor` en `app.json`) |
| `android-icon-monochrome.png` | 1024×1024, una tinta                                                | Iconos temáticos de Android 13+                           |
| `splash-icon.png`             | ~1024×1024, fondo transparente                                      | Logo del splash (se centra sobre `backgroundColor`)       |
| `favicon.png`                 | 48×48                                                               | Pestaña del navegador (web)                               |

`assets/expo.icon/` es el formato de iconos "Liquid Glass" de iOS 26 (se crea con la app **Icon
Composer** de Apple). Si no lo usas, borra `"icon": "./assets/expo.icon"` de `ios` en `app.json`
y se usará `icon.png`.

## Pasos

1. Diseña el icono (Figma, Canva…) a 1024×1024. Que se entienda en pequeño: una forma, pocos colores.
2. Sustituye los archivos manteniendo **los mismos nombres**.
3. Colores del splash: `app.json` → plugin `expo-splash-screen` → `backgroundColor` (y `dark.backgroundColor`).
   Usa los mismos que `background` en `src/theme/tokens.ts`.
4. En Expo Go no verás tu icono (sale el de Expo Go). Se ve en un development build o build de preview
   ([nivel 2](../graduacion/02-builds-con-eas.md)). Tras cambiar iconos/splash hace falta **build nuevo** (no vale OTA).

Docs: https://docs.expo.dev/develop/user-interface/splash-screen-and-app-icon/
