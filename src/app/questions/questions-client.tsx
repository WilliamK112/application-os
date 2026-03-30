"use client";

import { useState } from "react";
import { useActionState, useEffect } from "react";
import {
  createQuestionAction,
  updateQuestionAction,
  deleteQuestionAction,
  QUESTION_CATEGORY_LABELS,
} from "./actions";
import type { InterviewQuestion } from "@/types/domain";

const CATEGORY_COLORS: Record<string, string> = {
  BEHAVIORAL: "bg-blue-100 text-blue-700",
  TECHNICAL: "bg-purple-100 text-purple-700",
  SYSTEM_DESIGN: "bg-amber-100 text-amber-700",
  CODING: "bg-green-100 text-green-700",
  LEADERSHIP: "bg-red-100 text-red-700",
  CULTURE_FIT: "bg-pink-100 text-pink-700",
  COMPENSATION: "bg-yellow-100 text-yellow-700",
  OTHER: "bg-slate-100 text-slate-700",
};

const CATEGORIES = Object.keys(QUESTION_CATEGORY_LABELS);

function QuestionForm({
  initial,
  onCancel,
  onSuccess,
}: {
  initial?: Partial<InterviewQuestion>;
  onCancel?: () => void;
  onSuccess?: () => void;
}) {
  const [state, formAction, isPending] = useActionState(
    initial ? updateQuestionAction : createQuestionAction,
    { error: "", questionId: undefined, success: false },
  );

  useEffect(() => {
    if ((state as { questionId?: string; success?: boolean }).questionId || (state as { success?: boolean }).success) {
      onSuccess?.();
    }
  }, [state, onSuccess]);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border border-blue-200 bg-blue-50 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-slate-700">Category *</label>
          <select
            name="category"
            defaultValue={initial?.category ?? "BEHAVIORAL"}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{QUESTION_CATEGORY_LABELS[cat]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700">Tags (comma-separated)</label>
          <input
            type="text"
            name="tags"
            defaultValue={initial?.tags?.join(", ")}
            placeholder="e.g. javascript, arrays, algorithms"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Question *</label>
        <textarea
          name="question"
          defaultValue={initial?.question}
          required
          rows={2}
          placeholder="e.g. Tell me about a time you had a conflict with a teammate..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700">Answer Hints / Notes</label>
        <textarea
          name="answerHints"
          defaultValue={initial?.answerHints}
          rows={3}
          placeholder="STAR method, key points to cover, common follow-ups..."
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>
      {(state as { error: string }).error && (
        <p className="text-sm text-red-600">{(state as { error: string }).error}</p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "Saving..." : initial ? "Save Changes" : "Add Question"}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md bg-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
          >
            Cancel
          </button>
        )}
      </div>
      {initial && (
        <input type="hidden" name="questionId" value={initial.id} />
      )}
    </form>
  );
}

function QuestionCard({
  question,
  onEdit,
}: {
  question: InterviewQuestion;
  onEdit: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    await deleteQuestionAction(question.id);
    window.location.reload();
  };

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[question.category] ?? "bg-slate-100 text-slate-700"}`}>
              {QUESTION_CATEGORY_LABELS[question.category] ?? question.category}
            </span>
            {question.usageCount > 0 && (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                📝 Used {question.usageCount}x
              </span>
            )}
          </div>
          <p className="mt-2 font-medium text-slate-900">{question.question}</p>
          {question.answerHints && (
            <p className="mt-1 text-sm text-slate-600">{question.answerHints}</p>
          )}
          {question.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {question.tags.map((tag) => (
                <span key={tag} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-600">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={() => onEdit(question.id)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            ✏️ Edit
          </button>
          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-xs text-red-400 hover:text-red-600"
            >
              🗑 Delete
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                className="rounded bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 hover:bg-red-200"
              >
                Confirm
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500 hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function QuestionsClient({ questions }: { questions: InterviewQuestion[] }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const editingQuestion = editingId ? questions.find((q) => q.id === editingId) : undefined;

  const filtered = questions.filter((q) => {
    const matchesCategory = !categoryFilter || q.category === categoryFilter;
    const matchesSearch =
      !search ||
      q.question.toLowerCase().includes(search.toLowerCase()) ||
      q.answerHints?.toLowerCase().includes(search.toLowerCase()) ||
      q.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const groupedCount: Record<string, number> = {};
  for (const q of questions) {
    groupedCount[q.category] = (groupedCount[q.category] ?? 0) + 1;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">
            {questions.length} question{questions.length !== 1 ? "s" : ""}
            {categoryFilter && ` in ${QUESTION_CATEGORY_LABELS[categoryFilter] ?? categoryFilter}`}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          {showForm ? "✕ Cancel" : "+ New Question"}
        </button>
      </div>

      {/* Create form */}
      {showForm && !editingId && (
        <QuestionForm onCancel={() => setShowForm(false)} onSuccess={() => setShowForm(false)} />
      )}

      {/* Edit form */}
      {editingId && editingQuestion && (
        <QuestionForm
          initial={editingQuestion}
          onCancel={() => setEditingId(null)}
          onSuccess={() => setEditingId(null)}
        />
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Search questions, hints, tags..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {QUESTION_CATEGORY_LABELS[cat]} ({groupedCount[cat] ?? 0})
            </option>
          ))}
        </select>
      </div>

      {/* Category summary */}
      {!search && !categoryFilter && (
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) =>
            (groupedCount[cat] ?? 0) > 0 ? (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`rounded-full px-3 py-1 text-xs font-medium ${CATEGORY_COLORS[cat] ?? "bg-slate-100 text-slate-700"} ${categoryFilter === cat ? "ring-2 ring-offset-1 ring-slate-400" : ""}`}
              >
                {QUESTION_CATEGORY_LABELS[cat]}: {groupedCount[cat]}
              </button>
            ) : null,
          )}
        </div>
      )}

      {/* Question list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
          {search || categoryFilter ? "No questions match your filters." : "No questions yet. Add your first one!"}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((q) => (
            <QuestionCard key={q.id} question={q} onEdit={setEditingId} />
          ))}
        </div>
      )}
    </div>
  );
}
