import test from "node:test";
import assert from "node:assert/strict";
import { addJobsToQueueAction, updateQueueItemStatusAction } from "@/app/auto-apply/queue/actions";
import { authSession } from "@/lib/auth/session-adapter";
import { revalidateAdapter } from "@/lib/next/revalidate-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";

const testUser = {
  id: "user_test",
  email: "test@example.com",
  name: "Test User",
  timezone: "America/Chicago",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test("addJobsToQueueAction auto-detects per-job providers instead of forcing linkedin", async () => {
  const originalAuthSession = authSession;
  const originalGetJobs = applicationOsService.getJobs.bind(applicationOsService);
  const originalAddJobsToAutoApplyQueue = applicationOsService.addJobsToAutoApplyQueue.bind(applicationOsService);
  const originalRevalidatePath = revalidateAdapter.revalidatePath;

  const calls: Array<{ jobIds: string[]; provider?: string }> = [];

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;
    (authSession as typeof authSession & { user?: typeof testUser }).user = testUser;
    applicationOsService.getJobs = async () => [
      {
        id: "job_greenhouse",
        userId: testUser.id,
        company: "Acme AI",
        title: "Platform Engineer",
        status: "SAVED",
        url: "https://boards.greenhouse.io/acme/jobs/123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "job_unknown",
        userId: testUser.id,
        company: "Unknown Co",
        title: "Generalist",
        status: "SAVED",
        url: "https://example.com/jobs/123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    applicationOsService.addJobsToAutoApplyQueue = async (_userId, jobIds, provider) => {
      calls.push({ jobIds, provider });
      return [];
    };
    revalidateAdapter.revalidatePath = () => {};

    const formData = new FormData();
    formData.append("jobIds", "job_greenhouse");
    formData.append("jobIds", "job_unknown");
    formData.append("provider", "auto");

    const result = await addJobsToQueueAction(null, formData);

    assert.equal(result.error, "");
    assert.deepEqual(calls, [
      { jobIds: ["job_greenhouse"], provider: "greenhouse" },
      { jobIds: ["job_unknown"], provider: undefined },
    ]);
  } finally {
    authSession.getCurrentUserOrThrow = originalAuthSession.getCurrentUserOrThrow;
    applicationOsService.getJobs = originalGetJobs;
    applicationOsService.addJobsToAutoApplyQueue = originalAddJobsToAutoApplyQueue;
    revalidateAdapter.revalidatePath = originalRevalidatePath;
  }
});

test("updateQueueItemStatusAction uses the authenticated user id", async () => {
  const originalAuthSession = authSession;
  const originalUpdateQueueItemStatus = applicationOsService.updateQueueItemStatus.bind(applicationOsService);
  const originalRevalidatePath = revalidateAdapter.revalidatePath;

  let capturedUserId = "";
  let capturedQueueItemId = "";

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;
    applicationOsService.updateQueueItemStatus = async (userId, queueItemId, input) => {
      capturedUserId = userId;
      capturedQueueItemId = queueItemId;
      return {
        id: queueItemId,
        userId,
        jobId: "job_greenhouse",
        job: {
          id: "job_greenhouse",
          userId,
          company: "Acme AI",
          title: "Platform Engineer",
          status: "SAVED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        status: input.status ?? "COMPLETED",
        provider: "greenhouse",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    };
    revalidateAdapter.revalidatePath = () => {};

    const formData = new FormData();
    formData.append("queueItemId", "queue_item_1");
    formData.append("status", "COMPLETED");
    formData.append("verificationToken", "");

    const result = await updateQueueItemStatusAction(null, formData);

    assert.equal(result.error, "");
    assert.equal(capturedUserId, testUser.id);
    assert.equal(capturedQueueItemId, "queue_item_1");
  } finally {
    authSession.getCurrentUserOrThrow = originalAuthSession.getCurrentUserOrThrow;
    applicationOsService.updateQueueItemStatus = originalUpdateQueueItemStatus;
    revalidateAdapter.revalidatePath = originalRevalidatePath;
  }
});
