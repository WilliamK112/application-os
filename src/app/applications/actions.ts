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
