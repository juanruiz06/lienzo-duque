---
name: nueva-pantalla
description: Añade una pantalla nueva con expo-router (ruta, pestaña, modal o detalle con parámetro) siguiendo las convenciones de UI del proyecto - Screen, primitivos, tema, estados de carga/error/vacío y accesibilidad. Úsala para cualquier pantalla o cambio de navegación.
argument-hint: '[qué pantalla y dónde]'
---

# Nueva pantalla

Pantalla: $ARGUMENTS

## Dónde va el archivo (expo-router: archivo = ruta)

| Quiero…                                 | Archivo                                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Pantalla que exige sesión               | `src/app/(app)/<nombre>.tsx`                                                                                         |
| Pestaña nueva en la barra de abajo      | `src/app/(app)/(tabs)/<nombre>.tsx` + `Tabs.Screen` en `(tabs)/_layout.tsx` (icono Ionicons: https://icons.expo.fyi) |
| Detalle con parámetro (`/task/123`)     | `src/app/(app)/task/[id].tsx` → `useLocalSearchParams<{ id: string }>()`                                             |
| Modal                                   | Como arriba + `<Stack.Screen name="…" options={{ presentation: 'modal' }} />` en `(app)/_layout.tsx`                 |
| Pantalla sin sesión (onboarding, legal) | `src/app/(auth)/<nombre>.tsx`                                                                                        |

Navegar: `router.push('/ruta')` o `router.push({ pathname: '/task/[id]', params: { id } })`,
o `<Link href="/ruta">`. Título: `<Stack.Screen options={{ title: '…' }} />` dentro de la pantalla.
Rutas en `src/app/` = solo pantallas; nada de utilidades ahí.

## Plantilla

Mira `src/app/(app)/(tabs)/index.tsx` (lista) y `src/app/(app)/note/[id].tsx` (formulario).

```tsx
export default function TasksScreen() {
  const tasks = useTasks();               // SIEMPRE un hook; nunca Supabase aquí (INV-ARCH-1)
  if (tasks.isPending) return <LoadingState />;
  if (tasks.error) return <ErrorState error={tasks.error} onRetry={() => void tasks.refetch()} />;
  return (
    <Screen padded={false}>
      <FlatList data={tasks.data} … ListEmptyComponent={<EmptyState title="…" />} />
    </Screen>
  );
}
```

## Reglas de UI

- Contenedor `<Screen>` (`scroll` si hay formulario: gestiona teclado y márgenes seguros).
- Solo primitivos de `@/components/ui` (`Text`, `Button`, `TextField`, `Card`…). Si falta uno reutilizable → `/nuevo-componente`.
- Colores/espacios de `useTheme()`: `t.color.*`, `t.spacing.*`. Nada de hex (INV-UI-1).
- Textos en castellano, claros y cortos. Errores con `toUserMessage`.
- Listas con `FlatList` (nunca `.map` dentro de `ScrollView` para listas largas), `keyExtractor`, pull-to-refresh si hay datos del servidor.
- Formularios: estado con `useState`, validación con `validateForm(schema, valores)`, error bajo cada campo, botón con `loading`.
- Accesibilidad: `accessibilityRole`/`accessibilityLabel` en lo pulsable; tamaños ≥ 44 pt.
- Confirmar destructivos con `confirm()` de `@/utils/confirm`.

## Verificación

`npm run check` y ábrela en la app (simulador/Expo Go y, si puedes, modo oscuro). Comprueba los
4 estados (desconecta la red o para Supabase para ver el de error).
