import assert from "node:assert/strict";
import test from "node:test";
import { greenhouseAdapter } from "@/lib/jobs/greenhouse-adapter";
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
    provider: overrides.provider ?? "greenhouse",
    job: overrides.job ?? {
      id: "job_1",
      company: "Acme AI",
      title: "Platform Engineer",
      url: "https://boards.greenhouse.io/acme/jobs/123",
      location: "Remote",
      source: "import",
    },
    applicant: overrides.applicant ??
      applicant({
        fullName: "Alex Candidate",
        email: "alex@example.com",
        phone: "+1-555-000-1111",
      }),
    dryRun: overrides.dryRun ?? true,
  };
}

test("greenhouseAdapter.getReadiness reports ready when core applicant fields and job url exist", () => {
  const result = greenhouseAdapter.getReadiness(context());

  assert.equal(result.ready, true);
  assert.deepEqual(result.missingFields, []);
});

test("greenhouseAdapter.getReadiness reports missing applicant core fields and job url", () => {
  const result = greenhouseAdapter.getReadiness(
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
        diagnostics: ["Missing applicant full name.", "Missing applicant phone."],
      }),
    }),
  );

  assert.equal(result.ready, false);
  assert.deepEqual(result.missingFields, ["applicant.fullName", "applicant.phone", "job.url"]);
  assert.deepEqual(result.diagnostics, ["Missing applicant full name.", "Missing applicant phone."]);
});

test("greenhouseAdapter.submit returns needs_manual in dry-run when readiness passes", async () => {
  const result = await greenhouseAdapter.submit(context({ dryRun: true }));

  assert.equal(result.status, "needs_manual");
  assert.match(result.message, /dry-run enabled: greenhouse adapter detected/i);
  assert.match(result.message, /submit plan \(greenhouse\)/i);
});

test("greenhouseAdapter.submit returns needs_manual when readiness fails", async () => {
  const result = await greenhouseAdapter.submit(
    context({
      applicant: applicant({ email: "alex@example.com", diagnostics: ["Missing applicant full name."] }),
    }),
  );

  assert.equal(result.status, "needs_manual");
  assert.match(result.message, /greenhouse adapter blocked: missing fields/i);
  assert.match(result.message, /applicant\.fullName/i);
});
