# Staging Readiness + Smoke Test (Phase 3)

## Preconditions
- Staging environment variables are set:
  - `DATABASE_URL` (staging Postgres)
  - `AUTH_SECRET`
  - `NEXTAUTH_URL` (public staging app URL)
- App is deployed with latest `main` (includes Auth.js + middleware guards).

## 1) Migration deploy (staging)
```bash
npx prisma migrate deploy
```
Expected: migrations apply cleanly or report already up to date.

## 2) Seed (optional but recommended for smoke)
```bash
npx prisma db seed
```
Expected: demo/sample data created without errors.

## 3) Auth + protected-route smoke flow
1. Open a protected route directly (e.g. `/dashboard`)
   - Expected: redirect to `/login?callbackUrl=...`
2. Sign in via credentials
   - Expected: return to original callback route
3. Create a Job
   - Expected: new row saved and visible in job list
4. Create an Application linked to that Job
   - Expected: row saved and visible in applications list
5. Update application status
   - Expected: status change persists after refresh

## 4) Auth audit-log verification (observability)
After running the auth smoke flow, inspect your staging logs and verify these events appear:

1. Failed login attempt (wrong password)
   - Expected event: `auth.login.failed`
   - Expected metadata outcome: `invalid_credentials`
2. Successful login attempt
   - Expected event: `auth.login.success`
   - Expected fields: `actorUserId`, `email`, `ip`, `metadata.outcome=success`
3. Optional lockout check (repeat failures to threshold)
   - Expected event: `auth.login.failed`
   - Expected metadata outcome: `rate_limited`

If events are missing, staging sign-off is blocked until audit sink visibility is restored.

## 5) Build/health quick check
```bash
npm run build
```
Expected: build passes.

## Exit Criteria
- Migration deploy succeeds in staging DB.
- Redirect/login/callback flow works for protected routes.
- Job/Application create + status update all succeed.
- Auth audit events are visible with correct outcome taxonomy.
- No auth/session regression observed.
