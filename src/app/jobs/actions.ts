"use server";

import { revalidateAdapter } from "@/lib/next/revalidate-adapter";
import { z } from "zod";
import { authSession } from "@/lib/auth/session-adapter";
import { JOB_STATUS_OPTIONS } from "@/lib/constants/status";
import { parseBulkJobImport, parseJobUrlToDraft } from "@/lib/jobs/import";
import { submitExternalApplication } from "@/lib/jobs/external-submit";
import { buildDocumentApplicationProfile } from "@/lib/jobs/document-application-profile";
import { detectJobApplyProvider } from "@/lib/jobs/providers";
import { applicationOsService } from "@/lib/services/application-os-service";
import type { AutoApplyHistoryFilter, AutoApplyResultState } from "@/types/auto-apply";
import type { AutoApplyFailureCategory, AutoApplyRunStatus } from "@/types/domain";

const createJobSchema = z.object({
  company: z.string().trim().min(1, "Company is required").max(120),
  title: z.string().trim().min(1, "Title is required").max(120),
  location: z.string().trim().max(120).optional(),
  source: z.string().trim().max(120).optional(),
  status: z.enum(JOB_STATUS_OPTIONS).default("SAVED"),
});

const updateJobStatusSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(JOB_STATUS_OPTIONS),
});

const importByUrlSchema = z.object({
  jobUrl: z.string().url("Please enter a valid URL."),
});

const bulkImportSchema = z.object({
  bulkInput: z.string().trim().min(1, "Paste at least one URL or CSV row."),
});

const autoApplySchema = z.object({
  jobIds: z.array(z.string().min(1)).min(1, "Select at least one job."),
});

const autoApplyHistoryFilterSchema = z.enum([
  "ALL",
  "success",
  "failed",
  "needs_manual",
  "http_failure",
  "network_failure",
  "no_form",
  "manual_handoff",
]);

export async function createJobAction(formData: FormData): Promise<void> {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = createJobSchema.parse({
    company: formData.get("company"),
    title: formData.get("title"),
    location: formData.get("location") || undefined,
    source: formData.get("source") || undefined,
    status: formData.get("status") || "SAVED",
  });

  await applicationOsService.createJob(user.id, parsed);
  revalidateAdapter.revalidatePath("/jobs");
  revalidateAdapter.revalidatePath("/applications");
  revalidateAdapter.revalidatePath("/dashboard");
}

export async function importJobFromUrlAction(formData: FormData): Promise<void> {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = importByUrlSchema.parse({
    jobUrl: formData.get("jobUrl"),
  });

  const draft = parseJobUrlToDraft(parsed.jobUrl);
  await applicationOsService.createJob(user.id, draft);

  revalidateAdapter.revalidatePath("/jobs");
  revalidateAdapter.revalidatePath("/applications");
  revalidateAdapter.revalidatePath("/dashboard");
}

export async function bulkImportJobsAction(formData: FormData): Promise<void> {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = bulkImportSchema.parse({
    bulkInput: formData.get("bulkInput"),
  });

  const jobs = parseBulkJobImport(parsed.bulkInput);
  if (jobs.length === 0) {
    throw new Error("No valid URLs or CSV rows found.");
  }

  for (const job of jobs) {
    await applicationOsService.createJob(user.id, job);
  }

  revalidateAdapter.revalidatePath("/jobs");
  revalidateAdapter.revalidatePath("/applications");
  revalidateAdapter.revalidatePath("/dashboard");
}

const DEFAULT_AUTO_APPLY_STATE: AutoApplyResultState = {
  error: "",
  results: [],
  history: [],
  historyFilter: "ALL",
};

// Production: just re-export the external submit function
export async function autoApplyExternalSubmitFn(
  input: Parameters<typeof submitExternalApplication>[0],
) {
  return submitExternalApplication(input);
}

