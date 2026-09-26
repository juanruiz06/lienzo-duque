/**
 * Punto de entrada de la observabilidad (logs, errores, analítica).
 *
 * `initObservability()` se llama UNA vez al arrancar (src/app/_layout.tsx). Hoy no hace nada
 * porque no hay servicios conectados; en el nivel 3 de graduación aquí se enchufan Sentry y
 * PostHog SOLO si hay clave en el .env (sin clave = no-op, coste cero).
 */
export { log, type Logger } from './logger';
export { reportError, setErrorReporter, setReporterUser, type ErrorReporter } from './reporter';
export {
  identifyUser,
  resetAnalytics,
  setAnalyticsClient,
  trackEvent,
  type AnalyticsClient,
  type AppEventName,
  type AppEvents,
} from './analytics';

let initialized = false;

export function initObservability(): void {
  if (initialized) {
    return;
  }
  initialized = true;
  // Nivel 3 (docs/graduacion/03-observabilidad.md):
  //   initSentry();   → setErrorReporter(...)
  //   initPostHog();  → setAnalyticsClient(...)
}
