import assert from "node:assert/strict";
import test from "node:test";
import { workdayAdapter } from "@/lib/jobs/workday-adapter";
import type { ProviderAdapterContext } from "@/lib/jobs/provider-adapter";
import type { UnifiedApplicantProfile } from "@/types/applicant-profile";

function applicant(overrides: Partial<UnifiedApplicantProfile> = {}): UnifiedApplicantProfile {
  return {
    fullName: overrides.fullName,
    firstName: overrides.firstName,
    lastName: overrides.lastName,
    email: overrides.email,
    phone: overrides.phone,
    location: overrides.location,
    workAuthorization: overrides.workAuthorization ?? {},
    links: overrides.links ?? {},
    documents: overrides.documents ?? {},
    preferences: overrides.preferences ?? {
      targetRoles: [],
      targetLocations: [],
    },
    answers: overrides.answers ?? {
      customAnswers: {},
    },
    source: overrides.source ?? "merged",
    diagnostics: overrides.diagnostics ?? [],
  };
}

function context(overrides: Partial<ProviderAdapterContext> = {}): ProviderAdapterContext {
  return {
    provider: overrides.provider ?? "workday",
    job: overrides.job ?? {
      id: "job_1",
      company: "Acme AI",
      title: "Platform Engineer",
      url: "https://example.wd5.myworkdayjobs.com/en-US/External/job/Austin-TX/PM_12345",
      location: "Remote",
      source: "import",
    },
    applicant: overrides.applicant ??
      applicant({
        fullName: "Alex Candidate",
        email: "alex@example.com",
        phone: "+1-555-000-1111",
        documents: {
          resumeUrl: "https://docs.example.com/resume.pdf",
        },
      }),
    dryRun: overrides.dryRun ?? true,
  };
}

test("workdayAdapter.getReadiness reports ready when core applicant fields, resume, and job url exist", () => {
  const result = workdayAdapter.getReadiness(context());

  assert.equal(result.ready, true);
  assert.deepEqual(result.missingFields, []);
});

test("workdayAdapter.getReadiness reports missing resume and applicant core fields", () => {
  const result = workdayAdapter.getReadiness(
    context({
      job: {
        id: "job_1",
        company: "Acme AI",
        title: "Platform Engineer",
        url: undefined,
        location: "Remote",
        source: "import",
      },
      applicant: applicant({
        email: "alex@example.com",
        diagnostics: ["Missing applicant full name.", "Missing applicant phone.", "Missing applicant resume URL."],
      }),
    }),
  );

  assert.equal(result.ready, false);
  assert.deepEqual(result.missingFields, [
    "applicant.fullName",
    "applicant.phone",
    "job.url",
    "applicant.documents.resumeUrl",
  ]);
});

test("workdayAdapter.submit returns needs_manual in dry-run with explicit not-implemented message", async () => {
  const result = await workdayAdapter.submit(context({ dryRun: true }));

  assert.equal(result.status, "needs_manual");
  assert.match(result.message, /dry-run enabled: workday adapter detected/i);
  assert.match(result.message, /live workday submit is not implemented yet/i);
  assert.match(result.message, /submit plan \(workday\)/i);
});

test("workdayAdapter.submit returns needs_manual when readiness fails", async () => {
  const result = await workdayAdapter.submit(
    context({
      applicant: applicant({ email: "alex@example.com", diagnostics: ["Missing applicant full name."] }),
    }),
  );

  assert.equal(result.status, "needs_manual");
  assert.match(result.message, /workday adapter blocked: missing fields/i);
  assert.match(result.message, /applicant\.fullName/i);
});
