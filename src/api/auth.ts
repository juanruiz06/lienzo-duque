import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { supabase } from './supabase';
import { AppError } from '@/utils/errors';
import {
  emailSchema,
  parseOrThrow,
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from '@/utils/validation';

/**
 * Autenticación con email + contraseña (Supabase Auth).
 *
 * Login social (Apple/Google) → docs/graduacion/06-login-social.md.
 */

export async function signIn(input: SignInInput): Promise<void> {
  const { email, password } = parseOrThrow(signInSchema, input);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }
}

/**
 * Crea la cuenta. Devuelve `needsConfirmation: true` si el proyecto exige confirmar el email
 * (en la nube viene activado por defecto): en ese caso NO hay sesión hasta que el usuario
 * pulse el enlace del correo.
 */
export async function signUp(input: SignUpInput): Promise<{ needsConfirmation: boolean }> {
  const { email, password, displayName } = parseOrThrow(signUpSchema, input);
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // El trigger `handle_new_user` (migración base) copia esto al perfil.
      data: { display_name: displayName },
      emailRedirectTo: Linking.createURL('/sign-in'),
    },
  });
  if (error) {
    throw error;
  }
  return { needsConfirmation: data.session === null };
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}

export async function requestPasswordReset(email: string): Promise<void> {
  const parsed = parseOrThrow(emailSchema, email);
  const { error } = await supabase.auth.resetPasswordForEmail(parsed, {
    redirectTo: Linking.createURL('/sign-in'),
  });
  if (error) {
    throw error;
  }
}

/**
 * Borra la cuenta y todos sus datos (lo exigen Apple y Google). Lo hace la Edge Function
 * `delete-account` porque necesita permisos de administrador que la app no puede tener.
 */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) {
    throw new AppError('No se pudo borrar la cuenta. Inténtalo de nuevo.', 'delete_account', {
      cause: error,
    });
  }
  // La sesión ya no vale (el usuario no existe): la limpiamos en local.
  await supabase.auth.signOut({ scope: 'local' });
}

/**
 * Escucha los cambios de sesión (entrar, salir, token refrescado…). Se llama al primer
 * evento con la sesión guardada en el dispositivo (o `null`). Devuelve la función para dejar
 * de escuchar. La usa `useAuthListener` en el layout raíz; no hace falta en ningún otro sitio.
 */
export function onSessionChange(callback: (session: Session | null) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}
