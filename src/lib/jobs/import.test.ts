import assert from "node:assert/strict";
import test from "node:test";
import { parseBulkJobImport, parseJobUrlToDraft } from "@/lib/jobs/import";

test("parseJobUrlToDraft extracts company/title/source/url", () => {
  const result = parseJobUrlToDraft("https://careers.acme.com/jobs/frontend-engineer");

  assert.equal(result.company, "Careers");
  assert.equal(result.title, "Frontend Engineer");
  assert.equal(result.source, "careers.acme.com");
  assert.equal(result.url, "https://careers.acme.com/jobs/frontend-engineer");
  assert.equal(result.status, "SAVED");
});

test("parseBulkJobImport supports URL lines and CSV rows", () => {
  const result = parseBulkJobImport(
    [
      "https://jobs.example.com/careers/backend-engineer",
      "Acme AI,Frontend Engineer,Remote,LinkedIn,https://linkedin.com/jobs/view/1",
    ].join("\n"),
  );

  assert.equal(result.length, 2);
  assert.equal(result[0]?.title, "Backend Engineer");
  assert.equal(result[1]?.company, "Acme AI");
  assert.equal(result[1]?.source, "LinkedIn");
});
