"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateQueueItemStatusAction } from "@/app/auto-apply/queue/actions";
import type { AutoApplyQueueItem } from "@/types/domain";

export function VerifyClient({ queueItem }: { queueItem: AutoApplyQueueItem }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState("");

  const markDone = (asCompleted: boolean) => {
    setError("");
    const formData = new FormData();
    formData.append("queueItemId", queueItem.id);
    formData.append(
      "status",
      asCompleted ? "COMPLETED" : "NEEDS_VERIFICATION",
    );
    if (asCompleted) {
      // Clear the verification token — it's been resolved
      formData.append("verificationToken", "");
    }

    startTransition(async () => {
      const result = await updateQueueItemStatusAction(null, formData);
      if (result.error) {
        setError(result.error);
      } else {
        if (asCompleted) {
          setCompleted(true);
        } else {
          // User said "Skip" — put it back to pending
          router.push("/auto-apply/queue");
        }
      }
    });
  };

  if (completed) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="text-xl font-semibold mb-2 text-green-800">
          Verification Complete!
        </h2>
        <p className="text-green-700 mb-4">
          Your application for <strong>{queueItem.job.title}</strong> at{" "}
          <strong>{queueItem.job.company}</strong> has been marked as verified.
        </p>
        <a
          href="/auto-apply/queue"
          className="inline-block rounded bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          ← Back to Queue
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instruction Card */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-5">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-yellow-900">
          ⚠️ Action Required — Complete this application manually
        </h2>
        <p className="mt-2 text-sm text-yellow-800">
          The auto-apply worker paused on this job because it needs a manual step
          (likely a CAPTCHA or a form field that couldn&apos;t be filled automatically).
        </p>
        <p className="mt-2 text-sm font-medium text-yellow-900">
          Please complete the application yourself — it should only take 1-2 minutes.
        </p>
      </div>

      {/* Job Info */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="mb-3">
          <h3 className="text-lg font-semibold">{queueItem.job.title}</h3>
          <p className="text-sm text-slate-500">{queueItem.job.company}</p>
        </div>
        {queueItem.job.url ? (
          <a
            href={queueItem.job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            🔗 Open Application Page →
          </a>
        ) : (
          <p className="text-sm text-slate-400 italic">
            No URL stored for this job — please find it in your saved jobs.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h4 className="mb-3 text-sm font-medium text-slate-700">
          Once you&apos;ve completed the application, come back here and choose:
        </h4>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => markDone(true)}
            disabled={isPending}
            className="flex-1 rounded bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "✅ Done — Mark as Completed"}
          </button>
          <button
            onClick={() => markDone(false)}
            disabled={isPending}
            className="flex-1 rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Skip — Put Back in Queue
          </button>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          &quot;Done&quot; marks this job as successfully applied. &quot;Skip&quot; returns it to the
          queue for the worker to retry later.
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
        <h4 className="text-sm font-medium text-slate-700">💡 How this works</h4>
        <ul className="mt-2 space-y-1 text-sm text-slate-600">
          <li>• The worker automatically fills 90%+ of application fields</li>
          <li>• When a CAPTCHA or special field appears, it pauses and alerts you here</li>
          <li>• You solve the CAPTCHA in ~10 seconds, then click &quot;Done&quot;</li>
          <li>• The worker automatically continues with the next job</li>
        </ul>
      </div>
    </div>
  );
}
