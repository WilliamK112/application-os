import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";

export default async function DashboardPage() {
  const user = await getCurrentUserOrThrow();
  const snapshot = await applicationOsService.getDashboard(user.id);

  const cards = [
    { label: "Jobs", value: snapshot.metrics.totalJobs },
    { label: "Applications", value: snapshot.metrics.totalApplications },
    { label: "Active", value: snapshot.metrics.activeApplications },
    { label: "Pending Follow-ups", value: snapshot.metrics.pendingFollowUps },
  ];

  return (
    <AppShell title="Dashboard">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-lg font-semibold">Upcoming Follow-ups</h3>
        <ul className="mt-3 space-y-3">
          {snapshot.upcomingFollowUps.map((followUp) => (
            <li key={followUp.id} className="rounded-md bg-slate-50 p-3">
              <p className="text-sm font-medium">{followUp.content ?? "Follow-up action"}</p>
              <p className="text-xs text-slate-500">Due: {new Date(followUp.dueAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
