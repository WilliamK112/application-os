import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";

export default async function AnalyticsPage() {
  const user = await getCurrentUserOrThrow();

  const [applications, jobs, interviews] = await Promise.all([
    applicationOsService.getApplications(user.id),
    applicationOsService.getJobs(user.id),
    applicationOsService.listInterviews(user.id),
  ]);

  // Application funnel
  const funnel = {
    total: applications.length,
    draft: applications.filter(({ application }) => application.status === "DRAFT").length,
    applied: applications.filter(({ application }) => application.status === "APPLIED").length,
    screening: applications.filter(({ application }) => application.status === "SCREENING").length,
    interview: applications.filter(({ application }) => application.status === "INTERVIEW").length,
    offer: applications.filter(({ application }) => application.status === "OFFER").length,
    rejected: applications.filter(({ application }) => application.status === "REJECTED").length,
    withdrawn: applications.filter(({ application }) => application.status === "WITHDRAWN").length,
  };

  // Interview type breakdown
  const interviewTypeCount: Record<string, number> = {};
  for (const i of interviews) {
    interviewTypeCount[i.interviewType] = (interviewTypeCount[i.interviewType] ?? 0) + 1;
  }
  const interviewOutcomeCount: Record<string, number> = {};
  for (const i of interviews) {
    if (i.outcome) {
      interviewOutcomeCount[i.outcome] = (interviewOutcomeCount[i.outcome] ?? 0) + 1;
    }
  }

  // Job status breakdown
  const jobStatusCount: Record<string, number> = {};
  for (const job of jobs) {
    jobStatusCount[job.status] = (jobStatusCount[job.status] ?? 0) + 1;
  }

  // Source breakdown
  const sourceCount: Record<string, number> = {};
  for (const job of jobs) {
    if (job.source) {
      sourceCount[job.source] = (sourceCount[job.source] ?? 0) + 1;
    }
  }

  const conversionRate = funnel.total > 0
    ? Math.round((funnel.interview / funnel.total) * 100)
    : 0;
  const offerRate = funnel.total > 0
    ? Math.round((funnel.offer / funnel.total) * 100)
    : 0;

  return (
    <AppShell title="Analytics">
      {/* Conversion metrics */}
      <section className="grid gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {[
          { label: "Total Applications", value: funnel.total, color: "text-slate-900" },
          { label: "Interview Rate", value: `${conversionRate}%`, color: conversionRate > 0 ? "text-blue-600" : "text-slate-400" },
          { label: "Offer Rate", value: `${offerRate}%`, color: offerRate > 0 ? "text-green-600" : "text-slate-400" },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className={`mt-2 text-3xl font-semibold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      {/* Application funnel */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Application Funnel</h3>
        <div className="mt-4 space-y-2">
          {[
            { label: "Total", count: funnel.total, width: 100, color: "bg-slate-400" },
            { label: "Applied", count: funnel.applied, width: funnel.total > 0 ? Math.round((funnel.applied / funnel.total) * 100) : 0, color: "bg-blue-400" },
            { label: "Screening", count: funnel.screening, width: funnel.total > 0 ? Math.round((funnel.screening / funnel.total) * 100) : 0, color: "bg-purple-400" },
            { label: "Interview", count: funnel.interview, width: funnel.total > 0 ? Math.round((funnel.interview / funnel.total) * 100) : 0, color: "bg-amber-400" },
            { label: "Offer", count: funnel.offer, width: funnel.total > 0 ? Math.round((funnel.offer / funnel.total) * 100) : 0, color: "bg-green-400" },
            { label: "Rejected", count: funnel.rejected, width: funnel.total > 0 ? Math.round((funnel.rejected / funnel.total) * 100) : 0, color: "bg-red-300" },
          ].map(({ label, count, width, color }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <span className="w-24 text-slate-600">{label}</span>
              <div className="flex-1 rounded-full bg-slate-100">
                <div
                  className={`h-5 rounded-full ${color}`}
                  style={{ width: `${Math.max(width, count > 0 ? 2 : 0)}%` }}
                />
              </div>
              <span className="w-8 text-right font-medium">{count}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Interview breakdown */}
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold">Interviews by Type</h3>
          {Object.keys(interviewTypeCount).length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No interviews yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {Object.entries(interviewTypeCount)
                .sort(([, a], [, b]) => b - a)
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{type.replace(/_/g, " ")}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          )}

          {Object.keys(interviewOutcomeCount).length > 0 && (
            <>
              <h4 className="mt-6 text-md font-semibold">Interview Outcomes</h4>
              <div className="mt-3 space-y-2">
                {Object.entries(interviewOutcomeCount)
                  .sort(([, a], [, b]) => b - a)
                  .map(([outcome, count]) => {
                    const colors: Record<string, string> = {
                      positive: "bg-green-400",
                      negative: "bg-red-300",
                      neutral: "bg-slate-300",
                      pending: "bg-amber-300",
                    };
                    return (
                      <div key={outcome} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 capitalize">{outcome}</span>
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${colors[outcome] ?? "bg-slate-300"}`} />
                          <span className="font-medium">{count}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </>
          )}
        </section>

        {/* Job source breakdown */}
        <section className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-lg font-semibold">Jobs by Source</h3>
          {Object.keys(sourceCount).length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">No sources tracked yet.</p>
          ) : (
            <div className="mt-4 space-y-2">
              {Object.entries(sourceCount)
                .sort(([, a], [, b]) => b - a)
                .map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{source}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          )}

          <h4 className="mt-6 text-md font-semibold">Jobs by Status</h4>
          <div className="mt-3 space-y-2">
            {Object.entries(jobStatusCount)
              .sort(([, a], [, b]) => b - a)
              .map(([status, count]) => (
                <div key={status} className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">{status}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
