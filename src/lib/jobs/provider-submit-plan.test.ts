import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProviderSubmitPayload,
  getProviderSubmitChecklist,
} from "@/lib/jobs/provider-submit-plan";

const ORIGINAL_ENV = { ...process.env };

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("provider-submit-plan checklist and payload stay aligned for greenhouse", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";
  delete process.env.APP_OS_APPLICANT_RESUME_URL;

  const checklist = getProviderSubmitChecklist("greenhouse");
  const payload = buildProviderSubmitPayload("greenhouse");

  const requiredMissing = checklist.required.filter((item) => !item.ready).map((item) => item.envVar);
  const optionalMissing = checklist.optional.filter((item) => !item.ready).map((item) => item.envVar);

  assert.deepEqual(requiredMissing, payload.missingRequiredEnvVars);
  assert.deepEqual(optionalMissing, payload.missingOptionalEnvVars);
  assert.equal(payload.payload.full_name, "Alex Candidate");
  assert.equal(payload.payload.email, "alex@example.com");
  assert.equal(payload.payload.phone, "+1-555-000-1111");
  assert.equal(payload.payload.resume_url, undefined);
});

test("provider-submit-plan uses overrides for payload fallbacks", () => {
  delete process.env.APP_OS_APPLICANT_RESUME_URL;

  const payload = buildProviderSubmitPayload("greenhouse", {
    APP_OS_APPLICANT_RESUME_URL: "https://docs.example.com/resume-from-documents.pdf",
  });

  assert.equal(payload.payload.resume_url, "https://docs.example.com/resume-from-documents.pdf");
  assert.deepEqual(payload.missingOptionalEnvVars, []);
});

test("provider-submit-plan checklist and payload stay aligned for lever", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  delete process.env.APP_OS_APPLICANT_PHONE;
  process.env.APP_OS_APPLICANT_RESUME_URL = "https://example.com/resume.pdf";

  const checklist = getProviderSubmitChecklist("lever");
  const payload = buildProviderSubmitPayload("lever");

  const requiredMissing = checklist.required.filter((item) => !item.ready).map((item) => item.envVar);
  const optionalMissing = checklist.optional.filter((item) => !item.ready).map((item) => item.envVar);

  assert.deepEqual(requiredMissing, payload.missingRequiredEnvVars);
  assert.deepEqual(optionalMissing, payload.missingOptionalEnvVars);
  assert.equal(payload.payload.name, "Alex Candidate");
  assert.equal(payload.payload.email, "alex@example.com");
  assert.equal(payload.payload.phone, undefined);
  assert.equal(payload.payload.resume, "https://example.com/resume.pdf");
});
