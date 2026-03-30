import assert from "node:assert/strict";
import test from "node:test";
import { loadApplicantProfileFromEnv } from "@/lib/jobs/applicant-profile";

const ORIGINAL_ENV = { ...process.env };

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("loadApplicantProfileFromEnv returns missing fields", () => {
  delete process.env.APP_OS_APPLICANT_FULL_NAME;
  delete process.env.APP_OS_APPLICANT_EMAIL;
  delete process.env.APP_OS_APPLICANT_PHONE;

  const result = loadApplicantProfileFromEnv();
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.deepEqual(result.missing.sort(), [
      "APP_OS_APPLICANT_EMAIL",
      "APP_OS_APPLICANT_FULL_NAME",
      "APP_OS_APPLICANT_PHONE",
    ]);
  }
});

test("loadApplicantProfileFromEnv returns profile when required fields exist", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";
  process.env.APP_OS_APPLICANT_RESUME_URL = "https://example.com/resume.pdf";

  const result = loadApplicantProfileFromEnv();
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.profile.fullName, "Alex Candidate");
    assert.equal(result.profile.email, "alex@example.com");
    assert.equal(result.profile.phone, "+1-555-000-1111");
    assert.equal(result.profile.resumeUrl, "https://example.com/resume.pdf");
  }
});
