import { useColorScheme } from 'react-native';

import { fontSize, fontWeight, palette, radius, spacing, type ColorScheme } from './tokens';

export type Theme = {
  scheme: ColorScheme;
  color: (typeof palette)[ColorScheme];
  spacing: typeof spacing;
  radius: typeof radius;
  fontSize: typeof fontSize;
  fontWeight: typeof fontWeight;
};

/**
 * Devuelve el tema activo (claro u oscuro según el sistema).
 *
 *   const t = useTheme();
 *   <View style={{ backgroundColor: t.color.surface, padding: t.spacing.md }} />
 */
export function useTheme(): Theme {
  const scheme: ColorScheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return { scheme, color: palette[scheme], spacing, radius, fontSize, fontWeight };
}
