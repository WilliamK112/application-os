import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { FollowUpList } from "@/components/follow-up-list";

export default async function FollowUpsPage() {
  const user = await getCurrentUserOrThrow();
  const followUps = await applicationOsService.getFollowUps(user.id);
  const applications = await applicationOsService.getApplications(user.id);

  const applicationMap = Object.fromEntries(
    applications.map(({ application, job }) => [
      application.id,
      `${job.company} — ${job.title}`,
    ]),
  );

  return (
    <AppShell title="Follow-ups">
      <FollowUpList
        followUps={followUps}
        applicationMap={applicationMap}
        userId={user.id}
      />
    </AppShell>
  );
}