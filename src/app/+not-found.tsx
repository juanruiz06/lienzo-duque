import { Link, Stack } from 'expo-router';

import { Screen, Text } from '@/components/ui';
import { useTheme } from '@/theme';

export default function NotFoundScreen() {
  const t = useTheme();
  return (
    <Screen>
      <Stack.Screen options={{ title: 'Ups', headerShown: true }} />
      <Text variant="title">Esta pantalla no existe</Text>
      <Link href="/" style={{ color: t.color.primary }}>
        Volver al inicio
      </Link>
    </Screen>
  );
}
