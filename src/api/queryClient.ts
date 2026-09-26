import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';

import { log } from '@/observability';
import { toError } from '@/utils/errors';

/**
 * Configuración de React Query (la "caché" de datos del servidor).
 *
 * - staleTime 30 s: un dato leído hace menos de 30 s se reutiliza sin volver a pedirlo.
 * - retry 1: si una lectura falla, se reintenta UNA vez (la red del móvil es inestable).
 * - Los fallos dejan rastro en el log (y en Sentry cuando lo conectes).
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      log.warn(`lectura falló ${JSON.stringify(query.queryKey)}`, toError(error).message);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _vars, _ctx, mutation) => {
      log.warn(
        `escritura falló ${JSON.stringify(mutation.options.mutationKey ?? '?')}`,
        toError(error).message,
      );
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
