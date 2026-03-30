# Quality-First Checklist (Phase 4+)

Last updated: 2026-03-28

This checklist is execution-oriented: each item should be completed with code + tests + docs before moving on.

## A. Account System Hardening (Priority: P0)

- [x] Replace email-only auto-login with email+password credentials auth.
- [x] Add registration flow (`/register`) with validation and duplicate-email handling.
- [ ] Add forgot-password request flow (`/forgot-password`) with generic success response.
- [ ] Add reset-password flow (`/reset-password`) with one-time token + expiry.
- [ ] Add rate limiting for login and password reset endpoints.
- [ ] Add optional email verification flow and block sensitive actions for unverified accounts.

Definition of Done:
- End-to-end path works: register → login → forgot password → reset password → login.
- Security checks: token expiry, one-time use, invalid token handling.
- Integration tests cover happy-path + abuse-path.

## B. UX/Error Consistency (Priority: P1)

- [ ] Define shared error map for auth + CRUD actions.
- [ ] Standardize form states: loading, field-level validation, retry guidance.
- [ ] Add clear empty/error states for Jobs/Applications/Documents pages.
- [ ] Remove ambiguous messages (e.g., generic unknown errors without next action).

Definition of Done:
- Every failure has clear user-facing copy and recovery action.
- No raw stack/technical error leaks to UI.

## C. Business Rules Hardening (Priority: P1)

- [ ] Add application status transition guard rules (service-level enforcement).
- [ ] Add job status transition constraints for invalid jumps.
- [ ] Add batch operations with confirmation and safe partial-failure handling.
- [ ] Add advanced filters (status/company/date/keyword).

Definition of Done:
- Rules enforced server-side (not only in UI).
- Integration tests verify invalid transition rejection.

## D. Production Readiness (Priority: P0/P1)

- [ ] Add auth/security audit log events (login success/fail, password reset, status changes).
- [ ] Add request-level observability hooks (error + latency tracing baseline).
- [ ] Add abuse prevention policy (rate limits + lockout strategy).
- [ ] Add deployment hardening checks (env completeness, secret rotation notes).

Definition of Done:
- Team can answer: who changed what, when, and from where.
- Critical failures trigger visible alerts, not silent failures.

## Immediate Next Action

1. Implement password reset data model and server actions:
   - Add `PasswordResetToken` model to Prisma schema.
   - Create request/reset server actions with secure token lifecycle.
   - Add tests for expiry + one-time token use.
