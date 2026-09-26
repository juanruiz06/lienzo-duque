import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import { Button, ErrorState, LoadingState, Screen, Text, TextField } from '@/components/ui';
import { useCreateNote, useDeleteNote, useNote, useUpdateNote } from '@/hooks/useNotes';
import type { Note } from '@/api/notes';
import { confirm } from '@/utils/confirm';
import { toUserMessage } from '@/utils/errors';
import { noteSchema, validateForm, type FieldErrors, type NoteInput } from '@/utils/validation';

/**
 * Crear o editar una nota. La ruta es /note/new (crear) o /note/<id> (editar).
 * `[id]` en el nombre del archivo = parámetro dinámico de la URL.
 */
export default function NoteScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const note = useNote(isNew ? undefined : id);

  if (!isNew && note.isPending) {
    return <LoadingState />;
  }
  if (!isNew && (note.error || !note.data)) {
    return (
      <Screen>
        <ErrorState error={note.error ?? new Error('not found')} onRetry={() => router.back()} />
      </Screen>
    );
  }

  // `key` fuerza a reiniciar el formulario si cambia la nota.
  return <NoteForm key={id} note={isNew ? null : (note.data ?? null)} />;
}

function NoteForm({ note }: { note: Note | null }) {
  const [title, setTitle] = useState(note?.title ?? '');
  const [body, setBody] = useState(note?.body ?? '');
  const [errors, setErrors] = useState<FieldErrors<NoteInput>>({});

  const create = useCreateNote();
  const update = useUpdateNote(note?.id ?? '');
  const remove = useDeleteNote();
  const save = note ? update : create;

  const onSave = () => {
    const { data, errors: fieldErrors } = validateForm(noteSchema, { title, body });
    setErrors(fieldErrors ?? {});
    if (data) {
      save.mutate(data, { onSuccess: () => router.back() });
    }
  };

  const onDelete = async () => {
    if (!note) {
      return;
    }
    const ok = await confirm({
      title: '¿Borrar esta nota?',
      message: 'No se puede deshacer.',
      confirmLabel: 'Borrar',
      destructive: true,
    });
    if (ok) {
      remove.mutate(note.id);
      router.back();
    }
  };

  return (
    <Screen scroll>
      <Stack.Screen options={{ title: note ? 'Editar nota' : 'Nueva nota' }} />
      <TextField
        label="Título"
        value={title}
        onChangeText={setTitle}
        error={errors.title}
        maxLength={120}
        autoFocus={!note}
        returnKeyType="next"
      />
      <TextField
        label="Contenido"
        value={body}
        onChangeText={setBody}
        error={errors.body}
        maxLength={5000}
        multiline
      />
      {save.error ? <Text color="danger">{toUserMessage(save.error)}</Text> : null}
      <Button label="Guardar" onPress={onSave} loading={save.isPending} />
      {note ? (
        <Button label="Borrar nota" variant="danger" onPress={() => void onDelete()} />
      ) : null}
    </Screen>
  );
}
