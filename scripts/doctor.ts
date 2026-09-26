/**
 * `npm run doctor` — comprueba que tu ordenador y el proyecto están listos para trabajar.
 * No cambia nada: solo mira y te dice qué falta y cómo arreglarlo. Funciona en Windows, Mac y Linux.
 */
import { existsSync, readFileSync } from 'node:fs';
import { networkInterfaces } from 'node:os';

import { envMode, isLocalDbRunning, linkedProjectRef, readEnvVar, runQuiet } from './lib';

type Status = 'ok' | 'warn' | 'fail';
const results: { status: Status; label: string; help?: string }[] = [];
const add = (status: Status, label: string, help?: string) => results.push({ status, label, help });

// 1. Node
const nodeMajor = Number(process.versions.node.split('.')[0]);
if (nodeMajor >= 20) {
  add('ok', `Node ${process.versions.node}`);
} else {
  add(
    'fail',
    `Node ${process.versions.node} es demasiado viejo`,
    'Instala la versión LTS desde https://nodejs.org',
  );
}

// 2. Git
add(
  runQuiet('git', ['--version']) ? 'ok' : 'warn',
  'Git instalado',
  'Instala Git for Windows: https://git-scm.com/download/win',
);

// 3. Dependencias
add(existsSync('node_modules') ? 'ok' : 'fail', 'Dependencias instaladas', 'Ejecuta: npm install');

// 4. OneDrive (en Windows sincroniza el Escritorio/Documentos y se atraganta con node_modules)
if (/onedrive/i.test(process.cwd())) {
  add(
    'warn',
    'El proyecto está dentro de OneDrive',
    'Muévelo a una carpeta fuera de OneDrive, p. ej. C:\\proyectos\\',
  );
}

// 5. .env y base de datos
const mode = envMode();
if (!existsSync('.env')) {
  add('fail', 'Falta el archivo .env', 'Ejecuta: npm run setup');
} else {
  const envText = readFileSync('.env', 'utf8');
  const url = readEnvVar('EXPO_PUBLIC_SUPABASE_URL');
  add(url ? 'ok' : 'fail', `Base de datos: ${url || '(sin configurar)'}`, 'Ejecuta: npm run setup');
  add(
    readEnvVar('EXPO_PUBLIC_SUPABASE_KEY') ? 'ok' : 'fail',
    'Clave pública de Supabase',
    'Ejecuta: npm run setup',
  );
  if (/service_role|sb_secret_/.test(envText)) {
    add(
      'fail',
      '.env contiene una clave SECRETA',
      'Quítala: en .env solo van claves públicas (INVARIANTS.md → INV-SEC-1).',
    );
  }

  if (mode === 'cloud') {
    const ref = url.replace('https://', '').split('.')[0];
    const linked = linkedProjectRef();
    add(
      linked === ref ? 'ok' : 'warn',
      linked === ref ? 'Proyecto de Supabase enlazado' : 'Proyecto de Supabase sin enlazar',
      'Ejecuta: npm run setup (hace falta para crear tablas nuevas).',
    );
  } else if (mode === 'local') {
    add(
      isLocalDbRunning() ? 'ok' : 'fail',
      isLocalDbRunning() ? 'Base de datos local en marcha' : 'Base de datos local parada',
      'Abre Docker Desktop y ejecuta: npm run db:start',
    );
    if (/127\.0\.0\.1|localhost/.test(url)) {
      add(
        'warn',
        'La base apunta a 127.0.0.1',
        'Vale para simulador y web; en un móvil físico usa la IP de abajo.',
      );
    }
  }
}

const lanIp = Object.values(networkInterfaces())
  .flat()
  .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;

console.log('\n🩺 Diagnóstico\n');
for (const r of results) {
  const icon = r.status === 'ok' ? '✅' : r.status === 'warn' ? '⚠️ ' : '❌';
  console.log(`${icon} ${r.label}`);
  if (r.status !== 'ok' && r.help) {
    console.log(`   → ${r.help}`);
  }
}
if (mode === 'local' && lanIp) {
  console.log(`\n📱 Móvil físico + base local → EXPO_PUBLIC_SUPABASE_URL=http://${lanIp}:54421`);
}
const failed = results.some((r) => r.status === 'fail');
console.log(
  failed
    ? '\nHay cosas que arreglar (❌). Guía paso a paso: SETUP.html\n'
    : '\nTodo listo: npm start y escanea el QR con Expo Go. 🚀\n',
);
process.exit(failed ? 1 : 0);
