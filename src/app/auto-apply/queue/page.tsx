import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { QueueClient } from "./queue-client";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";

export default async function AutoApplyQueuePage() {
  const user = await getCurrentUserOrThrow();
  const [queue, jobs] = await Promise.all([
    applicationOsService.getAutoApplyQueue(user.id),
    applicationOsService.getJobs(user.id),
  ]);

  // Jobs not yet in queue — for "Add more" flow
  const queueJobIds = new Set(queue.map((q) => q.jobId));
  const availableJobs = jobs.filter((j) => !queueJobIds.has(j.id));

  return (
    <AppShell title="Auto-Apply Queue">
      <Suspense fallback={<div className="text-sm text-slate-500 p-4">Loading queue...</div>}>
        <QueueClient
          initialQueue={queue}
          availableJobs={availableJobs}
          currentUserId={user.id}
        />
      </Suspense>
    </AppShell>
  );
}
