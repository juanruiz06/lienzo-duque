import { router } from 'expo-router';
import { useState } from 'react';

import { Button, EmptyState, Screen, Text, TextField } from '@/components/ui';
import { useSignUp } from '@/hooks/useAuth';
import { toUserMessage } from '@/utils/errors';
import { signUpSchema, validateForm, type FieldErrors, type SignUpInput } from '@/utils/validation';

export default function SignUpScreen() {
  const signUp = useSignUp();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<SignUpInput>>({});

  const onSubmit = () => {
    const { data, errors: fieldErrors } = validateForm(signUpSchema, {
      displayName,
      email,
      password,
    });
    setErrors(fieldErrors ?? {});
    if (data) {
      signUp.mutate(data);
    }
  };

  // Proyecto con "Confirm email" activado: no hay sesión hasta pulsar el enlace del correo.
  if (signUp.data?.needsConfirmation) {
    return (
      <Screen>
        <EmptyState
          title="Revisa tu email 📬"
          description={`Te hemos enviado un enlace a ${email}. Púlsalo y luego inicia sesión.`}
          actionLabel="Ir a iniciar sesión"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <TextField
        label="Nombre"
        value={displayName}
        onChangeText={setDisplayName}
        error={errors.displayName}
        autoComplete="name"
        textContentType="name"
        placeholder="Cómo quieres que te llamemos"
      />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        hint="Mínimo 8 caracteres."
        secureTextEntry
        autoComplete="new-password"
        textContentType="newPassword"
        onSubmitEditing={onSubmit}
      />

      {signUp.error ? <Text color="danger">{toUserMessage(signUp.error)}</Text> : null}

      <Button label="Crear cuenta" onPress={onSubmit} loading={signUp.isPending} />
    </Screen>
  );
}
