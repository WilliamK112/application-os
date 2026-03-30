"use client";

import { useState, useEffect } from "react";
import { useActionState } from "react";
import {
  createInterviewAction,
  updateInterviewAction,
  deleteInterviewAction,
  INTERVIEW_TYPE_LABELS,
} from "@/app/interviews/actions";
import type { Interview, InterviewQuestion, QuestionCategory } from "@/types/domain";

const OUTCOME_OPTIONS = ["positive", "neutral", "negative", "pending"];

const QUESTION_CATEGORY_LABELS: Record<QuestionCategory, string> = {
  BEHAVIORAL: "Behavioral",
  TECHNICAL: "Technical",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding",
  LEADERSHIP: "Leadership",
  CULTURE_FIT: "Culture Fit",
  COMPENSATION: "Compensation",
  OTHER: "Other",
};

function QuestionBankPicker({
  questions,
  selectedIds,
  onChange,
  name,
}: {
  questions: InterviewQuestion[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  name: string;
}) {
  const [activeCategory, setActiveCategory] = useState<QuestionCategory | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  const categories = Object.keys(QUESTION_CATEGORY_LABELS) as QuestionCategory[];

  const filtered = questions.filter((q) => {
    const matchesCategory = activeCategory === "ALL" || q.category === activeCategory;
    const matchesSearch = !search || q.question.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  function toggleQuestion(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((i) => i !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium text-purple-700">📚 Pick from Question Bank ({selectedIds.length} selected)</span>
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs text-purple-600 hover:text-purple-800"
        >
          {showPicker ? "Hide bank" : "Show bank"}
        </button>
      </div>

      {/* Selected chips */}
      {selectedIds.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedIds.map((id) => {
            const q = questions.find((q) => q.id === id);
            if (!q) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full bg-purple-200 px-2 py-0.5 text-xs text-purple-800"
              >
                {q.question.slice(0, 30)}{q.question.length > 30 ? "…" : ""}
                <button
                  type="button"
                  onClick={() => toggleQuestion(id)}
                  className="font-bold hover:text-purple-900"
                >
                  ×
                </button>
              </span>
            );
          })}
        </div>
      )}

      {showPicker && (
        <div className="mt-2 space-y-2">
          {/* Category pills */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => setActiveCategory("ALL")}
              className={`rounded-full px-2 py-0.5 text-xs ${
                activeCategory === "ALL"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-100 text-purple-700 hover:bg-purple-200"
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`rounded-full px-2 py-0.5 text-xs ${
                  activeCategory === cat
                    ? "bg-purple-600 text-white"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200"
                }`}
              >
                {QUESTION_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          {/* Search */}
          <input
            type="text"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-purple-300 px-3 py-1.5 text-sm"
          />

          {/* Question list */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filtered.length === 0 && (
              <p className="text-xs text-slate-500 py-2 text-center">No questions found</p>
            )}
            {filtered.map((q) => {
              const checked = selectedIds.includes(q.id);
              return (
                <label
                  key={q.id}
                  className={`flex items-start gap-2 rounded p-1.5 cursor-pointer ${
                    checked ? "bg-purple-100" : "hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleQuestion(q.id)}
                    className="mt-0.5 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-800 leading-snug">{q.question}</p>
                    <p className="text-xs text-slate-400">
                      {QUESTION_CATEGORY_LABELS[q.category]}
                      {q.usageCount > 0 && ` · used ${q.usageCount}x`}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Hidden inputs for form submission */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}

function InterviewEditForm({
  interview,
  applicationMap,
  questionBank,
  onCancel,
}: {
  interview: Interview;
  applicationMap: Record<string, string>;
  questionBank: InterviewQuestion[];
  onCancel: () => void;
}) {
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState(updateInterviewAction, { error: "" });
  const [deleteState, deleteAction, isDeleting] = useActionState(deleteInterviewAction, { error: "" });

  // Reload on success (non-pending, no error)
  useEffect(() => {
    if (!isPending && !state.error) {
      window.location.reload();
    }
  }, [isPending, state.error]);

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
      <h3 className="mb-3 font-semibold">Edit Interview</h3>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="interviewId" value={interview.id} />
        <input type="hidden" name="questionIds" value={selectedQuestionIds.join(",")} />
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-slate-700">Application</label>
            <p className="mt-1 text-sm text-slate-600">{applicationMap[interview.applicationId] ?? "—"}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Interview Type *</label>
            <select
              name="interviewType"
              defaultValue={interview.interviewType}
              required
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
              defaultValue={interview.interviewerName ?? ""}
              placeholder="e.g. Sarah from HR"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Scheduled Date/Time</label>
            <input
              type="datetime-local"
              name="scheduledAt"
              defaultValue={interview.scheduledAt ? interview.scheduledAt.slice(0, 16) : ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Duration (minutes)</label>
            <input
              type="number"
              name="durationMinutes"
              defaultValue={interview.durationMinutes ?? ""}
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
              defaultValue={interview.location ?? ""}
              placeholder="e.g. Zoom / Google Meet / Office"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Rating (1-5)</label>
            <select
              name="rating"
              defaultValue={interview.rating ?? ""}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">Not rated</option>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{"★".repeat(r)}{"☆".repeat(5 - r)} ({r})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Outcome</label>
            <select
              name="outcome"
              defaultValue={interview.outcome ?? ""}
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
            defaultValue={interview.notes ?? ""}
            rows={3}
            placeholder="Key discussion points..."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Questions (comma-separated)</label>
          <input
            type="text"
            name="questions"
            defaultValue={interview.questions.join(", ")}
            placeholder="Tell me about yourself, Why this company?, ..."
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <QuestionBankPicker
          questions={questionBank}
          selectedIds={selectedQuestionIds}
          onChange={setSelectedQuestionIds}
          name="questionIds"
        />

        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            Cancel
          </button>
        </div>
      </form>
      <form action={deleteAction} className="mt-3">
        <input type="hidden" name="interviewId" value={interview.id} />
        {deleteState.error && <p className="text-sm text-red-600 mb-1">{deleteState.error}</p>}
        <button
          type="submit"
          disabled={isDeleting}
          className="rounded-md bg-red-100 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-200 disabled:opacity-50"
        >
          {isDeleting ? "Deleting..." : "🗑 Delete Interview"}
        </button>
      </form>
    </div>
  );
}

function InterviewCard({
  interview,
  applicationMap,
  questionBank,
  editingId,
  onEdit,
}: {
  interview: Interview;
  applicationMap: Record<string, string>;
  questionBank: InterviewQuestion[];
  editingId: string | null;
  onEdit: (id: string) => void;
}) {
  if (editingId === interview.id) {
    return (
      <InterviewEditForm
        interview={interview}
        applicationMap={applicationMap}
        questionBank={questionBank}
        onCancel={() => onEdit("")}
      />
    );
  }

  return (
    <article
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
                {"★".repeat(interview.rating)}
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
        <div className="flex flex-col items-end gap-1">
          {interview.outcome && (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                interview.outcome === "positive"
                  ? "bg-green-200 text-green-800"
                  : interview.outcome === "negative"
                  ? "bg-red-200 text-red-800"
                  : "bg-slate-200 text-slate-600"
              }`}
            >
              {interview.outcome}
            </span>
          )}
          <button
            onClick={() => onEdit(interview.id)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            ✏️ Edit
          </button>
        </div>
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
  );
}

export function InterviewList({
  interviews,
  applicationMap,
  defaultApplicationId,
  questionBank,
}: {
  interviews: Interview[];
  applicationMap: Record<string, string>;
  defaultApplicationId?: string;
  questionBank: InterviewQuestion[];
}) {
  const [showCreate, setShowCreate] = useState(!!defaultApplicationId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [state, formAction, isPending] = useActionState(createInterviewAction, {
    error: "",
  });

  useEffect(() => {
    if (state.interviewId) {
      window.location.reload();
    }
  }, [state.interviewId]);

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
            <input type="hidden" name="questionIds" value={selectedQuestionIds.join(",")} />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Application *</label>
                <select
                  name="applicationId"
                  required
                  defaultValue={defaultApplicationId ?? ""}
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
                  {[5, 4, 3, 2, 1].map((r) => (
                    <option key={r} value={r}>{"★".repeat(r)}{"☆".repeat(5 - r)} ({r})</option>
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

            <QuestionBankPicker
              questions={questionBank}
              selectedIds={selectedQuestionIds}
              onChange={setSelectedQuestionIds}
              name="questionIds"
            />

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

      {sorted.length === 0 && !showCreate ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center">
          <p className="text-sm text-slate-500">No interviews yet. Schedule your first one!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sorted.map((interview) => (
            <InterviewCard
              key={interview.id}
              interview={interview}
              applicationMap={applicationMap}
              questionBank={questionBank}
              editingId={editingId}
              onEdit={setEditingId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
