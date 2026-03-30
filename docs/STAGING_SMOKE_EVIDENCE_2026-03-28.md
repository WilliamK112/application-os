# STAGING_SMOKE_EVIDENCE_2026-03-28

Date: 2026-03-28 (America/Chicago)
Scope: Local staging-readiness evidence capture before non-local staging handoff.

## Commands Executed

```bash
npx prisma migrate deploy
npx prisma db seed
npm run build
```

Result:
- `migrate deploy`: applied pending migration `202603280424_add_password_reset_token`.
- `db seed`: completed successfully.
- `npm run build`: passed with all app routes generated.

## Auth Smoke (Local Runtime)

Checks executed against live app runtime:
- Unauthenticated access to `/dashboard` redirects (`307`) to `/login`.
- Credentials callback exercised for:
  - malformed payload
  - invalid password
  - valid password

Observed audit events in runtime logs:
- `auth.login.failed` with `metadata.outcome=invalid_payload`
- `auth.login.failed` with `metadata.outcome=invalid_credentials`
- `auth.login.success` with actor/email/ip metadata

## Environment Parity Follow-up

Initial local warning gap observed:
- NextAuth warnings when `NEXTAUTH_URL` / `AUTH_SECRET` were not set.

Fix applied:
- Added `NEXTAUTH_URL`, `AUTH_SECRET`, `APP_OS_DEFAULT_USER_PASSWORD` defaults to `.env.example`.
- Synced local `.env` and re-ran quick auth smoke; warnings no longer appeared.

## End-to-End Data Path Smoke

Executed script:

```bash
scripts/smoke-auth-flow.ts
```

Validated:
- Created Job for seeded user (`candidate@example.com`)
- Created linked Application
- Updated Application status to `INTERVIEW`

## Remaining Staging-Only Checks (Before Sign-off)

1. Run the same flow in real staging infra (staging DB + staging URL + staging secret).
2. Verify audit events are visible in the staging log sink (not only local console) with expected taxonomy.
3. Confirm protected-route redirect + login callback behavior through the staging domain.
4. Re-run Job/Application create + status-update smoke against staging data plane.
5. Capture evidence artifact (logs + command outputs) for final Phase-3 handoff approval.

Reference command sheet:
- `docs/STAGING_RUN_COMMANDS.md`
