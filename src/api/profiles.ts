import { requireUserId } from './session';
import { supabase } from './supabase';
import type { Tables } from '@/types/database';
import { parseOrThrow, profileSchema, type ProfileInput } from '@/utils/validation';

export type Profile = Pick<Tables<'profiles'>, 'id' | 'display_name'>;

export async function getMyProfile(): Promise<Profile> {
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name')
    .eq('id', userId)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function updateMyProfile(input: ProfileInput): Promise<Profile> {
  const { displayName } = parseOrThrow(profileSchema, input);
  const userId = await requireUserId();
  const { data, error } = await supabase
    .from('profiles')
    .update({ display_name: displayName })
    .eq('id', userId)
    .select('id, display_name')
    .single();
  if (error) {
    throw error;
  }
  return data;
}
