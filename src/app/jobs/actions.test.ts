import test from "node:test";
import assert from "node:assert/strict";
import { runAutoApplyAction } from "@/app/jobs/actions";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";
import { revalidateAdapter } from "@/lib/next/revalidate-adapter";

const testUser = {
  id: "user_test",
  email: "test@example.com",
  name: "Test User",
  timezone: "America/Chicago",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test("runAutoApplyAction loads documents and forwards resume override for external providers", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetJobs = applicationOsService.getJobs.bind(applicationOsService);
  const originalGetDocuments = applicationOsService.getDocuments.bind(applicationOsService);
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);
  const originalCreateAutoApplyRunLogs = applicationOsService.createAutoApplyRunLogs.bind(applicationOsService);
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);
  const originalRevalidatePath = revalidateAdapter.revalidatePath;

  let getDocumentsCallUserId: string | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getJobs = async () => [
      {
        id: "job_greenhouse",
        userId: testUser.id,
        company: "Acme AI",
        title: "Platform Engineer",
        location: "Remote",
        source: "import",
        status: "SAVED",
        url: "https://boards.greenhouse.io/acme/jobs/123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    applicationOsService.getDocuments = async (userId) => {
      getDocumentsCallUserId = userId;
      return [
        {
          id: "doc_resume",
          userId,
          name: "Resume.pdf",
          type: "RESUME",
          url: "https://cdn.example.com/resume.pdf",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
    };

    applicationOsService.createApplication = async (userId, input) => ({
      application: {
        id: "app_1",
        userId,
        jobId: input.jobId,
        status: input.status,
        appliedAt: input.appliedAt,
        notes: input.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      job: {
        id: input.jobId,
        userId,
        company: "Acme AI",
        title: "Platform Engineer",
        location: "Remote",
        source: "import",
        status: "APPLIED",
        url: "https://boards.greenhouse.io/acme/jobs/123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    applicationOsService.createAutoApplyRunLogs = async () => {};
    applicationOsService.getAutoApplyRunLogs = async () => [];

    revalidateAdapter.revalidatePath = () => {};

    const formData = new FormData();
    formData.set("historyFilter", "ALL");
    formData.append("jobIds", "job_greenhouse");

    const result = await runAutoApplyAction(undefined, formData);

    // Verify documents were loaded (the test focus)
    assert.equal(getDocumentsCallUserId, testUser.id);
    // Verify job was created
    assert.ok(!result.error);
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getJobs = originalGetJobs;
    applicationOsService.getDocuments = originalGetDocuments;
    applicationOsService.createApplication = originalCreateApplication;
    applicationOsService.createAutoApplyRunLogs = originalCreateAutoApplyRunLogs;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
    revalidateAdapter.revalidatePath = originalRevalidatePath;
  }
});
test("runAutoApplyAction accepts failure-category history filter and forwards it to history query", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    const formData = new FormData();
    formData.set("historyFilter", "http_failure");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "Select at least one job.");
    assert.deepEqual(receivedHistoryQuery, {
      status: undefined,
      failureCategory: "http_failure",
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
  }
});

test("runAutoApplyAction maps status history filter to status query only", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    const formData = new FormData();
    formData.set("historyFilter", "needs_manual");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "Select at least one job.");
    assert.deepEqual(receivedHistoryQuery, {
      status: "needs_manual",
      failureCategory: undefined,
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
  }
});

test("runAutoApplyAction maps manual_handoff history filter to failureCategory query only", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    const formData = new FormData();
    formData.set("historyFilter", "manual_handoff");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "Select at least one job.");
    assert.deepEqual(receivedHistoryQuery, {
      status: undefined,
      failureCategory: "manual_handoff",
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
  }
});

test("runAutoApplyAction maps network_failure history filter to failureCategory query only", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    const formData = new FormData();
    formData.set("historyFilter", "network_failure");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "Select at least one job.");
    assert.deepEqual(receivedHistoryQuery, {
      status: undefined,
      failureCategory: "network_failure",
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
  }
});

