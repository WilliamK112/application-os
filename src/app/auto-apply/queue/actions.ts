"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { authSession } from "@/lib/auth/session-adapter";
import { applicationOsService } from "@/lib/services/application-os-service";

const addToQueueSchema = z.object({
  jobIds: z.array(z.string()).min(1, "Select at least one job"),
  provider: z.string().optional(),
});

const removeFromQueueSchema = z.object({
  queueItemIds: z.array(z.string()).min(1),
});

const updateQueueStatusSchema = z.object({
  queueItemId: z.string(),
  status: z.enum(["PENDING", "IN_PROGRESS", "NEEDS_VERIFICATION", "COMPLETED", "FAILED"]),
  runLogId: z.string().optional(),
  applicationId: z.string().optional(),
  errorMessage: z.string().optional(),
  verificationToken: z.string().optional(),
});

export async function addJobsToQueueAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error: string }> {
  const { user } = await authSession();

  const rawJobIds = formData.getAll("jobIds") as string[];
  const provider = (formData.get("provider") as string) || undefined;

  const parsed = addToQueueSchema.safeParse({ jobIds: rawJobIds, provider });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await applicationOsService.addJobsToAutoApplyQueue(user.id, parsed.data.jobIds, parsed.data.provider);
    revalidatePath("/jobs");
    revalidatePath("/auto-apply/queue");
    return { error: "" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to add jobs to queue" };
  }
}

export async function removeFromQueueAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error: string }> {
  const { user } = await authSession();

  const rawIds = formData.getAll("queueItemIds") as string[];
  const parsed = removeFromQueueSchema.safeParse({ queueItemIds: rawIds });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await applicationOsService.removeFromQueue(user.id, parsed.data.queueItemIds);
    revalidatePath("/auto-apply/queue");
    return { error: "" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to remove from queue" };
  }
}

export async function updateQueueItemStatusAction(
  _prevState: unknown,
  formData: FormData,
): Promise<{ error: string }> {
  const parsed = updateQueueStatusSchema.safeParse({
    queueItemId: formData.get("queueItemId"),
    status: formData.get("status"),
    runLogId: formData.get("runLogId") || undefined,
    applicationId: formData.get("applicationId") || undefined,
    errorMessage: formData.get("errorMessage") || undefined,
    verificationToken: formData.get("verificationToken") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  try {
    await applicationOsService.updateQueueItemStatus(
      "user_1", // worker context - bypass auth for internal calls
      parsed.data.queueItemId,
      {
        status: parsed.data.status,
        runLogId: parsed.data.runLogId,
        applicationId: parsed.data.applicationId,
        errorMessage: parsed.data.errorMessage,
        verificationToken: parsed.data.verificationToken,
      },
    );
    revalidatePath("/auto-apply/queue");
    return { error: "" };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to update queue item" };
  }
}

export async function startQueueWorkerAction(): Promise<{ error: string }> {
  // This will be called by the Worker via webhook/API
  // For now it's a placeholder — real implementation hits Worker endpoint
  redirect("/auto-apply/queue");
}
