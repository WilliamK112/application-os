"use server";

import { z } from "zod";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";

type QuestionActionState = { error: string; questionId?: string; success?: boolean };
type CreateQuestionState = QuestionActionState;
type UpdateQuestionState = QuestionActionState;

const QUESTION_CATEGORY_OPTIONS = [
  "BEHAVIORAL",
  "TECHNICAL",
  "SYSTEM_DESIGN",
  "CODING",
  "LEADERSHIP",
  "CULTURE_FIT",
  "COMPENSATION",
  "OTHER",
] as const;

const QUESTION_CATEGORY_LABELS: Record<string, string> = {
  BEHAVIORAL: "Behavioral",
  TECHNICAL: "Technical",
  SYSTEM_DESIGN: "System Design",
  CODING: "Coding",
  LEADERSHIP: "Leadership",
  CULTURE_FIT: "Culture Fit",
  COMPENSATION: "Compensation",
  OTHER: "Other",
};

const createQuestionSchema = z.object({
  category: z.enum(QUESTION_CATEGORY_OPTIONS),
  question: z.string().trim().min(1, "Question is required").max(500),
  answerHints: z.string().trim().max(2000).optional(),
  tags: z.string().trim().max(200).optional(), // comma-separated
});

const updateQuestionSchema = createQuestionSchema.partial();

export async function createQuestionAction(_prevState: CreateQuestionState, formData: FormData): Promise<CreateQuestionState> {
  const { user } = await authSession();

  const parsed = createQuestionSchema.safeParse({
    category: String(formData.get("category") ?? ""),
    question: String(formData.get("question") ?? ""),
    answerHints: formData.get("answerHints") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", questionId: undefined };
  }

  const tags = parsed.data.tags
    ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  try {
    const q = await applicationOsService.createQuestion(user.id, {
      category: parsed.data.category,
      question: parsed.data.question,
      answerHints: parsed.data.answerHints,
      tags,
    });
    return { error: "", questionId: q.id };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unable to save question", questionId: undefined };
  }
}

export async function updateQuestionAction(_prevState: UpdateQuestionState, formData: FormData): Promise<UpdateQuestionState> {
  const { user } = await authSession();
  const questionId = String(formData.get("questionId") ?? "");

  if (!questionId) {
    return { error: "Question ID required", success: false };
  }

  const parsed = updateQuestionSchema.safeParse({
    category: String(formData.get("category") ?? ""),
    question: String(formData.get("question") ?? ""),
    answerHints: formData.get("answerHints") || undefined,
    tags: formData.get("tags") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", success: false };
  }

  const tags = parsed.data.tags
    ? parsed.data.tags.split(",").map((t) => t.trim()).filter(Boolean)
    : parsed.data.tags === "" ? [] : undefined;

  try {
    await applicationOsService.updateQuestion(user.id, questionId, {
      category: parsed.data.category,
      question: parsed.data.question,
      answerHints: parsed.data.answerHints,
      tags,
    });
    return { error: "", success: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unable to update", success: false };
  }
}

export async function deleteQuestionAction(questionId: string) {
  const { user } = await authSession();
  try {
    await applicationOsService.deleteQuestion(user.id, questionId);
    return { error: "" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Unable to delete" };
  }
}

export { QUESTION_CATEGORY_OPTIONS, QUESTION_CATEGORY_LABELS };
