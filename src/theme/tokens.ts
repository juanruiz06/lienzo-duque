/**
 * Design tokens: la ÚNICA fuente de verdad de colores, espacios, radios y tamaños de letra.
 *
 * Regla (INV-UI-1): en componentes y pantallas NO se escriben colores a mano (`'#fff'`,
 * `'red'`…). Se usa `useTheme()` y se leen de aquí. Así cambiar la marca o el modo oscuro
 * es tocar UN archivo.
 *
 * Para cambiar la identidad visual de la app: edita `palette.light` / `palette.dark`.
 */

const light = {
  background: '#F6F4EF', // fondo de pantalla (hueso cálido, no blanco puro)
  surface: '#FFFFFF', // tarjetas, inputs
  surfaceMuted: '#EFEBE3', // chips, fondos secundarios
  border: '#E2DDD3',
  text: '#1C1A17', // texto principal
  textMuted: '#6B665E', // texto secundario
  textFaint: '#A19B91', // placeholders, iconos apagados
  primary: '#3D5AFE', // color de marca: botones principales, enlaces
  primaryPressed: '#2F47D6',
  onPrimary: '#FFFFFF', // texto encima de `primary`
  danger: '#D93F3F',
  success: '#2E9E6A',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

type Palette = { [K in keyof typeof light]: string };

const dark: Palette = {
  background: '#121212',
  surface: '#1C1C1E',
  surfaceMuted: '#26262A',
  border: '#34343A',
  text: '#F2F0EB',
  textMuted: '#A8A39A',
  textFaint: '#6E6A63',
  primary: '#7C8CFF',
  primaryPressed: '#6574F0',
  onPrimary: '#0B0D1F',
  danger: '#FF6B6B',
  success: '#4CC38A',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

export const palette = { light, dark } as const;
export type ColorScheme = keyof typeof palette;
export type ColorToken = keyof Palette;

/** Escala de espacios (múltiplos de 4). Usa `spacing.md` en vez de `16`. */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  full: 999,
} as const;

export const fontSize = {
  caption: 13,
  body: 16,
  subtitle: 18,
  title: 24,
  display: 32,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/** Tamaño mínimo de algo que se toca con el dedo (Apple recomienda 44 pt). */
export const minTouchTarget = 44;
