/**
 * Logger de la app. Usa `log.info/warn/error` en vez de `console.log` (ESLint avisa).
 *
 * - En desarrollo: todo sale por la consola de Metro.
 * - En producción: `info` se calla; `warn` y `error` siguen saliendo y, cuando conectes
 *   Sentry (docs/graduacion/03-observabilidad.md), `reportError` los enviará allí.
 *
 *   const notesLog = log.scoped('notes');
 *   notesLog.warn('no se pudo guardar', error);
 */

declare const __DEV__: boolean;
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

type LogFn = (message: string, ...details: unknown[]) => void;

export type Logger = {
  info: LogFn;
  warn: LogFn;
  error: LogFn;
  scoped: (scope: string) => Logger;
};

function createLogger(scope?: string): Logger {
  const prefix = scope ? `[${scope}]` : '[app]';
  return {
    info: (message, ...details) => {
      if (isDev) {
        // eslint-disable-next-line no-console -- el logger es el único sitio con console.log
        console.log(`${prefix} ${message}`, ...details);
      }
    },
    warn: (message, ...details) => console.warn(`${prefix} ${message}`, ...details),
    error: (message, ...details) => console.error(`${prefix} ${message}`, ...details),
    scoped: (child) => createLogger(scope ? `${scope}:${child}` : child),
  };
}

export const log = createLogger();
