/**
 * `npm run check:secrets` — busca claves secretas donde no deben estar (INV-SEC-1 / INV-SEC-2).
 * También lo corre el CI en cada PR.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { runQuiet } from './lib';

const problems: string[] = [];

function walk(dir: string, exts: string[]): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path, exts);
    return exts.some((e) => name.endsWith(e)) && !name.endsWith('.d.ts') ? [path] : [];
  });
}

// 1) La app (src/) nunca usa claves secretas.
for (const file of walk('src', ['.ts', '.tsx'])) {
  readFileSync(file, 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (/service_role|SERVICE_ROLE|sb_secret_/.test(line)) {
        problems.push(
          `INV-SEC-1: referencia SECRETA en ${file}:${i + 1}. La app es pública: muévelo a una Edge Function.`,
        );
      }
    });
}

// 2) Ningún .env real versionado (solo si es un repo git).
const tracked = runQuiet('git', ['ls-files'])?.split(/\r?\n/) ?? [];
for (const file of tracked) {
  if (/(^|\/)\.env$/.test(file)) {
    problems.push(
      `INV-SEC-2: ${file} está subido a git. Quítalo (git rm --cached ${file}) y cambia las claves.`,
    );
  }
}

// 3) .env.example sin valores.
if (existsSync('.env.example')) {
  readFileSync('.env.example', 'utf8')
    .split(/\r?\n/)
    .forEach((line, i) => {
      if (/^[A-Z_]+=.+/.test(line)) {
        problems.push(
          `INV-SEC-2: .env.example:${i + 1} tiene un valor. Solo debe llevar el NOMBRE de la variable.`,
        );
      }
    });
}

// 4) Claves con pinta de secreto en archivos versionados (salvo docs y este script).
const SECRET = /sk_live_[0-9a-zA-Z]{10,}|\bre_[0-9a-zA-Z]{20,}|sb_secret_[0-9a-zA-Z_-]{10,}/;
for (const file of tracked) {
  if (!file || /^(docs\/|scripts\/check-secrets|INVARIANTS\.md)/.test(file) || !existsSync(file))
    continue;
  if (statSync(file).size > 1_000_000) continue;
  const text = readFileSync(file, 'utf8');
  if (SECRET.test(text)) {
    problems.push(
      `Parece que hay una API key secreta en ${file}. Quítala y cámbiala por una nueva.`,
    );
  }
}

if (problems.length) {
  for (const p of problems) console.error(`❌ ${p}`);
  process.exit(1);
}
console.log('✅ Sin secretos a la vista.');
