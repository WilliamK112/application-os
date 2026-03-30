# Staging Blocker Status

Last checked: 2026-03-28 14:06 CDT

## Current blocker
Staging smoke/sign-off cannot run in the current runtime because required environment variables are not available:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `AUTH_SECRET`

## Fastest unblocking path (in a real staging shell)

1. `./scripts/print-staging-env-exports.sh`
2. Export real staging values
3. `./scripts/staging-signoff-status.sh` (expect READY)
4. `./scripts/run-staging-smoke-with-env-file.sh ./.env.staging.local` (or `./scripts/run-staging-smoke.sh`)
5. Fill `docs/STAGING_SIGNOFF_2026-03-28_103644.md`
6. `./scripts/validate-staging-signoff.sh docs/STAGING_SIGNOFF_2026-03-28_103644.md`

## Evidence expectation for sign-off

- `auth.login.failed` with `metadata.outcome=invalid_credentials`
- `auth.login.success` with actor/email/ip metadata
- Protected-route redirect check
- Job/Application create + status update PASS
