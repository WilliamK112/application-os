import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { deleteCompanyAction } from "./actions";
import { JOB_STATUS_OPTIONS } from "@/lib/constants/status";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserOrThrow();
  const data = await applicationOsService.getCompanyWithStats(user.id, id);

  if (!data) {
    notFound();
  }

  const { company, jobs, totalApplications } = data;

  const statusLabel = (status: string) =>
    JOB_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;

  return (
    <AppShell title={company.name}>
      <div className="space-y-6">
        {/* Back link */}
        <Link
          href="/companies"
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
        >
          ← Companies
        </Link>

        {/* Company header card */}
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{company.name}</h1>
              {company.industry && (
                <p className="mt-1 text-sm text-slate-500">{company.industry}</p>
              )}
            </div>
            <form
              action={async () => {
                "use server";
                await deleteCompanyAction(company.id);
              }}
            >
              <button
                type="submit"
                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
                onClick={(e) => {
                  if (!confirm(`Delete ${company.name}? This cannot be undone.`)) {
                    e.preventDefault();
                  }
                }}
              >
                🗑️ Delete Company
              </button>
            </form>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {company.size && (
              <span className="rounded bg-slate-100 px-2.5 py-1 text-sm text-slate-700">
                👥 {company.size}
              </span>
            )}
            {company.location && (
              <span className="rounded bg-slate-100 px-2.5 py-1 text-sm text-slate-700">
                📍 {company.location}
              </span>
            )}
            {company.website && (
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded bg-blue-50 px-2.5 py-1 text-sm text-blue-600 hover:underline"
              >
                🌐 {company.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>

          {company.notes && (
            <p className="mt-4 text-sm text-slate-600">{company.notes}</p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">{jobs.length}</div>
            <div className="mt-1 text-sm text-slate-500">Jobs</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">{totalApplications}</div>
            <div className="mt-1 text-sm text-slate-500">Applications</div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <div className="text-3xl font-bold text-slate-900">
              {jobs.length > 0 ? Math.round(totalApplications / jobs.length * 10) / 10 : 0}
            </div>
            <div className="mt-1 text-sm text-slate-500">Avg Apps/Job</div>
          </div>
        </div>

        {/* Jobs list */}
        {jobs.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
            <p className="text-sm text-slate-500">No jobs linked to this company yet.</p>
            <Link
              href="/jobs/new"
              className="mt-3 inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              + Add Job
            </Link>
          </div>
        ) : (
          <div className="rounded-lg border border-slate-200 bg-white overflow-hidden">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Applications
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Source
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/jobs/${job.id}`}
                        className="font-medium text-slate-900 hover:text-blue-600"
                      >
                        {job.title}
                      </Link>
                      {job.location && (
                        <div className="text-xs text-slate-400">{job.location}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusLabel(job.status).split(" ").pop()?.toLowerCase() === "active" ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-700"}`}
                      >
                        {statusLabel(job.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {job.applicationCount} {job.applicationCount === 1 ? "app" : "apps"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {job.source ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-400">
                      {new Date(job.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
