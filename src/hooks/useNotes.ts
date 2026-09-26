import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { createNote, deleteNote, getNote, listNotes, updateNote, type Note } from '@/api/notes';
import { queryKeys } from '@/api/queryKeys';
import { trackEvent } from '@/observability';
import type { NoteInput } from '@/utils/validation';

/**
 * Hooks de NOTAS: el puente entre la capa de datos (src/api/notes) y las pantallas.
 *
 * Las pantallas usan SOLO estos hooks. Te dan `data`, `isPending`, `error`… y se encargan de
 * cachear, reintentar y refrescar. Tras crear/editar/borrar, `invalidateQueries` marca la lista
 * como vieja y React Query la vuelve a pedir sola.
 */

export function useNotes() {
  return useQuery({ queryKey: queryKeys.notes.list(), queryFn: listNotes });
}

export function useNote(id: string | undefined) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: queryKeys.notes.detail(id ?? ''),
    queryFn: () => getNote(id!),
    enabled: Boolean(id),
    // Si la nota ya está en la lista, se enseña al instante mientras se confirma con el servidor.
    initialData: () =>
      queryClient.getQueryData<Note[]>(queryKeys.notes.list())?.find((note) => note.id === id),
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['notes', 'create'],
    mutationFn: (input: NoteInput) => createNote(input),
    onSuccess: (note) => {
      trackEvent('note_created', { title_length: note.title.length });
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.all });
    },
  });
}

export function useUpdateNote(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['notes', 'update', id],
    mutationFn: (input: NoteInput) => updateNote(id, input),
    onSuccess: (note) => {
      trackEvent('note_updated', {});
      queryClient.setQueryData(queryKeys.notes.detail(id), note);
      void queryClient.invalidateQueries({ queryKey: queryKeys.notes.list() });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: ['notes', 'delete'],
    mutationFn: (id: string) => deleteNote(id),
    // Actualización optimista: la nota desaparece de la lista AL INSTANTE, sin esperar a la red.
    // Si el servidor falla, se restaura (onError).
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.notes.list() });
      const previous = queryClient.getQueryData<Note[]>(queryKeys.notes.list());
      queryClient.setQueryData<Note[]>(queryKeys.notes.list(), (old) =>
        old?.filter((note) => note.id !== id),
      );
      return { previous };
    },
    onError: (_error, _id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.notes.list(), context.previous);
      }
    },
    onSuccess: () => trackEvent('note_deleted', {}),
    onSettled: () => queryClient.invalidateQueries({ queryKey: queryKeys.notes.all }),
  });
}
