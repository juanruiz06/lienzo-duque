// ════════════════════════════════════════════════════════════════════════════════════════════
// Edge Function `delete-account`: borra la cuenta del usuario que la llama.
//
// Por qué existe: Apple (App Store, guideline 5.1.1(v)) y Google Play EXIGEN que una app con
// registro permita borrar la cuenta desde dentro de la app. Borrar un usuario de `auth.users`
// requiere la service-role key, que JAMÁS puede ir en la app (INV-SEC-1). Por eso vive aquí,
// en el servidor.
//
// Flujo:
//   1. Supabase comprueba que la llamada trae un JWT válido (verify_jwt = true en config.toml).
//   2. Con ese JWT averiguamos QUIÉN llama (nunca aceptamos un user_id del body).
//   3. Con el cliente admin borramos ese usuario. Sus filas (profiles, notes…) se borran en
//      cascada por las FK `on delete cascade`.
//
// Probar en local:  npx supabase functions serve   (y llamar desde la app → Perfil → Borrar)
// Desplegar:        npx supabase functions deploy delete-account
// ════════════════════════════════════════════════════════════════════════════════════════════

import { createClient } from 'npm:@supabase/supabase-js@2';

import { corsHeaders, json } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Falta la cabecera Authorization' }, 401);
  }

  // Estas variables las inyecta Supabase automáticamente (en local y en la nube).
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // 1) ¿Quién llama? Cliente "como el usuario" (con su token).
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const {
    data: { user },
    error: userError,
  } = await userClient.auth.getUser();
  if (userError || !user) {
    return json({ error: 'Sesión no válida' }, 401);
  }

  // 2) Borrado con privilegios de administrador (solo existe aquí, en el servidor).
  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error('delete-account: fallo al borrar', user.id, deleteError.message);
    return json({ error: 'No se pudo borrar la cuenta' }, 500);
  }

  return json({ ok: true });
});
