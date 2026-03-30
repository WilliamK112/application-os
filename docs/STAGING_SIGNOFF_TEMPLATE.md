# STAGING_SIGNOFF_TEMPLATE

Use this template after running staging smoke to capture final Phase-3 sign-off evidence.

## Environment
- Date/Time:
- Staging URL (`NEXTAUTH_URL`):
- DB target (`DATABASE_URL` redacted host/db):
- Commit SHA:

## Command Results
- `./scripts/staging-smoke-preflight.sh`: PASS/FAIL
- `./scripts/run-staging-smoke.sh`: PASS/FAIL
- `npx prisma migrate deploy`: PASS/FAIL (notes)
- `npm run build`: PASS/FAIL

## Auth Smoke Evidence
- Protected route redirect (`/dashboard` -> `/login?callbackUrl=...`): PASS/FAIL
- Failed login event observed: `auth.login.failed` with `metadata.outcome=invalid_credentials` (attach log excerpt)
- Successful login event observed: `auth.login.success` with actor/email/ip metadata (attach log excerpt)

## Data Path Smoke
- Job create: PASS/FAIL (id)
- Application create: PASS/FAIL (id)
- Application status update: PASS/FAIL (from -> to)

## Issues / Gaps
- 

## Sign-off
- Ready for Phase-3 closeout: YES/NO
- Approved by:
- Notes:
