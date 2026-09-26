import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

/**
 * Contenedor base de cada pantalla: fondo del tema, márgenes seguros (notch, barra inferior),
 * padding lateral y, si `scroll`, desplazamiento + teclado que no tapa los inputs.
 *
 *   <Screen scroll>…formulario…</Screen>
 *   <Screen padded={false}>…lista a sangre…</Screen>
 */
export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  /** Bordes con margen seguro. Con header de navegación, el de arriba ya lo pone el header. */
  edges?: Edge[];
};

export function Screen({
  children,
  scroll = false,
  padded = true,
  edges = ['bottom', 'left', 'right'],
}: ScreenProps) {
  const t = useTheme();
  const padding = padded ? { padding: t.spacing.md, gap: t.spacing.md } : undefined;

  return (
    <SafeAreaView edges={edges} style={[styles.flex, { backgroundColor: t.color.background }]}>
      {scroll ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.grow, padding]}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.flex, padding]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flexGrow: 1 },
});
