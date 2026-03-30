import test from "node:test";
import assert from "node:assert/strict";
import JobsPage, { jobsPageAuth, jobsPageChecklist } from "@/app/jobs/page";
import { applicationOsService } from "@/lib/services/application-os-service";

test("JobsPage redirects to /login when user is unauthenticated", async () => {
  const originalGetCurrentUserOrThrow = jobsPageAuth.getCurrentUserOrThrow;
  const originalGetJobs = applicationOsService.getJobs.bind(applicationOsService);
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);
  const originalListCompanies = applicationOsService.listCompanies.bind(applicationOsService);

  try {
    jobsPageAuth.getCurrentUserOrThrow = async () => {
      throw new Error("NEXT_REDIRECT");
    };

    let getJobsCalled = false;
    let getAutoApplyRunLogsCalled = false;
    let listCompaniesCalled = false;

    applicationOsService.getJobs = async () => {
      getJobsCalled = true;
      throw new Error("should not be called");
    };

    applicationOsService.getAutoApplyRunLogs = async () => {
      getAutoApplyRunLogsCalled = true;
      throw new Error("should not be called");
    };

    applicationOsService.listCompanies = async () => {
      listCompaniesCalled = true;
      throw new Error("should not be called");
    };

    await assert.rejects(() => JobsPage(), /NEXT_REDIRECT/);
    assert.equal(getJobsCalled, false);
    assert.equal(getAutoApplyRunLogsCalled, false);
    assert.equal(listCompaniesCalled, false);
  } finally {
    jobsPageAuth.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getJobs = originalGetJobs;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
    applicationOsService.listCompanies = originalListCompanies;
  }
});

test("JobsPage loads user-scoped data and renders both provider checklists", async () => {
  const originalGetCurrentUserOrThrow = jobsPageAuth.getCurrentUserOrThrow;
  const originalGetJobs = applicationOsService.getJobs.bind(applicationOsService);
  const originalGetAutoApplyRunLogs = applicationOsService.getAutoApplyRunLogs.bind(applicationOsService);
  const originalListCompanies = applicationOsService.listCompanies.bind(applicationOsService);
  const originalGetProviderSubmitChecklist = jobsPageChecklist.getProviderSubmitChecklist;

  try {
    jobsPageAuth.getCurrentUserOrThrow = async () => ({ id: "user-123" }) as never;

    let getJobsUserId: string | null = null;
    let getHistoryUserId: string | null = null;
    let listCompaniesUserId: string | null = null;
    const checklistProviders: string[] = [];

    applicationOsService.getJobs = async (userId: string) => {
      getJobsUserId = userId;
      return [];
    };

    applicationOsService.getAutoApplyRunLogs = async (userId: string) => {
      getHistoryUserId = userId;
      return [];
    };

    applicationOsService.listCompanies = async (userId: string) => {
      listCompaniesUserId = userId;
      return [];
    };

    jobsPageChecklist.getProviderSubmitChecklist = ((provider: "greenhouse" | "lever") => {
      checklistProviders.push(provider);
      return {
        provider,
        required: [],
        optional: [],
      };
    }) as typeof jobsPageChecklist.getProviderSubmitChecklist;

    await JobsPage();

    assert.equal(getJobsUserId, "user-123");
    assert.equal(getHistoryUserId, "user-123");
    assert.equal(listCompaniesUserId, "user-123");
    assert.deepEqual(checklistProviders, ["greenhouse", "lever"]);
  } finally {
    jobsPageAuth.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getJobs = originalGetJobs;
    applicationOsService.getAutoApplyRunLogs = originalGetAutoApplyRunLogs;
    applicationOsService.listCompanies = originalListCompanies;
    jobsPageChecklist.getProviderSubmitChecklist = originalGetProviderSubmitChecklist;
  }
});
