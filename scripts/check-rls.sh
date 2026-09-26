#!/usr/bin/env bash
# `npm run check:rls` — comprueba las reglas de seguridad de la base de datos LOCAL
# (INV-DB-1, INV-DB-2, INV-DB-3, INV-DB-5). Necesita `npm run db:start`. También corre en el CI.
set -uo pipefail

PROJECT_ID="$(grep -m1 '^project_id' supabase/config.toml | cut -d'"' -f2)"
CONTAINER="supabase_db_${PROJECT_ID}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "❌ Supabase local no está arrancado (no encuentro $CONTAINER). Ejecuta: npm run db:start"
  exit 1
fi

q() { docker exec -i "$CONTAINER" psql -U postgres -d postgres -tA -F ' | ' -c "$1"; }
fail=0

# INV-DB-1: toda tabla de `public` tiene RLS activado.
no_rls="$(q "select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
             where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;")"
if [[ -n "$no_rls" ]]; then
  echo "❌ INV-DB-1 — tablas SIN RLS (sus datos son públicos):"; echo "$no_rls" | sed 's/^/   · /'; fail=1
fi

# INV-DB-2: `anon` (sin sesión) no tiene permisos sobre tablas, salvo las listadas como públicas.
PUBLIC_TABLES="'__ninguna__'"   # ← añade aquí tablas de catálogo público, p. ej. 'products'
anon_grants="$(q "select table_name, string_agg(privilege_type, ',') from information_schema.role_table_grants
                  where grantee = 'anon' and table_schema = 'public' and table_name not in ($PUBLIC_TABLES)
                  group by table_name;")"
if [[ -n "$anon_grants" ]]; then
  echo "❌ INV-DB-2 — 'anon' tiene permisos (añade 'revoke all on public.<tabla> from anon;'):"
  echo "$anon_grants" | sed 's/^/   · /'; fail=1
fi

# INV-DB-3: las policies usan `(select auth.uid())`, no `auth.uid()` a pelo (rendimiento).
slow_policies="$(q "select tablename, policyname from pg_policies where schemaname = 'public'
                    and (coalesce(qual,'') || coalesce(with_check,'')) ~ 'auth\.uid\(\)'
                    and (coalesce(qual,'') || coalesce(with_check,'')) !~* 'select auth\.uid\(\)';")"
if [[ -n "$slow_policies" ]]; then
  echo "❌ INV-DB-3 — policies con auth.uid() sin '(select …)':"; echo "$slow_policies" | sed 's/^/   · /'; fail=1
fi

# INV-DB-5: funciones SECURITY DEFINER de `public` fijan search_path.
definer="$(q "select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
              where n.nspname = 'public' and p.prosecdef
              and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');")"
if [[ -n "$definer" ]]; then
  echo "❌ INV-DB-5 — funciones SECURITY DEFINER sin 'set search_path':"; echo "$definer" | sed 's/^/   · /'; fail=1
fi

if [[ $fail -eq 0 ]]; then
  echo "✅ RLS, permisos y funciones: todo en orden."
fi
exit $fail
