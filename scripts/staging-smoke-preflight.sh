#!/usr/bin/env bash
set -euo pipefail

required_vars=(DATABASE_URL NEXTAUTH_URL AUTH_SECRET)
missing=()

for var in "${required_vars[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    missing+=("$var")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "[staging-preflight] Missing required environment variables: ${missing[*]}" >&2
  echo "[staging-preflight] Export them in your staging shell, then run:" >&2
  echo "  npx prisma migrate deploy" >&2
  echo "  npx prisma db seed   # optional" >&2
  echo "  npm run build" >&2
  echo "  # then execute docs/STAGING_READINESS_SMOKETEST.md" >&2
  exit 1
fi

echo "[staging-preflight] Required env vars present: DATABASE_URL, NEXTAUTH_URL, AUTH_SECRET"
echo "[staging-preflight] Ready to run docs/STAGING_READINESS_SMOKETEST.md"
