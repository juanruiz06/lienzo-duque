import { z } from 'zod';

import { AppError } from './errors';

/**
 * Esquemas de validación (zod). Se usan en DOS sitios:
 *  - en los formularios, para enseñar el error debajo del campo;
 *  - en `src/api`, antes de mandar nada a Supabase.
 *
 * Los límites (120, 5000, 50…) coinciden con los `check` de las migraciones SQL. Si cambias
 * uno, cambia el otro.
 */

export const emailSchema = z.email({ error: 'Escribe un email válido.' });

export const passwordSchema = z
  .string()
  .min(8, { error: 'La contraseña necesita al menos 8 caracteres.' })
  .max(72, { error: 'La contraseña no puede pasar de 72 caracteres.' });

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, { error: 'Escribe tu contraseña.' }),
});

export const signUpSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'Dinos cómo te llamas.' })
    .max(50, { error: 'Máximo 50 caracteres.' }),
  email: emailSchema,
  password: passwordSchema,
});

export const noteSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, { error: 'La nota necesita un título.' })
    .max(120, { error: 'Máximo 120 caracteres.' }),
  body: z.string().max(5000, { error: 'Máximo 5000 caracteres.' }),
});

export const profileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, { error: 'El nombre no puede estar vacío.' })
    .max(50, { error: 'Máximo 50 caracteres.' }),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type NoteInput = z.infer<typeof noteSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

/** Errores por campo, listos para pintar debajo de cada input. */
export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Valida y devuelve `{ data }` o `{ errors }` por campo (para formularios). */
export function validateForm<T extends z.ZodType>(
  schema: T,
  values: unknown,
): { data: z.infer<T>; errors: null } | { data: null; errors: FieldErrors<z.infer<T>> } {
  const result = schema.safeParse(values);
  if (result.success) {
    return { data: result.data, errors: null };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const field = String(issue.path[0] ?? '');
    if (field && !errors[field]) {
      errors[field] = issue.message;
    }
  }
  return { data: null, errors: errors as FieldErrors<z.infer<T>> };
}

/** Valida o lanza `AppError` con el primer mensaje (para la capa `src/api`). */
export function parseOrThrow<T extends z.ZodType>(schema: T, values: unknown): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    throw new AppError(result.error.issues[0]?.message ?? 'Datos no válidos.', 'validation');
  }
  return result.data;
}
