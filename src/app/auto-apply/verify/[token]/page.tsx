import { Suspense } from "react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { VerifyClient } from "./verify-client";
import { getCurrentUserOrThrow } from "@/lib/auth/session";
import { applicationOsService } from "@/lib/services/application-os-service";

export default async function VerifyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const user = await getCurrentUserOrThrow();

  const queueItem = await applicationOsService.getQueueItemByVerificationToken(token);

  if (!queueItem) {
    notFound();
  }

  // Security: ensure the queue item belongs to the current user
  if (queueItem.userId !== user.id) {
    notFound();
  }

  // Only allow verification for items in NEEDS_VERIFICATION state
  if (queueItem.status !== "NEEDS_VERIFICATION") {
    return (
      <AppShell title="Verification">
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
          <div className="text-4xl mb-4">
            {queueItem.status === "COMPLETED" ? "✅" : "⏭️"}
          </div>
          <h2 className="text-xl font-semibold mb-2">
            {queueItem.status === "COMPLETED"
              ? "Already Verified"
              : "No Action Needed"}
          </h2>
          <p className="text-slate-500 mb-4">
            {queueItem.status === "COMPLETED"
              ? "This application has already been completed."
              : `This job is currently in "${queueItem.status}" status — no verification needed.`}
          </p>
          <a
            href="/auto-apply/queue"
            className="inline-block rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            ← Back to Queue
          </a>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Verify Application">
      <Suspense fallback={<div className="text-sm text-slate-500 p-4">Loading...</div>}>
        <VerifyClient queueItem={queueItem} />
      </Suspense>
    </AppShell>
  );
}
