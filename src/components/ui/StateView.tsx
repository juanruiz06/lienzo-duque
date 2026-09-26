import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from './Button';
import { Text } from './Text';
import { useTheme } from '@/theme';
import { toUserMessage } from '@/utils/errors';

/**
 * Los 3 estados que TODA pantalla con datos debe cubrir (además del "con datos"):
 *
 *   if (query.isPending) return <LoadingState />;
 *   if (query.error)     return <ErrorState error={query.error} onRetry={query.refetch} />;
 *   if (!data.length)    return <EmptyState title="…" />;
 */

export function LoadingState({ label = 'Cargando…' }: { label?: string }) {
  const t = useTheme();
  return (
    <View style={styles.center} accessibilityLabel={label}>
      <ActivityIndicator color={t.color.primary} />
    </View>
  );
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <View style={styles.center}>
      <Text variant="subtitle" align="center">
        Vaya…
      </Text>
      <Text color="textMuted" align="center">
        {toUserMessage(error)}
      </Text>
      {onRetry ? <Button label="Reintentar" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.center}>
      <Text variant="subtitle" align="center">
        {title}
      </Text>
      {description ? (
        <Text color="textMuted" align="center">
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? <Button label={actionLabel} onPress={onAction} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});
