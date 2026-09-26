/**
 * Utilidades compartidas por los scripts de `scripts/`. Funcionan igual en Windows, Mac y Linux
 * (por eso son TypeScript/Node y no bash).
 */
import { spawnSync, type SpawnSyncOptions } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

/**
 * Une comando y argumentos en una sola línea para la shell (cmd.exe en Windows, sh en Mac/Linux).
 * Hace falta `shell: true` porque en Windows `npx` es `npx.cmd`.
 */
function toCommandLine(command: string, args: string[]): string {
  const quote = (a: string) => (/[\s{}"&|<>^]/.test(a) ? `"${a.replace(/"/g, '\\"')}"` : a);
  return [command, ...args.map(quote)].join(' ');
}

/** Ejecuta un comando mostrando su salida y dejando que pida datos (contraseñas, "¿seguro?"). */
export function runInteractive(command: string, args: string[]): boolean {
  const result = spawnSync(toCommandLine(command, args), { stdio: 'inherit', shell: true });
  return result.status === 0;
}

/** Ejecuta un comando en silencio y devuelve su salida, o `null` si falla. */
export function runQuiet(command: string, args: string[], options: SpawnSyncOptions = {}) {
  const result = spawnSync(toCommandLine(command, args), {
    encoding: 'utf8',
    shell: true,
    ...options,
  });
  if (result.status !== 0) {
    return null;
  }
  return String(result.stdout ?? '').trim();
}

/** Lee una variable del archivo .env (o '' si no existe). */
export function readEnvVar(key: string): string {
  if (!existsSync('.env')) {
    return '';
  }
  const text = readFileSync('.env', 'utf8');
  const match = text.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match?.[1]?.trim() ?? '';
}

/** `project_id` de supabase/config.toml (nombra los contenedores de Docker en modo local). */
export function localProjectId(): string {
  const toml = readFileSync('supabase/config.toml', 'utf8');
  return toml.match(/^project_id = "(.*)"$/m)?.[1] ?? 'lienzo';
}

/** ¿Está arrancada la base de datos LOCAL (Docker)? */
export function isLocalDbRunning(): boolean {
  const names = runQuiet('docker', ['ps', '--format', '{{.Names}}']);
  return Boolean(names?.split(/\r?\n/).includes(`supabase_db_${localProjectId()}`));
}

/** ¿Está el repo enlazado a un proyecto de Supabase en la nube (`supabase link`)? */
export function linkedProjectRef(): string | null {
  const file = 'supabase/.temp/project-ref';
  return existsSync(file) ? readFileSync(file, 'utf8').trim() || null : null;
}

/** "local" si el .env apunta a este ordenador; "cloud" si apunta a supabase.co. */
export function envMode(): 'local' | 'cloud' | 'unknown' {
  const url = readEnvVar('EXPO_PUBLIC_SUPABASE_URL');
  if (/127\.0\.0\.1|localhost|192\.168\.|10\.\d+\.|172\.(1[6-9]|2\d|3[01])\./.test(url)) {
    return 'local';
  }
  if (/\.supabase\.co/.test(url)) {
    return 'cloud';
  }
  return 'unknown';
}
