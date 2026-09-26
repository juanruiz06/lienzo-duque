-- ════════════════════════════════════════════════════════════════════════════════════════════
-- Datos de prueba SOLO para la base LOCAL (`npm run db:reset` lo carga tras las migraciones).
-- Nunca se aplica a la nube: `supabase db push` no ejecuta el seed.
--
-- Usuario de prueba:  demo@lienzo.test  /  lienzo-demo-1234
-- ════════════════════════════════════════════════════════════════════════════════════════════

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values (
  '00000000-0000-0000-0000-000000000000',
  '11111111-1111-1111-1111-111111111111',
  'authenticated', 'authenticated',
  'demo@lienzo.test',
  extensions.crypt('lienzo-demo-1234', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"display_name":"Demo"}',
  now(), now(), '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  '11111111-1111-1111-1111-111111111111',
  'email',
  '{"sub":"11111111-1111-1111-1111-111111111111","email":"demo@lienzo.test","email_verified":true}',
  now(), now(), now()
);

-- El perfil lo crea el trigger `on_auth_user_created`. Aquí solo notas de ejemplo.
insert into public.notes (user_id, title, body) values
  ('11111111-1111-1111-1111-111111111111', 'Bienvenido a Lienzo 👋',
   'Esta nota viene del seed (supabase/seed.sql). Edítala, bórrala o crea otras.'),
  ('11111111-1111-1111-1111-111111111111', 'Siguiente paso',
   'Lee docs/00-empieza-aqui.md y luego docs/graduacion/README.md.');
