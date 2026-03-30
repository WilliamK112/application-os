import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { AutoApplyPanel } from "@/components/auto-apply-panel";
import { JOB_STATUS_OPTIONS } from "@/lib/constants/status";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { getProviderSubmitChecklist } from "@/lib/jobs/external-submit";
import { applicationOsService } from "@/lib/services/application-os-service";
import {
  bulkImportJobsAction,
  createJobAction,
  importJobFromUrlAction,
} from "./actions";
import { JobsClient } from "./jobs-client";

export const jobsPageAuth = {
  getCurrentUserOrThrow,
};

export const jobsPageChecklist = {
  getProviderSubmitChecklist,
};

export default async function JobsPage() {
  const user = await jobsPageAuth.getCurrentUserOrThrow();
  const [jobs, autoApplyHistory, companies] = await Promise.all([
    applicationOsService.getJobs(user.id),
    applicationOsService.getAutoApplyRunLogs(user.id, { limit: 40 }),
    applicationOsService.listCompanies(user.id),
  ]);

  const submitChecklists = [
    jobsPageChecklist.getProviderSubmitChecklist("greenhouse"),
    jobsPageChecklist.getProviderSubmitChecklist("lever"),
  ];

  return (
    <AppShell title="Jobs">
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Add Job</h3>
        <form action={createJobAction} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Company</span>
            <input
              name="company"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Acme AI"
              list="company-suggestions"
            />
            <datalist id="company-suggestions">
              {companies.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
            </datalist>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Link to Company</span>
            <select
              name="companyId"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              <option value="">— None —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Title</span>
            <input
              name="title"
              required
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Frontend Engineer"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Location</span>
            <input
              name="location"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="Remote"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Source</span>
            <input
              name="source"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="LinkedIn"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Job URL</span>
            <input
              name="url"
              type="url"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
              placeholder="https://linkedin.com/jobs/view/123456"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-slate-600">Status</span>
            <select
              name="status"
              defaultValue="SAVED"
              className="w-full rounded-md border border-slate-300 px-3 py-2"
            >
              {JOB_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              Create Job
            </button>
          </div>
        </form>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Import from Job URL</h3>
        <p className="mt-1 text-sm text-slate-600">
          Paste a job URL and we&apos;ll prefill company/title/source automatically.
        </p>
        <form action={importJobFromUrlAction} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            name="jobUrl"
            type="url"
            required
            placeholder="https://company.com/careers/frontend-engineer"
            className="w-full rounded-md border border-slate-300 px-3 py-2"
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Import URL
          </button>
        </form>
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Batch Import (CSV / URL list)</h3>
        <p className="mt-1 text-sm text-slate-600">
          One entry per line. Use URL lines or CSV lines: company,title,location,source,url
        </p>
        <form action={bulkImportJobsAction} className="mt-4 space-y-3">
          <textarea
            name="bulkInput"
            required
            rows={6}
            className="w-full rounded-md border border-slate-300 px-3 py-2 font-mono text-sm"
            placeholder={"https://jobs.example.com/frontend-engineer\nAcme AI,Backend Engineer,Remote,LinkedIn,https://linkedin.com/jobs/view/123"}
          />
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Import Batch
          </button>
        </form>
      </section>

      <AutoApplyPanel
        jobs={jobs.map((job) => ({ id: job.id, company: job.company, title: job.title }))}
        initialHistory={autoApplyHistory}
        submitChecklists={submitChecklists}
      />

      <Suspense fallback={<div className="text-sm text-slate-500 p-4">Loading jobs...</div>}>
        <JobsClient jobs={jobs} companies={companies} />
      </Suspense>
    </AppShell>
  );
}