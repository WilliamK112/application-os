# Staging Run Commands (Copy/Paste)

Use this in a real staging shell (not local heartbeat runtime).

## 1) Export required env vars

```bash
export DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>?schema=public"
export NEXTAUTH_URL="https://<your-staging-domain>"
export AUTH_SECRET="<long-random-secret>"
```

### Optional: use an env file instead of manual exports

Create `.env.staging.local` (gitignored) with:

```bash
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<db>?schema=public"
NEXTAUTH_URL="https://<your-staging-domain>"
AUTH_SECRET="<long-random-secret>"
```

Then run:

```bash
./scripts/run-staging-smoke-with-env-file.sh ./.env.staging.local
```

## 2) Preflight check

```bash
./scripts/staging-smoke-preflight.sh
```

Expected: no missing env var errors.

## 3) Run staging smoke pipeline

```bash
./scripts/run-staging-smoke.sh
```

This runs:
- `npx prisma migrate deploy`
- `npx prisma db seed` (optional but included in script)
- `npm run build`

## 4) Complete app-level smoke

Follow: `docs/STAGING_READINESS_SMOKETEST.md`

Must capture log-sink evidence for:
- `auth.login.failed` with `metadata.outcome=invalid_credentials`
- `auth.login.success` with actor/email/ip metadata
