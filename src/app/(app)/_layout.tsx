import { Stack } from 'expo-router';

/** Pantallas para quien SÍ tiene sesión: las tabs y, encima, el editor de notas (modal). */
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="note/[id]" options={{ presentation: 'modal', title: 'Nota' }} />
    </Stack>
  );
}
