#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./scripts/run-staging-smoke-with-env-file.sh ./.env.staging.local
#
# Expected env file entries:
#   DATABASE_URL=...
#   NEXTAUTH_URL=...
#   AUTH_SECRET=...

ENV_FILE="${1:-.env.staging.local}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Env file not found: $ENV_FILE"
  echo "Create it with DATABASE_URL, NEXTAUTH_URL, AUTH_SECRET and rerun."
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

./scripts/run-staging-smoke.sh
