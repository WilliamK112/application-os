#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
OUT_FILE="${PROJECT_ROOT}/docs/STAGING_BLOCKER_STATUS.md"

cd "${PROJECT_ROOT}"

now="$(date '+%Y-%m-%d %H:%M %Z')"
missing=()
for key in DATABASE_URL NEXTAUTH_URL AUTH_SECRET; do
  if [[ -z "${!key:-}" ]]; then
    missing+=("$key")
  fi
done

{
  echo "# Staging Blocker Status"
  echo
  echo "Last checked: ${now}"
  echo
  if (( ${#missing[@]} > 0 )); then
    echo "## Current blocker"
    echo "Staging smoke/sign-off cannot run in the current runtime because required environment variables are not available:"
    echo
    for key in "${missing[@]}"; do
      echo "- \`${key}\`"
    done
  else
    echo "## Current status"
    echo "All required staging env vars are present in this runtime."
  fi
  echo
  echo "## Fastest unblocking path (in a real staging shell)"
  echo
  echo "1. \`./scripts/print-staging-env-exports.sh\`"
  echo "2. Export real staging values"
  echo "3. \`./scripts/staging-signoff-status.sh\` (expect READY)"
  echo "4. \`./scripts/run-staging-smoke-with-env-file.sh ./.env.staging.local\` (or \`./scripts/run-staging-smoke.sh\`)"
  echo "5. Fill \`docs/STAGING_SIGNOFF_2026-03-28_103644.md\`"
  echo "6. \`./scripts/validate-staging-signoff.sh docs/STAGING_SIGNOFF_2026-03-28_103644.md\`"
  echo
  echo "## Evidence expectation for sign-off"
  echo
  echo "- \`auth.login.failed\` with \`metadata.outcome=invalid_credentials\`"
  echo "- \`auth.login.success\` with actor/email/ip metadata"
  echo "- Protected-route redirect check"
  echo "- Job/Application create + status update PASS"
} > "${OUT_FILE}"

echo "[blocker-status] Updated ${OUT_FILE}"
if (( ${#missing[@]} > 0 )); then
  echo "[blocker-status] Missing: ${missing[*]}"
else
  echo "[blocker-status] READY: all required env vars present"
fi
