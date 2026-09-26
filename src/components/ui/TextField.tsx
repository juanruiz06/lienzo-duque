import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './Text';
import { minTouchTarget, useTheme } from '@/theme';

/**
 * Campo de texto con etiqueta y mensaje de error debajo.
 *
 *   <TextField label="Email" value={email} onChangeText={setEmail} error={errors.email} />
 */
export type TextFieldProps = TextInputProps & {
  label: string;
  error?: string;
  hint?: string;
};

export function TextField({ label, error, hint, style, multiline, ...rest }: TextFieldProps) {
  const t = useTheme();
  return (
    <View style={styles.container}>
      <Text variant="caption" color="textMuted">
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.color.textFaint}
        multiline={multiline}
        style={[
          styles.input,
          {
            color: t.color.text,
            backgroundColor: t.color.surface,
            borderColor: error ? t.color.danger : t.color.border,
            borderRadius: t.radius.md,
            fontSize: t.fontSize.body,
            paddingHorizontal: t.spacing.md,
          },
          multiline && styles.multiline,
          style,
        ]}
        {...rest}
      />
      {error ? (
        <Text variant="caption" color="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" color="textFaint">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  input: {
    minHeight: minTouchTarget + 4,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingVertical: 12,
  },
  multiline: {
    minHeight: 160,
    textAlignVertical: 'top',
  },
});
