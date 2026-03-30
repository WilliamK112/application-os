#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <signoff-file>" >&2
  exit 1
fi

FILE="$1"
if [[ ! -f "$FILE" ]]; then
  echo "[signoff-validate] File not found: $FILE" >&2
  exit 1
fi

missing=0

# 1) Hard-required completion markers
required_exact=(
  "Ready for Phase-3 closeout: YES"
  "auth.login.failed"
  "invalid_credentials"
  "auth.login.success"
  "Job create: PASS"
  "Application create: PASS"
  "Application status update: PASS"
)

for pattern in "${required_exact[@]}"; do
  if ! grep -Fq "$pattern" "$FILE"; then
    echo "[signoff-validate] Missing expected evidence marker: $pattern"
    missing=1
  fi
done

# 2) Ensure placeholders are resolved (template text should be gone)
for placeholder in "PASS/FAIL" "YES/NO"; do
  if grep -Fq "$placeholder" "$FILE"; then
    echo "[signoff-validate] Placeholder still present: $placeholder"
    missing=1
  fi
done

# 3) Ensure key identity fields are actually filled (not blank labels)
required_nonempty_prefixes=(
  "- Staging URL (\`NEXTAUTH_URL\`):"
  "- DB target (\`DATABASE_URL\` redacted host/db):"
  "- Approved by:"
)

for prefix in "${required_nonempty_prefixes[@]}"; do
  line="$(grep -F -- "$prefix" "$FILE" || true)"
  if [[ -z "$line" ]]; then
    echo "[signoff-validate] Missing line: $prefix"
    missing=1
    continue
  fi

  value="${line#*$prefix}"
  value="$(echo "$value" | xargs)"
  if [[ -z "$value" ]]; then
    echo "[signoff-validate] Field is empty: $prefix"
    missing=1
  fi
done

if [[ $missing -ne 0 ]]; then
  echo "[signoff-validate] Validation failed. Fill required evidence fields before sign-off."
  exit 1
fi

echo "[signoff-validate] PASS: sign-off evidence is complete in $FILE"
