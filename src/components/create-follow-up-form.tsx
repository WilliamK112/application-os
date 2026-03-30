"use client";

import { useActionState } from "react";
import { createFollowUpAction } from "./actions";

export type CreateFollowUpFormState = {
  error: string;
  success: boolean;
};

interface CreateFollowUpFormProps {
  applicationId: string;
}

export function CreateFollowUpForm({ applicationId }: CreateFollowUpFormProps) {
  const [state, formAction, isPending] = useActionState<CreateFollowUpFormState, FormData>(
    createFollowUpAction,
    { error: "", success: false },
  );

  if (state.success) {
    return (
      <div className="rounded-md bg-green-50 p-3 text-sm text-green-700">
        ✅ Follow-up created
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="applicationId" value={applicationId} />
      <div className="space-y-3">
        <div>
          <label htmlFor="dueAt" className="block text-sm font-medium text-slate-700">
            Due Date
          </label>
          <input
            type="datetime-local"
            id="dueAt"
            name="dueAt"
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="channel" className="block text-sm font-medium text-slate-700">
            Channel (optional)
          </label>
          <select
            id="channel"
            name="channel"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">Select...</option>
            <option value="Email">Email</option>
            <option value="Phone">Phone</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="In-person">In-person</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-slate-700">
            Action / Content (optional)
          </label>
          <textarea
            id="content"
            name="content"
            rows={2}
            placeholder="e.g. Send thank-you email after interview"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {state.error && (
          <p className="text-sm text-red-600">{state.error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Creating..." : "Add Follow-up"}
        </button>
      </div>
    </form>
  );
}