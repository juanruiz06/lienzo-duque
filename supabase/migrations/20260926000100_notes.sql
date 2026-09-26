-- ════════════════════════════════════════════════════════════════════════════════════════════
-- Notas: la feature de EJEMPLO de Lienzo.
--
-- Es la plantilla a copiar cuando crees tu propia tabla (la skill `/nueva-tabla` lo hace
-- por ti). Fíjate en las 5 piezas: tabla con checks → índice → trigger updated_at →
-- RLS + policies → GRANTs.
-- ════════════════════════════════════════════════════════════════════════════════════════════

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  -- `default auth.uid()`: el cliente no manda user_id; lo pone la base de datos con el
  -- usuario de la sesión. Así nadie puede crear notas "a nombre de" otro.
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.notes is 'Notas privadas de cada usuario (feature de ejemplo).';

-- La consulta típica es "mis notas, las más recientes primero": este índice la cubre.
create index notes_user_id_updated_at_idx on public.notes (user_id, updated_at desc);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

alter table public.notes enable row level security;

create policy "notes: el dueño lee sus notas"
  on public.notes for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notes: el dueño crea notas suyas"
  on public.notes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "notes: el dueño edita sus notas"
  on public.notes for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notes: el dueño borra sus notas"
  on public.notes for delete
  to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete on public.notes to authenticated;
revoke all on public.notes from anon;
