# Phase 3 Progress Handoff (2026-03-28)

## Completed

### 1) Auth + route protection landed
- Added Auth.js credentials flow with shared auth options and `/api/auth/[...nextauth]` route.
- Added `/login` page and switched protected pages to session-gated access via `getCurrentUserOrThrow()`.
- Added middleware route guard for:
  - `/dashboard`
  - `/jobs`
  - `/applications`
  - `/documents`
  - `/settings`
- Unauthenticated access now redirects to `/login?callbackUrl=...`.

### 2) Multi-user isolation hardening
- Server actions and page reads/writes now consistently scope by authenticated `user.id`.
- Repository-level isolation tests cover cross-user update denial:
  - user A cannot update user B application status (`Application not found`)
  - user A cannot update user B job status (`Job not found`)

### 3) Auth schema + migration chain stabilized
- Added `User.passwordHash` and `User.lastLoginAt`.
- Updated credentials authorize path to stamp `lastLoginAt` on create/update.
- Resolved local migration history issues by introducing baseline init migration and replaying deploy cleanly.
- Local DB bootstrapped and migrations now apply successfully.

### 4) Quality gates + bootstrap + CI
- Local checks pass after Phase-3 auth/multi-user changes:
  - `npm test` (16/16)
  - `npm run lint`
  - `npm run build`
- Added one-command local bootstrap:
  - `scripts/bootstrap-local.sh`
  - `npm run bootstrap:local`
- Added GitHub Actions CI workflow with PostgreSQL service and pipeline:
  - migrate → seed → test → build

## Current Status vs Phase-3 DoD
- ✅ 未登录无法访问业务页
- ✅ 登录后可正常使用核心 Jobs/Applications 流程
- ✅ A/B 用户数据隔离（含关键越权更新测试）
- ✅ 写入路径由服务端会话用户驱动（不信任客户端 userId）
- ✅ CI 流程已覆盖核心质量门禁

## Remaining Phase-3 Items (recommended closeout)
1. Add production/staging rollout checklist for auth config (`AUTH_SECRET`, `NEXTAUTH_URL`, `DATABASE_URL`).
2. Execute migration deploy + smoke test in target non-local environment(s).
3. Add a brief "Auth & Multi-user" operations section in README (env vars, login behavior, protected routes, bootstrap/CI expectations).
4. Optional tightening: add one end-to-end happy path check (login → create job → create application → update status) in CI or pre-release checklist.

## Suggested Next Owner Action
- Start with item #1 + #2 as a single deployment readiness pass, then mark Phase 3 complete after environment verification.