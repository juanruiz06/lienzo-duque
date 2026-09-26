import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

/**
 * Estado GLOBAL de la sesión (Zustand).
 *
 * Cuándo usar Zustand vs React Query:
 *  - React Query → datos que vienen del servidor (notas, perfil…). Casi todo.
 *  - Zustand     → estado de la app que no es "del servidor": la sesión, preferencias locales,
 *                  un borrador… Poco y pequeño.
 *
 * Quien escribe aquí es `useAuthListener` (layout raíz). El resto solo lee:
 *   const userId = useSession((s) => s.session?.user.id);
 */
type SessionState = {
  session: Session | null;
  /** `false` hasta saber si hay sesión guardada (mientras, se ve el splash). */
  initialized: boolean;
  setSession: (session: Session | null) => void;
};

export const useSession = create<SessionState>((set) => ({
  session: null,
  initialized: false,
  setSession: (session) => set({ session, initialized: true }),
}));
