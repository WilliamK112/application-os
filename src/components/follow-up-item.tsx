"use client";

import { useActionState } from "react";
import { updateFollowUpStatusAction } from "@/app/followups/actions";
import type { FollowUp } from "@/types/domain";

interface FollowUpItemProps {
  followUp: FollowUp;
  applicationLabel: string;
}

export function FollowUpItem({ followUp, applicationLabel }: FollowUpItemProps) {
  const [, formAction, isPending] = useActionState<
    { error: string },
    FormData
  >(updateFollowUpStatusAction as never, { error: "" });

  const isOverdue =
    followUp.status === "PENDING" && new Date(followUp.dueAt) < new Date();

  return (
    <div
      className={`rounded-lg border p-4 ${
        isOverdue
          ? "border-red-200 bg-red-50"
          : followUp.status === "DONE"
          ? "border-green-200 bg-green-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <p className="text-sm font-medium">
            {followUp.content ?? "No description"}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            📋 {applicationLabel}
          </p>
          {followUp.channel && (
            <p className="mt-1 text-xs text-slate-500">
              📞 {followUp.channel}
            </p>
          )}
          <p
            className={`mt-2 text-xs ${
              isOverdue ? "text-red-600 font-medium" : "text-slate-500"
            }`}
          >
            Due: {new Date(followUp.dueAt).toLocaleString()}
            {isOverdue && " (Overdue)"}
          </p>
        </div>

        {followUp.status === "PENDING" && (
          <div className="flex gap-2">
            <form action={formAction}>
              <input type="hidden" name="followUpId" value={followUp.id} />
              <input type="hidden" name="status" value="DONE" />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                ✓ Done
              </button>
            </form>
            <form action={formAction}>
              <input type="hidden" name="followUpId" value={followUp.id} />
              <input type="hidden" name="status" value="SKIPPED" />
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-slate-400 px-3 py-1 text-xs font-medium text-white hover:bg-slate-500 disabled:opacity-50"
              >
                Skip
              </button>
            </form>
          </div>
        )}

        {followUp.status === "DONE" && (
          <span className="rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
            ✅ Done
          </span>
        )}

        {followUp.status === "SKIPPED" && (
          <span className="rounded-md bg-slate-200 px-2 py-1 text-xs font-medium text-slate-500">
            Skipped
          </span>
        )}
      </div>
    </div>
  );
}