import type { AutoApplyRunLog } from "@/types/domain";

export function isRetryableAutoApplyStatus(status: AutoApplyRunLog["status"]): boolean {
  return status === "failed" || status === "needs_manual";
}

export function getRetryableJobIds(history: AutoApplyRunLog[]): string[] {
  const seen = new Set<string>();
  const jobIds: string[] = [];

  for (const item of history) {
    if (!isRetryableAutoApplyStatus(item.status)) {
      continue;
    }

    if (seen.has(item.jobId)) {
      continue;
    }

    seen.add(item.jobId);
    jobIds.push(item.jobId);
  }

  return jobIds;
}
