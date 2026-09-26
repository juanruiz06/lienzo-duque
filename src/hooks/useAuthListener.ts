import { useEffect } from 'react';

import { onSessionChange } from '@/api/auth';
import { queryClient } from '@/api/queryClient';
import { identifyUser, resetAnalytics, setReporterUser } from '@/observability';
import { useSession } from '@/store/session';

/**
 * Mantiene `useSession` sincronizado con Supabase. Se monta UNA vez, en src/app/_layout.tsx.
 *
 * Al cambiar de usuario (o cerrar sesión) se vacía la caché de React Query: si no, el
 * siguiente usuario de este móvil vería un instante las notas del anterior.
 */
export function useAuthListener(): void {
  const setSession = useSession((s) => s.setSession);

  useEffect(() => {
    let currentUserId: string | null = null;
    return onSessionChange((session) => {
      const nextUserId = session?.user.id ?? null;
      if (nextUserId !== currentUserId) {
        if (currentUserId !== null) {
          queryClient.clear();
        }
        currentUserId = nextUserId;
        if (nextUserId) {
          identifyUser(nextUserId);
          setReporterUser({ id: nextUserId });
        } else {
          resetAnalytics();
          setReporterUser(null);
        }
      }
      setSession(session);
    });
  }, [setSession]);
}
