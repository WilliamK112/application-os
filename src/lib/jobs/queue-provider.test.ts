import test from "node:test";
import assert from "node:assert/strict";
import { resolveQueueProvider } from "@/lib/jobs/queue-provider";

test("resolveQueueProvider auto-detects greenhouse from job url", () => {
  const provider = resolveQueueProvider(
    { url: "https://boards.greenhouse.io/acme/jobs/123" },
    "auto",
  );

  assert.equal(provider, "greenhouse");
});

test("resolveQueueProvider respects explicit provider override", () => {
  const provider = resolveQueueProvider(
    { url: "https://boards.greenhouse.io/acme/jobs/123" },
    "lever",
  );

  assert.equal(provider, "lever");
});

test("resolveQueueProvider returns undefined when provider cannot be detected", () => {
  const provider = resolveQueueProvider(
    { url: "https://example.com/jobs/123" },
    "auto",
  );

  assert.equal(provider, undefined);
});
