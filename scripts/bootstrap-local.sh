#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f ".env" ]]; then
  if [[ -f ".env.example" ]]; then
    cp .env.example .env
    echo "[bootstrap] Created .env from .env.example"
  else
    echo "[bootstrap] Missing .env and .env.example" >&2
    exit 1
  fi
fi

if ! command -v npm >/dev/null 2>&1; then
  echo "[bootstrap] npm is required but not installed." >&2
  exit 1
fi

if [[ ! -d "node_modules" ]]; then
  echo "[bootstrap] Installing dependencies..."
  npm install
fi

echo "[bootstrap] Applying Prisma migrations..."
npx prisma migrate deploy

echo "[bootstrap] Seeding database..."
npx prisma db seed

echo "[bootstrap] Running tests..."
npm test

echo "[bootstrap] Building app..."
npm run build

echo "[bootstrap] Local bootstrap completed successfully."