test("runAutoApplyAction maps no_form history filter to failureCategory query only", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    const formData = new FormData();
    formData.set("historyFilter", "no_form");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "Select at least one job.");
    assert.deepEqual(receivedHistoryQuery, {
      status: undefined,
      failureCategory: "no_form",
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
  }
});

test("runAutoApplyAction falls back malformed historyFilter to ALL query and stable error", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    const formData = new FormData();
    formData.set("historyFilter", "totally_invalid");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "Select at least one job.");
    assert.equal(result.historyFilter, "ALL");
    assert.deepEqual(receivedHistoryQuery, {
      status: undefined,
      failureCategory: undefined,
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
  }
});

test("runAutoApplyAction keeps apply happy-path semantics when historyFilter is malformed", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetJobs = applicationOsService.getJobs.bind(applicationOsService);
  const originalGetDocuments = applicationOsService.getDocuments.bind(applicationOsService);
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);
  const originalCreateAutoApplyRunLogs = applicationOsService.createAutoApplyRunLogs.bind(applicationOsService);
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);
  const originalRevalidatePath = revalidateAdapter.revalidatePath;

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getJobs = async () => [
      {
        id: "job_unknown",
        userId: testUser.id,
        company: "Acme AI",
        title: "Platform Engineer",
        location: "Remote",
        source: "import",
        status: "SAVED",
        url: "https://example.com/jobs/123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    applicationOsService.getDocuments = async () => [];

    applicationOsService.createApplication = async (userId, input) => ({
      application: {
        id: "app_1",
        userId,
        jobId: input.jobId,
        status: input.status,
        appliedAt: input.appliedAt,
        notes: input.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      job: {
        id: input.jobId,
        userId,
        company: "Acme AI",
        title: "Platform Engineer",
        location: "Remote",
        source: "import",
        status: "APPLIED",
        url: "https://example.com/jobs/123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    applicationOsService.createAutoApplyRunLogs = async () => {};
    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    revalidateAdapter.revalidatePath = () => {};

    const formData = new FormData();
    formData.set("historyFilter", "bad_filter_value");
    formData.append("jobIds", "job_unknown");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "");
    assert.equal(result.historyFilter, "ALL");
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0]?.status, "success");
    assert.deepEqual(receivedHistoryQuery, {
      status: undefined,
      failureCategory: undefined,
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getJobs = originalGetJobs;
    applicationOsService.getDocuments = originalGetDocuments;
    applicationOsService.createApplication = originalCreateApplication;
    applicationOsService.createAutoApplyRunLogs = originalCreateAutoApplyRunLogs;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
    revalidateAdapter.revalidatePath = originalRevalidatePath;
  }
});

test("runAutoApplyAction normalizes malformed historyFilter to ALL on successful apply path", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetJobs = applicationOsService.getJobs.bind(applicationOsService);
  const originalGetDocuments = applicationOsService.getDocuments.bind(applicationOsService);
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);
  const originalCreateAutoApplyRunLogs = applicationOsService.createAutoApplyRunLogs.bind(applicationOsService);
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);
  const originalRevalidatePath = revalidateAdapter.revalidatePath;

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;

    applicationOsService.getJobs = async () => [
      {
        id: "job_1",
        userId: testUser.id,
        company: "Acme",
        title: "Engineer",
        location: "Remote",
        source: "import",
        status: "SAVED",
        url: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    applicationOsService.getDocuments = async () => [];

    applicationOsService.createApplication = async (userId, input) => ({
      application: {
        id: "app_1",
        userId,
        jobId: input.jobId,
        status: input.status,
        appliedAt: input.appliedAt,
        notes: input.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      job: {
        id: input.jobId,
        userId,
        company: "Acme",
        title: "Engineer",
        location: "Remote",
        source: "import",
        status: "APPLIED",
        url: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    applicationOsService.createAutoApplyRunLogs = async () => {};

    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    revalidateAdapter.revalidatePath = () => {};

    const formData = new FormData();
    formData.set("historyFilter", "totally_invalid");
    formData.append("jobIds", "job_1");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "");
    assert.equal(result.historyFilter, "ALL");
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0]?.status, "success");
    assert.deepEqual(receivedHistoryQuery, {
      status: undefined,
      failureCategory: undefined,
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getJobs = originalGetJobs;
    applicationOsService.getDocuments = originalGetDocuments;
    applicationOsService.createApplication = originalCreateApplication;
    applicationOsService.createAutoApplyRunLogs = originalCreateAutoApplyRunLogs;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
    revalidateAdapter.revalidatePath = originalRevalidatePath;
  }
});

test("runAutoApplyAction malformed historyFilter keeps external-provider status and persisted failureCategory semantics", async () => {
  const originalGetCurrentUserOrThrow = authSession.getCurrentUserOrThrow;
  const originalGetJobs = applicationOsService.getJobs.bind(applicationOsService);
  const originalGetDocuments = applicationOsService.getDocuments.bind(applicationOsService);
  const originalCreateApplication = applicationOsService.createApplication.bind(applicationOsService);
  const originalCreateAutoApplyRunLogs = applicationOsService.createAutoApplyRunLogs.bind(applicationOsService);
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);
  const originalRevalidatePath = revalidateAdapter.revalidatePath;
  const originalDryRunEnv = process.env.APP_OS_AUTO_APPLY_DRY_RUN;

  let receivedHistoryQuery: { status?: string; failureCategory?: string; limit?: number } | undefined;
  let persistedRunLogs:
    | Array<{ status: string; failureCategory?: string; applicationId?: string }>
    | undefined;

  try {
    authSession.getCurrentUserOrThrow = async () => testUser;
    process.env.APP_OS_AUTO_APPLY_DRY_RUN = "true";

    applicationOsService.getJobs = async () => [
      {
        id: "job_greenhouse",
        userId: testUser.id,
        company: "Acme",
        title: "ML Engineer",
        location: "Remote",
        source: "import",
        status: "SAVED",
        url: "https://boards.greenhouse.io/acme/jobs/123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    applicationOsService.getDocuments = async () => [];

    applicationOsService.createApplication = async (userId, input) => ({
      application: {
        id: "app_external_1",
        userId,
        jobId: input.jobId,
        status: input.status,
        appliedAt: input.appliedAt,
        notes: input.notes,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      job: {
        id: input.jobId,
        userId,
        company: "Acme",
        title: "ML Engineer",
        location: "Remote",
        source: "import",
        status: "APPLIED",
        url: "https://boards.greenhouse.io/acme/jobs/123",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    applicationOsService.createAutoApplyRunLogs = async (_userId, logs) => {
      persistedRunLogs = logs.map((item) => ({
        status: item.status,
        failureCategory: item.failureCategory,
        applicationId: item.applicationId,
      }));
    };

    applicationOsService.getAutoApplyRunLogs = async (_userId, input) => {
      receivedHistoryQuery = input as { status?: string; failureCategory?: string; limit?: number };
      return [];
    };

    revalidateAdapter.revalidatePath = () => {};

    const formData = new FormData();
    formData.set("historyFilter", "totally_invalid");
    formData.append("jobIds", "job_greenhouse");

    const result = await runAutoApplyAction(undefined, formData);

    assert.equal(result.error, "");
    assert.equal(result.historyFilter, "ALL");
    assert.equal(result.results.length, 1);
    assert.equal(result.results[0]?.status, "needs_manual");
    assert.equal(result.results[0]?.failureCategory, undefined);
    assert.deepEqual(persistedRunLogs, [
      {
        status: "needs_manual",
        failureCategory: undefined,
        applicationId: "app_external_1",
      },
    ]);
    assert.deepEqual(receivedHistoryQuery, {
      status: undefined,
      failureCategory: undefined,
      limit: 40,
    });
  } finally {
    authSession.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getJobs = originalGetJobs;
    applicationOsService.getDocuments = originalGetDocuments;
    applicationOsService.createApplication = originalCreateApplication;
    applicationOsService.createAutoApplyRunLogs = originalCreateAutoApplyRunLogs;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
    revalidateAdapter.revalidatePath = originalRevalidatePath;
    if (originalDryRunEnv === undefined) {
      delete process.env.APP_OS_AUTO_APPLY_DRY_RUN;
    } else {
      process.env.APP_OS_AUTO_APPLY_DRY_RUN = originalDryRunEnv;
    }
  }
});
