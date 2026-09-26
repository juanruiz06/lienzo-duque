import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps } from 'react-native';

import { Text } from './Text';
import { minTouchTarget, useTheme } from '@/theme';

/**
 * Botón de la app. Tres variantes, cada una con UN significado:
 *  - primary   → LA acción principal de la pantalla (una por pantalla).
 *  - secondary → acciones normales.
 *  - danger    → acciones destructivas (borrar). Pide confirmación antes.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export type ButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  ...rest
}: ButtonProps) {
  const t = useTheme();
  const isDisabled = Boolean(disabled) || loading;

  const background = {
    primary: t.color.primary,
    secondary: t.color.surfaceMuted,
    danger: 'transparent',
  }[variant];
  const pressedBackground = {
    primary: t.color.primaryPressed,
    secondary: t.color.border,
    danger: t.color.surfaceMuted,
  }[variant];
  const labelColor = ({ primary: 'onPrimary', secondary: 'text', danger: 'danger' } as const)[
    variant
  ];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        {
          borderRadius: t.radius.full,
          backgroundColor: pressed ? pressedBackground : background,
          opacity: isDisabled ? 0.5 : 1,
        },
      ]}
      {...rest}
    >
      <View style={styles.content}>
        {loading ? <ActivityIndicator color={t.color[labelColor]} /> : null}
        <Text variant="bodyStrong" color={labelColor}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget + 4,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
