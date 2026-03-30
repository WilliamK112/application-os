import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUserOrThrow();
  const { id: companyId } = await params;

  const [company, jobs, applications] = await Promise.all([
    applicationOsService.getCompany(user.id, companyId),
    applicationOsService.getJobs(user.id),
    applicationOsService.getApplications(user.id),
  ]);

  if (!company) {
    notFound();
  }

  const companyJobs = jobs.filter((job) => job.companyId === companyId);
  const companyApplications = applications.filter(({ job }) => job.companyId === companyId);

  const APPLICATION_STATUS_COLORS: Record<string, string> = {
    DRAFT: "bg-slate-200 text-slate-700",
    APPLIED: "bg-blue-100 text-blue-700",
    SCREENING: "bg-purple-100 text-purple-700",
    INTERVIEW: "bg-amber-100 text-amber-700",
    OFFER: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
    WITHDRAWN: "bg-slate-100 text-slate-500",
  };

  return (
    <AppShell
      title={company.name}
      backHref="/companies"
    >
      {/* Company header */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{company.name}</h2>
            {company.industry && <p className="mt-1 text-sm text-slate-500">{company.industry}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
              {company.size && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-sm text-slate-600">👥 {company.size}</span>
              )}
              {company.location && (
                <span className="rounded bg-slate-100 px-2 py-0.5 text-sm text-slate-600">📍 {company.location}</span>
              )}
              {company.website && (
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded bg-blue-50 px-2 py-0.5 text-sm text-blue-600 hover:underline"
                >
                  🌐 Website
                </a>
              )}
            </div>
          </div>
        </div>
        {company.notes && (
          <p className="mt-3 text-sm text-slate-600">{company.notes}</p>
        )}
      </section>

      {/* Stats */}
      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Jobs at this company</p>
          <p className="mt-1 text-2xl font-semibold">{companyJobs.length}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Applications at this company</p>
          <p className="mt-1 text-2xl font-semibold">{companyApplications.length}</p>
        </div>
      </section>

      {/* Jobs */}
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Jobs ({companyJobs.length})</h3>
        {companyJobs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No jobs linked to this company.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {companyJobs.map((job) => (
              <div key={job.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 p-3">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-slate-500">{job.location ?? "—"} · {job.status}</p>
                </div>
                <div className="flex gap-2">
                  {job.url && (
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100"
                    >
                      🔗 Apply
                    </a>
                  )}
                  <Link
                    href={`/jobs`}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Applications */}
      <section className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Applications ({companyApplications.length})</h3>
        {companyApplications.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No applications at this company yet.</p>
        ) : (
          <div className="mt-3 space-y-2">
            {companyApplications.map(({ application, job }) => (
              <div key={application.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-slate-50 p-3">
                <div>
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-slate-500">
                    {application.appliedAt
                      ? `Applied ${new Date(application.appliedAt).toLocaleDateString()}`
                      : "Not yet applied"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${APPLICATION_STATUS_COLORS[application.status] ?? "bg-slate-200 text-slate-700"}`}>
                    {application.status}
                  </span>
                  <Link
                    href={`/applications/${application.id}`}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs hover:bg-slate-100"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
