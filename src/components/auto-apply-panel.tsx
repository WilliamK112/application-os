"use client";

import { useActionState } from "react";
import { runAutoApplyAction } from "@/app/jobs/actions";
import { getRetryableJobIds, isRetryableAutoApplyStatus } from "@/lib/jobs/auto-apply-retry";
import type { AutoApplyResultState } from "@/types/auto-apply";
import type { AutoApplyRunLog } from "@/types/domain";
import type { ProviderSubmitChecklist } from "@/lib/jobs/provider-submit-plan";
import { AUTO_APPLY_HISTORY_FILTER_OPTIONS } from "@/components/auto-apply-panel-config";

type AutoApplyPanelProps = {
  jobs: Array<{
    id: string;
    company: string;
    title: string;
  }>;
  initialHistory: AutoApplyRunLog[];
  submitChecklists: ProviderSubmitChecklist[];
};

export function AutoApplyPanel({ jobs, initialHistory, submitChecklists }: AutoApplyPanelProps) {
  const [state, action, isPending] = useActionState(runAutoApplyAction, {
    error: "",
    results: [],
    history: initialHistory,
    historyFilter: "ALL",
  } satisfies AutoApplyResultState);

  const retryableJobIds = getRetryableJobIds(state.history);

  return (
    <section className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-lg font-semibold">Auto Apply (Core)</h3>
      <p className="mt-1 text-sm text-slate-600">
        Select jobs and create application records automatically with status tracking.
      </p>

      {submitChecklists.length > 0 ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            External submit readiness checklist
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {submitChecklists.map((checklist) => {
              const requiredReady = checklist.required.filter((item) => item.ready).length;

              return (
                <div key={checklist.provider} className="rounded border border-slate-200 bg-white p-2">
                  <p className="text-sm font-medium capitalize">{checklist.provider}</p>
                  <p className="text-xs text-slate-500">
                    Required ready: {requiredReady}/{checklist.required.length}
                  </p>

                  <ul className="mt-2 space-y-1 text-xs text-slate-700">
                    {checklist.required.map((item) => (
                      <li key={`${checklist.provider}-${item.envVar}`}>
                        {item.ready ? "✅" : "❌"} {item.providerField} ({item.envVar})
                      </li>
                    ))}
                    {checklist.optional.map((item) => (
                      <li key={`${checklist.provider}-${item.envVar}`} className="text-slate-500">
                        {item.ready ? "✅" : "○"} optional: {item.providerField} ({item.envVar})
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <form action={action} className="mt-4 space-y-3">
        <div className="max-h-56 space-y-2 overflow-y-auto rounded-md border border-slate-200 p-3">
          {jobs.length === 0 ? (
            <p className="text-sm text-slate-500">No jobs available. Add or import jobs first.</p>
          ) : (
            jobs.map((job) => (
              <label key={job.id} className="flex items-start gap-2 text-sm">
                <input type="checkbox" name="jobIds" value={job.id} className="mt-1" />
                <span>
                  <span className="font-medium">{job.company}</span>
                  <span className="text-slate-600"> — {job.title}</span>
                </span>
              </label>
            ))
          )}
        </div>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">History filter</span>
          <select
            name="historyFilter"
            defaultValue={state.historyFilter}
            className="rounded-md border border-slate-300 px-2 py-1"
          >
            {AUTO_APPLY_HISTORY_FILTER_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          disabled={isPending || jobs.length === 0}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Running auto apply..." : "Run Auto Apply"}
        </button>
      </form>

      {state.error ? (
        <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </div>
      ) : null}

      {state.history.length > 0 ? (
        <div className="mt-4 rounded-md border border-slate-200">
          <div className="border-b bg-slate-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-600">
            Persisted auto-apply run history ({state.historyFilter})
          </div>

          {retryableJobIds.length > 0 ? (
            <div className="border-b bg-slate-50/70 px-3 py-2">
              <form action={action}>
                {retryableJobIds.map((jobId) => (
                  <input key={jobId} type="hidden" name="jobIds" value={jobId} />
                ))}
                <input type="hidden" name="historyFilter" value={state.historyFilter} />
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Retry all failed / needs_manual in view ({retryableJobIds.length})
                </button>
              </form>
            </div>
          ) : null}

          <ul className="divide-y">
            {state.history.map((item) => {
              const isRetryable = isRetryableAutoApplyStatus(item.status);

              return (
                <li key={item.id} className="px-3 py-2 text-sm">
                  <span className="font-medium">
                    {item.job.company} — {item.job.title}
                  </span>
                  <span className="ml-2 rounded border px-2 py-0.5 text-xs">{item.status}</span>
                  <p className="mt-1 text-slate-600">{item.message}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {new Date(item.createdAt).toLocaleString()}
                    {item.applicationId ? ` • app: ${item.applicationId}` : ""}
                    {item.failureCategory ? ` • failure: ${item.failureCategory}` : ""}
                  </p>

                  {isRetryable ? (
                    <form action={action} className="mt-2">
                      <input type="hidden" name="jobIds" value={item.jobId} />
                      <input type="hidden" name="historyFilter" value={state.historyFilter} />
                      <button
                        type="submit"
                        disabled={isPending}
                        className="rounded border border-slate-300 px-2 py-1 text-xs font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Retry this job
                      </button>
                    </form>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
