import { supabase } from './supabase';

/**
 * Id del usuario con sesión, o error si no hay. Para usar dentro de `src/api/`.
 * (En pantallas usa `useSession()` de src/store/session.)
 */
export async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) {
    throw new Error('session missing');
  }
  return userId;
}
