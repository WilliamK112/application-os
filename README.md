# Application OS

A quality-first MVP for managing job applications end-to-end:

- Job tracking (company/title/source/status)
- Application pipeline (draft → interview → offer)
- Follow-up reminders dashboard
- Document inventory foundation

Built with Next.js App Router + Prisma + PostgreSQL, with a **mock fallback mode** for local development when DB is not configured.

## Tech Stack

- Next.js 16 (App Router, Server Actions)
- TypeScript
- Prisma ORM
- PostgreSQL (optional in early local dev)
- Zod validation

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000

### Auth quick start

- Create a user at `/register`
- Sign in at `/login`
- If you run seed data, default credentials are:
  - Email: `candidate@example.com`
  - Password: `candidate123`

(Override with `APP_OS_DEFAULT_USER_EMAIL`, `APP_OS_DEFAULT_USER_NAME`, `APP_OS_DEFAULT_USER_PASSWORD` in your env.)

For local development, set these in `.env` (included in `.env.example`) to avoid NextAuth warnings and ensure callback correctness:

- `NEXTAUTH_URL=http://localhost:3000`
- `AUTH_SECRET=<long-random-secret>`

### Auth security behavior

- Login failure lockout is enabled with a 15-minute rolling window.
- Lockout threshold is 5 failed attempts per-email and per-IP.
- A successful login clears the current email/IP failure buckets.
- When locked, sign-in remains generic (no account existence disclosure).

#### Auth audit events (ops reference)

The app emits structured auth audit events via the security audit logger:

- `auth.login.success`
  - Fields: `actorUserId`, `email`, `ip`, `metadata.outcome=success`
- `auth.login.failed`
  - Common outcomes in `metadata.outcome`:
    - `invalid_payload`
    - `invalid_credentials`
    - `rate_limited`
- `auth.password-reset.requested`
  - Outcomes: `token_sent`, `user_not_found`, `rate_limited`, `error`
- `auth.password-reset.completed`
  - Outcomes: `success`, `invalid_token`, `expired`, `already_used`, `rate_limited`, `error`

These events are best-effort and non-blocking: auth flows continue even if audit sink writes fail.

#### Login audit events (ops reference)

Credentials login now emits structured auth events with consistent taxonomy:

- `auth.login.failed`
  - `outcome=invalid_payload`: request payload failed validation before credential check.
  - `outcome=invalid_credentials`: email/password did not match a valid account.
  - `outcome=rate_limited`: request hit login lockout policy.
- `auth.login.success`
  - Includes authenticated actor context (`userId`, `email`) and request context (`ip`) for traceability.

Notes for operations:

- Failed outcomes intentionally keep user-facing responses generic while preserving machine-readable reason codes in audit logs.
- `rate_limited` indicates threshold breach (5 failures in 15 minutes by email or IP), not necessarily malicious activity by itself.
- Track spikes by outcome type and source IP/email patterns to distinguish normal typo bursts from abuse attempts.

## Repository Modes

The app supports two repository providers:

- `prisma` → real PostgreSQL data
- `mock` → in-memory/mock data for UI and workflow development

Selection rule:

1. If `APP_OS_REPOSITORY_PROVIDER` is set, that value is used.
2. Otherwise, the app uses `prisma` when `DATABASE_URL` exists.
3. If no `DATABASE_URL`, it falls back to `mock` automatically.

## Enable Real Database (Prisma)

1. Set `DATABASE_URL` in `.env`
2. Generate/migrate schema:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

3. Seed demo data (optional but recommended for first run):

```bash
npm run prisma:seed
```

4. Start app:

```bash
npm run dev
```

## One-command Local Bootstrap

Run this to execute a full local readiness pipeline:

```bash
npm run bootstrap:local
```

It will automatically run:

- Prisma migration deploy
- Prisma seed
- Test suite
- Production build check

If `.env` is missing, it auto-creates it from `.env.example`.

## Production/Staging Auth Rollout Checklist

Use this checklist before deploying auth-protected builds to non-local environments.

### 1) Required environment variables

Set these in your deployment environment (staging/prod):

- `DATABASE_URL` → PostgreSQL connection string for target environment
- `AUTH_SECRET` → strong random secret used to sign Auth.js JWT/session tokens
- `NEXTAUTH_URL` → canonical external app URL (for correct callback/redirect behavior)

Recommended:

- `NODE_ENV=production`
- Seed defaults only for non-production demos (`APP_OS_DEFAULT_USER_*`), not real prod accounts.

### 2) Protected route coverage

Verify middleware still guards:

- `/dashboard`
- `/jobs`
- `/applications`
- `/documents`
- `/settings`

Expected behavior when unauthenticated:

- Redirect to `/login?callbackUrl=<original_path>`

### 3) Deploy-time verification steps

Run after env vars are configured and app is deployed:

1. `npx prisma migrate deploy`
2. (Optional) `npm run prisma:seed` for staging/demo environments
3. `npm run build`
4. Smoke test auth flow in deployed app:
   - Open a protected route while signed out → confirm redirect to `/login?callbackUrl=...`
   - Sign in at `/login`
   - Confirm redirect returns to original protected route
   - Create/update a Job and Application successfully

### 4) CI/quality expectations

Before or during rollout, ensure pipeline remains green for:

- `npm test`
- `npm run lint`
- `npm run build`

### 5) Staging smoke command helpers

For predictable staging execution, use these helpers:

- `./scripts/print-staging-env-exports.sh`
  - Prints required `export DATABASE_URL=...`, `NEXTAUTH_URL=...`, `AUTH_SECRET=...` commands.
- `./scripts/staging-smoke-preflight.sh`
  - Fails fast when required env vars are missing.
- `./scripts/run-staging-smoke.sh`
  - Runs migrate/seed/build pipeline for staging smoke.
- `./scripts/run-staging-smoke-with-env-file.sh ./.env.staging.local`
  - Loads vars from env file and executes the smoke pipeline.
- `./scripts/init-staging-signoff.sh`
  - Creates a timestamped sign-off doc from template.
- `./scripts/validate-staging-signoff.sh <signoff-file>`
  - Validates required sign-off evidence markers before closeout.
- `./scripts/staging-signoff-status.sh`
  - One-command readiness status (checks env vars, runs preflight when possible, prints exact next actions).

## Troubleshooting

- If `DATABASE_URL` is missing or invalid, the app will **auto-fallback to `mock` mode**.
- In that case, you can still run and demo the UI with mock data (`npm run dev`).
- To use real PostgreSQL data, set a valid `DATABASE_URL` and run migrations.

## Quality Gates

```bash
npm run lint
npm run build
```

## Current Scope (Phase 2)

- ✅ Prisma-ready repository + automatic fallback
- ✅ Jobs CRUD (create + status update)
- ✅ Applications CRUD (create + status update)
- ✅ Dashboard metrics and pending follow-ups summary
- ✅ Input validation with Zod in server actions

## Next

- Auth + per-user isolation in session context
- Follow-ups create/update flows
- Filter/sort controls across Jobs/Applications
- E2E tests for critical user paths
