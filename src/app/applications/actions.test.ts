import test from "node:test";
import assert from "node:assert/strict";
import {
  createApplicationAction,
  updateApplicationStatusAction,
} from "@/app/applications/actions";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";

const testUser = {
  id: "user_test",
  email: "test@example.com",
  name: "Test User",
  timezone: "America/Chicago",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test("createApplicationAction propagates unauthenticated redirect/error and does not create", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);

  try {
    authSession.getCurrentUserOrThrow = async () => {
      throw new Error("NEXT_REDIRECT");
    };

    let createCalled = false;
    applicationOsService.createApplication = async () => {
      createCalled = true;
      throw new Error("should not be called");
    };

    const formData = new FormData();
    formData.set("jobId", "job_1");
    formData.set("status", "DRAFT");

    await assert.rejects(() => createApplicationAction({ error: "" }, formData), /NEXT_REDIRECT/);
    assert.equal(createCalled, false);
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.createApplication = originalCreateApplication;
  }
});

test("createApplicationAction returns friendly validation error for invalid appliedAt", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    let createCalled = false;
    applicationOsService.createApplication = async () => {
      createCalled = true;
      throw new Error("should not be called for invalid date");
    };

    const formData = new FormData();
    formData.set("jobId", "job_1");
    formData.set("status", "DRAFT");
    formData.set("appliedAt", "not-a-date");

    const result = await createApplicationAction({ error: "" }, formData);

    assert.equal(result.error, "Applied date is invalid. Please use a valid date.");
    assert.equal(createCalled, false);
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.createApplication = originalCreateApplication;
  }
});

test("createApplicationAction returns duplicate-application friendly error", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.createApplication = async () => {
      throw new Error("Application already exists");
    };

    const formData = new FormData();
    formData.set("jobId", "job_1");
    formData.set("status", "DRAFT");

    const result = await createApplicationAction({ error: "" }, formData);

    assert.equal(result.error, "You already created an application for this job.");
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.createApplication = originalCreateApplication;
  }
});

test("createApplicationAction returns generic-friendly error for non-duplicate failures", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.createApplication = async () => {
      throw new Error("Database unavailable");
    };

    const formData = new FormData();
    formData.set("jobId", "job_1");
    formData.set("status", "DRAFT");

    const result = await createApplicationAction({ error: "" }, formData);

    assert.equal(result.error, "Unable to create application right now. Please try again.");
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.createApplication = originalCreateApplication;
  }
});

test("createApplicationAction succeeds and normalizes appliedAt to ISO before service call", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    let capturedUserId: string | undefined;
    let capturedInput:
      | {
          jobId: string;
          status?: string;
          appliedAt?: string;
          notes?: string;
        }
      | undefined;

    applicationOsService.createApplication = async (userId, input) => {
      capturedUserId = userId;
      capturedInput = input;
      return {
        application: {
          id: "app_1",
          userId,
          jobId: input.jobId,
          status: (input.status ?? "DRAFT") as "DRAFT",
          appliedAt: input.appliedAt,
          notes: input.notes,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        job: {
          id: input.jobId,
          userId,
          company: "Acme AI",
          title: "Frontend Engineer",
          status: "SAVED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    };

    const formData = new FormData();
    formData.set("jobId", "job_1");
    formData.set("status", "DRAFT");
    formData.set("appliedAt", "2026-03-20");
    formData.set("notes", "Submitted referral");

    const result = await createApplicationAction({ error: "" }, formData);

    assert.equal(result.error, "");
    assert.equal(capturedUserId, "user_test");
    assert.equal(capturedInput?.jobId, "job_1");
    assert.equal(capturedInput?.status, "DRAFT");
    assert.equal(capturedInput?.notes, "Submitted referral");
    assert.equal(capturedInput?.appliedAt, new Date("2026-03-20").toISOString());
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.createApplication = originalCreateApplication;
  }
});

test("updateApplicationStatusAction propagates unauthenticated redirect/error and does not update", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalUpdateApplicationStatus =
    applicationOsService.updateApplicationStatus.bind(applicationOsService);

  try {
    authSession.getCurrentUserOrThrow = async () => {
      throw new Error("NEXT_REDIRECT");
    };

    let updateCalled = false;
    applicationOsService.updateApplicationStatus = async () => {
      updateCalled = true;
      throw new Error("should not be called");
    };

    const formData = new FormData();
    formData.set("applicationId", "app_1");
    formData.set("status", "INTERVIEW");

    await assert.rejects(() => updateApplicationStatusAction(formData), /NEXT_REDIRECT/);
    assert.equal(updateCalled, false);
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.updateApplicationStatus = originalUpdateApplicationStatus;
  }
});

test("updateApplicationStatusAction uses authenticated user scope and payload shape", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalUpdateApplicationStatus =
    applicationOsService.updateApplicationStatus.bind(applicationOsService);

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    let capturedUserId: string | undefined;
    let capturedInput:
      | {
          applicationId: string;
          status: string;
        }
      | undefined;

    applicationOsService.updateApplicationStatus = async (userId, input) => {
      capturedUserId = userId;
      capturedInput = input;
      return {
        application: {
          id: input.applicationId,
          userId,
          jobId: "job_1",
          status: input.status,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        job: {
          id: "job_1",
          userId,
          company: "Acme AI",
          title: "Frontend Engineer",
          status: "APPLIED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      };
    };

    const formData = new FormData();
    formData.set("applicationId", "app_1");
    formData.set("status", "INTERVIEW");

    await updateApplicationStatusAction(formData);

    assert.equal(capturedUserId, "user_test");
    assert.deepEqual(capturedInput, {
      applicationId: "app_1",
      status: "INTERVIEW",
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.updateApplicationStatus = originalUpdateApplicationStatus;
  }
});
