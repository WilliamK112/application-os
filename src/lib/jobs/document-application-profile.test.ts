import assert from "node:assert/strict";
import test from "node:test";
import { buildDocumentApplicationProfile } from "@/lib/jobs/document-application-profile";
import type { Document } from "@/types/domain";

function doc(input: Partial<Document> & Pick<Document, "id" | "name" | "type">): Document {
  const now = new Date().toISOString();
  return {
    userId: "user_1",
    isDefault: false,
    tags: [],
    createdAt: now,
    updatedAt: now,
    ...input,
  };
}

test("buildDocumentApplicationProfile picks default resume + cover letter urls", () => {
  const profile = buildDocumentApplicationProfile([
    doc({ id: "d1", name: "resume-old", type: "RESUME", url: "https://example.com/old.pdf" }),
    doc({
      id: "d2",
      name: "resume-default",
      type: "RESUME",
      url: "https://example.com/default.pdf",
      isDefault: true,
    }),
    doc({
      id: "d3",
      name: "cl-default",
      type: "COVER_LETTER",
      url: "https://example.com/cl.pdf",
      isDefault: true,
    }),
  ]);

  assert.equal(profile.resumeUrl, "https://example.com/default.pdf");
  assert.equal(profile.coverLetterUrl, "https://example.com/cl.pdf");
  assert.equal(profile.source, "documents");
});

test("buildDocumentApplicationProfile reports diagnostics when resume url is missing", () => {
  const profile = buildDocumentApplicationProfile([
    doc({ id: "d4", name: "resume-no-url", type: "RESUME", isDefault: true }),
  ]);

  assert.equal(profile.resumeUrl, undefined);
  assert.ok(profile.diagnostics.some((item) => item.includes("Missing default resume URL")));
});
