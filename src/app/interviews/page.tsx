import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";
import { InterviewsClient } from "./interviews-client";

interface InterviewsPageProps {
  searchParams: Promise<{ applicationId?: string }>;
}

export default async function InterviewsPage({ searchParams }: InterviewsPageProps) {
  const { applicationId } = await searchParams;
  const user = await getCurrentUserOrThrow();
  const [interviews, applications] = await Promise.all([
    applicationOsService.listInterviews(user.id),
    applicationOsService.getApplications(user.id),
  ]);

  const applicationMap = Object.fromEntries(
    applications.map(({ application, job }) => [
      application.id,
      `${job.company} — ${job.title}`,
    ]),
  );

  return (
    <AppShell title="Interviews">
      <Suspense fallback={<div className="text-sm text-slate-500 p-4">Loading...</div>}>
        <InterviewsClient
          interviews={interviews}
          applicationMap={applicationMap}
          defaultApplicationId={applicationId}
        />
      </Suspense>
    </AppShell>
  );
}
