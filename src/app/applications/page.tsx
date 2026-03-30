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

      <Suspense fallback={<div className="text-sm text-slate-500 p-4">Loading applications...</div>}>
        <ApplicationsClient rows={rows} />
      </Suspense>
    </AppShell>
  );
}
