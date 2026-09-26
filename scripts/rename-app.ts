/**
 * `npm run rename -- "Mi App" com.tunombre.miapp`
 *
 * Cambia el nombre de la plantilla (Lienzo) por el de TU app en los sitios que importan:
 * nombre visible, slug, esquema de enlaces (miapp://), bundle id de iOS y package de Android.
 *
 * Hazlo al principio: el bundle id NO se puede cambiar una vez publicada la app en las tiendas.
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [displayName, bundleId] = process.argv.slice(2);

if (!displayName || !bundleId) {
  console.error('Uso: npm run rename -- "Nombre Visible" com.tunombre.tuapp');
  process.exit(1);
}
if (!/^[a-z][a-z0-9]*(\.[a-z][a-z0-9]*){2,}$/.test(bundleId)) {
  console.error(
    'El bundle id debe ser tipo com.tunombre.tuapp (minúsculas, sin guiones ni espacios).',
  );
  process.exit(1);
}

// El nombre del proyecto local de Supabase cambia: si la base está arrancada con el nombre viejo,
// luego `db:stop` no la encontraría. Hay que pararla antes.
try {
  execSync('npx supabase status', { stdio: 'ignore' });
  console.error('Supabase local está en marcha. Páralo primero con `npm run db:stop` y repite.');
  process.exit(1);
} catch {
  // Parado: seguimos.
}

const slug = displayName
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');
const scheme = slug.replace(/-/g, '');

// app.json
const app = JSON.parse(readFileSync('app.json', 'utf8'));
app.expo.name = displayName;
app.expo.slug = slug;
app.expo.scheme = scheme;
app.expo.ios.bundleIdentifier = bundleId;
app.expo.android.package = bundleId;
writeFileSync('app.json', JSON.stringify(app, null, 2) + '\n');

// package.json
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
pkg.name = slug;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

// supabase/config.toml (id del proyecto local + redirecciones de auth)
let toml = readFileSync('supabase/config.toml', 'utf8');
toml = toml
  .replace(/^project_id = ".*"$/m, `project_id = "${slug}"`)
  .replace(/lienzo:\/\//g, `${scheme}://`);
writeFileSync('supabase/config.toml', toml);

console.log(`✅ App renombrada:
   Nombre visible : ${displayName}
   Slug           : ${slug}
   Esquema        : ${scheme}://
   iOS / Android  : ${bundleId}

Siguientes pasos:
  1. Cambia el texto "Lienzo" de la pantalla de login (src/app/(auth)/sign-in.tsx).
  2. Cambia el icono y el splash (assets/images/) — ver docs/guias/iconos-y-splash.md.
  3. Si usas la base local (avanzado): npm run db:start`);
