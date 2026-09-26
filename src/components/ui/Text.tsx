import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { useTheme, type ColorToken } from '@/theme';

/**
 * Texto de la app. Usa SIEMPRE este en vez del `<Text>` de react-native: así todos los textos
 * comparten tamaños y colores del tema (y el modo oscuro funciona solo).
 *
 *   <Text variant="title">Mis notas</Text>
 *   <Text variant="caption" color="textMuted">hace 5 min</Text>
 */
export type TextVariant = 'display' | 'title' | 'subtitle' | 'body' | 'bodyStrong' | 'caption';

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  color?: ColorToken;
  align?: 'left' | 'center' | 'right';
};

export function Text({ variant = 'body', color = 'text', align, style, ...rest }: TextProps) {
  const t = useTheme();
  const variants = {
    display: { fontSize: t.fontSize.display, fontWeight: t.fontWeight.bold, lineHeight: 38 },
    title: { fontSize: t.fontSize.title, fontWeight: t.fontWeight.bold, lineHeight: 30 },
    subtitle: { fontSize: t.fontSize.subtitle, fontWeight: t.fontWeight.semibold, lineHeight: 24 },
    body: { fontSize: t.fontSize.body, fontWeight: t.fontWeight.regular, lineHeight: 22 },
    bodyStrong: { fontSize: t.fontSize.body, fontWeight: t.fontWeight.semibold, lineHeight: 22 },
    caption: { fontSize: t.fontSize.caption, fontWeight: t.fontWeight.regular, lineHeight: 18 },
  } as const;

  return (
    <RNText
      style={[variants[variant], { color: t.color[color], textAlign: align }, style]}
      {...rest}
    />
  );
}
