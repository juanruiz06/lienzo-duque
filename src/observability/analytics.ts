import { log } from './logger';

/**
 * Analítica de producto con eventos TIPADOS.
 *
 * Regla: la app solo emite eventos que estén en este catálogo (`AppEvents`). Así no acabas con
 * "note_created", "noteCreated" y "create_note" midiendo lo mismo. Para añadir uno: añádelo
 * aquí con sus propiedades y úsalo con `trackEvent('nombre', {...})`. La skill
 * `/nuevo-evento` lo hace por ti.
 *
 * Hoy no hay servicio conectado (solo log en desarrollo). En el nivel 3 de graduación,
 * `src/observability/posthog.ts` llamará a `setAnalyticsClient(...)` y los eventos irán a PostHog.
 *
 * PRIVACIDAD: nunca metas emails, nombres, ni texto que escriba el usuario en las propiedades.
 */
export type AppEvents = {
  sign_up: { method: 'email' };
  sign_in: { method: 'email' };
  sign_out: Record<string, never>;
  note_created: { title_length: number };
  note_updated: Record<string, never>;
  note_deleted: Record<string, never>;
  account_deleted: Record<string, never>;
};

export type AppEventName = keyof AppEvents;

export type AnalyticsClient = {
  capture: (event: string, properties?: Record<string, unknown>) => void;
  identify: (userId: string) => void;
  reset: () => void;
};

let client: AnalyticsClient | null = null;

export function setAnalyticsClient(next: AnalyticsClient | null): void {
  client = next;
}

export function trackEvent<E extends AppEventName>(event: E, properties: AppEvents[E]): void {
  log.info(`evento: ${event}`, properties);
  try {
    client?.capture(event, properties);
  } catch {
    // La analítica nunca rompe la app.
  }
}

export function identifyUser(userId: string): void {
  try {
    client?.identify(userId);
  } catch {
    // best-effort
  }
}

export function resetAnalytics(): void {
  try {
    client?.reset();
  } catch {
    // best-effort
  }
}
