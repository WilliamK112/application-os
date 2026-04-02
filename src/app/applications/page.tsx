import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { ApplicationCreateForm } from "@/components/application-create-form";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { ApplicationsClient } from "./applications-client";

export const applicationsPageAuth = {
  getCurrentUserOrThrow,
};

export default async function ApplicationsPage() {
  const user = await applicationsPageAuth.getCurrentUserOrThrow();
  const [rows, jobs] = await Promise.all([
    applicationOsService.getApplications(user.id),
    applicationOsService.getJobs(user.id),
  ]);

  return (
    <AppShell title="Applications">
      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Add Application</h3>
        <ApplicationCreateForm jobs={jobs} />
      </section>

      <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Export Applications</h3>
        <p className="mt-1 text-sm text-slate-600">
          Download your application history as CSV or JSON.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a
            href="/api/export/applications"
            download
            className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-600"
          >
            ↓ Export CSV
          </a>
          <a
            href="/api/export/applications?format=json"
            download
            className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50"
          >
            Export JSON
          </a>
        </div>
      </section>

      <Suspense fallback={<div className="text-sm text-slate-500 p-4">Loading applications...</div>}>
        <ApplicationsClient rows={rows} />
      </Suspense>
    </AppShell>
  );
}
