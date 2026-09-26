import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from '@/config/env';
import type { Database } from '@/types/database';

/**
 * El cliente de Supabase. Hay UNO para toda la app.
 *
 * ⚠️ Regla de arquitectura (INV-ARCH-1): solo los archivos de `src/api/` importan esto.
 * Pantallas y componentes piden datos a través de los hooks de `src/hooks/`, que llaman a
 * `src/api/`. ESLint lo impide si te lo saltas.
 *
 * `Database` son los tipos generados de tu esquema (`npm run db:types`): gracias a ellos
 * `supabase.from('notes')` sabe qué columnas existen.
 */
export const supabase = createClient<Database>(
  env.EXPO_PUBLIC_SUPABASE_URL,
  env.EXPO_PUBLIC_SUPABASE_KEY,
  {
    auth: {
      // La sesión se guarda en el dispositivo para no pedir login cada vez.
      // (Nivel avanzado: guardarla cifrada en el Keychain → docs/graduacion/99-mas-alla.md)
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  },
);

// En móvil, refresca el token solo mientras la app está en primer plano (recomendación oficial
// de Supabase para React Native: evita peticiones con la app en segundo plano).
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
