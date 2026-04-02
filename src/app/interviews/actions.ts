"use server";

import { z } from "zod";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";
import {
  INTERVIEW_TYPE_OPTIONS,
  INTERVIEW_TYPE_LABELS,
} from "@/lib/constants/interviews";

const createInterviewSchema = z.object({
  applicationId: z.string().trim().min(1, "Application is required"),
  interviewType: z.enum(INTERVIEW_TYPE_OPTIONS),
  interviewerName: z.string().trim().max(120).optional(),
  scheduledAt: z.string().optional(),
  durationMinutes: z.coerce.number().int().min(1).max(480).optional(),
  location: z.string().trim().max(200).optional(),
  notes: z.string().trim().max(2000).optional(),
  questions: z.string().trim().max(2000).optional(), // comma-separated
  questionIds: z.string().trim().max(1000).optional(), // comma-separated question bank IDs
  rating: z.coerce.number().int().min(1).max(5).optional(),
  outcome: z.string().trim().max(50).optional(),
});

export type CreateInterviewActionState = {
  error: string;
  interviewId?: string;
};

export async function createInterviewAction(
  _prevState: CreateInterviewActionState,
  formData: FormData,
): Promise<CreateInterviewActionState> {
  const { user } = await authSession();

  const parsed = createInterviewSchema.safeParse({
    applicationId: String(formData.get("applicationId") ?? ""),
    interviewType: String(formData.get("interviewType") ?? ""),
    interviewerName: formData.get("interviewerName") || undefined,
    scheduledAt: formData.get("scheduledAt") || undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
    questions: formData.get("questions") || undefined,
    questionIds: formData.get("questionIds") || undefined,
    rating: formData.get("rating") || undefined,
    outcome: formData.get("outcome") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const questions = parsed.data.questions
    ? parsed.data.questions.split(",").map((q) => q.trim()).filter(Boolean)
    : [];

  const questionIds = parsed.data.questionIds
    ? parsed.data.questionIds.split(",").map((q) => q.trim()).filter(Boolean)
    : [];

  try {
    const interview = await applicationOsService.createInterview(user.id, {
      ...parsed.data,
      questions,
    });
    if (questionIds.length > 0) {
      await applicationOsService.addQuestionUsages(interview.id, questionIds);
    }
    return { error: "", interviewId: interview.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to create interview";
    return { error: message };
  }
}

const updateInterviewSchema = z.object({
  interviewId: z.string().trim().min(1, "Interview ID is required"),
  interviewType: z.enum(INTERVIEW_TYPE_OPTIONS).optional(),
  interviewerName: z.string().trim().max(120).nullish(),
  scheduledAt: z.string().optional().nullable(),
  durationMinutes: z.coerce.number().int().min(1).max(480).optional().nullable(),
  location: z.string().trim().max(200).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  questions: z.string().trim().max(2000).optional().nullable(),
  questionIds: z.string().trim().max(1000).optional().nullable(),
  rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
  outcome: z.string().trim().max(50).optional().nullable(),
});

export type UpdateInterviewActionState = {
  error: string;
};

export async function updateInterviewAction(
  _prevState: UpdateInterviewActionState,
  formData: FormData,
): Promise<UpdateInterviewActionState> {
  const { user } = await authSession();

  const parsed = updateInterviewSchema.safeParse({
    interviewId: String(formData.get("interviewId") ?? ""),
    interviewType: formData.get("interviewType") || undefined,
    interviewerName: formData.get("interviewerName") || undefined,
    scheduledAt: formData.get("scheduledAt") || undefined,
    durationMinutes: formData.get("durationMinutes") || undefined,
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
    questions: formData.get("questions") || undefined,
    questionIds: formData.get("questionIds") || undefined,
    rating: formData.get("rating") || undefined,
    outcome: formData.get("outcome") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { interviewId, questions: questionsStr, questionIds: questionIdsStr, ...rest } = parsed.data;
  const questions = questionsStr
    ? questionsStr.split(",").map((q: string) => q.trim()).filter(Boolean)
    : null;

  const questionIds = questionIdsStr
    ? questionIdsStr.split(",").map((q: string) => q.trim()).filter(Boolean)
    : null;

  try {
    await applicationOsService.updateInterview(user.id, interviewId, {
      ...rest,
      questions,
    });
    // Sync question bank usages: remove old, add new
    await applicationOsService.removeQuestionUsagesByInterview(interviewId);
    if (questionIds && questionIds.length > 0) {
      await applicationOsService.addQuestionUsages(interviewId, questionIds);
    }
    return { error: "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to update interview";
    return { error: message };
  }
}

export type DeleteInterviewActionState = {
  error: string;
};

export async function deleteInterviewAction(
  _prevState: DeleteInterviewActionState,
  formData: FormData,
): Promise<DeleteInterviewActionState> {
  const { user } = await authSession();
  const interviewId = String(formData.get("interviewId") ?? "");

  if (!interviewId) {
    return { error: "Interview ID is required" };
  }

  try {
    await applicationOsService.deleteInterview(user.id, interviewId);
    return { error: "" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to delete interview";
    return { error: message };
  }
}

