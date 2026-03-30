import { AppShell } from "@/components/app-shell";
import { ApplicationCreateForm } from "@/components/application-create-form";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/constants/status";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { updateApplicationStatusAction } from "./actions";

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

      <div className="space-y-3">
        {rows.map(({ application, job }) => (
          <article key={application.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">
                {job.company} · {job.title}
              </h3>
              <form action={updateApplicationStatusAction}>
                <input type="hidden" name="applicationId" value={application.id} />
                <select
                  name="status"
                  defaultValue={application.status}
                  className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium"
                >
                  {APPLICATION_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button type="submit" className="ml-2 rounded border border-slate-300 px-2 py-1 text-xs">
                  Save
                </button>
              </form>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              Applied: {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString() : "Not yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Last activity: {application.lastActivityAt ? new Date(application.lastActivityAt).toLocaleString() : "-"}
            </p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
