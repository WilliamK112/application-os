import test from "node:test";
import assert from "node:assert/strict";
import { AUTO_APPLY_HISTORY_FILTER_OPTIONS } from "@/components/auto-apply-panel-config";

test("auto-apply history filter options include status and failure-category drill-down values", () => {
  assert.deepEqual(AUTO_APPLY_HISTORY_FILTER_OPTIONS, [
    "ALL",
    "success",
    "failed",
    "needs_manual",
    "http_failure",
    "network_failure",
    "no_form",
    "manual_handoff",
  ]);
});

test("auto-apply history filter options remain unique for stable select rendering", () => {
  const unique = new Set(AUTO_APPLY_HISTORY_FILTER_OPTIONS);

  assert.equal(unique.size, AUTO_APPLY_HISTORY_FILTER_OPTIONS.length);
});
