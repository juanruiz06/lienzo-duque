import { Alert, Platform } from 'react-native';

/**
 * Pregunta "¿seguro?" y espera la respuesta. Funciona en iOS, Android y web
 * (en web `Alert.alert` no hace nada, por eso se usa `window.confirm`).
 *
 *   if (await confirm({ title: '¿Borrar la nota?', confirmLabel: 'Borrar', destructive: true })) …
 */
export function confirm(options: {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}): Promise<boolean> {
  const {
    title,
    message,
    confirmLabel = 'Aceptar',
    cancelLabel = 'Cancelar',
    destructive = false,
  } = options;

  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
  }

  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: cancelLabel, style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

/** Aviso simple con un botón. */
export function notify(title: string, message?: string): void {
  if (Platform.OS === 'web') {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
