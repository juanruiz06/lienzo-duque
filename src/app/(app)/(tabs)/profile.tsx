import { useState } from 'react';
import { View } from 'react-native';

import { Button, ErrorState, LoadingState, Screen, Text, TextField } from '@/components/ui';
import { useDeleteAccount, useSignOut } from '@/hooks/useAuth';
import { useMyProfile, useUpdateProfile } from '@/hooks/useProfile';
import type { Profile } from '@/api/profiles';
import { useSession } from '@/store/session';
import { useTheme } from '@/theme';
import { confirm, notify } from '@/utils/confirm';
import { toUserMessage } from '@/utils/errors';
import { profileSchema, validateForm } from '@/utils/validation';

export default function ProfileScreen() {
  const profile = useMyProfile();

  if (profile.isPending) {
    return <LoadingState />;
  }
  if (profile.error) {
    return <ErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  }
  return <ProfileForm profile={profile.data} />;
}

function ProfileForm({ profile }: { profile: Profile }) {
  const t = useTheme();
  const email = useSession((s) => s.session?.user.email ?? '');
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [error, setError] = useState<string>();

  const update = useUpdateProfile();
  const signOut = useSignOut();
  const deleteAccount = useDeleteAccount();

  const onSave = () => {
    const { data, errors } = validateForm(profileSchema, { displayName });
    setError(errors?.displayName);
    if (data) {
      update.mutate(data, { onSuccess: () => notify('Guardado') });
    }
  };

  const onDeleteAccount = async () => {
    const ok = await confirm({
      title: '¿Borrar tu cuenta?',
      message: 'Se borrarán tu perfil y todas tus notas. No se puede deshacer.',
      confirmLabel: 'Borrar cuenta',
      destructive: true,
    });
    if (ok) {
      deleteAccount.mutate(undefined, {
        onError: (e) => notify('No se pudo borrar', toUserMessage(e)),
      });
    }
  };

  return (
    <Screen scroll>
      <View style={{ gap: t.spacing.xs }}>
        <Text variant="caption" color="textMuted">
          Sesión iniciada como
        </Text>
        <Text variant="bodyStrong">{email}</Text>
      </View>

      <TextField
        label="Nombre"
        value={displayName}
        onChangeText={setDisplayName}
        error={error}
        maxLength={50}
      />
      {update.error ? <Text color="danger">{toUserMessage(update.error)}</Text> : null}
      <Button label="Guardar cambios" onPress={onSave} loading={update.isPending} />

      <View style={{ flex: 1, minHeight: t.spacing.xl }} />

      <Button
        label="Cerrar sesión"
        variant="secondary"
        onPress={() => signOut.mutate()}
        loading={signOut.isPending}
      />
      <Button
        label="Borrar mi cuenta"
        variant="danger"
        onPress={() => void onDeleteAccount()}
        loading={deleteAccount.isPending}
      />
    </Screen>
  );
}
