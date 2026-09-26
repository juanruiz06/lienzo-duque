import { Card, Text } from '@/components/ui';
import type { Note } from '@/api/notes';
import { formatRelative } from '@/utils/dates';

/**
 * Tarjeta de una nota en la lista. Componente "de feature": vive en components/notes/ porque
 * solo tiene sentido para notas. Los genéricos (Button, Card…) van en components/ui/.
 */
export function NoteCard({ note, onPress }: { note: Note; onPress: () => void }) {
  return (
    <Card onPress={onPress} accessibilityLabel={`Abrir nota ${note.title}`}>
      <Text variant="bodyStrong" numberOfLines={1}>
        {note.title}
      </Text>
      {note.body ? (
        <Text color="textMuted" numberOfLines={2}>
          {note.body}
        </Text>
      ) : null}
      <Text variant="caption" color="textFaint">
        {formatRelative(note.updated_at)}
      </Text>
    </Card>
  );
}
