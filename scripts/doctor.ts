/**
 * `npm run doctor` — comprueba que tu máquina y el proyecto están listos para trabajar.
 * No cambia nada: solo mira y te dice qué falta y cómo arreglarlo.
 */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

type Status = 'ok' | 'warn' | 'fail';
const results: { status: Status; label: string; help?: string }[] = [];
const add = (status: Status, label: string, help?: string) => results.push({ status, label, help });

function run(cmd: string): string | null {
  try {
    return execSync(cmd, { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return null;
  }
}

// 1. Node
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor >= 20) {
  add('ok', `Node ${process.versions.node}`);
} else {
  add(
    'fail',
    `Node ${process.versions.node} es demasiado viejo`,
    'Instala Node 22 (https://nodejs.org o `nvm install 22`).',
  );
}

// 2. Git
add(run('git --version') ? 'ok' : 'fail', 'Git instalado', 'Instala Git: https://git-scm.com');

// 3. node_modules
add(
  existsSync('node_modules') ? 'ok' : 'fail',
  'Dependencias instaladas',
  'Ejecuta `npm install`.',
);

// 4. .env
if (!existsSync('.env')) {
  add(
    'fail',
    'Existe .env',
    'Ejecuta `cp .env.example .env` y rellénalo (docs/00-empieza-aqui.md).',
  );
} else {
  const envText = readFileSync('.env', 'utf8');
  const get = (key: string) => envText.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim() ?? '';
  const url = get('EXPO_PUBLIC_SUPABASE_URL');
  const key = get('EXPO_PUBLIC_SUPABASE_KEY');
  add(url ? 'ok' : 'fail', `EXPO_PUBLIC_SUPABASE_URL = ${url || '(vacío)'}`, 'Rellénalo en .env.');
  add(key ? 'ok' : 'fail', 'EXPO_PUBLIC_SUPABASE_KEY rellena', 'Rellénala en .env.');
  if (/service_role|sb_secret_/.test(envText)) {
    add(
      'fail',
      '.env contiene una clave SECRETA',
      'Quítala: en .env solo van claves públicas (INV-SEC-1).',
    );
  }
  if (url.includes('127.0.0.1') || url.includes('localhost')) {
    add(
      'warn',
      'Supabase apunta a tu ordenador (127.0.0.1)',
      'Vale para simulador y web. En un móvil físico usa la IP de abajo.',
    );
  }
}

// 5. Docker (solo para Supabase local)
const docker = run('docker info --format "{{.ServerVersion}}"');
add(
  docker ? 'ok' : 'warn',
  docker ? `Docker ${docker} en marcha` : 'Docker no está en marcha',
  'Solo hace falta para Supabase LOCAL. Abre Docker Desktop, o usa Supabase en la nube.',
);

// 6. Supabase local
const status = run('npx supabase status -o json');
add(
  status ? 'ok' : 'warn',
  status ? 'Supabase local arrancado' : 'Supabase local parado',
  'Si usas la base local: `npm run db:start`.',
);

// IP de la red local (para móviles físicos con Expo Go)
const lanIp = Object.values(networkInterfaces())
  .flat()
  .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;

console.log('\n🩺 Lienzo doctor\n');
for (const r of results) {
  const icon = r.status === 'ok' ? '✅' : r.status === 'warn' ? '⚠️ ' : '❌';
  console.log(`${icon} ${r.label}`);
  if (r.status !== 'ok' && r.help) {
    console.log(`   → ${r.help}`);
  }
}
if (lanIp) {
  console.log(`\n📱 IP de este ordenador en tu wifi: ${lanIp}`);
  console.log(`   Móvil físico + Supabase local → EXPO_PUBLIC_SUPABASE_URL=http://${lanIp}:54421`);
}
const failed = results.some((r) => r.status === 'fail');
console.log(
  failed ? '\nHay cosas que arreglar (❌). \n' : '\nTodo listo. `npm start` y a construir. 🚀\n',
);
process.exit(failed ? 1 : 0);
