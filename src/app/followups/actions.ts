"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";

const CHANNEL_OPTIONS = ["Email", "Phone", "LinkedIn", "In-person", "Other"] as const;

const createFollowUpSchema = z.object({
  applicationId: z.string().trim().min(1, "Application is required"),
  dueAt: z.string().trim().min(1, "Due date is required"),
  channel: z.enum(CHANNEL_OPTIONS).optional(),
  content: z.string().trim().max(500).optional(),
});

const updateFollowUpStatusSchema = z.object({
  followUpId: z.string().min(1),
  status: z.enum(["PENDING", "DONE", "SKIPPED"]),
});

export type CreateFollowUpActionState = {
  error: string;
  success: boolean;
};

export async function createFollowUpAction(
  _prevState: CreateFollowUpActionState,
  formData: FormData,
): Promise<CreateFollowUpActionState> {
  const { user } = await authSession();

  const parsed = createFollowUpSchema.safeParse({
    applicationId: String(formData.get("applicationId") ?? ""),
    dueAt: String(formData.get("dueAt") ?? ""),
    channel: formData.get("channel") || undefined,
    content: formData.get("content") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", success: false };
  }

  try {
    await applicationOsService.createFollowUp(user.id, parsed.data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create follow-up";
    return { error: message, success: false };
  }

  return { error: "", success: true };
}

export async function updateFollowUpStatusAction(
  _prevState: { error: string },
  formData: FormData,
): Promise<{ error: string }> {
  const { user } = await authSession();

  const parsed = updateFollowUpStatusSchema.safeParse({
    followUpId: String(formData.get("followUpId") ?? ""),
    status: String(formData.get("status") ?? ""),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await applicationOsService.updateFollowUpStatus(user.id, parsed.data);
    revalidatePath("/followups");
    return { error: "" };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update follow-up";
    return { error: message };
  }
}

export async function getApplicationsForFollowUp(userId: string) {
  return applicationOsService.getApplications(userId);
}