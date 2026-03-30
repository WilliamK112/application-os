"use client";

import { useState } from "react";
import { useActionState } from "react";
import { createInterviewAction, INTERVIEW_TYPE_LABELS } from "./actions";
import type { Interview } from "@/types/domain";

const OUTCOME_OPTIONS = ["positive", "neutral", "negative", "pending"];

export function InterviewsClient({
  interviews,
  applicationMap,
}: {
  interviews: Interview[];
  applicationMap: Record<string, string>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [state, formAction, isPending] = useActionState(createInterviewAction, {
    error: "",
  });

  if (state.interviewId && typeof window !== "undefined") {
    window.location.reload();
  }

  const sorted = [...interviews].sort(
    (a, b) =>
      new Date(b.scheduledAt ?? b.createdAt).getTime() -
      new Date(a.scheduledAt ?? a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {interviews.length} interview{interviews.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showCreate ? "✕ Cancel" : "+ New Interview"}
        </button>
      </div>

      {showCreate && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="mb-3 font-semibold">Schedule Interview</h3>
          <form action={formAction} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Application *</label>
                <select
                  name="applicationId"
                  required
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Select application...</option>
                  {Object.entries(applicationMap).map(([id, label]) => (
                    <option key={id} value={id}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Interview Type *</label>
                <select
                  name="interviewType"
                  required
                  defaultValue="PHONE_SCREEN"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  {Object.entries(INTERVIEW_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Interviewer Name</label>
                <input
                  type="text"
                  name="interviewerName"
                  placeholder="e.g. Sarah from HR"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Scheduled Date/Time</label>
                <input
                  type="datetime-local"
                  name="scheduledAt"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Duration (minutes)</label>
                <input
                  type="number"
                  name="durationMinutes"
                  min="1"
                  max="480"
                  placeholder="e.g. 60"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Location / Link</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Zoom / Google Meet / Office"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Rating (1-5)</label>
                <select
                  name="rating"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Not rated</option>
                  {[5,4,3,2,1].map((r) => (
                    <option key={r} value={r}>{"★".repeat(r)}{"☆".repeat(5-r)} ({r})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Outcome</label>
                <select
                  name="outcome"
                  className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Pending</option>
                  {OUTCOME_OPTIONS.map((o) => (
                    <option key={o} value={o}>{o.charAt(0).toUpperCase() + o.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Notes</label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Key discussion points, impressions, next steps..."
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Questions (comma-separated)</label>
              <input
                type="text"
                name="questions"
                placeholder="Tell me about yourself, Why this company?, ..."
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            {state.error && <p className="text-sm text-red-600">{state.error}</p>}
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "Saving..." : "Save Interview"}
            </button>
          </form>
        </div>
      )}

      {sorted.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">No interviews yet. Schedule your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((interview) => (
            <article
              key={interview.id}
              className={`rounded-lg border p-4 ${
                interview.outcome === "positive"
                  ? "border-green-200 bg-green-50"
                  : interview.outcome === "negative"
                  ? "border-red-200 bg-red-50"
                  : "border-slate-200 bg-white"
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">
                    {INTERVIEW_TYPE_LABELS[interview.interviewType] ?? interview.interviewType}
                    {interview.rating && (
                      <span className="ml-2 text-sm text-amber-600">
                        {"★".repeat(interview.rating)}{"☆".repeat(5 - interview.rating)}
                      </span>
                    )}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600">
                    📋 {applicationMap[interview.applicationId] ?? "Unknown"}
                  </p>
                  {interview.interviewerName && (
                    <p className="text-sm text-slate-500">👤 {interview.interviewerName}</p>
                  )}
                  {interview.scheduledAt && (
                    <p className="text-sm text-slate-500">
                      🗓 {new Date(interview.scheduledAt).toLocaleString()}
                      {interview.durationMinutes && ` · ${interview.durationMinutes} min`}
                    </p>
                  )}
                  {interview.location && (
                    <p className="text-sm text-slate-500">📍 {interview.location}</p>
                  )}
                </div>
                {interview.outcome && (
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${
                    interview.outcome === "positive"
                      ? "bg-green-200 text-green-800"
                      : interview.outcome === "negative"
                      ? "bg-red-200 text-red-800"
                      : "bg-slate-200 text-slate-600"
                  }`}>
                    {interview.outcome}
                  </span>
                )}
              </div>
              {interview.notes && (
                <p className="mt-2 text-sm text-slate-700">{interview.notes}</p>
              )}
              {interview.questions.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-slate-500">Questions:</p>
                  <ul className="mt-1 space-y-1">
                    {interview.questions.map((q, i) => (
                      <li key={i} className="flex items-start gap-1 text-sm text-slate-600">
                        <span>Q{i + 1}:</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
