import { log } from './logger';

/**
 * "Enchufe" para reportar errores a un servicio externo (Sentry).
 *
 * Hoy no hay ningún servicio conectado: `reportError` solo escribe en el log. Cuando llegues
 * al nivel 3 de graduación, `src/observability/sentry.ts` llamará a `setErrorReporter(...)`
 * y a partir de ese momento TODOS los `reportError` de la app irán a Sentry sin tocar nada más.
 */
export type ErrorContext = Record<string, unknown>;

export type ErrorReporter = {
  captureException: (error: unknown, context?: ErrorContext) => void;
  setUser: (user: { id: string } | null) => void;
};

let reporter: ErrorReporter | null = null;

export function setErrorReporter(next: ErrorReporter | null): void {
  reporter = next;
}

export function reportError(error: unknown, context?: ErrorContext): void {
  log.error('error reportado', error, context ?? '');
  try {
    reporter?.captureException(error, context);
  } catch {
    // Un fallo del reporter nunca debe tumbar la app.
  }
}

export function setReporterUser(user: { id: string } | null): void {
  try {
    reporter?.setUser(user);
  } catch {
    // best-effort
  }
}
