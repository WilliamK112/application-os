"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authSession } from "@/lib/auth/session-adapter";
import { APPLICATION_STATUS_OPTIONS } from "@/lib/constants/status";
import { applicationOsService } from "@/lib/services/application-os-service";

export type CreateApplicationActionState = {
  error: string;
};

const createApplicationSchema = z.object({
  jobId: z.string().trim().min(1, "Job is required"),
  status: z.enum(APPLICATION_STATUS_OPTIONS).default("DRAFT"),
  appliedAt: z.string().optional(),
  notes: z.string().trim().max(500).optional(),
});

const updateApplicationStatusSchema = z.object({
  applicationId: z.string().min(1),
  status: z.enum(APPLICATION_STATUS_OPTIONS),
});

const bulkUpdateApplicationStatusSchema = z.object({
  applicationIds: z.string().min(1).transform(s => s.split(",").filter(Boolean)),
  status: z.enum(APPLICATION_STATUS_OPTIONS),
});

const CHANNEL_OPTIONS = ["Email", "Phone", "LinkedIn", "In-person", "Other"] as const;

const bulkCreateFollowUpsSchema = z.object({
  applicationIds: z.string().min(1).transform(s => s.split(",").filter(Boolean)),
  dueAt: z.string().trim().min(1, "Due date is required"),
  channel: z.enum(CHANNEL_OPTIONS).optional(),
  content: z.string().trim().max(500).optional(),
});

function safeRevalidatePath(path: string): void {
  try {
    revalidatePath(path);
  } catch (error) {
    const message = error instanceof Error ? error.message : "";

    if (message.includes("static generation store missing")) {
      return;
    }

    throw error;
  }
}

export async function createApplicationAction(
  _prevState: CreateApplicationActionState,
  formData: FormData,
): Promise<CreateApplicationActionState> {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = createApplicationSchema.safeParse({
    jobId: String(formData.get("jobId") ?? ""),
    status: formData.get("status") || "DRAFT",
    appliedAt: formData.get("appliedAt") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Please check your input and try again." };
  }

  const rawAppliedAt = parsed.data.appliedAt?.trim();
  let appliedAtIso: string | undefined;

  if (rawAppliedAt) {
    const date = new Date(rawAppliedAt);

    if (Number.isNaN(date.getTime())) {
      return { error: "Applied date is invalid. Please use a valid date." };
    }

    appliedAtIso = date.toISOString();
  }

  try {
    await applicationOsService.createApplication(user.id, {
      jobId: parsed.data.jobId,
      status: parsed.data.status,
      appliedAt: appliedAtIso,
      notes: parsed.data.notes,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create application right now.";

    if (message.includes("already exists")) {
      return { error: "You already created an application for this job." };
    }

    return { error: "Unable to create application right now. Please try again." };
  }

  safeRevalidatePath("/applications");
  safeRevalidatePath("/dashboard");

  return { error: "" };
}

export async function updateApplicationStatusAction(formData: FormData): Promise<void> {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = updateApplicationStatusSchema.parse({
    applicationId: formData.get("applicationId"),
    status: formData.get("status"),
  });

  await applicationOsService.updateApplicationStatus(user.id, parsed);
  safeRevalidatePath("/applications");
  safeRevalidatePath("/dashboard");
}

export async function bulkUpdateApplicationStatusAction(
  applicationIds: string[],
  status: string,
): Promise<void> {
  const user = await authSession.getCurrentUserOrThrow();
  const parsed = bulkUpdateApplicationStatusSchema.parse({ applicationIds: applicationIds.join(","), status });
  await Promise.all(
    parsed.applicationIds.map((id) =>
      applicationOsService.updateApplicationStatus(user.id, { applicationId: id, status: parsed.status }),
    ),
  );
  safeRevalidatePath("/applications");
  safeRevalidatePath("/dashboard");
}

export async function getApplicationAction(applicationId: string) {
  const user = await authSession.getCurrentUserOrThrow();
  return applicationOsService.getApplication(user.id, applicationId);
}

export type BulkCreateFollowUpsActionState = {
  error: string;
  success: boolean;
};

export async function bulkCreateFollowUpsAction(
  _prevState: BulkCreateFollowUpsActionState,
  formData: FormData,
): Promise<BulkCreateFollowUpsActionState> {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = bulkCreateFollowUpsSchema.safeParse({
    applicationIds: String(formData.get("applicationIds") ?? ""),
    dueAt: String(formData.get("dueAt") ?? ""),
    channel: formData.get("channel") || undefined,
    content: formData.get("content") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input", success: false };
  }

  const rawDueAt = parsed.data.dueAt.trim();
  const dueAtDate = new Date(rawDueAt);
  if (Number.isNaN(dueAtDate.getTime())) {
    return { error: "Due date is invalid.", success: false };
  }

  const dueAtIso = dueAtDate.toISOString();

  try {
    await Promise.all(
      parsed.data.applicationIds.map((applicationId) =>
        applicationOsService.createFollowUp(user.id, {
          applicationId,
          dueAt: dueAtIso,
          channel: parsed.data.channel,
          content: parsed.data.content,
        }),
      ),
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create follow-ups";
    return { error: message, success: false };
  }

  safeRevalidatePath("/applications");
  safeRevalidatePath("/followups");
  safeRevalidatePath("/dashboard");

  return { error: "", success: true };
}
