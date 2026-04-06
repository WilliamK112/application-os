import assert from "node:assert/strict";
import test from "node:test";
import { getRetryableJobIds, isRetryableAutoApplyStatus } from "@/lib/jobs/auto-apply-retry";
import type { AutoApplyRunLog } from "@/types/domain";

const baseLog = {
  id: "log-1",
  userId: "user-1",
  message: "message",
  createdAt: new Date("2026-03-28T20:00:00.000Z").toISOString(),
  applicationId: null,
  job: {
    id: "job-1",
    company: "Acme",
    title: "Engineer",
  },
} satisfies Omit<AutoApplyRunLog, "status" | "jobId">;

test("isRetryableAutoApplyStatus only allows failed and needs_manual", () => {
  assert.equal(isRetryableAutoApplyStatus("failed"), true);
  assert.equal(isRetryableAutoApplyStatus("needs_manual"), true);
  assert.equal(isRetryableAutoApplyStatus("success"), false);
});

test("getRetryableJobIds returns only retryable statuses and de-duplicates in display order", () => {
  const history: AutoApplyRunLog[] = [
    { ...baseLog, id: "log-1", jobId: "job-1", status: "success" },
    { ...baseLog, id: "log-2", jobId: "job-2", status: "failed" },
    { ...baseLog, id: "log-3", jobId: "job-3", status: "needs_manual" },
    { ...baseLog, id: "log-4", jobId: "job-2", status: "needs_manual" },
    { ...baseLog, id: "log-5", jobId: "job-4", status: "success" },
  ];

  assert.deepEqual(getRetryableJobIds(history), ["job-2", "job-3"]);
});

test("getRetryableJobIds returns empty when current history view has no retryable rows", () => {
  const history: AutoApplyRunLog[] = [
    { ...baseLog, id: "log-1", jobId: "job-1", status: "success" },
    { ...baseLog, id: "log-2", jobId: "job-2", status: "success" },
  ];

  assert.deepEqual(getRetryableJobIds(history), []);
});

test("getRetryableJobIds matches retryable rows in failure-category filtered views", () => {
  const history: AutoApplyRunLog[] = [
    {
      ...baseLog,
      id: "log-1",
      jobId: "job-http",
      status: "failed",
      failureCategory: "http_failure",
    },
    {
      ...baseLog,
      id: "log-2",
      jobId: "job-network",
      status: "failed",
      failureCategory: "network_failure",
    },
    {
      ...baseLog,
      id: "log-3",
      jobId: "job-manual",
      status: "needs_manual",
      failureCategory: "manual_handoff",
    },
    {
      ...baseLog,
      id: "log-4",
      jobId: "job-manual",
      status: "needs_manual",
      failureCategory: "no_form",
    },
  ];

  assert.deepEqual(getRetryableJobIds(history), ["job-http", "job-network", "job-manual"]);
});
