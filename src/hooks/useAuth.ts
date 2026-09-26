import { useMutation } from '@tanstack/react-query';

import { deleteAccount, requestPasswordReset, signIn, signOut, signUp } from '@/api/auth';
import { trackEvent } from '@/observability';
import type { SignInInput, SignUpInput } from '@/utils/validation';

/**
 * Hooks de autenticación. No hace falta navegar tras entrar o salir: el layout raíz
 * (src/app/_layout.tsx) enseña las pantallas de login o las de la app según haya sesión.
 */

export function useSignIn() {
  return useMutation({
    mutationKey: ['auth', 'signIn'],
    mutationFn: (input: SignInInput) => signIn(input),
    onSuccess: () => trackEvent('sign_in', { method: 'email' }),
  });
}

export function useSignUp() {
  return useMutation({
    mutationKey: ['auth', 'signUp'],
    mutationFn: (input: SignUpInput) => signUp(input),
    onSuccess: () => trackEvent('sign_up', { method: 'email' }),
  });
}

export function useRequestPasswordReset() {
  return useMutation({
    mutationKey: ['auth', 'passwordReset'],
    mutationFn: (email: string) => requestPasswordReset(email),
  });
}

export function useSignOut() {
  return useMutation({
    mutationKey: ['auth', 'signOut'],
    mutationFn: signOut,
    onSuccess: () => trackEvent('sign_out', {}),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationKey: ['auth', 'deleteAccount'],
    mutationFn: deleteAccount,
    onSuccess: () => trackEvent('account_deleted', {}),
  });
}
