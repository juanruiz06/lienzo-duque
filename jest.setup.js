// Se ejecuta antes de cada archivo de test.

// Variables de entorno falsas: así `src/config/env.ts` no falla al importarse en tests.
process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://127.0.0.1:54421';
process.env.EXPO_PUBLIC_SUPABASE_KEY = 'sb_publishable_test_key_for_jest_only';

// AsyncStorage usa código nativo: en tests se sustituye por su mock oficial.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
