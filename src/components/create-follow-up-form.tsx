"use client";

import { useActionState } from "react";
import { useEffect, useLayoutEffect, useRef } from "react";
import { createFollowUpAction } from "@/app/followups/actions";
import type { CreateFollowUpActionState } from "@/app/followups/actions";

interface CreateFollowUpFormProps {
  applicationId: string;
  onSuccess?: () => void;
}

export function CreateFollowUpForm({ applicationId, onSuccess }: CreateFollowUpFormProps) {
  const [state, formAction, isPending] = useActionState<CreateFollowUpActionState, FormData>(
    createFollowUpAction,
    { error: "", success: false },
  );
  const onSuccessRef = useRef(onSuccess);

  useLayoutEffect(() => {
    onSuccessRef.current = onSuccess;
  }, [onSuccess]);

  useEffect(() => {
    if (state.success) {
      onSuccessRef.current?.();
    }
  }, [state.success]);

  if (state.success) {
    return (
      <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
        ✅ Follow-up created
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="applicationId" value={applicationId} />

      <div>
        <label htmlFor="dueAt" className="mb-1 block text-sm font-medium text-slate-700">
          Due Date
        </label>
        <input
          id="dueAt"
          name="dueAt"
          type="datetime-local"
          required
          disabled={isPending}
          className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
        />
      </div>

      <div>
        <label htmlFor="channel" className="mb-1 block text-sm font-medium text-slate-700">
          Channel
        </label>
        <select
          id="channel"
          name="channel"
          required
          disabled={isPending}
          className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
        >
          <option value="">Select channel</option>
          <option value="EMAIL">Email</option>
          <option value="PHONE">Phone</option>
          <option value="LINKEDIN">LinkedIn</option>
          <option value="OTHER">Other</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="mb-1 block text-sm font-medium text-slate-700">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          disabled={isPending}
          className="w-full rounded-md border border-slate-300 px-3 py-2 disabled:bg-slate-100"
          placeholder="What do you want to follow up about?"
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 p-2 text-sm text-red-600">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-slate-700 py-2 text-sm font-medium text-white hover:bg-slate-600 disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Create Follow-up"}
      </button>
    </form>
  );
}
