#!/usr/bin/env bash
# `npm run check:secrets` — busca claves secretas donde no deben estar (INV-SEC-1 / INV-SEC-2).
# También lo corre el CI en cada PR.
set -uo pipefail
fail=0

# 1) La app (src/) nunca usa claves secretas.
if grep -rnE "service_role|SERVICE_ROLE|sb_secret_" src --include='*.ts' --include='*.tsx' | grep -v "\.d\.ts"; then
  echo "❌ INV-SEC-1: hay una clave/referencia SECRETA dentro de src/. La app es pública: muévelo a una Edge Function."
  fail=1
fi

# 2) Ningún .env real versionado.
if git ls-files | grep -E '(^|/)\.env$'; then
  echo "❌ INV-SEC-2: hay un .env subido a git. Bórralo del repo (git rm --cached .env) y rota las claves."
  fail=1
fi

# 3) .env.example sin valores.
if grep -nE '^[A-Z_]+=.+' .env.example; then
  echo "❌ INV-SEC-2: .env.example tiene valores. Debe llevar solo los NOMBRES de las variables."
  fail=1
fi

# 4) Claves con pinta de secreto en archivos versionados.
if git ls-files -z | xargs -0 grep -nE "sk_live_[0-9a-zA-Z]{10,}|re_[0-9a-zA-Z]{20,}|sb_secret_[0-9a-zA-Z_-]{10,}" -- 2>/dev/null \
  | grep -vE "^(scripts/check-secrets\.sh|INVARIANTS\.md|docs/)"; then
  echo "❌ Parece que hay una API key secreta en un archivo del repo. Quítala y rótala."
  fail=1
fi

if [[ $fail -eq 0 ]]; then
  echo "✅ Sin secretos a la vista."
fi
exit $fail
