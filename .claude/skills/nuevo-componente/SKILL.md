---
name: nuevo-componente
description: Crea un componente de UI reutilizable (en components/ui si es genérico o components/<feature> si es de una feature) usando tokens del tema, variantes con significado, accesibilidad y un test. Úsala cuando haga falta una pieza visual que se repite (avatar, chip, fila de ajustes, cabecera…).
argument-hint: '[qué componente]'
---

# Nuevo componente

Componente: $ARGUMENTS

1. **¿Ya existe?** Revisa `src/components/ui/index.ts`. Si se puede componer con los primitivos
   existentes, hazlo así en vez de crear uno nuevo.
2. **¿Dónde?**
   - Genérico (lo usaría cualquier app: Avatar, Chip, ListItem) → `src/components/ui/<Nombre>.tsx` y expórtalo en `src/components/ui/index.ts`.
   - De una feature (TaskRow, NoteCard) → `src/components/<feature>/<Nombre>.tsx`.
3. **Patrón** (mira `Button.tsx`, `Card.tsx`, `TextField.tsx`):
   - Comentario inicial: para qué sirve y un ejemplo de uso de 1-2 líneas.
   - Props tipadas (`export type XProps`), con valores por defecto sensatos.
   - Variantes con **significado** (`variant="danger"`), no con estilos sueltos (`red={true}`). Evita la proliferación de booleanos (ver skill `vercel-composition-patterns`).
   - Estilos: `StyleSheet.create` para lo estático + `useTheme()` para colores/espacios. Nada de hex.
   - Texto siempre con `<Text>` de `@/components/ui` (nunca strings sueltos fuera de un Text).
   - Pulsable → `Pressable` con `accessibilityRole`, `accessibilityLabel`, estado `pressed` visible, ≥ 44 pt.
   - Imágenes → `expo-image` (`<Image>`), no la de react-native.
4. **Test** en `src/components/ui/__tests__/<Nombre>.test.tsx` (modelo: `Button.test.tsx`):
   renderiza y comprueba el comportamiento importante (se pulsa, se deshabilita, muestra el texto).
   Recuerda: en Testing Library v14 `render` y `fireEvent` son `async` (usa `await`).
5. **Úsalo** en al menos un sitio y `npm run check`.
