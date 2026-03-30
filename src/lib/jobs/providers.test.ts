import assert from "node:assert/strict";
import test from "node:test";
import { detectJobApplyProvider } from "@/lib/jobs/providers";

test("detectJobApplyProvider identifies Greenhouse", () => {
  assert.equal(detectJobApplyProvider("https://boards.greenhouse.io/example/jobs/123"), "greenhouse");
});

test("detectJobApplyProvider identifies Lever", () => {
  assert.equal(detectJobApplyProvider("https://jobs.lever.co/example/abc"), "lever");
});

test("detectJobApplyProvider identifies Workday", () => {
  assert.equal(
    detectJobApplyProvider("https://example.wd1.myworkdayjobs.com/en-US/External/job/Software-Engineer"),
    "workday",
  );
});

test("detectJobApplyProvider returns unknown for missing or invalid url", () => {
  assert.equal(detectJobApplyProvider(undefined), "unknown");
  assert.equal(detectJobApplyProvider("not-a-url"), "unknown");
});

test("detectJobApplyProvider classifies real-world posted links consistently", () => {
  assert.equal(
    detectJobApplyProvider("https://boards.greenhouse.io/notion/jobs/7697103002"),
    "greenhouse",
  );
  assert.equal(detectJobApplyProvider("https://jobs.lever.co/figma/3f2f9f8a-1234-4b1a"), "lever");
  assert.equal(
    detectJobApplyProvider("https://example.wd5.myworkdayjobs.com/en-US/External/job/Austin-TX/PM_12345"),
    "workday",
  );

  // Currently unsupported providers should remain unknown until adapters are implemented.
  assert.equal(detectJobApplyProvider("https://jobs.ashbyhq.com/company/role"), "unknown");
  assert.equal(detectJobApplyProvider("https://careers.example.icims.com/jobs/1234/job"), "unknown");
});
