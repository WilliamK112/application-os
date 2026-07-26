import assert from "node:assert/strict";
import test from "node:test";
import { getCoreApplicantFieldDiagnostics } from "@/lib/jobs/provider-adapter";
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

test("getCoreApplicantFieldDiagnostics returns ready when core applicant fields exist", () => {
  const result = getCoreApplicantFieldDiagnostics(
    applicant({
      fullName: "Alex Candidate",
      email: "alex@example.com",
      phone: "+1-555-000-1111",
    }),
  );

  assert.equal(result.ready, true);
  assert.deepEqual(result.missingFields, []);
  assert.deepEqual(result.diagnostics, []);
});

test("getCoreApplicantFieldDiagnostics reports missing unified applicant core fields", () => {
  const result = getCoreApplicantFieldDiagnostics(
    applicant({
      email: "alex@example.com",
      diagnostics: ["Missing applicant full name.", "Missing applicant phone."],
    }),
  );

  assert.equal(result.ready, false);
  assert.deepEqual(result.missingFields, ["applicant.fullName", "applicant.phone"]);
  assert.deepEqual(result.diagnostics, ["Missing applicant full name.", "Missing applicant phone."]);
});
