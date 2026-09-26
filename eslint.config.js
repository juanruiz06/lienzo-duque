// ESLint = detecta errores y hace CUMPLIR la arquitectura. (El formato lo pone Prettier.)
// Base: eslint-config-expo (entiende React Native, Expo y TypeScript).
const expoConfig = require('eslint-config-expo/flat');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  ...expoConfig,
  eslintConfigPrettier,
  {
    ignores: [
      'node_modules/**',
      'ios/**',
      'android/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'src/types/database.ts', // generado por `npm run db:types`
      'supabase/functions/**', // Deno (servidor), no React Native
      '.claude/**',
    ],
  },
  {
    rules: {
      // Usa `log` de src/observability, no console.log (que en producción ensucia y no se ve).
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // INV-ARCH-1: pantallas y componentes NO hablan con Supabase directamente.
    // Flujo obligatorio: pantalla → hook (src/hooks) → api (src/api) → Supabase.
    files: ['src/app/**/*.{ts,tsx}', 'src/components/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@supabase/supabase-js',
              message:
                'Las pantallas no usan Supabase directamente. Crea una función en src/api/ y un hook en src/hooks/ (skill /nueva-feature).',
            },
          ],
          patterns: [
            {
              group: ['@/api/supabase', '**/api/supabase'],
              message:
                'Las pantallas no usan el cliente de Supabase. Usa un hook de src/hooks/ (INV-ARCH-1).',
            },
          ],
        },
      ],
    },
  },
  {
    // Archivos de Jest: conocen los globales `jest`, `describe`, `it`, `expect`…
    files: ['jest.setup.js', '**/__tests__/**'],
    languageOptions: { globals: require('globals').jest },
  },
  {
    // Scripts de terminal: console.log es su salida normal.
    files: ['scripts/**/*.{ts,js}', '*.config.js'],
    rules: { 'no-console': 'off' },
  },
];
