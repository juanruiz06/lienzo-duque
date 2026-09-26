import { z } from 'zod';

/**
 * Variables de entorno PÚBLICAS de la app, validadas al arrancar.
 *
 * Todo lo que empieza por `EXPO_PUBLIC_` se mete dentro de la app y cualquiera puede leerlo
 * desempaquetándola. Por eso aquí solo van valores publicables (URL de Supabase, publishable
 * key, DSN de Sentry…). Los secretos (service-role, API keys de Resend…) viven en el servidor:
 * Edge Functions o secrets de GitHub. Ver INVARIANTS.md → INV-SEC-1.
 *
 * Si falta algo, la app falla al arrancar con un mensaje claro en vez de romperse más tarde
 * con un error raro.
 */
const envSchema = z.object({
  EXPO_PUBLIC_SUPABASE_URL: z.url({
    error:
      'Falta EXPO_PUBLIC_SUPABASE_URL o no es una URL (http://… en local, https://… en la nube)',
  }),
  EXPO_PUBLIC_SUPABASE_KEY: z
    .string({ error: 'Falta EXPO_PUBLIC_SUPABASE_KEY' })
    .min(20, 'EXPO_PUBLIC_SUPABASE_KEY parece incompleta'),
  // Opcionales: se activan en los niveles de graduación (docs/graduacion).
  EXPO_PUBLIC_SENTRY_DSN: z.string().optional(),
  EXPO_PUBLIC_POSTHOG_KEY: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

// Expo solo sustituye `process.env.EXPO_PUBLIC_X` si se escribe LITERALMENTE así (no vale
// `process.env[nombre]`). Por eso se listan una a una.
const parsed = envSchema.safeParse({
  EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
  EXPO_PUBLIC_SUPABASE_KEY: process.env.EXPO_PUBLIC_SUPABASE_KEY,
  EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN || undefined,
  EXPO_PUBLIC_POSTHOG_KEY: process.env.EXPO_PUBLIC_POSTHOG_KEY || undefined,
});

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.message}`).join('\n');
  throw new Error(
    `Configuración inválida.\nCopia .env.example a .env y rellena los valores (docs/00-empieza-aqui.md):\n${issues}`,
  );
}

export const env: Env = parsed.data;
