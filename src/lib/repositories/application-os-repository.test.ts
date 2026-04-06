import test from "node:test";
import assert from "node:assert/strict";

test("user isolation: user A cannot update user B application status", async () => {
  const originalProvider = process.env.APP_OS_REPOSITORY_PROVIDER;

  try {
    process.env.APP_OS_REPOSITORY_PROVIDER = "mock";

    const modulePath = `@/lib/repositories/application-os-repository?isolation=${Date.now()}`;
    const repoModule = await import(modulePath);
    const repository = repoModule.applicationOsRepository as {
      updateApplicationStatus: (
        userId: string,
        input: { applicationId: string; status: "INTERVIEW" },
      ) => Promise<unknown>;
    };

    await assert.rejects(
      () =>
        repository.updateApplicationStatus("user_2", {
          applicationId: "app_1",
          status: "INTERVIEW",
        }),
      /Application not found/,
    );
  } finally {
    if (originalProvider === undefined) {
      delete process.env.APP_OS_REPOSITORY_PROVIDER;
    } else {
      process.env.APP_OS_REPOSITORY_PROVIDER = originalProvider;
    }
  }
});

test("user isolation: user A cannot update user B job status", async () => {
  const originalProvider = process.env.APP_OS_REPOSITORY_PROVIDER;

  try {
    process.env.APP_OS_REPOSITORY_PROVIDER = "mock";

    const modulePath = `@/lib/repositories/application-os-repository?job-isolation=${Date.now()}`;
    const repoModule = await import(modulePath);
    const repository = repoModule.applicationOsRepository as {
      updateJobStatus: (
        userId: string,
        input: { jobId: string; status: "APPLIED" },
      ) => Promise<unknown>;
    };

    await assert.rejects(
      () =>
        repository.updateJobStatus("user_2", {
          jobId: "job_1",
          status: "APPLIED",
        }),
      /Job not found/,
    );
  } finally {
    if (originalProvider === undefined) {
      delete process.env.APP_OS_REPOSITORY_PROVIDER;
    } else {
      process.env.APP_OS_REPOSITORY_PROVIDER = originalProvider;
    }
  }
});

test("auto-apply run logs persist failureCategory and support failureCategory filter", async () => {
  const originalProvider = process.env.APP_OS_REPOSITORY_PROVIDER;

  try {
    process.env.APP_OS_REPOSITORY_PROVIDER = "mock";

    const modulePath = `@/lib/repositories/application-os-repository?failure-category=${Date.now()}`;
    const repoModule = await import(modulePath);
    const repository = repoModule.applicationOsRepository as {
      createAutoApplyRunLogs: (
        userId: string,
        input: Array<{
          jobId: string;
          status: "failed" | "success";
          failureCategory?: "http_failure" | "network_failure" | "manual_handoff" | "no_form";
          message: string;
        }>,
      ) => Promise<void>;
      listAutoApplyRunLogs: (
        userId: string,
        input?: {
          failureCategory?: "http_failure" | "network_failure" | "manual_handoff" | "no_form";
          limit?: number;
        },
      ) => Promise<Array<{ failureCategory?: string; status: string; jobId: string }>>;
    };

    await repository.createAutoApplyRunLogs("user_1", [
      {
        jobId: "job_1",
        status: "failed",
        failureCategory: "http_failure",
        message: "Greenhouse probe returned 500",
      },
      {
        jobId: "job_2",
        status: "success",
        message: "Application created",
      },
      {
        jobId: "job_1",
        status: "failed",
        failureCategory: "network_failure",
        message: "Probe request timed out",
      },
      {
        jobId: "job_2",
        status: "failed",
        failureCategory: "manual_handoff",
        message: "Provider form detected; requires manual submit",
      },
      {
        jobId: "job_1",
        status: "failed",
        failureCategory: "no_form",
        message: "No provider form signal found",
      },
    ]);

    const allLogs = await repository.listAutoApplyRunLogs("user_1", { limit: 10 });
    assert.equal(allLogs.length, 5);
    assert.equal(allLogs.some((log) => log.failureCategory === "http_failure"), true);
    assert.equal(allLogs.some((log) => log.failureCategory === "network_failure"), true);
    assert.equal(allLogs.some((log) => log.failureCategory === "no_form"), true);
    assert.equal(allLogs.some((log) => log.failureCategory === "manual_handoff"), true);
    assert.equal(allLogs.some((log) => log.status === "success" && log.failureCategory === undefined), true);

    const httpFailures = await repository.listAutoApplyRunLogs("user_1", {
      failureCategory: "http_failure",
      limit: 10,
    });

    assert.equal(httpFailures.length, 1);
    assert.equal(httpFailures[0]?.failureCategory, "http_failure");
    assert.equal(httpFailures[0]?.status, "failed");

    const manualHandoffFailures = await repository.listAutoApplyRunLogs("user_1", {
      failureCategory: "manual_handoff",
      limit: 10,
    });

    assert.equal(manualHandoffFailures.length, 1);
    assert.equal(manualHandoffFailures[0]?.failureCategory, "manual_handoff");
    assert.equal(manualHandoffFailures[0]?.status, "failed");

    const noFormFailures = await repository.listAutoApplyRunLogs("user_1", {
      failureCategory: "no_form",
      limit: 10,
    });

    assert.equal(noFormFailures.length, 1);
    assert.equal(noFormFailures[0]?.failureCategory, "no_form");
    assert.equal(noFormFailures[0]?.status, "failed");
  } finally {
    if (originalProvider === undefined) {
      delete process.env.APP_OS_REPOSITORY_PROVIDER;
    } else {
      process.env.APP_OS_REPOSITORY_PROVIDER = originalProvider;
    }
  }
});
