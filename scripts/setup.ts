/**
 * `npm run setup` — asistente de configuración inicial (Windows, Mac y Linux).
 *
 * Conecta la app con TU proyecto de Supabase en la nube (plan gratis) sin tener que saber nada
 * de bases de datos:
 *   1. Guarda la URL y la clave pública en `.env`.
 *   2. Inicia sesión en Supabase (se abre el navegador).
 *   3. Enlaza este proyecto con el tuyo de supabase.com.
 *   4. Crea las tablas (aplica las migraciones de supabase/migrations).
 *   5. Ajusta el login para desarrollo (sin email de confirmación).
 *   6. Sube la función de servidor `delete-account`.
 *
 * Se puede repetir sin miedo: lo que ya está hecho se salta o se vuelve a aplicar igual.
 * Prueba sin tocar nada:  npm run setup -- --dry-run
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline';

import { linkedProjectRef, readEnvVar, runInteractive, runQuiet } from './lib';

const DRY_RUN = process.argv.includes('--dry-run');

const bold = (s: string) => `\x1b[1m${s}\x1b[0m`;
const green = (s: string) => `\x1b[32m${s}\x1b[0m`;
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`;
const red = (s: string) => `\x1b[31m${s}\x1b[0m`;
const dim = (s: string) => `\x1b[2m${s}\x1b[0m`;

// ─── Preguntas por teclado ──────────────────────────────────────────────────────────────────

// Sin teclado (respuestas por tubería, p. ej. en pruebas): se leen todas las líneas de golpe.
let pipedAnswers: string[] | null = null;
async function readPipedAnswers(): Promise<string[]> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) chunks.push(chunk as Buffer);
  return Buffer.concat(chunks).toString('utf8').split(/\r?\n/);
}

async function ask(question: string, { hidden = false } = {}): Promise<string> {
  if (!process.stdin.isTTY) {
    pipedAnswers ??= await readPipedAnswers();
    const next = pipedAnswers.shift();
    if (next === undefined) {
      fail('Faltan respuestas: ejecuta `npm run setup` en una terminal normal.');
    }
    const answer = next.trim();
    console.log(`${question}${hidden ? '***' : answer}`);
    return answer;
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    // Oculta lo que se escribe (para la contraseña): se muestra un * por carácter.
    const internal = rl as unknown as {
      _writeToOutput: (s: string) => void;
      output: NodeJS.WriteStream;
    };
    internal._writeToOutput = (s: string) => {
      if (s.includes(question)) internal.output.write(s);
      else if (s === '\r\n' || s === '\n') internal.output.write(s);
      else internal.output.write('*'.repeat(s.length));
    };
  }
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write('\n');
      resolve(answer.trim());
    }),
  );
}

async function askUntilValid(
  question: string,
  validate: (v: string) => string | null,
  hidden = false,
) {
  for (;;) {
    const value = await ask(question, { hidden });
    const error = validate(value);
    if (!error) return value;
    console.log(red(`   ${error}`));
  }
}

async function confirm(question: string): Promise<boolean> {
  const answer = await ask(`${question} ${dim('(s/n)')} `);
  return /^s|^y/i.test(answer);
}

function step(n: number, title: string) {
  console.log(`\n${bold(`── Paso ${n}/6 · ${title}`)}`);
}

function run(command: string, args: string[], env: Record<string, string> = {}): boolean {
  const printable = [command, ...args].join(' ');
  if (DRY_RUN) {
    console.log(dim(`   (simulación) ${printable}`));
    return true;
  }
  Object.assign(process.env, env);
  const ok = runInteractive(command, args);
  for (const key of Object.keys(env)) delete process.env[key];
  return ok;
}

function fail(message: string): never {
  console.log(`\n${red('✖ ' + message)}`);
  console.log(`Arréglalo y vuelve a ejecutar ${bold('npm run setup')} (lo ya hecho no se repite).`);
  console.log(`Guía con capturas y soluciones: abre ${bold('SETUP.html')} (doble clic).\n`);
  process.exit(1);
}

// ─── Validaciones ───────────────────────────────────────────────────────────────────────────

function validateUrl(value: string): string | null {
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/.test(value)) {
    return 'Debe ser tipo https://abcdefghijklmnopqrst.supabase.co (Project Settings → Data API → Project URL).';
  }
  return null;
}

function validateKey(value: string): string | null {
  if (/sb_secret_|service_role/.test(value)) {
    return '⚠️  Esa es la clave SECRETA. Nunca la pongas en la app. Copia la "Publishable key".';
  }
  if (!/^sb_publishable_[\w-]{10,}$/.test(value) && !/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(value)) {
    return 'Debe empezar por sb_publishable_ (Project Settings → API Keys → Publishable key).';
  }
  return null;
}

// ─── Asistente ──────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log(
    `\n${bold('🎨 Configuración de la app')}${DRY_RUN ? yellow('  [SIMULACIÓN: no se cambia nada]') : ''}`,
  );
  console.log('Vamos a conectar la app con tu base de datos gratuita de Supabase.');
  console.log(
    `Necesitas tener creado el proyecto en ${bold('https://supabase.com/dashboard')} (ver SETUP.html, paso 5).`,
  );

  const nodeMajor = Number(process.versions.node.split('.')[0]);
  if (nodeMajor < 20)
    fail(
      `Tu Node es la versión ${process.versions.node}. Instala la versión LTS desde https://nodejs.org`,
    );

  // 1 · .env ──────────────────────────────────────────────────────────────────────────────
  step(1, 'Datos de tu proyecto de Supabase');
  let url = readEnvVar('EXPO_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  let key = readEnvVar('EXPO_PUBLIC_SUPABASE_KEY');
  const alreadyConfigured = !validateUrl(url) && !validateKey(key);

  if (
    alreadyConfigured &&
    !(await confirm(`Ya tienes configurado ${bold(url)}. ¿Quieres cambiarlo?`))
  ) {
    console.log(green('   ✓ Se mantiene el .env actual'));
  } else {
    console.log(
      dim(
        '   En supabase.com → tu proyecto → botón "Connect" (arriba) o Project Settings → API Keys.',
      ),
    );
    url = (await askUntilValid('   Project URL: ', validateUrl)).replace(/\/$/, '');
    key = await askUntilValid('   Publishable key: ', validateKey);

    const template = existsSync('.env.example') ? readFileSync('.env.example', 'utf8') : '';
    const envText = (template || 'EXPO_PUBLIC_SUPABASE_URL=\nEXPO_PUBLIC_SUPABASE_KEY=\n')
      .replace(/^EXPO_PUBLIC_SUPABASE_URL=.*$/m, `EXPO_PUBLIC_SUPABASE_URL=${url}`)
      .replace(/^EXPO_PUBLIC_SUPABASE_KEY=.*$/m, `EXPO_PUBLIC_SUPABASE_KEY=${key}`);
    if (DRY_RUN) {
      console.log(dim('   (simulación) se escribiría .env con esa URL y esa clave'));
    } else {
      writeFileSync('.env', envText);
      console.log(green('   ✓ Guardado en .env'));
    }
  }
  const projectRef = url.replace('https://', '').split('.')[0]!;

  // 2 · login ─────────────────────────────────────────────────────────────────────────────
  step(2, 'Iniciar sesión en Supabase');
  const loggedIn = !DRY_RUN && runQuiet('npx', ['supabase', 'projects', 'list']) !== null;
  if (loggedIn) {
    console.log(green('   ✓ Ya habías iniciado sesión'));
  } else {
    console.log('   Se abrirá el navegador: pulsa el botón para autorizar y vuelve aquí.');
    if (!run('npx', ['supabase', 'login'])) fail('No se pudo iniciar sesión en Supabase.');
  }

  // 3 · link ──────────────────────────────────────────────────────────────────────────────
  step(3, 'Enlazar con tu proyecto');
  let dbPassword = '';
  const needsPassword = async () => {
    if (!dbPassword) {
      console.log(
        dim('   Es la "Database password" que pusiste al crear el proyecto (no la de tu cuenta).'),
      );
      console.log(
        dim('   ¿No la recuerdas? Project Settings → Database → Reset database password.'),
      );
      dbPassword = await askUntilValid(
        '   Contraseña de la base de datos: ',
        (v) => (v ? null : 'Escríbela.'),
        true,
      );
    }
    return { SUPABASE_DB_PASSWORD: dbPassword };
  };

  if (linkedProjectRef() === projectRef) {
    console.log(green(`   ✓ Ya enlazado con ${projectRef}`));
  } else if (
    !run('npx', ['supabase', 'link', '--project-ref', projectRef], await needsPassword())
  ) {
    fail('No se pudo enlazar. ¿La contraseña de la base de datos es correcta?');
  }

  // 4 · migraciones ───────────────────────────────────────────────────────────────────────
  step(4, 'Crear las tablas (migraciones)');
  console.log(dim('   Aplica los archivos de supabase/migrations que tu proyecto aún no tenga.'));
  if (!run('npx', ['supabase', 'db', 'push', '--yes'], await needsPassword())) {
    fail('No se pudieron crear las tablas.');
  }

  // 5 · ajustes de login ──────────────────────────────────────────────────────────────────
  step(5, 'Ajustes de login para desarrollo (a mano, 1 minuto)');
  // No se usa `supabase config push`: copiaría a la nube ajustes pensados para la base local.
  console.log('   Mientras desarrollas, que no haga falta confirmar el email al registrarse:');
  console.log(
    `   supabase.com → tu proyecto → ${bold('Authentication')} → ${bold('Sign In / Providers')} → ${bold('Email')}`,
  );
  console.log(`   → desactiva ${bold('"Confirm email"')} → ${bold('Save')}.`);
  console.log(
    dim(
      '   (Se vuelve a activar al publicar, con emails de verdad: docs/graduacion/04-emails-con-resend.md)',
    ),
  );
  await ask(`   Pulsa ${bold('Enter')} cuando lo tengas… `);

  // 6 · función de servidor ───────────────────────────────────────────────────────────────
  step(6, 'Subir la función "borrar cuenta"');
  if (
    !run('npx', [
      'supabase',
      'functions',
      'deploy',
      'delete-account',
      '--use-api',
      '--project-ref',
      projectRef,
    ])
  ) {
    console.log(
      yellow('   ⚠️  No se pudo subir. La app funciona igual; solo fallará "Borrar mi cuenta".'),
    );
    console.log(`      Reinténtalo más tarde con ${bold('npm run setup')}.`);
  }

  console.log(`\n${green(bold('✅ ¡Listo! La app ya está conectada a tu base de datos.'))}\n`);
  console.log(
    `Ahora: ${bold('npm start')} y escanea el código QR con la app ${bold('Expo Go')} de tu móvil.`,
  );
  console.log('Dentro de la app, pulsa "Regístrate" y crea tu cuenta.\n');
}

main().catch((error: unknown) => fail(error instanceof Error ? error.message : String(error)));
