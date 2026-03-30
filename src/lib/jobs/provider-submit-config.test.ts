import assert from "node:assert/strict";
import test from "node:test";
import {
  PROVIDER_FIELD_MAP,
  PROVIDER_UNSUPPORTED_FIELDS,
  type SupportedProvider,
} from "@/lib/jobs/provider-submit-config";

test("provider-submit-config exposes canonical supported providers", () => {
  const providers = Object.keys(PROVIDER_FIELD_MAP).sort();
  assert.deepEqual(providers, ["greenhouse", "lever"]);
});

test("provider-submit-config keeps canonical field mapping for greenhouse and lever", () => {
  assert.deepEqual(PROVIDER_FIELD_MAP.greenhouse, [
    { providerField: "full_name", envVar: "APP_OS_APPLICANT_FULL_NAME", required: true },
    { providerField: "email", envVar: "APP_OS_APPLICANT_EMAIL", required: true },
    { providerField: "phone", envVar: "APP_OS_APPLICANT_PHONE", required: true },
    { providerField: "resume_url", envVar: "APP_OS_APPLICANT_RESUME_URL", required: false },
  ]);

  assert.deepEqual(PROVIDER_FIELD_MAP.lever, [
    { providerField: "name", envVar: "APP_OS_APPLICANT_FULL_NAME", required: true },
    { providerField: "email", envVar: "APP_OS_APPLICANT_EMAIL", required: true },
    { providerField: "phone", envVar: "APP_OS_APPLICANT_PHONE", required: true },
    { providerField: "resume", envVar: "APP_OS_APPLICANT_RESUME_URL", required: false },
  ]);
});

test("provider-submit-config unsupported-field lists are locked and provider-aligned", () => {
  const providers: SupportedProvider[] = ["greenhouse", "lever"];

  for (const provider of providers) {
    const unsupportedFields = PROVIDER_UNSUPPORTED_FIELDS[provider];

    assert.ok(unsupportedFields.length > 0, `${provider} should have at least one unsupported field`);
    assert.equal(new Set(unsupportedFields).size, unsupportedFields.length, `${provider} unsupported fields should be unique`);
    assert.ok(unsupportedFields.includes("work_authorization"));
    assert.ok(unsupportedFields.includes("cover_letter"));
  }

  assert.deepEqual(PROVIDER_UNSUPPORTED_FIELDS.greenhouse, [
    "cover_letter",
    "attachments",
    "work_authorization",
  ]);

  assert.deepEqual(PROVIDER_UNSUPPORTED_FIELDS.lever, [
    "cover_letter",
    "portfolio",
    "work_authorization",
  ]);
});
