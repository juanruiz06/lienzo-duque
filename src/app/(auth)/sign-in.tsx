import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Screen, Text, TextField } from '@/components/ui';
import { useSignIn } from '@/hooks/useAuth';
import { useTheme } from '@/theme';
import { toUserMessage } from '@/utils/errors';
import { signInSchema, validateForm, type FieldErrors, type SignInInput } from '@/utils/validation';

export default function SignInScreen() {
  const t = useTheme();
  const signIn = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors<SignInInput>>({});

  const onSubmit = () => {
    const { data, errors: fieldErrors } = validateForm(signInSchema, { email, password });
    setErrors(fieldErrors ?? {});
    if (data) {
      // Si va bien, el layout raíz detecta la sesión y enseña la app solo.
      signIn.mutate(data);
    }
  };

  return (
    <Screen scroll edges={['top', 'bottom', 'left', 'right']}>
      <View style={[styles.header, { marginTop: t.spacing.xxl }]}>
        <Text variant="display">Lienzo</Text>
        <Text color="textMuted">Entra para ver tus notas.</Text>
      </View>

      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
        placeholder="tu@email.com"
      />
      <TextField
        label="Contraseña"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={onSubmit}
      />

      {signIn.error ? <Text color="danger">{toUserMessage(signIn.error)}</Text> : null}

      <Button label="Entrar" onPress={onSubmit} loading={signIn.isPending} />

      <View style={styles.links}>
        <Link href="/forgot-password" style={{ color: t.color.primary }}>
          ¿Has olvidado la contraseña?
        </Link>
        <Link href="/sign-up" style={{ color: t.color.primary }}>
          ¿No tienes cuenta? Regístrate
        </Link>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { gap: 8, marginBottom: 16 },
  links: { gap: 16, alignItems: 'center', marginTop: 8 },
});
