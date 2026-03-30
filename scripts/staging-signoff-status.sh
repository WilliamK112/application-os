#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

cd "${PROJECT_ROOT}"

echo "[signoff-status] Project: ${PROJECT_ROOT}"
echo "[signoff-status] Time: $(date '+%Y-%m-%d %H:%M:%S %Z')"

missing=()
for key in DATABASE_URL NEXTAUTH_URL AUTH_SECRET; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

if (( ${#missing[@]} > 0 )); then
  echo "[signoff-status] BLOCKED: missing env vars: ${missing[*]}"
  echo "[signoff-status] Next actions:"
  echo "  1) In staging shell: ./scripts/print-staging-env-exports.sh"
  echo "  2) Export real values"
  echo "  3) Run: ./scripts/run-staging-smoke.sh"
  echo "  4) Fill signoff doc and validate with: ./scripts/validate-staging-signoff.sh <file>"
  exit 2
fi

echo "[signoff-status] Env vars present. Running preflight..."
./scripts/staging-smoke-preflight.sh

echo "[signoff-status] READY: preflight passed. Run ./scripts/run-staging-smoke.sh next."
