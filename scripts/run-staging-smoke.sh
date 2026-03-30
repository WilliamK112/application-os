#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

"$ROOT_DIR/scripts/staging-smoke-preflight.sh"

echo "[staging-smoke] Running migrate/seed/build..."
npx prisma migrate deploy
npx prisma db seed
npm run build

echo "[staging-smoke] Running documented smoke checks..."
echo "Follow: docs/STAGING_READINESS_SMOKETEST.md"
echo "Capture auth log-sink evidence for:"
echo "  - auth.login.failed (metadata.outcome=invalid_credentials)"
echo "  - auth.login.success"

echo "[staging-smoke] Optional automated local smoke script:"
echo "  npm run tsx -- scripts/smoke-auth-flow.ts"

echo "[staging-smoke] Done."
