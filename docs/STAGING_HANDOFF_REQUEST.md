# Staging Access / Env Handoff Request

Use this message to request the minimum needed staging access for final Phase-3 sign-off.

## Request
Please provide a staging shell/session (or run on our behalf) with these environment variables set:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `AUTH_SECRET`

## Commands to run (in staging shell)

```bash
cd projects/application-os
./scripts/staging-signoff-status.sh
./scripts/run-staging-smoke-with-env-file.sh ./.env.staging.local
```

If env-file workflow is not used:

```bash
./scripts/print-staging-env-exports.sh
# export real values
./scripts/run-staging-smoke.sh
```

## Evidence to return
Please attach log/output evidence for:

1. `auth.login.failed` with `metadata.outcome=invalid_credentials`
2. `auth.login.success` with actor/email/ip metadata
3. Protected route redirect (`/dashboard` -> `/login?callbackUrl=...`)
4. Job create PASS
5. Application create PASS
6. Application status update PASS

## Sign-off file
Update and return:

- `docs/STAGING_SIGNOFF_2026-03-28_103644.md`

Then validate:

```bash
./scripts/validate-staging-signoff.sh docs/STAGING_SIGNOFF_2026-03-28_103644.md
```
