#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TEMPLATE_FILE="${PROJECT_ROOT}/docs/STAGING_SIGNOFF_TEMPLATE.md"
OUT_FILE="${PROJECT_ROOT}/docs/STAGING_SIGNOFF_$(date +%Y-%m-%d_%H%M%S).md"

if [[ ! -f "${TEMPLATE_FILE}" ]]; then
  echo "[signoff-init] Missing template: ${TEMPLATE_FILE}" >&2
  exit 1
fi

cp "${TEMPLATE_FILE}" "${OUT_FILE}"

# Fill a few helpful defaults for faster staging handoff
sed -i '' "s/- Date\/Time:/- Date\/Time: $(date '+%Y-%m-%d %H:%M:%S %Z')/" "${OUT_FILE}"

GIT_SHA="$(git -C "${PROJECT_ROOT}" rev-parse --short HEAD 2>/dev/null || echo unknown)"
sed -i '' "s/- Commit SHA:/- Commit SHA: ${GIT_SHA}/" "${OUT_FILE}"

echo "[signoff-init] Created ${OUT_FILE}"

echo "[signoff-init] Next: fill this file after running:"
echo "  ./scripts/staging-smoke-preflight.sh"
echo "  ./scripts/run-staging-smoke.sh"
