import assert from "node:assert/strict";
import test from "node:test";
import {
  buildProviderSubmitPayload,
  getProviderSubmitChecklist,
  submitExternalApplication,
} from "@/lib/jobs/external-submit";
import { detectJobApplyProvider } from "@/lib/jobs/providers";

const ORIGINAL_ENV = { ...process.env };

test.afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

test("buildProviderSubmitPayload maps configured greenhouse env vars and reports optional gaps", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";
  delete process.env.APP_OS_APPLICANT_RESUME_URL;

  const payloadPlan = buildProviderSubmitPayload("greenhouse");

  assert.deepEqual(payloadPlan.payload, {
    full_name: "Alex Candidate",
    email: "alex@example.com",
    phone: "+1-555-000-1111",
  });
  assert.deepEqual(payloadPlan.missingRequiredEnvVars, []);
  assert.deepEqual(payloadPlan.missingOptionalEnvVars, ["APP_OS_APPLICANT_RESUME_URL"]);
  assert.ok(payloadPlan.unsupportedProviderFields.length > 0);
});

test("buildProviderSubmitPayload reports missing required lever fields", () => {
  delete process.env.APP_OS_APPLICANT_FULL_NAME;
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  delete process.env.APP_OS_APPLICANT_PHONE;

  const payloadPlan = buildProviderSubmitPayload("lever");

  assert.deepEqual(payloadPlan.payload, {
    email: "alex@example.com",
  });
  assert.deepEqual(payloadPlan.missingRequiredEnvVars, [
    "APP_OS_APPLICANT_FULL_NAME",
    "APP_OS_APPLICANT_PHONE",
  ]);
  assert.deepEqual(payloadPlan.missingOptionalEnvVars, ["APP_OS_APPLICANT_RESUME_URL"]);
  assert.ok(payloadPlan.unsupportedProviderFields.includes("cover_letter"));
});

test("getProviderSubmitChecklist returns provider-specific field readiness for greenhouse", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  delete process.env.APP_OS_APPLICANT_PHONE;
  delete process.env.APP_OS_APPLICANT_RESUME_URL;

  const checklist = getProviderSubmitChecklist("greenhouse");

  assert.equal(checklist.provider, "greenhouse");
  assert.deepEqual(checklist.required, [
    {
      providerField: "full_name",
      envVar: "APP_OS_APPLICANT_FULL_NAME",
      ready: true,
    },
    {
      providerField: "email",
      envVar: "APP_OS_APPLICANT_EMAIL",
      ready: true,
    },
    {
      providerField: "phone",
      envVar: "APP_OS_APPLICANT_PHONE",
      ready: false,
    },
  ]);
  assert.deepEqual(checklist.optional, [
    {
      providerField: "resume_url",
      envVar: "APP_OS_APPLICANT_RESUME_URL",
      ready: false,
    },
  ]);
});

test("getProviderSubmitChecklist returns provider-specific field readiness for lever", () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  delete process.env.APP_OS_APPLICANT_EMAIL;
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";
  process.env.APP_OS_APPLICANT_RESUME_URL = "https://cdn.example.com/resume.pdf";

  const checklist = getProviderSubmitChecklist("lever");

  assert.equal(checklist.provider, "lever");
  assert.deepEqual(checklist.required, [
    {
      providerField: "name",
      envVar: "APP_OS_APPLICANT_FULL_NAME",
      ready: true,
    },
    {
      providerField: "email",
      envVar: "APP_OS_APPLICANT_EMAIL",
      ready: false,
    },
    {
      providerField: "phone",
      envVar: "APP_OS_APPLICANT_PHONE",
      ready: true,
    },
  ]);
  assert.deepEqual(checklist.optional, [
    {
      providerField: "resume",
      envVar: "APP_OS_APPLICANT_RESUME_URL",
      ready: true,
    },
  ]);
});

test("submitExternalApplication returns needs_manual for greenhouse in dry-run", async () => {
  const result = await submitExternalApplication({
    provider: "greenhouse",
    dryRun: true,
    jobUrl: "https://boards.greenhouse.io/example/jobs/1",
  });

  assert.equal(result.status, "needs_manual");
  assert.match(result.message, /dry-run enabled/i);
  assert.match(result.message, /submit plan \(greenhouse\)/i);
  assert.match(result.message, /payload keys ready/i);
  assert.match(result.message, /unsupported provider fields pending automation/i);
});

