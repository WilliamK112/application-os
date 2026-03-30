"use client";

import { useActionState } from "react";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/constants/status";
import { createApplicationAction } from "@/app/applications/actions";
import type { Job } from "@/types/domain";

const initialState = { error: "" };

export function ApplicationCreateForm({ jobs }: { jobs: Job[] }) {
  const [state, formAction, isPending] = useActionState(createApplicationAction, initialState);

  return (
    <form action={formAction} className="mt-4 grid gap-3 sm:grid-cols-2">
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block text-slate-600">Job</span>
        <select name="jobId" required className="w-full rounded-md border border-slate-300 px-3 py-2">
          <option value="">Select a job</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.company} · {job.title}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Status</span>
        <select
          name="status"
          defaultValue="DRAFT"
          className="w-full rounded-md border border-slate-300 px-3 py-2"
        >
          {APPLICATION_STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm">
        <span className="mb-1 block text-slate-600">Applied Date</span>
        <input name="appliedAt" type="date" className="w-full rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="text-sm sm:col-span-2">
        <span className="mb-1 block text-slate-600">Notes</span>
        <textarea
          name="notes"
          rows={2}
          className="w-full rounded-md border border-slate-300 px-3 py-2"
          placeholder="Optional notes"
        />
      </label>

      {state.error ? (
        <p className="sm:col-span-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Creating..." : "Create Application"}
        </button>
      </div>
    </form>
  );
}
