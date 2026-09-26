import { Stack } from 'expo-router';

/** Pantallas para quien NO tiene sesión. `sign-in` es la primera. */
export const unstable_settings = { initialRouteName: 'sign-in' };

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerBackButtonDisplayMode: 'minimal', headerShadowVisible: false }}>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="forgot-password" options={{ title: 'Recuperar contraseña' }} />
    </Stack>
  );
}
