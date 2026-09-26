/**
 * Claves de caché de React Query, TODAS en un sitio.
 *
 * React Query guarda cada dato bajo una "clave". Si dos pantallas usan la misma clave,
 * comparten el dato (y se actualizan juntas). Centralizarlas evita erratas tipo
 * ['note'] vs ['notes'] que hacen que una pantalla no se refresque.
 */
export const queryKeys = {
  notes: {
    all: ['notes'] as const,
    list: () => [...queryKeys.notes.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.notes.all, 'detail', id] as const,
  },
  profile: {
    me: ['profile', 'me'] as const,
  },
} as const;
