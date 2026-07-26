# Applicant Profile Schema v1

## Why this exists

`application-os` is moving from a job tracker into a full:

**search → match → apply → track**

product.

The current codebase already has fragments of applicant data in multiple places:
- `Profile` (target role / locations / salary / bio)
- `Document` defaults (resume / cover letter / portfolio)
- env-based `ApplicantProfile` used by external submit
- interview question bank that can later power application answers

That fragmentation is enough for assisted flows, but not enough for a scalable multi-provider auto-apply system.

We need one canonical applicant profile shape that can:
- feed provider adapters
- drive validation before auto-apply
- support missing-field diagnostics
- unify env fallback + stored user data
- support regression tests across providers

---

## Goals for v1

v1 should support these provider-facing use cases:

1. **Identity / contact fields**
   - full name
   - email
   - phone
   - location

2. **Work authorization**
   - authorized to work in target country
   - visa sponsorship requirement
   - citizenship / sponsorship notes when needed

3. **Core files / links**
   - resume URL
   - cover letter URL
   - portfolio URL
   - LinkedIn URL
   - GitHub URL
   - personal website URL

4. **Application defaults**
   - default years of experience
   - target roles
   - target locations
   - remote preference

5. **Answer bank hooks**
   - canned answers for common application questions
   - work authorization answer
   - salary expectation answer
   - why-us / summary style answer

v1 is intentionally not trying to model every ATS field. It should be the stable base contract used by provider adapters.

---

## Proposed canonical shape

```ts
export type ApplicantWorkAuthorization = {
  workAuthorizedInUS?: boolean;
  requireSponsorship?: boolean;
  currentVisaStatus?: string;
  futureSponsorshipNeeded?: boolean;
  notes?: string;
};

export type ApplicantLinks = {
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  websiteUrl?: string;
};

export type ApplicantDocuments = {
  resumeUrl?: string;
  coverLetterUrl?: string;
  portfolioUrl?: string;
};

export type ApplicantPreferences = {
  targetRoles: string[];
  targetLocations: string[];
  remotePreference?: string;
  salaryMin?: number;
  salaryMax?: number;
  yearsOfExperience?: number;
};

export type ApplicantAnswerBank = {
  workAuthorizationSummary?: string;
  sponsorshipSummary?: string;
  salaryExpectationSummary?: string;
  professionalSummary?: string;
  whyCompany?: string;
  customAnswers: Record<string, string>;
};

export type UnifiedApplicantProfile = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  location?: string;
  workAuthorization: ApplicantWorkAuthorization;
  links: ApplicantLinks;
  documents: ApplicantDocuments;
  preferences: ApplicantPreferences;
  answers: ApplicantAnswerBank;
  source: "database" | "env" | "documents" | "merged";
  diagnostics: string[];
};
```

---

## Mapping from current system

### Existing `Profile`
Current `Profile` already maps well to:
- `targetRole` → `preferences.targetRoles[0]`
- `targetLocations` → `preferences.targetLocations`
- `salaryMin` / `salaryMax` → `preferences.salaryMin` / `preferences.salaryMax`
- `remotePreference` → `preferences.remotePreference`
- `bio` → candidate input for `answers.professionalSummary`

### Existing `Document`
Current default docs map to:
- default `RESUME` → `documents.resumeUrl`
- default `COVER_LETTER` → `documents.coverLetterUrl`
- default `PORTFOLIO` → `documents.portfolioUrl`

### Existing env-based `ApplicantProfile`
Current env vars map to:
- `APP_OS_APPLICANT_FULL_NAME` → `fullName`
- `APP_OS_APPLICANT_EMAIL` → `email`
- `APP_OS_APPLICANT_PHONE` → `phone`
- `APP_OS_APPLICANT_RESUME_URL` → `documents.resumeUrl`

### Question bank integration
Current question bank should not be directly overloaded yet.
Instead, v1 should define a stable target:
- use tagged interview/application answers later to populate `answers.customAnswers`
- keep storage implementation flexible for now

---

## Proposed implementation phases

### Phase 1 — Domain contract only
Add new domain-level types without changing persistence yet.

Suggested files:
- `src/types/applicant-profile.ts`
- optional shared loader/composer utility:
  - `src/lib/jobs/unified-applicant-profile.ts`

Outputs for phase 1:
- canonical TS types
- composition helper that merges env + profile + documents into one shape
- diagnostics for missing required fields

### Phase 2 — Composition layer
Create a function like:

```ts
buildUnifiedApplicantProfile({
  profile,
  documents,
  env,
}): UnifiedApplicantProfile
```

Behavior:
- prefer stored user data where available
- allow env vars as fallback / override for worker runtime
- gather diagnostics instead of immediately throwing
- provide `source` metadata

### Phase 3 — Provider adapter integration
Each provider adapter should declare required fields against this canonical shape.

Example:
- Workday requires: `fullName`, `email`, `phone`, `documents.resumeUrl`
- Lever may additionally prefer: `links.linkedinUrl`, `links.githubUrl`
- Greenhouse may use: `answers.customAnswers[...]`

### Phase 4 — Persistence expansion
After the contract proves useful, expand Prisma `Profile` (or create a dedicated applicant-profile table) to store:
- phone
- location
- work authorization fields
- link fields
- answer-bank fields

This should happen only after the TS/domain contract is stable.

---

## Validation rules for v1

### Minimal profile required for assisted auto-apply
- `fullName`
- `email`
- `phone`

### Minimal profile required for live external submit
- `fullName`
- `email`
- `phone`
- `documents.resumeUrl`

### Provider-conditional fields
- `links.linkedinUrl`: optional but useful
- `workAuthorization.*`: required only when provider/form asks
- `coverLetterUrl`: optional unless provider requires it
- `answers.customAnswers`: optional in v1 but should support injection later

---

## Diagnostics model

The composer should prefer returning diagnostics over hard failure.

Examples:
- `Missing applicant full name.`
- `Missing applicant email.`
- `Missing applicant phone.`
- `Missing default resume URL in Documents.`
- `Work authorization fields not configured.`
- `LinkedIn URL unavailable; provider may require manual completion.`

This is important because the system should distinguish:
- **can live-submit now**
- **can queue but needs manual follow-up**
- **cannot submit because profile is incomplete**

---

## Open design questions

1. Should work authorization live in `Profile` or its own table/object?
   - Recommendation: start in `Profile` only if fields stay small; otherwise dedicate a separate object/table.

2. Should answer bank be embedded in `Profile`?
   - Recommendation: no. Keep answer bank logically separate, then project into `UnifiedApplicantProfile.answers`.

3. Should env vars override DB or only backfill missing values?
   - Recommendation: **backfill missing values by default**, but allow explicit worker override later.

4. Should first/last name be stored separately?
   - Recommendation: yes in the canonical type, even if initially derived from `fullName`.

---

## Immediate next engineering step

Create `src/types/applicant-profile.ts` and define:
- `ApplicantWorkAuthorization`
- `ApplicantLinks`
- `ApplicantDocuments`
- `ApplicantPreferences`
- `ApplicantAnswerBank`
- `UnifiedApplicantProfile`

Then build a non-breaking composer that merges:
- current `Profile`
- current `Document[]`
- current env applicant profile

without changing runtime behavior yet.
