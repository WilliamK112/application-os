import test from "node:test";
import assert from "node:assert/strict";
import ApplicationsPage, { applicationsPageAuth } from "@/app/applications/page";
import { applicationOsService } from "@/lib/services/application-os-service";

test("ApplicationsPage redirects to /login when user is unauthenticated", async () => {
  const originalGetCurrentUserOrThrow = applicationsPageAuth.getCurrentUserOrThrow;
  const originalGetApplications = applicationOsService.getApplications.bind(applicationOsService);
  const originalGetJobs = applicationOsService.getJobs.bind(applicationOsService);

  try {
    applicationsPageAuth.getCurrentUserOrThrow = async () => {
      throw new Error("NEXT_REDIRECT");
    };

    let getApplicationsCalled = false;
    let getJobsCalled = false;

    applicationOsService.getApplications = async () => {
      getApplicationsCalled = true;
      throw new Error("should not be called");
    };

    applicationOsService.getJobs = async () => {
      getJobsCalled = true;
      throw new Error("should not be called");
    };

    await assert.rejects(() => ApplicationsPage(), /NEXT_REDIRECT/);
    assert.equal(getApplicationsCalled, false);
    assert.equal(getJobsCalled, false);
  } finally {
    applicationsPageAuth.getCurrentUserOrThrow = originalGetCurrentUserOrThrow;
    applicationOsService.getApplications = originalGetApplications;
    applicationOsService.getJobs = originalGetJobs;
  }
});
