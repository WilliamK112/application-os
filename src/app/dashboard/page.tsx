import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";

const INTERVIEW_TYPE_LABELS: Record<string, string> = {
  PHONE_SCREEN: "Phone Screen",
  TECHNICAL: "Technical",
  BEHAVIORAL: "Behavioral",
  SYSTEM_DESIGN: "System Design",
  ONSITE: "Onsite",
  FINAL_ROUND: "Final Round",
  OTHER: "Other",
};

export default async function DashboardPage() {
  const user = await getCurrentUserOrThrow();
  const snapshot = await applicationOsService.getDashboard(user.id);

  const cards = [
    { label: "Jobs", value: snapshot.metrics.totalJobs },
    { label: "Applications", value: snapshot.metrics.totalApplications },
    { label: "Active", value: snapshot.metrics.activeApplications },
    { label: "Interviews", value: snapshot.metrics.totalInterviews },
    { label: "Pending Follow-ups", value: snapshot.metrics.pendingFollowUps },
  ];

  return (
    <AppShell title="Dashboard">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Upcoming Follow-ups</h3>
        {snapshot.upcomingFollowUps.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No upcoming follow-ups.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {snapshot.upcomingFollowUps.map((followUp) => (
              <li key={followUp.id} className="rounded-md bg-slate-50 p-3">
                <p className="text-sm font-medium">{followUp.content ?? "Follow-up action"}</p>
                <p className="text-xs text-slate-500">
                  Due: {new Date(followUp.dueAt).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">
          Upcoming Interviews
          {snapshot.metrics.upcomingInterviewsTotal > 0 && (
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({snapshot.metrics.upcomingInterviewsTotal} in next 7 days)
            </span>
          )}
        </h3>
        {snapshot.upcomingInterviews.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No upcoming interviews scheduled.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {snapshot.upcomingInterviews.map((interview) => (
              <li key={interview.id} className="rounded-md bg-slate-50 p-3">
                <p className="text-sm font-medium">
                  {INTERVIEW_TYPE_LABELS[interview.interviewType] ?? interview.interviewType}
                  {interview.rating && (
                    <span className="ml-2 text-amber-600">
                      {"★".repeat(interview.rating)}
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-500">
                  🗓 {interview.scheduledAt
                    ? new Date(interview.scheduledAt).toLocaleString()
                    : "TBD"}
                  {interview.durationMinutes && ` · ${interview.durationMinutes} min`}
                </p>
                {interview.interviewerName && (
                  <p className="text-xs text-slate-500">👤 {interview.interviewerName}</p>
                )}
                {interview.location && (
                  <p className="text-xs text-slate-500">📍 {interview.location}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}
