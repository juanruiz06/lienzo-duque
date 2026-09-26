import { QueryClientProvider } from '@tanstack/react-query';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  type ErrorBoundaryProps,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/queryClient';
import { Button, Screen, Text } from '@/components/ui';
import { useAuthListener } from '@/hooks/useAuthListener';
import { initObservability, reportError } from '@/observability';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';

/**
 * LAYOUT RAÍZ: lo primero que se monta. Aquí se enchufan los "providers" (caché de datos,
 * gestos, márgenes seguros, tema) y se decide qué pantallas se ven según haya sesión o no.
 *
 * `Stack.Protected`: si `guard` es false, esas rutas NO existen. Al iniciar sesión, expo-router
 * lleva solo a la app; al cerrarla, a (auth). No hace falta navegar a mano tras login/logout.
 */

initObservability();
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <RootNavigator />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  useAuthListener();
  const t = useTheme();
  const initialized = useSession((s) => s.initialized);
  const isSignedIn = useSession((s) => s.session !== null);

  useEffect(() => {
    if (initialized) {
      void SplashScreen.hideAsync();
    }
  }, [initialized]);

  // Mientras no sabemos si hay sesión guardada, se queda el splash (evita un parpadeo del login).
  if (!initialized) {
    return null;
  }

  const navigationTheme = t.scheme === 'dark' ? DarkTheme : DefaultTheme;

  return (
    <ThemeProvider
      value={{
        ...navigationTheme,
        colors: {
          ...navigationTheme.colors,
          primary: t.color.primary,
          background: t.color.background,
          card: t.color.surface,
          text: t.color.text,
          border: t.color.border,
        },
      }}
    >
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}

/**
 * Si una pantalla revienta con un error no controlado, expo-router enseña esto en vez de una
 * pantalla en blanco. El error se reporta (a Sentry cuando lo conectes).
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    reportError(error, { where: 'root-error-boundary' });
  }, [error]);

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']}>
      <Text variant="title">Algo se ha roto</Text>
      <Text color="textMuted">
        Hemos registrado el error. Prueba otra vez y, si sigue pasando, cierra y abre la app.
      </Text>
      <Button label="Reintentar" onPress={() => void retry()} />
    </Screen>
  );
}
