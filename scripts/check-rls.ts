/**
 * `npm run check:rls` — comprueba las reglas de seguridad de la base de datos
 * (INV-DB-1, INV-DB-2, INV-DB-3, INV-DB-5) sobre la base LOCAL (Docker).
 *
 * Si no tienes la base local (lo normal en Windows), no pasa nada: esta comprobación la hace
 * GitHub automáticamente en cada Pull Request (job "Base de datos" del CI).
 */
import { spawnSync } from 'node:child_process';

import { isLocalDbRunning, localProjectId } from './lib';

// Tablas que pueden leerse SIN sesión (catálogos públicos). Justifícalo en el PR si añades una.
const PUBLIC_TABLES: string[] = [];

if (!isLocalDbRunning()) {
  if (process.env.CI) {
    console.error('❌ La base local no está arrancada en el CI.');
    process.exit(1);
  }
  console.log(
    'ℹ️  Esta comprobación necesita la base de datos LOCAL (Docker), que no está en marcha.\n' +
      '   No te preocupes: GitHub la hace automáticamente en cada Pull Request.',
  );
  process.exit(0);
}

const container = `supabase_db_${localProjectId()}`;
function query(sql: string): string[] {
  const r = spawnSync(
    'docker',
    ['exec', '-i', container, 'psql', '-U', 'postgres', '-tA', '-F', ' | '],
    {
      input: sql,
      encoding: 'utf8',
    },
  );
  if (r.status !== 0) throw new Error(r.stderr);
  return r.stdout.split(/\r?\n/).filter(Boolean);
}

const checks: { id: string; title: string; sql: string }[] = [
  {
    id: 'INV-DB-1',
    title: 'tablas SIN RLS (sus datos son públicos)',
    sql: `select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
          where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;`,
  },
  {
    id: 'INV-DB-2',
    title: "'anon' tiene permisos (añade 'revoke all on public.<tabla> from anon;')",
    sql: `select table_name, string_agg(privilege_type, ',') from information_schema.role_table_grants
          where grantee = 'anon' and table_schema = 'public'
          ${PUBLIC_TABLES.length ? `and table_name not in (${PUBLIC_TABLES.map((t) => `'${t}'`).join(',')})` : ''}
          group by table_name;`,
  },
  {
    id: 'INV-DB-3',
    title: "policies con auth.uid() sin '(select …)'",
    sql: `select tablename, policyname from pg_policies where schemaname = 'public'
          and (coalesce(qual,'') || coalesce(with_check,'')) ~ 'auth\\.uid\\(\\)'
          and (coalesce(qual,'') || coalesce(with_check,'')) !~* 'select auth\\.uid\\(\\)';`,
  },
  {
    id: 'INV-DB-5',
    title: "funciones SECURITY DEFINER sin 'set search_path'",
    sql: `select p.proname from pg_proc p join pg_namespace n on n.oid = p.pronamespace
          where n.nspname = 'public' and p.prosecdef
          and not exists (select 1 from unnest(coalesce(p.proconfig, '{}')) c where c like 'search_path=%');`,
  },
];

let failed = false;
for (const check of checks) {
  const rows = query(check.sql);
  if (rows.length) {
    failed = true;
    console.error(`❌ ${check.id} — ${check.title}:`);
    rows.forEach((r) => console.error(`   · ${r}`));
  }
}
if (failed) process.exit(1);
console.log('✅ RLS, permisos y funciones: todo en orden.');
