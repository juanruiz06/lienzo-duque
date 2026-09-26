/**
 * Convertir errores técnicos en mensajes que entiende una persona.
 *
 * Regla: las pantallas NUNCA enseñan `error.message` crudo (sale en inglés y con jerga).
 * Enseñan `toUserMessage(error)`.
 */

/** Error "de negocio" con un mensaje ya pensado para el usuario. */
export class AppError extends Error {
  constructor(
    public readonly userMessage: string,
    public readonly code?: string,
    options?: { cause?: unknown },
  ) {
    super(userMessage, options);
    this.name = 'AppError';
  }
}

/** Normaliza cualquier cosa lanzada (`throw 'texto'`, objetos de Supabase…) a `Error`. */
export function toError(value: unknown): Error {
  if (value instanceof Error) {
    return value;
  }
  if (typeof value === 'object' && value !== null && 'message' in value) {
    return new Error(String((value as { message: unknown }).message));
  }
  return new Error(typeof value === 'string' ? value : 'Error desconocido');
}

/** Códigos/mensajes conocidos de Supabase Auth → castellano. */
const AUTH_MESSAGES: [RegExp, string][] = [
  [/invalid login credentials/i, 'Email o contraseña incorrectos.'],
  [/email not confirmed/i, 'Confirma tu email antes de entrar (revisa tu bandeja de entrada).'],
  [/user already registered/i, 'Ya existe una cuenta con ese email. Prueba a iniciar sesión.'],
  [/password should be at least/i, 'La contraseña es demasiado corta.'],
  [/rate limit|too many requests/i, 'Demasiados intentos. Espera un minuto y vuelve a probar.'],
  [/network request failed|failed to fetch|fetch failed/i, 'Sin conexión. Revisa tu internet.'],
  [
    /jwt expired|invalid jwt|session.*(missing|expired)/i,
    'Tu sesión ha caducado. Vuelve a entrar.',
  ],
];

export function toUserMessage(value: unknown): string {
  if (value instanceof AppError) {
    return value.userMessage;
  }
  const message = toError(value).message;
  for (const [pattern, friendly] of AUTH_MESSAGES) {
    if (pattern.test(message)) {
      return friendly;
    }
  }
  return 'Algo ha fallado. Inténtalo de nuevo.';
}
