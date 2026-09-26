import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';

import { useTheme } from '@/theme';

/**
 * Barra de pestañas de abajo. Cada `Tabs.Screen` es un archivo de esta carpeta.
 * Para añadir una pestaña: crea `mi-pestana.tsx` aquí y añade su `Tabs.Screen`.
 * Iconos disponibles: https://icons.expo.fyi (familia Ionicons).
 */
export default function TabsLayout() {
  const t = useTheme();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: t.color.primary,
        tabBarInactiveTintColor: t.color.textFaint,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Notas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
