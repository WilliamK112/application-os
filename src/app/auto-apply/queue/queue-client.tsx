"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import {
  addJobsToQueueAction,
  removeFromQueueAction,
} from "./actions";
import type { AutoApplyQueueItem, AutoApplyQueueStatus, Job } from "@/types/domain";

const STATUS_META: Record<AutoApplyQueueStatus, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-slate-100 text-slate-700" },
  IN_PROGRESS: { label: "In Progress", color: "bg-blue-100 text-blue-700" },
  NEEDS_VERIFICATION: { label: "Needs Verification", color: "bg-yellow-100 text-yellow-800" },
  COMPLETED: { label: "Completed", color: "bg-green-100 text-green-700" },
  FAILED: { label: "Failed", color: "bg-red-100 text-red-700" },
};

function QueueItemRow({
  item,
  onRemove,
}: {
  item: AutoApplyQueueItem;
  onRemove: (id: string) => void;
}) {
  const meta = STATUS_META[item.status];
  return (
    <tr className="border-b border-slate-100">
      <td className="py-2.5 pr-3">
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
        >
          {meta.label}
        </span>
        {item.status === "NEEDS_VERIFICATION" && (
          <span className="ml-1 text-yellow-500" title="Waiting for you to solve CAPTCHA">
            ⚠️
          </span>
        )}
      </td>
      <td className="py-2.5 pr-3">
        <div className="font-medium text-slate-900">{item.job.title}</div>
        <div className="text-xs text-slate-500">{item.job.company}</div>
      </td>
      <td className="py-2.5 pr-3">
        {item.provider ? (
          <span className="text-xs text-slate-500 capitalize">{item.provider}</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )}
      </td>
      <td className="py-2.5 pr-3 text-xs text-slate-400">
        {new Date(item.createdAt).toLocaleDateString()}
      </td>
      <td className="py-2.5 text-right">
        {item.status === "NEEDS_VERIFICATION" && item.verificationToken && (
          <a
            href={`/auto-apply/verify/${item.verificationToken}`}
            className="mr-2 inline-block rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-white hover:bg-yellow-600"
          >
            Verify Now
          </a>
        )}
        {(item.status === "PENDING" || item.status === "FAILED") && (
          <button
            onClick={() => onRemove(item.id)}
            className="rounded text-slate-400 hover:text-red-500"
            title="Remove from queue"
          >
            ✕
          </button>
        )}
      </td>
    </tr>
  );
}

function AddJobsForm({ jobs }: { jobs: Job[] }) {
  const [state, action, isPending] = useActionState(addJobsToQueueAction, { error: "" });
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  if (jobs.length === 0) return null;

  return (
    <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-base font-semibold">Add Jobs to Queue</h3>
      <p className="mt-1 text-sm text-slate-500">
        Select jobs from your saved list. The worker will auto-apply for all selected.
      </p>

      {state.error && (
        <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-600">{state.error}</p>
      )}

      <div className="mt-3 max-h-64 overflow-y-auto rounded border border-slate-200">
        {jobs.map((job) => (
          <label
            key={job.id}
            className="flex cursor-pointer items-center gap-2 border-b border-slate-100 px-3 py-2 last:border-0 hover:bg-slate-50"
          >
            <input
              type="checkbox"
              name="jobIds"
              value={job.id}
              checked={selected.includes(job.id)}
              onChange={() => toggle(job.id)}
              className="rounded"
            />
            <div>
              <div className="text-sm font-medium">{job.title}</div>
              <div className="text-xs text-slate-400">{job.company}</div>
            </div>
          </label>
        ))}
      </div>

      {selected.length > 0 && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-slate-600">{selected.length} selected</span>
          <input type="hidden" name="provider" value="linkedin" />
          <button
            type="button"
            onClick={() => {
              const fd = new FormData();
              selected.forEach((id) => fd.append("jobIds", id));
              fd.append("provider", "linkedin");
              action(fd);
              setSelected([]);
            }}
            disabled={isPending}
            className="rounded bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {isPending ? "Adding..." : `Add ${selected.length} to Queue`}
          </button>
        </div>
      )}
    </div>
  );
}

