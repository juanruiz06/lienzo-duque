/**
 * `npm run db:types` — genera src/types/database.ts a partir del esquema de la base de datos.
 *
 * Elige solo de dónde leer:
 *   - base LOCAL si está arrancada (Docker, modo avanzado);
 *   - si no, el proyecto de la NUBE enlazado (`npm run setup` lo enlaza).
 * Forzar: `npm run db:types -- --local` o `npm run db:types -- --linked`.
 *
 * Córrelo SIEMPRE después de crear o cambiar una migración: así TypeScript sabe qué columnas
 * existen y te avisa si escribes mal un nombre.
 */
import { writeFileSync } from 'node:fs';

import { isLocalDbRunning, linkedProjectRef, runInteractive, runQuiet } from './lib';

const OUT = 'src/types/database.ts';
const forced = process.argv.find((a) => a === '--local' || a === '--linked');
const target = forced ?? (isLocalDbRunning() ? '--local' : linkedProjectRef() ? '--linked' : null);

if (!target) {
  console.error(
    '❌ No encuentro ninguna base de datos de la que leer.\n' +
      '   · Nube: ejecuta `npm run setup` (enlaza tu proyecto de Supabase).\n' +
      '   · Local (avanzado): `npm run db:start`.',
  );
  process.exit(1);
}

console.log(`Leyendo el esquema desde la base ${target === '--local' ? 'LOCAL' : 'de la NUBE'}…`);
const raw = runQuiet(
  'npx',
  ['supabase', 'gen', 'types', 'typescript', target, '--schema', 'public'],
  {
    maxBuffer: 20 * 1024 * 1024,
  },
);
if (raw === null || !raw.includes('export type Database')) {
  console.error('❌ No se pudieron generar los tipos. Si es la nube, prueba `npx supabase login`.');
  process.exit(1);
}

// La versión de la nube añade `__InternalSupabase` (versión de PostgREST) y la local no. Se quita
// para que el archivo salga idéntico en los dos modos (si no, el CI vería diferencias falsas).
const normalized = raw
  .replace(/^[ \t]*\/\/ Allows to automatically instantiate[^\n]*\n/m, '')
  .replace(/^[ \t]*\/\/ instead of createClient[^\n]*\n/m, '')
  .replace(/^[ \t]*__InternalSupabase: \{[^}]*\}\s*;?[ \t]*\n/m, '');

writeFileSync(
  OUT,
  `// ⚠️ ARCHIVO GENERADO por \`npm run db:types\`. No lo edites a mano: se sobrescribe.\n\n${normalized}\n`,
);
runInteractive('npx', ['prettier', '--log-level', 'warn', '--write', OUT]);
console.log(`✅ Tipos regenerados en ${OUT}`);