test("submitExternalApplication returns failed when live mode has no job url", async () => {
  const result = await submitExternalApplication({
    provider: "lever",
    dryRun: false,
  });

  assert.equal(result.status, "failed");
  assert.match(result.message, /requires a job url/i);
});

test("submitExternalApplication returns needs_manual when applicant profile env is missing", async () => {
  delete process.env.APP_OS_APPLICANT_FULL_NAME;
  delete process.env.APP_OS_APPLICANT_EMAIL;
  delete process.env.APP_OS_APPLICANT_PHONE;

  const result = await submitExternalApplication({
    provider: "lever",
    dryRun: false,
    jobUrl: "https://jobs.lever.co/example/1",
  });

  assert.equal(result.status, "needs_manual");
  assert.match(result.message, /missing applicant profile fields/i);
});

test("submitExternalApplication returns failed on non-200 response", async () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";

  const result = await submitExternalApplication({
    provider: "lever",
    dryRun: false,
    jobUrl: "https://jobs.lever.co/example/1",
    fetchFn: async () => new Response("not found", { status: 404 }),
  });

  assert.equal(result.status, "failed");
  assert.match(result.message, /lever request failed during live probe/i);
});

test("submitExternalApplication returns needs_manual when page has form signal", async () => {
  process.env.APP_OS_APPLICANT_FULL_NAME = "Alex Candidate";
  process.env.APP_OS_APPLICANT_EMAIL = "alex@example.com";
  process.env.APP_OS_APPLICANT_PHONE = "+1-555-000-1111";

  const result = await submitExternalApplication({
    provider: "greenhouse",
    dryRun: false,
    jobUrl: "https://boards.greenhouse.io/example/jobs/1",
    fetchFn: async () =>
      new Response("<html><body><form id='application'>Apply now</form></body></html>", {
        status: 200,
      }),
  });

  assert.equal(result.status, "needs_manual");
  assert.match(result.message, /form .* detected/i);
});

test("submitExternalApplication returns needs_manual for unsupported provider", async () => {
  const result = await submitExternalApplication({
    provider: "workday",
    dryRun: true,
  });

  assert.equal(result.status, "needs_manual");
  assert.match(result.message, /not supported/i);
});

test("submitExternalApplication keeps status taxonomy stable across common job board link types", async () => {
  const links = [
    {
      label: "greenhouse",
      url: "https://boards.greenhouse.io/notion/jobs/7697103002",
      expectedProvider: "greenhouse",
      expectedMessage: /adapter detected/i,
    },
    {
      label: "lever",
      url: "https://jobs.lever.co/figma/3f2f9f8a-1234-4b1a",
      expectedProvider: "lever",
      expectedMessage: /adapter detected/i,
    },
    {
      label: "workday",
      url: "https://example.wd5.myworkdayjobs.com/en-US/External/job/Austin-TX/PM_12345",
      expectedProvider: "workday",
      expectedMessage: /not supported/i,
    },
    {
      label: "ashby",
      url: "https://jobs.ashbyhq.com/company/role",
      expectedProvider: "unknown",
      expectedMessage: /not supported/i,
    },
    {
      label: "icims",
      url: "https://careers.example.icims.com/jobs/1234/job",
      expectedProvider: "unknown",
      expectedMessage: /not supported/i,
    },
  ] as const;

  for (const link of links) {
    const provider = detectJobApplyProvider(link.url);
    assert.equal(provider, link.expectedProvider, `${link.label} provider classification mismatch`);

    const result = await submitExternalApplication({
      provider,
      dryRun: true,
      jobUrl: link.url,
    });

    // Taxonomy lock: dry-run currently never returns hard failure for these providers.
    assert.equal(result.status, "needs_manual", `${link.label} status taxonomy changed unexpectedly`);
    assert.match(result.message, link.expectedMessage, `${link.label} message contract changed unexpectedly`);
  }
});
