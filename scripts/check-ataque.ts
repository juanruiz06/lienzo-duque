/**
 * `npm run check:ataque` — sondeo de ataque SIN sesión contra tu base de datos.
 *
 * Hace lo mismo que haría cualquier desconocido que desempaquete tu app y saque la publishable
 * key (que es pública): intenta leer y escribir en TODAS tus tablas, llamar a tus funciones SQL
 * y a tus Edge Functions sin iniciar sesión, y listar tus archivos. Si algo de eso funciona,
 * es un agujero.
 *
 * Funciona contra la base a la que apunte tu `.env` (tu proyecto de la nube o la local).
 * No borra ni cambia nada tuyo: solo lee e intenta insertar filas vacías (que deben fallar).
 * Lo usa la skill /anti-hackeo. Tablas de catálogo público intencionado: añádelas abajo.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';

import { createClient } from '@supabase/supabase-js';

import { readEnvVar } from './lib';

// Tablas que DEBEN poder leerse sin sesión (catálogos públicos). Justifícalo si añades alguna.
const PUBLIC_READ_TABLES: string[] = [];
// Edge Functions que no exigen login a propósito (webhooks que comprueban su propia firma).
const PUBLIC_FUNCTIONS: string[] = [];

const url = readEnvVar('EXPO_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
const key = readEnvVar('EXPO_PUBLIC_SUPABASE_KEY');
if (!url || !key) {
  console.error('❌ Falta la configuración de Supabase en .env. Ejecuta: npm run setup');
  process.exit(1);
}

const anon = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

/** Nombres de tablas y funciones SQL según los tipos generados (src/types/database.ts). */
function schemaNames(section: 'Tables' | 'Functions'): string[] {
  const text = readFileSync('src/types/database.ts', 'utf8');
  const start = text.indexOf(`    ${section}: {`);
  if (start === -1) return [];
  const rest = text.slice(start + section.length + 8);
  const end = rest.search(/^ {4}[A-Z]\w+: \{/m);
  const block = end === -1 ? rest : rest.slice(0, end);
  return [...block.matchAll(/^ {6}([a-z_][a-z0-9_]*): \{/gm)].map((m) => m[1]!);
}

type Result = { check: string; ok: boolean; detail: string };
const results: Result[] = [];

async function main() {
  console.log(`\n🕵️  Sondeo de ataque sin sesión contra ${url}\n`);

  // 1. Tablas: leer e insertar sin sesión.
  for (const table of schemaNames('Tables')) {
    const read = await anon
      .from(table as never)
      .select('*')
      .limit(5);
    const rows = read.data?.length ?? 0;
    const publicOk = PUBLIC_READ_TABLES.includes(table);
    results.push({
      check: `Leer "${table}" sin sesión`,
      ok: rows === 0 || publicOk,
      detail: read.error
        ? 'bloqueado ✔'
        : rows === 0
          ? '0 filas visibles ✔'
          : publicOk
            ? `${rows} filas (catálogo público declarado)`
            : `¡${rows} filas visibles para cualquiera!`,
    });

    const write = await anon.from(table as never).insert({} as never);
    // Bloqueado de verdad = error de PERMISOS (RLS o GRANT). Si falla por otra cosa (columna
    // obligatoria, check…), los permisos SÍ dejaban escribir y solo ha frenado la casualidad.
    const blockedByPermissions = Boolean(
      write.error &&
      (write.error.code === '42501' ||
        /permission denied|row-level security/i.test(write.error.message)),
    );
    results.push({
      check: `Escribir en "${table}" sin sesión`,
      ok: blockedByPermissions,
      detail: blockedByPermissions
        ? 'bloqueado ✔'
        : write.error
          ? `¡los permisos dejan escribir! (solo lo ha frenado: ${write.error.message})`
          : '¡Cualquiera puede insertar filas!',
    });
  }

  // 2. Funciones SQL (RPC) sin sesión.
  for (const fn of schemaNames('Functions')) {
    const call = await anon.rpc(fn as never);
    const denied = Boolean(
      call.error &&
      /permission|not allowed|denied|42501/i.test(call.error.message + (call.error.code ?? '')),
    );
    results.push({
      check: `Llamar a la función SQL "${fn}" sin sesión`,
      ok: denied,
      detail: denied
        ? 'bloqueado ✔'
        : `respondió (${call.error ? call.error.message : 'OK'}). Revisa si debe poder llamarla cualquiera: 'revoke execute … from anon'`,
    });
  }

  // 3. Edge Functions sin token de usuario.
  const functionsDir = 'supabase/functions';
  const functions = existsSync(functionsDir)
    ? readdirSync(functionsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
        .map((d) => d.name)
    : [];
  for (const name of functions) {
    try {
      const res = await fetch(`${url}/functions/v1/${name}`, {
        method: 'POST',
        headers: { apikey: key, 'Content-Type': 'application/json' },
        body: '{}',
      });
      const rejected = res.status === 401 || res.status === 403;
      const missing = res.status === 404;
      results.push({
        check: `Edge Function "${name}" sin login`,
        ok: rejected || missing || PUBLIC_FUNCTIONS.includes(name),
        detail: rejected
          ? `rechazada (${res.status}) ✔`
          : missing
            ? 'no desplegada en este proyecto (nada que atacar)'
            : `¡respondió ${res.status} sin login!`,
      });
    } catch (error) {
      results.push({
        check: `Edge Function "${name}" sin login`,
        ok: true,
        detail: `sin respuesta (${String(error)})`,
      });
    }
  }

  // 4. Archivos (Storage) visibles sin sesión.
  const buckets = await anon.storage.listBuckets();
  for (const bucket of buckets.data ?? []) {
    const list = await anon.storage.from(bucket.id).list('', { limit: 5 });
    const files = list.data?.length ?? 0;
    results.push({
      check: `Archivos del bucket "${bucket.id}" sin sesión`,
      ok: files === 0 && !bucket.public,
      detail: bucket.public
        ? '¡bucket PÚBLICO: cualquiera con el enlace ve los archivos!'
        : files === 0
          ? 'nada visible ✔'
          : `¡${files} archivos listables!`,
    });
  }

  // 5. Registro abierto (informativo): ¿puede cualquiera crear cuentas sin confirmar email?
  const settings = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: key } })
    .then((r) => r.json() as Promise<{ mailer_autoconfirm?: boolean; disable_signup?: boolean }>)
    .catch(() => null);
  if (settings) {
    results.push({
      check: 'Registro sin confirmar email',
      ok: true,
      detail: settings.disable_signup
        ? 'registro cerrado'
        : settings.mailer_autoconfirm
          ? '⚠️ activado (bien para desarrollo; en producción, activa "Confirm email" y CAPTCHA)'
          : 'exige confirmar email ✔',
    });
  }

  const width = Math.max(...results.map((r) => r.check.length));
  for (const r of results) {
    console.log(`${r.ok ? '✅' : '❌'} ${r.check.padEnd(width)}  ${r.detail}`);
  }
  const holes = results.filter((r) => !r.ok);
  console.log(
    holes.length
      ? `\n❌ ${holes.length} posible(s) agujero(s). Pídele a Claude: /anti-hackeo\n`
      : '\n✅ Un desconocido sin cuenta no puede leer ni escribir nada. (Falta la prueba entre dos usuarios: /anti-hackeo)\n',
  );
  process.exit(holes.length ? 1 : 0);
}

main().catch((error: unknown) => {
  console.error('❌ El sondeo falló:', error instanceof Error ? error.message : error);
  process.exit(1);
});
