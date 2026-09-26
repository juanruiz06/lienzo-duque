import { router } from 'expo-router';
import { useState } from 'react';

import { Button, EmptyState, Screen, Text, TextField } from '@/components/ui';
import { useRequestPasswordReset } from '@/hooks/useAuth';
import { toUserMessage } from '@/utils/errors';
import { emailSchema } from '@/utils/validation';

export default function ForgotPasswordScreen() {
  const reset = useRequestPasswordReset();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();

  const onSubmit = () => {
    const parsed = emailSchema.safeParse(email);
    setError(parsed.success ? undefined : parsed.error.issues[0]?.message);
    if (parsed.success) {
      reset.mutate(parsed.data);
    }
  };

  if (reset.isSuccess) {
    return (
      <Screen>
        <EmptyState
          title="Enlace enviado"
          description="Si existe una cuenta con ese email, recibirás un correo para cambiar la contraseña."
          actionLabel="Volver"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Text color="textMuted">
        Escribe tu email y te mandamos un enlace para crear una contraseña nueva.
      </Text>
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={error}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        onSubmitEditing={onSubmit}
      />
      {reset.error ? <Text color="danger">{toUserMessage(reset.error)}</Text> : null}
      <Button label="Enviar enlace" onPress={onSubmit} loading={reset.isPending} />
    </Screen>
  );
}
