import type { Job } from "@/types/domain";
import { detectJobApplyProvider } from "@/lib/jobs/providers";

export function resolveQueueProvider(job: Pick<Job, "url">, requestedProvider?: string): string | undefined {
  const normalizedRequestedProvider = requestedProvider?.trim().toLowerCase();

  if (normalizedRequestedProvider && normalizedRequestedProvider !== "auto") {
    return normalizedRequestedProvider;
  }

  const detectedProvider = detectJobApplyProvider(job.url);
  return detectedProvider === "unknown" ? undefined : detectedProvider;
}
