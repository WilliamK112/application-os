import assert from "node:assert/strict";
import test from "node:test";
import { buildProviderSubmitPayload } from "@/lib/jobs/provider-submit-plan";

// Scope: downstream-consumer guardrails only.
// Canonical payload/checklist behavior belongs in provider-submit-plan.test.ts.
// This file intentionally verifies a narrow integration-facing slice so both
// test files stay non-overlapping during refactors.

const ORIGINAL_ENV = { ...process.env };

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("buildProviderSubmitPayload maps greenhouse env vars to provider payload keys", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";
  process.env.APP_OS_APPLICANT_RESUME_URL = "https://example.com/resume.pdf";

  const plan = buildProviderSubmitPayload("greenhouse");

  assert.equal(plan.payload.full_name, "Alex Candidate");
  assert.equal(plan.payload.email, "alex@example.com");
  assert.equal(plan.payload.phone, "+1-555-000-1111");
  assert.equal(plan.payload.resume_url, "https://example.com/resume.pdf");
  assert.deepEqual(plan.missingRequiredEnvVars, []);
});

test("buildProviderSubmitPayload keeps greenhouse unsupported field diagnostics available", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";
  delete process.env.APP_OS_APPLICANT_RESUME_URL;

  const plan = buildProviderSubmitPayload("greenhouse");

  assert.deepEqual(plan.missingRequiredEnvVars, []);
  assert.deepEqual(plan.missingOptionalEnvVars, ["APP_OS_APPLICANT_RESUME_URL"]);
  assert.ok(plan.unsupportedProviderFields.includes("cover_letter"));
});