export async function runAutoApplyAction(
  previousState: AutoApplyResultState = DEFAULT_AUTO_APPLY_STATE,
  formData: FormData,
): Promise<AutoApplyResultState> {
  void previousState;
  const user = await authSession.getCurrentUserOrThrow();

  const historyFilterResult = autoApplyHistoryFilterSchema.safeParse(
    (formData.get("historyFilter") as AutoApplyHistoryFilter | null) ?? "ALL",
  );
  const historyFilter = historyFilterResult.success ? historyFilterResult.data : "ALL";

  const parsed = autoApplySchema.safeParse({
    jobIds: formData.getAll("jobIds"),
  });

  const statusFilters: readonly AutoApplyRunStatus[] = ["success", "failed", "needs_manual"];
  const failureCategoryFilters: readonly AutoApplyFailureCategory[] = [
    "http_failure",
    "network_failure",
    "no_form",
    "manual_handoff",
  ];

  const historyStatus: AutoApplyRunStatus | undefined =
    historyFilter !== "ALL" && statusFilters.includes(historyFilter as AutoApplyRunStatus)
      ? (historyFilter as AutoApplyRunStatus)
      : undefined;

  const historyFailureCategory: AutoApplyFailureCategory | undefined =
    historyFilter !== "ALL" &&
    failureCategoryFilters.includes(historyFilter as AutoApplyFailureCategory)
      ? (historyFilter as AutoApplyFailureCategory)
      : undefined;

  const historyQuery = {
    status: historyStatus,
    failureCategory: historyFailureCategory,
    limit: 40,
  } as const;

  if (!parsed.success) {
    const history = await applicationOsService.getAutoApplyRunLogs(user.id, historyQuery);

    return {
      error: parsed.error.issues[0]?.message ?? "Select at least one job.",
      results: [],
      history,
      historyFilter,
    };
  }

  const jobs = await applicationOsService.getJobs(user.id);
  const selected = jobs.filter((job) => parsed.data.jobIds.includes(job.id));

  if (selected.length === 0) {
    const history = await applicationOsService.getAutoApplyRunLogs(user.id, historyQuery);

    return {
      error: "No valid jobs selected.",
      results: [],
      history,
      historyFilter,
    };
  }

  const documents = await applicationOsService.getDocuments(user.id);
  const documentProfile = buildDocumentApplicationProfile(documents);

  const results: AutoApplyResultState["results"] = [];

  for (const job of selected) {
    const provider = detectJobApplyProvider(job.url);

    try {
      const created = await applicationOsService.createApplication(user.id, {
        jobId: job.id,
        status: "APPLIED",
        appliedAt: new Date().toISOString(),
        notes: "Auto-applied from jobs panel",
      });

      if (provider === "greenhouse" || provider === "lever") {
        const externalSubmitResult = await autoApplyExternalSubmitFn({
          provider,
          jobUrl: job.url,
          dryRun: process.env.APP_OS_AUTO_APPLY_DRY_RUN !== "false",
          payloadOverrides: {
            APP_OS_APPLICANT_RESUME_URL: documentProfile.resumeUrl ?? "",
          },
        });

        results.push({
          jobId: job.id,
          jobLabel: `${job.company} — ${job.title}`,
          status: externalSubmitResult.status,
          failureCategory: externalSubmitResult.failureCategory,
          applicationId: created.application.id,
          message:
            `Application created (${created.application.status}). ${externalSubmitResult.message}` +
            (documentProfile.diagnostics.length > 0
              ? ` Documents diagnostics: ${documentProfile.diagnostics.join(" ")}`
              : ""),
        });
      } else {
        results.push({
          jobId: job.id,
          jobLabel: `${job.company} — ${job.title}`,
          status: "success",
          applicationId: created.application.id,
          message:
            provider === "unknown"
              ? `Application created (${created.application.status}).`
              : `Application created (${created.application.status}). Provider detected: ${provider}.`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const duplicate = /already exists/i.test(message);

      results.push({
        jobId: job.id,
        jobLabel: `${job.company} — ${job.title}`,
        status: duplicate ? "needs_manual" : "failed",
        message: duplicate
          ? provider === "unknown"
            ? "Application already exists for this job. Review manually."
            : `Application already exists for this ${provider} job. Review manually.`
          : `Create application failed: ${message}`,
      });
    }
  }

  await applicationOsService.createAutoApplyRunLogs(
    user.id,
    results.map((item) => ({
      jobId: item.jobId,
      status: item.status,
      message: item.message,
      failureCategory: item.failureCategory,
      applicationId: item.applicationId,
    })),
  );

  const history = await applicationOsService.getAutoApplyRunLogs(user.id, historyQuery);

  revalidateAdapter.revalidatePath("/applications");
  revalidateAdapter.revalidatePath("/dashboard");
  revalidateAdapter.revalidatePath("/jobs");

  return {
    error: "",
    results,
    history,
    historyFilter,
  };
}

export async function updateJobStatusAction(formData: FormData): Promise<void> {
  const user = await authSession.getCurrentUserOrThrow();

  const parsed = updateJobStatusSchema.parse({
    jobId: formData.get("jobId"),
    status: formData.get("status"),
  });

  await applicationOsService.updateJobStatus(user.id, parsed);
  revalidateAdapter.revalidatePath("/jobs");
  revalidateAdapter.revalidatePath("/dashboard");
}