function RemoveButton({ itemId }: { itemId: string }) {
  const [state, action, isPending] = useActionState(removeFromQueueAction, { error: "" });

  if (state.error) {
    return <span className="text-xs text-red-500">{state.error}</span>;
  }

  return (
    <form action={action} className="inline">
      <input type="hidden" name="queueItemIds" value={itemId} />
      <button
        type="submit"
        disabled={isPending}
        className="rounded text-slate-400 text-xs hover:text-red-500 disabled:opacity-50"
        title="Remove from queue"
      >
        ✕
      </button>
    </form>
  );
}

export function QueueClient({
  initialQueue,
  availableJobs,
}: {
  initialQueue: AutoApplyQueueItem[];
  availableJobs: Job[];
  currentUserId: string;
}) {
  const pendingCount = initialQueue.filter((i) => i.status === "PENDING").length;
  const needsVerification = initialQueue.filter((i) => i.status === "NEEDS_VERIFICATION");
  const completedCount = initialQueue.filter((i) => i.status === "COMPLETED").length;
  const failedCount = initialQueue.filter((i) => i.status === "FAILED").length;

  return (
    <div>
      {/* Summary Stats */}
      <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-slate-900">{initialQueue.length}</div>
          <div className="text-xs text-slate-500">Total in Queue</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-yellow-600">{needsVerification.length}</div>
          <div className="text-xs text-slate-500">Need Verification</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{completedCount}</div>
          <div className="text-xs text-slate-500">Completed</div>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{failedCount}</div>
          <div className="text-xs text-slate-500">Failed</div>
        </div>
      </div>

      {/* Needs Verification Alert */}
      {needsVerification.length > 0 && (
        <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <h3 className="flex items-center gap-2 font-semibold text-yellow-800">
            ⚠️ Action Required — {needsVerification.length} job(s) need CAPTCHA verification
          </h3>
          <p className="mt-1 text-sm text-yellow-700">
            The auto-apply worker paused on these jobs and needs you to solve a CAPTCHA.{" "}
            <a
              href={`/auto-apply/verify/${needsVerification[0].verificationToken}`}
              className="underline"
            >
              Click here to verify now →
            </a>
          </p>
        </div>
      )}

      {/* Queue Table */}
      {initialQueue.length > 0 ? (
        <div className="mb-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Status
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Job
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Provider
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                  Added
                </th>
                <th className="px-3 py-2 text-right text-xs font-medium uppercase tracking-wide text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {initialQueue.map((item) => (
                <QueueItemRow
                  key={item.id}
                  item={item}
                  onRemove={() => {
                    // Trigger revalidation by removing via action
                    const formData = new FormData();
                    formData.append("queueItemIds", item.id);
                    removeFromQueueAction(null, formData);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">Your queue is empty.</p>
          <p className="mt-1 text-sm text-slate-400">
            Add jobs from your saved list below to start auto-applying.
          </p>
        </div>
      )}

      {/* Add Jobs Form */}
      <AddJobsForm jobs={availableJobs} />

      {/* Worker Status */}
      <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="text-base font-semibold">How It Works</h3>
        <div className="mt-2 space-y-2 text-sm text-slate-600">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
              1
            </span>
            <span>Add jobs to your queue using the form above</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
              2
            </span>
            <span>The worker opens each job page and fills in your info automatically</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
              3
            </span>
            <span>
              If a CAPTCHA appears, you&apos;ll be notified here — click &quot;Verify Now&quot; and solve
              it in seconds
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-medium">
              4
            </span>
            <span>Job status updates automatically as applications complete</span>
          </div>
        </div>
      </div>
    </div>
  );
}
