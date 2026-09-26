import { supabase } from './supabase';
import type { Tables } from '@/types/database';
import { noteSchema, parseOrThrow, type NoteInput } from '@/utils/validation';

/**
 * Capa de datos de NOTAS. Es el ejemplo canónico: copia este archivo cuando crees una feature.
 *
 * Reglas:
 *  - Funciones async simples: reciben datos, devuelven datos o lanzan error. Nada de React aquí.
 *  - Seleccionar columnas explícitas (no `*`) → no traes datos que no usas.
 *  - La SEGURIDAD la pone la base de datos (RLS): aunque aquí no filtremos por usuario, Postgres
 *    solo devuelve las notas del usuario con sesión. Aun así validamos la entrada con zod.
 */

export type Note = Pick<Tables<'notes'>, 'id' | 'title' | 'body' | 'created_at' | 'updated_at'>;

const NOTE_COLUMNS = 'id, title, body, created_at, updated_at';

export async function listNotes(): Promise<Note[]> {
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(200);
  if (error) {
    throw error;
  }
  return data;
}

export async function getNote(id: string): Promise<Note | null> {
  const { data, error } = await supabase
    .from('notes')
    .select(NOTE_COLUMNS)
    .eq('id', id)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

export async function createNote(input: NoteInput): Promise<Note> {
  const values = parseOrThrow(noteSchema, input);
  // `user_id` no se manda: la base de datos pone el del usuario con sesión (default auth.uid()).
  const { data, error } = await supabase.from('notes').insert(values).select(NOTE_COLUMNS).single();
  if (error) {
    throw error;
  }
  return data;
}

export async function updateNote(id: string, input: NoteInput): Promise<Note> {
  const values = parseOrThrow(noteSchema, input);
  const { data, error } = await supabase
    .from('notes')
    .update(values)
    .eq('id', id)
    .select(NOTE_COLUMNS)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await supabase.from('notes').delete().eq('id', id);
  if (error) {
    throw error;
  }
}
