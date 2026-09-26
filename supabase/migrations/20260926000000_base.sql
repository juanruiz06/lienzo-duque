-- ════════════════════════════════════════════════════════════════════════════════════════════
-- Migración base de Lienzo: utilidades + perfiles.
--
-- Reglas que sigue TODA migración de este repo (ver INVARIANTS.md):
--   · Toda tabla con datos de usuario lleva RLS activado y policies explícitas.   (INV-DB-1)
--   · Los permisos (GRANT) se dan a mano: Supabase ya NO expone tablas nuevas     (INV-DB-2)
--     a la API automáticamente, y `anon` (sin sesión) no recibe nada por defecto.
--   · En las policies se escribe `(select auth.uid())` y no `auth.uid()` a pelo:
--     Postgres lo calcula una vez por consulta en vez de una vez por fila (rendimiento).
-- ════════════════════════════════════════════════════════════════════════════════════════════

-- ─── Utilidad: mantener `updated_at` al día ──────────────────────────────────────────────────
-- Se engancha con un trigger a cualquier tabla que tenga columna `updated_at`.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Perfiles ────────────────────────────────────────────────────────────────────────────────
-- Un perfil por usuario. `auth.users` es de Supabase (no la tocamos); aquí guardamos lo nuestro.
-- `on delete cascade`: si se borra el usuario, se borra su perfil.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default ''
    check (char_length(display_name) <= 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Datos públicos/editables de cada usuario (1:1 con auth.users).';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

-- Cada usuario ve y edita SOLO su perfil. (Si algún día hay perfiles públicos entre usuarios,
-- se añade otra policy de SELECT; nunca se abre a `anon`.)
create policy "profiles: el dueño lee su perfil"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()));

create policy "profiles: el dueño edita su perfil"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Sin policy de INSERT ni DELETE: el perfil lo crea el trigger de abajo y se borra en cascada.
grant select, update on public.profiles to authenticated;
revoke all on public.profiles from anon;

-- ─── Crear el perfil automáticamente al registrarse ──────────────────────────────────────────
-- `security definer` = se ejecuta con permisos del dueño de la función (puede escribir en
-- profiles aunque el usuario aún no tenga sesión). Por eso fija `search_path = ''` y usa
-- nombres completos: es la práctica segura para funciones con privilegios.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 50)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
