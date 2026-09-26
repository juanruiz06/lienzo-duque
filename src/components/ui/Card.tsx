import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

/** Tarjeta: superficie con borde suave. Si le pasas `onPress`, se puede tocar. */
export type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function Card({ children, onPress, accessibilityLabel }: CardProps) {
  const t = useTheme();
  const base = {
    backgroundColor: t.color.surface,
    borderColor: t.color.border,
    borderRadius: t.radius.lg,
    padding: t.spacing.md,
    gap: t.spacing.xs,
  };

  if (!onPress) {
    return <View style={[styles.card, base]}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [styles.card, base, pressed && { opacity: 0.7 }]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth * 2 },
});
