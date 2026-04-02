import { notFound } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { INTERVIEW_TYPE_LABELS } from "@/lib/constants/interviews";

const OUTCOME_LABELS: Record<string, string> = {
  positive: "✅ Positive",
  neutral: "⚖️ Neutral",
  negative: "❌ Negative",
  pending: "⏳ Pending",
};

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUserOrThrow();
  const data = await applicationOsService.getApplication(user.id, id);

  if (!data) {
    notFound();
  }

  const { application, job, interviews } = data;

  return (
    <AppShell title={`${job.company} · ${job.title}`} backHref="/applications">
      {/* Application Summary */}
      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">{job.company}</h2>
            <p className="text-slate-600">{job.title}</p>
            {job.location && (
              <p className="mt-1 text-sm text-slate-500">📍 {job.location}</p>
            )}
          </div>
          <span className="rounded-full px-3 py-1 text-sm font-medium bg-slate-100 text-slate-700">
            {application.status}
          </span>
        </div>

        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-slate-500">Applied</p>
            <p className="font-medium">
              {application.appliedAt
                ? new Date(application.appliedAt).toLocaleDateString()
                : "Not yet applied"}
            </p>
          </div>
          <div>
            <p className="text-slate-500">Last activity</p>
            <p className="font-medium">
              {application.lastActivityAt
                ? new Date(application.lastActivityAt).toLocaleString()
                : "—"}
            </p>
          </div>
          {job.source && (
            <div>
              <p className="text-slate-500">Source</p>
              <p className="font-medium">{job.source}</p>
            </div>
          )}
          {(job.salaryMin || job.salaryMax) && (
            <div>
              <p className="text-slate-500">Salary range</p>
              <p className="font-medium">
                {job.salaryMin ? `$${job.salaryMin.toLocaleString()}` : "—"}
                {" – "}
                {job.salaryMax ? `$${job.salaryMax.toLocaleString()}` : "—"}
              </p>
            </div>
          )}
        </div>

        {application.notes && (
          <div className="mt-4">
            <p className="text-sm text-slate-500">Notes</p>
            <p className="mt-1 whitespace-pre-wrap text-sm">{application.notes}</p>
          </div>
        )}
      </section>

      {/* Interviews */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            Interviews ({interviews.length})
          </h3>
          <Link
            href={`/interviews?applicationId=${application.id}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Add interview
          </Link>
        </div>

        {interviews.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center text-slate-500 text-sm">
            No interviews recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <div
                key={interview.id}
                className="rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      {INTERVIEW_TYPE_LABELS[interview.interviewType] ?? interview.interviewType}
                      {interview.rating && (
                        <span className="ml-2 text-amber-600">
                          {"★".repeat(interview.rating)}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {interview.scheduledAt
                        ? new Date(interview.scheduledAt).toLocaleString()
                        : "Date TBD"}
                      {interview.durationMinutes && ` · ${interview.durationMinutes} min`}
                    </p>
                    {interview.interviewerName && (
                      <p className="mt-1 text-sm text-slate-500">👤 {interview.interviewerName}</p>
                    )}
                    {interview.location && (
                      <p className="mt-1 text-sm text-slate-500">📍 {interview.location}</p>
                    )}
                  </div>
                  {interview.outcome && (
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100">
                      {OUTCOME_LABELS[interview.outcome] ?? interview.outcome}
                    </span>
                  )}
                </div>

                {interview.notes && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-500">Notes</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">{interview.notes}</p>
                  </div>
                )}

                {interview.questions && interview.questions.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-slate-500">Questions asked</p>
                    <ul className="mt-1 space-y-1">
                      {interview.questions.map((q, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-slate-400">{i + 1}.</span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Follow-ups for this application */}
      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Follow-ups</h3>
          <Link
            href={`/followups?applicationId=${application.id}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm hover:bg-slate-50"
          >
            + Add follow-up
          </Link>
        </div>
        <p className="text-sm text-slate-500">
          Visit the{" "}
          <Link href="/followups" className="underline hover:text-slate-700">
            Follow-ups
          </Link>{" "}
          page to manage follow-up actions for this application.
        </p>
      </section>
    </AppShell>
  );
}
