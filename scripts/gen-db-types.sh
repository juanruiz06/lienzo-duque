#!/usr/bin/env bash
# Genera src/types/database.ts a partir del esquema de la base de datos.
#
#   npm run db:types            → desde la base LOCAL (necesita `npm run db:start`)
#   npm run db:types -- --linked → desde el proyecto de la NUBE enlazado (`supabase link`)
#
# Córrelo SIEMPRE después de crear o cambiar una migración: así TypeScript sabe qué columnas
# existen y te avisa si escribes mal un nombre.
set -euo pipefail

TARGET="--local"
if [[ "${1:-}" == "--linked" ]]; then
  TARGET="--linked"
fi

OUT="src/types/database.ts"
TMP="$(mktemp)"

npx supabase gen types typescript "$TARGET" --schema public > "$TMP"
{
  echo "// ⚠️ ARCHIVO GENERADO por \`npm run db:types\`. No lo edites a mano: se sobrescribe."
  echo ""
  cat "$TMP"
} > "$OUT"
rm -f "$TMP"
npx prettier --log-level warn --write "$OUT"
echo "✅ Tipos regenerados en $OUT"
