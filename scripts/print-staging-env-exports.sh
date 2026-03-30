#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_FILE="${PROJECT_ROOT}/.env.staging.example"

if [[ ! -f "${TEMPLATE_FILE}" ]]; then
  echo "[staging-env] Missing template: ${TEMPLATE_FILE}" >&2
  exit 1
fi

echo "# Run these in your staging shell (replace placeholders first):"
grep -E '^(DATABASE_URL|NEXTAUTH_URL|AUTH_SECRET)=' "${TEMPLATE_FILE}" | while IFS= read -r line; do
  printf 'export %s\n' "${line}"
done

echo
echo "# Then run:"
echo "bash scripts/staging-smoke-preflight.sh"
echo "bash scripts/run-staging-smoke.sh"
