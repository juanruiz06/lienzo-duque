import Ionicons from '@expo/vector-icons/Ionicons';
import { router, Stack } from 'expo-router';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { NoteCard } from '@/components/notes/NoteCard';
import { EmptyState, ErrorState, LoadingState, Screen } from '@/components/ui';
import { useNotes } from '@/hooks/useNotes';
import { useTheme } from '@/theme';

/**
 * Lista de notas. Patrón que se repite en toda pantalla con datos:
 *   1) pedir datos con un hook  2) cargando  3) error  4) vacío  5) datos.
 */
export default function NotesScreen() {
  const t = useTheme();
  const notes = useNotes();

  const openNew = () => router.push({ pathname: '/note/[id]', params: { id: 'new' } });

  return (
    <Screen padded={false}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={openNew}
              accessibilityRole="button"
              accessibilityLabel="Nueva nota"
              hitSlop={12}
              style={{ paddingHorizontal: t.spacing.md }}
            >
              <Ionicons name="add-circle" size={28} color={t.color.primary} />
            </Pressable>
          ),
        }}
      />

      {notes.isPending ? (
        <LoadingState />
      ) : notes.error ? (
        <ErrorState error={notes.error} onRetry={() => void notes.refetch()} />
      ) : (
        <FlatList
          data={notes.data}
          keyExtractor={(note) => note.id}
          renderItem={({ item }) => (
            <NoteCard
              note={item}
              onPress={() => router.push({ pathname: '/note/[id]', params: { id: item.id } })}
            />
          )}
          contentContainerStyle={{ padding: t.spacing.md, gap: t.spacing.sm, flexGrow: 1 }}
          refreshControl={
            <RefreshControl
              refreshing={notes.isRefetching}
              onRefresh={() => void notes.refetch()}
              tintColor={t.color.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              title="Aún no tienes notas"
              description="Crea la primera y aparecerá aquí."
              actionLabel="Crear nota"
              onAction={openNew}
            />
          }
        />
      )}
    </Screen>
  );
}
